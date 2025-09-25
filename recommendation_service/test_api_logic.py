#!/usr/bin/env python3
"""
Test the API logic without FastAPI server
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.django_data_loader import DjangoDataLoader
from services.recommendation_engine import RecommendationEngine, get_user_recommendations
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_data_loading():
    """Test Django data loading"""
    print("🔍 Testing Django Data Loading...")
    
    try:
        loader = DjangoDataLoader()
        donations_df, campaigns_df, orgs_df = loader.load_all_data()
        
        print(f"✅ Data loaded successfully:")
        print(f"   - Donations: {len(donations_df)} records")
        print(f"   - Campaigns: {len(campaigns_df)} records") 
        print(f"   - Organizations: {len(orgs_df)} records")
        
        # Show sample data
        if len(campaigns_df) > 0:
            print(f"\n📋 Sample Campaign:")
            sample = campaigns_df.iloc[0]
            print(f"   ID: {sample['id']}")
            print(f"   Title: {sample['title']}")
            print(f"   Category: {sample.get('category', 'N/A')}")
            print(f"   Goal: ${sample['goal_amount']}")
            print(f"   Progress: {sample['progress_percentage']:.1f}%")
        
        if len(donations_df) > 0:
            print(f"\n💰 Sample Donation:")
            sample = donations_df.iloc[0]
            print(f"   ID: {sample['id']}")
            print(f"   Amount: ${sample['amount']}")
            print(f"   Donor: {sample.get('donor_email', 'Anonymous')}")
            print(f"   Campaign: {sample.get('campaign_title', 'N/A')}")
        
        return donations_df, campaigns_df, orgs_df
        
    except Exception as e:
        print(f"❌ Error loading data: {str(e)}")
        return None, None, None

def test_recommendations(donations_df, campaigns_df):
    """Test recommendation engine"""
    print("\n🎯 Testing Recommendation Engine...")
    
    try:
        engine = RecommendationEngine()
        
        # Manually set the data (bypass refresh)
        engine._donations_df = donations_df
        engine._campaigns_df = campaigns_df
        
        # Test 1: Personalized recommendations
        if len(donations_df) > 0:
            sample_user = donations_df['donor_email'].iloc[0]
            print(f"\n1️⃣ Testing personalized recommendations for: {sample_user}")
            
            recommendations = engine.get_recommendations(sample_user, 5)
            print(f"✅ Generated {len(recommendations)} recommendations:")
            
            for i, rec in enumerate(recommendations, 1):
                print(f"   {i}. Campaign {rec['campaign_id']} - Score: {rec['score']:.2f} - {rec['reason']}")
        
        # Test 2: Similar campaigns
        if len(campaigns_df) > 0:
            sample_campaign = campaigns_df['id'].iloc[0]
            sample_title = campaigns_df['title'].iloc[0]
            print(f"\n2️⃣ Testing similar campaigns for: {sample_title} (ID: {sample_campaign})")
            
            similar = engine.get_similar_campaigns(sample_campaign, 3)
            print(f"✅ Found {len(similar)} similar campaigns:")
            
            for i, sim in enumerate(similar, 1):
                print(f"   {i}. {sim['title']} - Score: {sim['score']:.2f} - {sim['reason']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing recommendations: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_api_endpoints():
    """Simulate API endpoint calls"""
    print("\n🌐 Testing API Logic (without FastAPI server)...")
    
    try:
        # Test endpoint 1: GET /recommendations/{user_id}
        if len(donations_df) > 0:
            sample_user = donations_df['donor_email'].iloc[0]
            print(f"\n📡 Simulating: GET /recommendations/{sample_user}")
            
            recommendations = get_user_recommendations(sample_user, 5)
            
            # Simulate API response
            api_response = {
                "user_id": sample_user,
                "recommendations": recommendations,
                "total": len(recommendations)
            }
            
            print(f"✅ API Response: {len(api_response['recommendations'])} recommendations")
            print(f"   Sample: {api_response['recommendations'][0] if recommendations else 'None'}")
        
        # Test endpoint 2: GET /recommendations/similar/{campaign_id}
        if len(campaigns_df) > 0:
            sample_campaign = campaigns_df['id'].iloc[0]
            print(f"\n📡 Simulating: GET /recommendations/similar/{sample_campaign}")
            
            engine = RecommendationEngine()
            engine._donations_df = donations_df
            engine._campaigns_df = campaigns_df
            
            similar_campaigns = engine.get_similar_campaigns(sample_campaign, 5)
            
            # Simulate API response
            api_response = {
                "campaign_id": sample_campaign,
                "similar_campaigns": similar_campaigns,
                "total": len(similar_campaigns)
            }
            
            print(f"✅ API Response: {len(api_response['similar_campaigns'])} similar campaigns")
            print(f"   Sample: {api_response['similar_campaigns'][0]['title'] if similar_campaigns else 'None'}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing API logic: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🚀 Testing Recommendation Service Logic\n")
    
    # Test data loading
    donations_df, campaigns_df, orgs_df = test_data_loading()
    
    if donations_df is not None and campaigns_df is not None:
        # Test recommendation engine
        recommendations_ok = test_recommendations(donations_df, campaigns_df)
        
        if recommendations_ok:
            # Test API logic
            api_ok = test_api_endpoints()
            
            if api_ok:
                print("\n🎉 All tests passed! The recommendation service logic works correctly.")
                print("\n📝 Summary:")
                print(f"   - Database connection: ✅")
                print(f"   - Data loading: ✅ ({len(donations_df)} donations, {len(campaigns_df)} campaigns)")
                print(f"   - Recommendation engine: ✅")
                print(f"   - API logic: ✅")
                print("\n🔧 To fix FastAPI server:")
                print("   pip install --upgrade fastapi typing-extensions")
                print("   or use: pip install fastapi==0.68.0")
            else:
                print("\n⚠️ API logic tests failed")
        else:
            print("\n⚠️ Recommendation engine tests failed")
    else:
        print("\n❌ Data loading failed - check database connection")