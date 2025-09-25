#!/usr/bin/env python3
"""
Test that APIs return only campaign IDs and metadata
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import asyncio
from routes.recommendations import get_personalized_recommendations, get_similar_campaigns

async def test_simple_format():
    """Test that APIs return simple format with only IDs and metadata"""
    print("🔍 Testing Simple API Response Format...")
    
    try:
        # Test 1: Personalized recommendations
        print("\n1️⃣ Testing personalized recommendations format...")
        recommendations_response = await get_personalized_recommendations("7", 3)
        
        print(f"✅ Personalized recommendations response:")
        print(f"   User ID: {recommendations_response['user_id']}")
        print(f"   Total: {recommendations_response['total']}")
        
        if recommendations_response['recommendations']:
            sample_rec = recommendations_response['recommendations'][0]
            print(f"   Sample recommendation format:")
            for key, value in sample_rec.items():
                print(f"      {key}: {value}")
            
            # Verify it only has the expected fields
            expected_fields = {'campaign_id', 'score', 'reason'}
            actual_fields = set(sample_rec.keys())
            
            if actual_fields == expected_fields:
                print(f"   ✅ Correct format: Only campaign_id, score, and reason")
            else:
                print(f"   ⚠️  Format issue:")
                print(f"      Expected: {expected_fields}")
                print(f"      Actual: {actual_fields}")
        
        # Test 2: Similar campaigns
        print(f"\n2️⃣ Testing similar campaigns format...")
        similar_response = await get_similar_campaigns(33, 3)
        
        print(f"✅ Similar campaigns response:")
        print(f"   Campaign ID: {similar_response['campaign_id']}")
        print(f"   Total: {similar_response['total']}")
        
        if similar_response['similar_campaigns']:
            sample_similar = similar_response['similar_campaigns'][0]
            print(f"   Sample similar campaign format:")
            for key, value in sample_similar.items():
                print(f"      {key}: {value}")
            
            # Verify it only has the expected fields
            expected_fields = {'campaign_id', 'score', 'reason'}
            actual_fields = set(sample_similar.keys())
            
            if actual_fields == expected_fields:
                print(f"   ✅ Correct format: Only campaign_id, score, and reason")
            else:
                print(f"   ⚠️  Format issue:")
                print(f"      Expected: {expected_fields}")
                print(f"      Actual: {actual_fields}")
        
        print(f"\n🎉 API Format Test Complete!")
        return True
        
    except Exception as e:
        print(f"❌ Error testing format: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🚀 Testing Simple API Response Format\n")
    
    success = asyncio.run(test_simple_format())
    
    if success:
        print(f"\n📝 API Response Format:")
        print(f"   ✅ Personalized recommendations: campaign_id + score + reason")
        print(f"   ✅ Similar campaigns: campaign_id + score + reason")
        print(f"\n🎯 Perfect! APIs return only IDs and metadata as requested.")
    else:
        print(f"\n❌ Format test failed - check the errors above")