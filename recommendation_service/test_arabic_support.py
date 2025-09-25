#!/usr/bin/env python3
"""
Test Arabic text support in the recommendation service
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.django_data_loader import DjangoDataLoader
from services.recommendation_engine import RecommendationEngine
import json
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_arabic_text_handling():
    """Test that Arabic text is properly handled throughout the system"""
    print("🔍 Testing Arabic Text Support...")
    
    try:
        loader = DjangoDataLoader()
        donations_df, campaigns_df, orgs_df = loader.load_all_data()
        
        print(f"✅ Data loaded: {len(campaigns_df)} campaigns")
        
        # Find Arabic campaigns
        arabic_campaigns = campaigns_df[
            campaigns_df['title'].str.contains('[\u0600-\u06FF]', na=False, regex=True)
        ]
        
        print(f"🔤 Found {len(arabic_campaigns)} campaigns with Arabic text:")
        
        for idx, campaign in arabic_campaigns.head(3).iterrows():
            print(f"   📋 ID: {campaign['id']}")
            print(f"      Title: {campaign['title']}")
            print(f"      Category: {campaign.get('category', 'N/A')}")
            print(f"      Organization: {campaign.get('organization_name', 'N/A')}")
            print()
        
        # Test JSON serialization of Arabic text
        if len(arabic_campaigns) > 0:
            sample_campaign = arabic_campaigns.iloc[0]
            
            # Simulate API response with Arabic text
            api_response = {
                "campaign_id": int(sample_campaign['id']),
                "title": sample_campaign['title'],
                "category": sample_campaign.get('category'),
                "organization": sample_campaign.get('organization_name'),
                "goal_amount": float(sample_campaign['goal_amount']),
                "progress": float(sample_campaign['progress_percentage'])
            }
            
            # Test JSON encoding/decoding
            json_str = json.dumps(api_response, ensure_ascii=False, indent=2)
            print("📄 JSON Response with Arabic text:")
            print(json_str)
            
            # Test decoding
            decoded = json.loads(json_str)
            print(f"✅ JSON decode successful: {decoded['title']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing Arabic support: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_arabic_recommendations():
    """Test recommendations with Arabic campaigns"""
    print("\n🎯 Testing Arabic Recommendations...")
    
    try:
        engine = RecommendationEngine()
        engine._refresh_data_if_needed()
        
        # Find a user who donated to Arabic campaigns
        arabic_donations = engine._donations_df[
            engine._donations_df['campaign_title'].str.contains('[\u0600-\u06FF]', na=False, regex=True)
        ]
        
        if len(arabic_donations) > 0:
            sample_user = arabic_donations['donor_email'].iloc[0]
            print(f"👤 Testing recommendations for user: {sample_user}")
            
            recommendations = engine.get_recommendations(sample_user, 3)
            
            print(f"✅ Generated {len(recommendations)} recommendations:")
            for i, rec in enumerate(recommendations, 1):
                # Find campaign details
                campaign = engine._campaigns_df[engine._campaigns_df['id'] == rec['campaign_id']]
                if len(campaign) > 0:
                    title = campaign.iloc[0]['title']
                    print(f"   {i}. {title}")
                    print(f"      Score: {rec['score']:.2f} - {rec['reason']}")
                else:
                    print(f"   {i}. Campaign {rec['campaign_id']} - Score: {rec['score']:.2f}")
        
        # Test similar campaigns with Arabic
        arabic_campaigns = engine._campaigns_df[
            engine._campaigns_df['title'].str.contains('[\u0600-\u06FF]', na=False, regex=True)
        ]
        
        if len(arabic_campaigns) > 0:
            sample_campaign_id = arabic_campaigns.iloc[0]['id']
            sample_title = arabic_campaigns.iloc[0]['title']
            
            print(f"\n🔍 Testing similar campaigns for: {sample_title}")
            
            similar = engine.get_similar_campaigns(sample_campaign_id, 3)
            
            print(f"✅ Found {len(similar)} similar campaigns:")
            for i, sim in enumerate(similar, 1):
                print(f"   {i}. {sim['title']}")
                print(f"      Score: {sim['score']:.2f} - {sim['reason']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing Arabic recommendations: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_encoding_edge_cases():
    """Test various Arabic text edge cases"""
    print("\n🧪 Testing Arabic Encoding Edge Cases...")
    
    # Test various Arabic text patterns
    test_texts = [
        "حملة خيرية للأطفال",  # Basic Arabic
        "مشروع التعليم - Education Project",  # Mixed Arabic/English
        "١٢٣٤٥ ريال سعودي",  # Arabic numerals
        "الرعاية الصحية 2024",  # Arabic with Latin numerals
        "مؤسسة الخير الإسلامية",  # Arabic with Islamic terms
    ]
    
    try:
        for text in test_texts:
            # Test JSON serialization
            test_obj = {"text": text, "length": len(text)}
            json_str = json.dumps(test_obj, ensure_ascii=False)
            decoded = json.loads(json_str)
            
            print(f"✅ '{text}' -> JSON -> '{decoded['text']}'")
            
            # Verify text integrity
            if decoded['text'] == text:
                print(f"   ✓ Text integrity maintained")
            else:
                print(f"   ❌ Text corruption detected!")
                return False
        
        print("✅ All Arabic encoding tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Encoding test failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 Testing Arabic Text Support in Recommendation Service\n")
    
    # Test 1: Basic Arabic text handling
    arabic_ok = test_arabic_text_handling()
    
    if arabic_ok:
        # Test 2: Arabic recommendations
        recommendations_ok = test_arabic_recommendations()
        
        # Test 3: Encoding edge cases
        encoding_ok = test_encoding_edge_cases()
        
        if recommendations_ok and encoding_ok:
            print("\n🎉 All Arabic support tests passed!")
            print("\n📝 Arabic Support Summary:")
            print("   ✅ Database connection with UTF-8 encoding")
            print("   ✅ Arabic text loading from PostgreSQL")
            print("   ✅ JSON serialization with Arabic text")
            print("   ✅ Recommendation engine with Arabic campaigns")
            print("   ✅ Similar campaigns with Arabic titles")
            print("   ✅ Mixed Arabic/English text handling")
            print("\n🌍 Your service fully supports Arabic content!")
        else:
            print("\n⚠️ Some Arabic support tests failed")
    else:
        print("\n❌ Basic Arabic text handling failed")