import pandas as pd
from typing import List, Dict, Tuple
import logging
from collections import Counter
from datetime import datetime, timedelta

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
    """Campaign recommendation engine based on user behavior and popularity"""
    
    def __init__(self):
        self.data_loader = DjangoDataLoader()
        self._donations_df = None
        self._campaigns_df = None
        self._last_refresh = None
        
    def _refresh_data_if_needed(self):
        """Refresh data if it's older than 1 hour or not loaded"""
        if (self._last_refresh is None or 
            datetime.now() - self._last_refresh > timedelta(hours=1)):
            
            logger.info("Refreshing recommendation data...")
            donations_df, campaigns_df, _ = self.data_loader.load_all_data()
            
            # Filter for completed donations and active campaigns
            self._donations_df = donations_df[donations_df['status'] == 'completed'].copy()
            self._campaigns_df = campaigns_df[campaigns_df['is_active'] == True].copy()
            
            self._last_refresh = datetime.now()
            logger.info(f"Data refreshed: {len(self._donations_df)} donations, {len(self._campaigns_df)} campaigns")
    
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
                # User has donation history - use collaborative filtering
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
        Get campaigns similar to the given campaign (content-based filtering)
        
        Args:
            campaign_id: ID of the campaign to find similar ones for
            top_n: Number of similar campaigns to return
            
        Returns:
            List of similar campaigns with scores
        """
        self._refresh_data_if_needed()
        
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