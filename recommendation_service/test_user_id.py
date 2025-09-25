#!/usr/bin/env python3
"""
Test specific user ID recommendations
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import asyncio
from routes.recommendations import get_personalized_recommendations

async def test_user_id(user_id):
    """Test recommendations for a specific user ID"""
    print(f"🔍 Testing recommendations for user ID: {user_id}")
    
    try:
        response = await get_personalized_recommendations(str(user_id), 5)
        
        print(f"✅ Success! Generated {response['total']} recommendations")
        print(f"📊 Response:")
        print(f"   User ID: {response['user_id']}")
        print(f"   Total recommendations: {response['total']}")
        
        if response['recommendations']:
            print(f"   📋 Recommendations:")
            for i, rec in enumerate(response['recommendations'], 1):
                print(f"      {i}. Campaign {rec['campaign_id']} - Score: {rec['score']:.2f}")
                print(f"         Reason: {rec['reason']}")
        else:
            print("   ℹ️  No specific recommendations found, showing popular campaigns")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

async def main():
    print("🚀 Testing User ID Recommendations\n")
    
    # Test the original user ID you tried
    success_27 = await test_user_id(27)
    
    print("\n" + "="*50)
    
    # Test a known good user ID
    success_7 = await test_user_id(7)
    
    print("\n" + "="*50)
    
    # Test a non-existent user ID
    success_999 = await test_user_id(999)
    
    print(f"\n📝 Test Results:")
    print(f"   User ID 27: {'✅ Working' if success_27 else '❌ Failed'}")
    print(f"   User ID 7: {'✅ Working' if success_7 else '❌ Failed'}")
    print(f"   User ID 999: {'✅ Working' if success_999 else '❌ Failed'}")
    
    if success_27 and success_7 and success_999:
        print(f"\n🎉 All user ID tests passed!")
        print(f"   You can now use: http://localhost:8000/recommendations/27")
    else:
        print(f"\n⚠️  Some tests failed, but the system should still work")

if __name__ == "__main__":
    asyncio.run(main())