from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any, Union
import logging

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.recommendation_engine import get_user_recommendations, RecommendationEngine

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.get("/{user_id}")
async def get_personalized_recommendations(
    user_id: str,
    limit: int = Query(default=5, ge=1, le=10, description="Number of recommendations to return")
) -> Dict[str, Any]:
    """
    Get top 5 personalized recommendations based on user interactions
    
    Args:
        user_id: User identifier (numeric user ID or email as fallback)
        limit: Number of recommendations (defaults to 5, max 10)
        
    Returns:
        Dictionary with personalized recommendations
    """
    try:
        logger.info(f"Getting recommendations for user: {user_id} with limit: {limit}")
        recommendations = get_user_recommendations(user_id, limit)
        
        response = {
            "user_id": user_id,
            "recommendations": recommendations,
            "total": len(recommendations)
        }
        
        logger.info(f"Successfully generated {len(recommendations)} recommendations for user {user_id}")
        return response
        
    except Exception as e:
        logger.error(f"Error getting recommendations for user {user_id}: {str(e)}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate recommendations: {str(e)}"
        )


@router.get("/similar/{campaign_id}")
async def get_similar_campaigns(
    campaign_id: int,
    limit: int = Query(default=5, ge=1, le=10, description="Number of similar campaigns to return")
) -> Dict[str, Any]:
    """
    Get campaigns similar to this one (like "you might also like" section)
    
    Args:
        campaign_id: ID of the campaign to find similar ones for
        limit: Number of similar campaigns (defaults to 5, max 10)
        
    Returns:
        Dictionary with similar campaigns
    """
    try:
        logger.info(f"Getting similar campaigns for campaign_id: {campaign_id} with limit: {limit}")
        engine = RecommendationEngine()
        similar_campaigns = engine.get_similar_campaigns(campaign_id, limit)
        
        response = {
            "campaign_id": campaign_id,
            "similar_campaigns": similar_campaigns,
            "total": len(similar_campaigns)
        }
        
        logger.info(f"Successfully found {len(similar_campaigns)} similar campaigns for campaign {campaign_id}")
        return response
        
    except Exception as e:
        logger.error(f"Error getting similar campaigns for {campaign_id}: {str(e)}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get similar campaigns: {str(e)}"
        )


@router.get("/test/users")
async def get_test_users():
    """
    Get sample user IDs for testing recommendations
    
    Returns:
        List of sample donor emails that can be used for testing
    """
    try:
        from services.django_data_loader import DjangoDataLoader
        
        loader = DjangoDataLoader()
        donations_df, _, _ = loader.load_all_data()
        
        # Get unique donor IDs
        unique_donor_ids = donations_df['donor_id'].dropna().unique()[:10]
        
        # Also get some sample data for reference
        sample_data = []
        for donor_id in unique_donor_ids:
            donor_info = donations_df[donations_df['donor_id'] == donor_id].iloc[0]
            sample_data.append({
                "user_id": int(donor_id),
                "email": donor_info.get('donor_email', 'N/A'),
                "donations_count": len(donations_df[donations_df['donor_id'] == donor_id])
            })
        
        return {
            "message": "Sample user IDs for testing recommendations",
            "sample_users": sample_data,
            "usage": "Use these user IDs in /recommendations/{user_id}",
            "example": f"/recommendations/{int(unique_donor_ids[0])}" if len(unique_donor_ids) > 0 else "/recommendations/1"
        }
        
    except Exception as e:
        logger.error(f"Error getting test users: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get test users: {str(e)}"
        )


@router.get("/test/campaigns")
async def get_test_campaigns():
    """
    Get sample campaign IDs for testing similar campaigns
    
    Returns:
        List of sample campaign IDs that can be used for testing
    """
    try:
        from services.django_data_loader import DjangoDataLoader
        
        loader = DjangoDataLoader()
        _, campaigns_df, _ = loader.load_all_data()
        
        # Get sample campaigns
        sample_campaigns = campaigns_df[['id', 'title', 'category']].head(10)
        
        campaigns_list = []
        for _, campaign in sample_campaigns.iterrows():
            campaigns_list.append({
                "id": int(campaign['id']),
                "title": campaign['title'],
                "category": campaign.get('category', 'N/A')
            })
        
        return {
            "message": "Sample campaign IDs for testing similar campaigns",
            "sample_campaigns": campaigns_list,
            "usage": "Use these IDs in /recommendations/similar/{campaign_id}",
            "example": f"/recommendations/similar/{campaigns_list[0]['id']}" if campaigns_list else "/recommendations/similar/1"
        }
        
    except Exception as e:
        logger.error(f"Error getting test campaigns: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get test campaigns: {str(e)}"
        )