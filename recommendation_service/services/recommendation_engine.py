import pandas as pd
import numpy as np
from typing import List, Dict, Tuple, Optional
import logging
from collections import Counter
from datetime import datetime, timedelta
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler
import pickle
import os

try:
    from .django_data_loader import DjangoDataLoader
except ImportError:
    # Handle direct script execution
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from services.django_data_loader import DjangoDataLoader

logger = logging.getLogger(__name__)


class RecommendationEngine:
    """AI-powered campaign recommendation engine using embedding-based models"""
    
    def __init__(self):
        self.data_loader = DjangoDataLoader()
        self._donations_df = None
        self._campaigns_df = None
        self._last_refresh = None
        
        # AI Model components
        self.sentence_model = None
        self.campaign_embeddings = None
        self.user_embeddings = None
        self.scaler = StandardScaler()
        self.embeddings_cache_path = "embeddings_cache.pkl"
        
        # Initialize the multilingual sentence transformer (supports Arabic)
        self._initialize_ai_model()
        
    def _initialize_ai_model(self):
        """Initialize the AI model for embeddings"""
        try:
            # Use multilingual model that supports Arabic text
            logger.info("Loading multilingual sentence transformer model...")
            self.sentence_model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
            logger.info("AI model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load AI model: {str(e)}")
            # Fallback to a smaller model if the main one fails
            try:
                self.sentence_model = SentenceTransformer('all-MiniLM-L6-v2')
                logger.info("Loaded fallback AI model")
            except Exception as e2:
                logger.error(f"Failed to load fallback model: {str(e2)}")
                self.sentence_model = None
        
    def _refresh_data_if_needed(self):
        """Refresh data if it's older than 1 hour or not loaded"""
        if (self._last_refresh is None or 
            datetime.now() - self._last_refresh > timedelta(hours=1)):
            
            logger.info("Refreshing recommendation data...")
            donations_df, campaigns_df, _ = self.data_loader.load_all_data()
            
            # Filter for completed donations and active campaigns
            self._donations_df = donations_df[donations_df['status'] == 'completed'].copy()
            self._campaigns_df = campaigns_df[campaigns_df['is_active'] == True].copy()
            
            # Generate embeddings for campaigns
            self._generate_campaign_embeddings()
            
            self._last_refresh = datetime.now()
            logger.info(f"Data refreshed: {len(self._donations_df)} donations, {len(self._campaigns_df)} campaigns")
    
    def _generate_campaign_embeddings(self):
        """Generate embeddings for all campaigns using AI model"""
        if self.sentence_model is None or len(self._campaigns_df) == 0:
            logger.warning("Cannot generate embeddings: model not loaded or no campaigns")
            return
            
        try:
            # Create text representations of campaigns (title + description + category)
            campaign_texts = []
            for _, campaign in self._campaigns_df.iterrows():
                text_parts = []
                
                # Add title
                if pd.notna(campaign.get('title')):
                    text_parts.append(str(campaign['title']))
                
                # Add description
                if pd.notna(campaign.get('description')):
                    text_parts.append(str(campaign['description']))
                
                # Add category
                if pd.notna(campaign.get('category')):
                    text_parts.append(f"Category: {campaign['category']}")
                
                # Add organization name
                if pd.notna(campaign.get('organization_name')):
                    text_parts.append(f"Organization: {campaign['organization_name']}")
                
                campaign_text = " ".join(text_parts) if text_parts else "No description available"
                campaign_texts.append(campaign_text)
            
            # Generate embeddings
            logger.info(f"Generating embeddings for {len(campaign_texts)} campaigns...")
            self.campaign_embeddings = self.sentence_model.encode(
                campaign_texts, 
                show_progress_bar=False,
                convert_to_numpy=True
            )
            
            logger.info(f"Generated embeddings with shape: {self.campaign_embeddings.shape}")
            
        except Exception as e:
            logger.error(f"Error generating campaign embeddings: {str(e)}")
            self.campaign_embeddings = None
    
    def get_recommendations(self, user_id: str, top_n: int = 5) -> List[Dict]:
        """
        Get campaign recommendations for a user
        
        Args:
            user_id: User identifier (using donor_email as user_id)
            top_n: Number of recommendations to return
            
        Returns:
            List of dicts with campaign_id and score
        """
        self._refresh_data_if_needed()
        
        try:
            # Get user's donation history by user ID
            try:
                user_id_int = int(user_id)
                user_donations = self._donations_df[
                    self._donations_df['donor_id'] == user_id_int
                ].copy()
            except (ValueError, TypeError):
                # Fallback to email if user_id is not a number
                user_donations = self._donations_df[
                    self._donations_df['donor_email'] == user_id
                ].copy()
            
            recommendations = []
            
            if len(user_donations) > 0:
                # User has donation history - use AI-powered recommendations
                if self.campaign_embeddings is not None:
                    recommendations = self._get_ai_recommendations(user_donations, top_n)
                    logger.info(f"Generated {len(recommendations)} AI recommendations for user {user_id}")
                else:
                    # Fallback to collaborative filtering if AI not available
                    recommendations = self._get_collaborative_recommendations(user_donations, top_n)
                    logger.info(f"Generated {len(recommendations)} collaborative recommendations for user {user_id}")
            
            # Fill remaining slots with popular campaigns
            if len(recommendations) < top_n:
                popular_recs = self._get_popular_recommendations(
                    exclude_campaigns=[r['campaign_id'] for r in recommendations],
                    top_n=top_n - len(recommendations)
                )
                recommendations.extend(popular_recs)
                logger.info(f"Added {len(popular_recs)} popular recommendations")
            
            return recommendations[:top_n]
            
        except Exception as e:
            logger.error(f"Error generating recommendations for user {user_id}: {str(e)}")
            # Fallback to popular campaigns only
            return self._get_popular_recommendations(top_n=top_n)
    
    def _get_ai_recommendations(self, user_donations: pd.DataFrame, top_n: int) -> List[Dict]:
        """Generate AI-powered recommendations based on user profile embedding"""
        
        # Create user profile embedding
        user_profile = self._create_user_profile_embedding(user_donations)
        
        if user_profile is None:
            logger.warning("Could not create user profile, falling back to collaborative filtering")
            return self._get_collaborative_recommendations(user_donations, top_n)
        
        try:
            # Get campaigns user has already donated to
            donated_campaigns = set(user_donations['campaign_id'].unique())
            
            # Calculate similarities between user profile and all campaigns
            similarities = cosine_similarity([user_profile], self.campaign_embeddings)[0]
            
            # Create recommendations
            recommendations = []
            
            # Sort by similarity score (descending)
            sorted_indices = np.argsort(similarities)[::-1]
            
            for idx in sorted_indices:
                campaign_row = self._campaigns_df.iloc[idx]
                campaign_id = campaign_row['id']
                
                # Skip campaigns user has already donated to
                if campaign_id in donated_campaigns:
                    continue
                
                similarity_score = similarities[idx]
                
                # Apply additional scoring factors
                final_score = self._calculate_final_ai_score(
                    similarity_score, campaign_row, user_donations
                )
                
                recommendations.append({
                    'campaign_id': int(campaign_id),
                    'score': float(final_score),
                    'reason': f'AI semantic similarity ({similarity_score:.3f})'
                })
                
                if len(recommendations) >= top_n:
                    break
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error in AI recommendations: {str(e)}")
            return self._get_collaborative_recommendations(user_donations, top_n)
    
    def _create_user_profile_embedding(self, user_donations: pd.DataFrame) -> Optional[np.ndarray]:
        """Create user profile embedding from their donation history"""
        if self.campaign_embeddings is None or len(user_donations) == 0:
            return None
            
        try:
            # Get campaign indices for user's donations
            donated_campaign_ids = user_donations['campaign_id'].unique()
            
            # Find corresponding embeddings
            user_campaign_embeddings = []
            campaign_weights = []
            
            for campaign_id in donated_campaign_ids:
                # Find campaign in our dataframe
                campaign_idx = self._campaigns_df[self._campaigns_df['id'] == campaign_id].index
                
                if len(campaign_idx) > 0:
                    idx = campaign_idx[0]
                    # Get the position in our embeddings array
                    embedding_idx = self._campaigns_df.index.get_loc(idx)
                    
                    if embedding_idx < len(self.campaign_embeddings):
                        user_campaign_embeddings.append(self.campaign_embeddings[embedding_idx])
                        
                        # Weight by donation amount and recency
                        campaign_donations = user_donations[user_donations['campaign_id'] == campaign_id]
                        total_amount = campaign_donations['amount'].sum()
                        # Handle timezone-aware datetime comparison
                        cutoff_date = datetime.now() - timedelta(days=90)
                        try:
                            created_dates = pd.to_datetime(campaign_donations['created_at'])
                            if created_dates.dt.tz is not None:
                                # If timezone-aware, make cutoff timezone-aware too
                                import pytz
                                cutoff_date = cutoff_date.replace(tzinfo=pytz.UTC)
                            recent_donations = len(campaign_donations[created_dates > cutoff_date])
                        except Exception:
                            # Fallback: assume all donations are recent
                            recent_donations = len(campaign_donations)
                        
                        weight = np.log1p(total_amount) * (1 + recent_donations * 0.1)
                        campaign_weights.append(weight)
            
            if len(user_campaign_embeddings) == 0:
                return None
            
            # Create weighted average of user's campaign embeddings
            user_campaign_embeddings = np.array(user_campaign_embeddings)
            campaign_weights = np.array(campaign_weights)
            
            # Normalize weights
            campaign_weights = campaign_weights / campaign_weights.sum()
            
            # Weighted average
            user_profile = np.average(user_campaign_embeddings, axis=0, weights=campaign_weights)
            
            return user_profile
            
        except Exception as e:
            logger.error(f"Error creating user profile embedding: {str(e)}")
            return None
    
    def _calculate_final_ai_score(self, similarity_score: float, campaign_row: pd.Series, 
                                 user_donations: pd.DataFrame) -> float:
        """Calculate final score combining AI similarity with other factors"""
        
        final_score = similarity_score * 0.7  # Base AI similarity (70% weight)
        
        # Add popularity boost (20% weight)
        popularity_score = min(campaign_row['donation_count'] / 100, 1.0)  # Normalize to max 100 donations
        final_score += popularity_score * 0.2
        
        # Add progress boost (10% weight) - campaigns with some progress but not complete
        progress = campaign_row['progress_percentage']
        if 10 <= progress <= 80:  # Sweet spot for engagement
            progress_boost = 0.1
        else:
            progress_boost = 0.05
        final_score += progress_boost
        
        # Category preference boost
        user_categories = user_donations['campaign_category'].dropna().unique()
        if campaign_row['category'] in user_categories:
            final_score += 0.1
        
        # Organization trust boost
        if campaign_row.get('organization_verified', False):
            final_score += 0.05
        
        # Featured campaign boost
        if campaign_row.get('is_featured', False):
            final_score += 0.03
        
        return min(final_score, 1.0)  # Cap at 1.0

    def _get_collaborative_recommendations(self, user_donations: pd.DataFrame, top_n: int) -> List[Dict]:
        """Generate recommendations based on similar users' donation patterns"""
        
        # Get categories user has donated to
        user_categories = user_donations['campaign_category'].dropna().unique()
        
        # Get campaigns user has already donated to
        donated_campaigns = set(user_donations['campaign_id'].unique())
        
        recommendations = []
        
        # 1. Recommend campaigns in same categories (category-based)
        if len(user_categories) > 0:
            category_recs = self._get_category_based_recommendations(
                user_categories, donated_campaigns, top_n
            )
            recommendations.extend(category_recs)
        
        # 2. Recommend campaigns from same organizations (organization-based)
        if len(recommendations) < top_n:
            org_recs = self._get_organization_based_recommendations(
                user_donations, donated_campaigns, top_n - len(recommendations)
            )
            recommendations.extend(org_recs)
        
        # 3. Find similar users and their donations (collaborative filtering)
        if len(recommendations) < top_n:
            similar_user_recs = self._get_similar_user_recommendations(
                user_donations, donated_campaigns, top_n - len(recommendations)
            )
            recommendations.extend(similar_user_recs)
        
        return recommendations
    
    def _get_category_based_recommendations(self, user_categories: List[str], 
                                         exclude_campaigns: set, top_n: int) -> List[Dict]:
        """Recommend popular campaigns in user's preferred categories"""
        
        category_campaigns = self._campaigns_df[
            (self._campaigns_df['category'].isin(user_categories)) &
            (~self._campaigns_df['id'].isin(exclude_campaigns))
        ].copy()
        
        if len(category_campaigns) == 0:
            return []
        
        # Score based on donation count and progress
        category_campaigns['category_score'] = (
            category_campaigns['donation_count'] * 0.7 +
            category_campaigns['progress_percentage'] * 0.3
        )
        
        # Normalize scores to 0-1 range
        max_score = category_campaigns['category_score'].max()
        if max_score > 0:
            category_campaigns['category_score'] = category_campaigns['category_score'] / max_score
        
        top_campaigns = category_campaigns.nlargest(top_n, 'category_score')
        
        return [
            self._format_campaign_recommendation(
                row, 
                float(row['category_score']), 
                f'Popular in {row["category"]} category'
            )
            for _, row in top_campaigns.iterrows()
        ]
    
    def _get_organization_based_recommendations(self, user_donations: pd.DataFrame,
                                              exclude_campaigns: set, top_n: int) -> List[Dict]:
        """Recommend campaigns from organizations user has donated to before"""
        
        # Get organizations user has donated to
        user_organizations = user_donations['organization_id'].dropna().unique()
        
        if len(user_organizations) == 0:
            return []
        
        # Find other campaigns from same organizations
        org_campaigns = self._campaigns_df[
            (self._campaigns_df['organization_id'].isin(user_organizations)) &
            (~self._campaigns_df['id'].isin(exclude_campaigns))
        ].copy()
        
        if len(org_campaigns) == 0:
            return []
        
        # Score based on organization trust and campaign metrics
        org_campaigns['org_score'] = (
            org_campaigns['donation_count'] * 0.4 +
            org_campaigns['progress_percentage'] * 0.3 +
            org_campaigns['organization_verified'].astype(int) * 30  # Boost verified orgs
        )
        
        # Normalize scores
        max_score = org_campaigns['org_score'].max()
        if max_score > 0:
            org_campaigns['org_score'] = org_campaigns['org_score'] / max_score
        
        top_org_campaigns = org_campaigns.nlargest(top_n, 'org_score')
        
        return [
            self._format_campaign_recommendation(
                row, 
                float(row['org_score']), 
                f'From trusted organization: {row["organization_name"]}'
            )
            for _, row in top_org_campaigns.iterrows()
        ]
    
    def _get_similar_user_recommendations(self, user_donations: pd.DataFrame, 
                                        exclude_campaigns: set, top_n: int) -> List[Dict]:
        """Find similar users and recommend their campaigns"""
        
        user_campaign_ids = set(user_donations['campaign_id'].unique())
        
        # Find users who donated to similar campaigns
        if 'donor_id' in user_donations.columns and len(user_donations) > 0:
            current_user_id = user_donations['donor_id'].iloc[0]
            similar_users = self._donations_df[
                self._donations_df['campaign_id'].isin(user_campaign_ids) &
                (self._donations_df['donor_id'] != current_user_id)
            ]['donor_id'].unique()
            
            if len(similar_users) == 0:
                return []
            
            # Get campaigns donated to by similar users
            similar_user_donations = self._donations_df[
                (self._donations_df['donor_id'].isin(similar_users)) &
                (~self._donations_df['campaign_id'].isin(exclude_campaigns))
            ]
        else:
            # Fallback to email-based logic
            current_user_email = user_donations['donor_email'].iloc[0] if len(user_donations) > 0 else ""
            similar_users = self._donations_df[
                self._donations_df['campaign_id'].isin(user_campaign_ids) &
                (self._donations_df['donor_email'] != current_user_email)
            ]['donor_email'].unique()
            
            if len(similar_users) == 0:
                return []
            
            # Get campaigns donated to by similar users
            similar_user_donations = self._donations_df[
                (self._donations_df['donor_email'].isin(similar_users)) &
                (~self._donations_df['campaign_id'].isin(exclude_campaigns))
            ]
        
        # Count how many similar users donated to each campaign
        campaign_counts = similar_user_donations['campaign_id'].value_counts()
        
        recommendations = []
        for campaign_id, count in campaign_counts.head(top_n).items():
            # Get campaign details
            campaign = self._campaigns_df[self._campaigns_df['id'] == campaign_id]
            if len(campaign) > 0:
                # Score based on how many similar users donated
                similarity_score = min(count / len(similar_users), 1.0)
                
                campaign_data = self._campaigns_df[self._campaigns_df['id'] == campaign_id].iloc[0]
                recommendations.append(
                    self._format_campaign_recommendation(
                        campaign_data,
                        float(similarity_score),
                        f'Liked by {count} similar donors'
                    )
                )
        
        return recommendations
    
    def _get_popular_recommendations(self, exclude_campaigns: List[int] = None, 
                                   top_n: int = 5) -> List[Dict]:
        """Get popular campaigns as fallback recommendations"""
        
        if exclude_campaigns is None:
            exclude_campaigns = []
        
        # Filter out excluded campaigns
        popular_campaigns = self._campaigns_df[
            ~self._campaigns_df['id'].isin(exclude_campaigns)
        ].copy()
        
        if len(popular_campaigns) == 0:
            return []
        
        # Score based on donation count, progress, and featured status
        popular_campaigns['popularity_score'] = (
            popular_campaigns['donation_count'] * 0.5 +
            popular_campaigns['progress_percentage'] * 0.3 +
            popular_campaigns['is_featured'].astype(int) * 20  # Boost featured campaigns
        )
        
        # Normalize scores
        max_score = popular_campaigns['popularity_score'].max()
        if max_score > 0:
            popular_campaigns['popularity_score'] = popular_campaigns['popularity_score'] / max_score
        
        top_popular = popular_campaigns.nlargest(top_n, 'popularity_score')
        
        return [
            self._format_campaign_recommendation(
                row, 
                float(row['popularity_score']), 
                'Popular campaign'
            )
            for _, row in top_popular.iterrows()
        ]
    
    def get_trending_campaigns(self, days: int = 7, top_n: int = 5) -> List[Dict]:
        """Get trending campaigns based on recent donation activity"""
        
        self._refresh_data_if_needed()
        
        # Get recent donations
        cutoff_date = datetime.now() - timedelta(days=days)
        recent_donations = self._donations_df[
            pd.to_datetime(self._donations_df['created_at']) >= cutoff_date
        ]
        
        # Count donations per campaign in the period
        trending_counts = recent_donations['campaign_id'].value_counts()
        
        recommendations = []
        for campaign_id, count in trending_counts.head(top_n).items():
            campaign = self._campaigns_df[self._campaigns_df['id'] == campaign_id]
            if len(campaign) > 0:
                # Score based on recent activity
                trend_score = min(count / 10, 1.0)  # Normalize to max 10 donations
                
                recommendations.append(
                    self._format_campaign_recommendation(
                        campaign.iloc[0],
                        float(trend_score),
                        f'Trending with {count} recent donations'
                    )
                )
        
        return recommendations
    
    def _format_campaign_recommendation(self, campaign_row, score: float, reason: str) -> Dict:
        """Format a campaign recommendation with ID and metadata only"""
        return {
            'campaign_id': int(campaign_row['id']),
            'score': float(score),
            'reason': reason
        }
    
    def get_similar_campaigns(self, campaign_id: int, top_n: int = 5) -> List[Dict]:
        """
        Get campaigns similar to the given campaign using AI embeddings
        
        Args:
            campaign_id: ID of the campaign to find similar ones for
            top_n: Number of similar campaigns to return
            
        Returns:
            List of similar campaigns with scores
        """
        self._refresh_data_if_needed()
        
        # Try AI-based similarity first
        if self.campaign_embeddings is not None:
            return self._get_ai_similar_campaigns(campaign_id, top_n)
        else:
            # Fallback to rule-based similarity
            return self._get_rule_based_similar_campaigns(campaign_id, top_n)
    
    def _get_ai_similar_campaigns(self, campaign_id: int, top_n: int) -> List[Dict]:
        """Get similar campaigns using AI embeddings"""
        try:
            # Find the target campaign
            target_campaign_idx = self._campaigns_df[
                self._campaigns_df['id'] == campaign_id
            ].index
            
            if len(target_campaign_idx) == 0:
                logger.warning(f"Campaign {campaign_id} not found")
                return []
            
            # Get the embedding index
            target_idx = self._campaigns_df.index.get_loc(target_campaign_idx[0])
            
            if target_idx >= len(self.campaign_embeddings):
                logger.warning(f"Embedding not found for campaign {campaign_id}")
                return []
            
            # Get target campaign embedding
            target_embedding = self.campaign_embeddings[target_idx]
            
            # Calculate similarities with all other campaigns
            similarities = cosine_similarity([target_embedding], self.campaign_embeddings)[0]
            
            # Get top similar campaigns (excluding the target campaign)
            similar_campaigns = []
            sorted_indices = np.argsort(similarities)[::-1]
            
            for idx in sorted_indices:
                if idx == target_idx:  # Skip the target campaign itself
                    continue
                
                campaign_row = self._campaigns_df.iloc[idx]
                similarity_score = similarities[idx]
                
                similar_campaigns.append({
                    'campaign_id': int(campaign_row['id']),
                    'score': float(similarity_score),
                    'reason': f'AI semantic similarity ({similarity_score:.3f})'
                })
                
                if len(similar_campaigns) >= top_n:
                    break
            
            return similar_campaigns
            
        except Exception as e:
            logger.error(f"Error in AI similar campaigns for {campaign_id}: {str(e)}")
            return self._get_rule_based_similar_campaigns(campaign_id, top_n)
    
    def _get_rule_based_similar_campaigns(self, campaign_id: int, top_n: int) -> List[Dict]:
        """Fallback rule-based similar campaigns"""
        try:
            # Get the target campaign
            target_campaign = self._campaigns_df[
                self._campaigns_df['id'] == campaign_id
            ]
            
            if len(target_campaign) == 0:
                logger.warning(f"Campaign {campaign_id} not found")
                return []
            
            target = target_campaign.iloc[0]
            
            # Get all other active campaigns (exclude the target campaign)
            other_campaigns = self._campaigns_df[
                (self._campaigns_df['id'] != campaign_id) &
                (self._campaigns_df['is_active'] == True)
            ].copy()
            
            if len(other_campaigns) == 0:
                return []
            
            similar_campaigns = []
            
            # 1. Same category campaigns (highest priority)
            if pd.notna(target['category']):
                category_matches = other_campaigns[
                    other_campaigns['category'] == target['category']
                ].copy()
                
                if len(category_matches) > 0:
                    category_matches['similarity_score'] = self._calculate_campaign_similarity(
                        target, category_matches, base_score=0.8
                    )
                    similar_campaigns.extend(
                        self._format_similar_campaigns(category_matches, "Same category")
                    )
            
            # 2. Same organization campaigns
            if pd.notna(target['organization_id']):
                org_matches = other_campaigns[
                    (other_campaigns['organization_id'] == target['organization_id']) &
                    (~other_campaigns['id'].isin([c['campaign_id'] for c in similar_campaigns]))
                ].copy()
                
                if len(org_matches) > 0:
                    org_matches['similarity_score'] = self._calculate_campaign_similarity(
                        target, org_matches, base_score=0.7
                    )
                    similar_campaigns.extend(
                        self._format_similar_campaigns(org_matches, "Same organization")
                    )
            
            # 3. Similar goal amount and progress
            if len(similar_campaigns) < top_n:
                remaining_campaigns = other_campaigns[
                    ~other_campaigns['id'].isin([c['campaign_id'] for c in similar_campaigns])
                ].copy()
                
                if len(remaining_campaigns) > 0:
                    remaining_campaigns['similarity_score'] = self._calculate_campaign_similarity(
                        target, remaining_campaigns, base_score=0.5
                    )
                    similar_campaigns.extend(
                        self._format_similar_campaigns(remaining_campaigns, "Similar goals")
                    )
            
            # Sort by similarity score and return top N
            similar_campaigns.sort(key=lambda x: x['score'], reverse=True)
            return similar_campaigns[:top_n]
            
        except Exception as e:
            logger.error(f"Error finding similar campaigns for {campaign_id}: {str(e)}")
            return []
    
    def _calculate_campaign_similarity(self, target_campaign, candidate_campaigns, base_score=0.5):
        """Calculate similarity scores between target campaign and candidates"""
        
        scores = []
        target_goal = float(target_campaign['goal_amount'])
        target_progress = float(target_campaign['progress_percentage'])
        
        for _, candidate in candidate_campaigns.iterrows():
            score = base_score
            
            # Goal amount similarity (within 50% range gets bonus)
            candidate_goal = float(candidate['goal_amount'])
            if target_goal > 0 and candidate_goal > 0:
                goal_ratio = min(target_goal, candidate_goal) / max(target_goal, candidate_goal)
                if goal_ratio > 0.5:  # Within 50% range
                    score += 0.2 * goal_ratio
            
            # Progress similarity
            progress_diff = abs(target_progress - float(candidate['progress_percentage']))
            if progress_diff < 20:  # Within 20% progress difference
                score += 0.1 * (1 - progress_diff / 20)
            
            # Donation count similarity (popular campaigns)
            if candidate['donation_count'] > 5:  # Has decent activity
                score += 0.1
            
            # Featured campaigns get slight boost
            if candidate['is_featured']:
                score += 0.05
            
            scores.append(min(score, 1.0))  # Cap at 1.0
        
        return scores
    
    def _format_similar_campaigns(self, campaigns_df, reason):
        """Format campaigns dataframe into similar campaigns response with ID and metadata only"""
        
        return [
            {
                'campaign_id': int(row['id']),
                'score': float(row['similarity_score']),
                'reason': reason
            }
            for _, row in campaigns_df.iterrows()
        ]


# Convenience function
def get_user_recommendations(user_id: str, top_n: int = 5) -> List[Dict]:
    """
    Get campaign recommendations for a user
    
    Args:
        user_id: User identifier (donor_email)
        top_n: Number of recommendations to return
        
    Returns:
        List of dicts with campaign_id, score, and reason
    """
    engine = RecommendationEngine()
    return engine.get_recommendations(user_id, top_n)