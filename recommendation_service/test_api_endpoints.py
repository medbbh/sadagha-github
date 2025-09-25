#!/usr/bin/env python3
"""
Test the API endpoints directly without FastAPI server
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import asyncio
from routes.recommendations import get_personalized_recommendations, get_similar_campaigns, get_test_users, get_test_campaigns

async def test_endpoints():
    """Test the API endpoints directly"""
    print("🔍 Testing API Endpoints...")
    
    try:
        # Test 1: Get test users
        print("\n1️⃣ Getting test users...")
        test_users_response = await get_test_users()
        print(f"✅ Test users endpoint works")
        
        if test_users_response['sample_users']:
            sample_user_data = test_users_response['sample_users'][0]
            sample_user_id = str(sample_user_data['user_id'])
            print(f"   Sample user: {sample_user_data}")
            
            # Test 2: Get recommendations for sample user
            print(f"\n2️⃣ Getting recommendations for user ID {sample_user_id}...")
            recommendations_response = await get_personalized_recommendations(sample_user_id, 5)
            print(f"✅ Recommendations endpoint works")
            print(f"   Generated {recommendations_response['total']} recommendations")
            
            if recommendations_response['recommendations']:
                print(f"   Sample recommendation: Campaign {recommendations_response['recommendations'][0]['campaign_id']}")
        
        # Test 3: Get test campaigns
        print("\n3️⃣ Getting test campaigns...")
        test_campaigns_response = await get_test_campaigns()
        print(f"✅ Test campaigns endpoint works")
        
        if test_campaigns_response['sample_campaigns']:
            sample_campaign = test_campaigns_response['sample_campaigns'][0]
            print(f"   Sample campaign: {sample_campaign['id']} - {sample_campaign['title']}")
            
            # Test 4: Get similar campaigns
            print(f"\n4️⃣ Getting similar campaigns for {sample_campaign['id']}...")
            similar_response = await get_similar_campaigns(sample_campaign['id'], 3)
            print(f"✅ Similar campaigns endpoint works")
            print(f"   Found {similar_response['total']} similar campaigns")
            
            if similar_response['similar_campaigns']:
                print(f"   Sample similar: {similar_response['similar_campaigns'][0]['title']}")
        
        print("\n🎉 All API endpoints working correctly!")
        return True
        
    except Exception as e:
        print(f"❌ Error testing endpoints: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🚀 Testing API Endpoints\n")
    
    success = asyncio.run(test_endpoints())
    
    if success:
        print("\n📝 API Testing Summary:")
        print("   ✅ /recommendations/test/users - Working")
        print("   ✅ /recommendations/test/campaigns - Working") 
        print("   ✅ /recommendations/{user_id} - Working")
        print("   ✅ /recommendations/similar/{campaign_id} - Working")
        print("\n🌐 Ready for browser testing!")
        print("   Try: http://localhost:8000/recommendations/test/users")
        print("   Then use a real email from the response")
    else:
        print("\n❌ Some endpoints failed - check the errors above")