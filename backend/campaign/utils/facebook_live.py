# utils/facebook_live.py
import os
import re
import requests
import logging
from urllib.parse import urlparse, parse_qs
import environ

logger = logging.getLogger(__name__)

# Initialize environment
env = environ.Env()
environ.Env.read_env()

# Facebook App credentials
FACEBOOK_APP_ID = env("FACEBOOK_APP_ID")
FACEBOOK_APP_SECRET = env("FACEBOOK_APP_SECRET")
FACEBOOK_REDIRECT_URI = env("FACEBOOK_REDIRECT_URI")  # Your app's callback URL

class FacebookLiveAPI:
    BASE_URL = "https://graph.facebook.com/v22.0"
    
    @staticmethod
    def extract_video_id_from_url(facebook_url):
        """
        Extract Facebook video ID from various Facebook Live URL formats
        """
        if not facebook_url:
            return None
            
        # Common Facebook Live URL patterns
        patterns = [
            r'facebook\.com/[^/]+/videos/(\d+)',  # facebook.com/page/videos/123456
            r'facebook\.com/[^/]+/live/(\d+)',    # facebook.com/page/live/123456
            r'facebook\.com/watch/\?v=(\d+)',     # facebook.com/watch/?v=123456
            r'fb\.watch/([a-zA-Z0-9]+)',          # fb.watch/abc123
            r'facebook\.com/videos/(\d+)',        # facebook.com/videos/123456
        ]
        
        for pattern in patterns:
            match = re.search(pattern, facebook_url)
            if match:
                return match.group(1)
        
        # Try to extract from URL parameters
        parsed_url = urlparse(facebook_url)
        if parsed_url.query:
            params = parse_qs(parsed_url.query)
            if 'v' in params:
                return params['v'][0]
        
        logger.warning(f"Could not extract video ID from URL: {facebook_url}")
        return None
    
    @staticmethod
    def get_oauth_url():
        """
        Generate Facebook OAuth URL for getting user permission
        """
        permissions = "user_videos,pages_show_list"
        oauth_url = (
            f"https://www.facebook.com/v22.0/dialog/oauth?"
            f"client_id={FACEBOOK_APP_ID}&"
            f"redirect_uri={FACEBOOK_REDIRECT_URI}&"
            f"scope={permissions}&"
            f"response_type=code"
        )
        return oauth_url
    
    @staticmethod
    def exchange_code_for_token(auth_code):
        """
        Exchange authorization code for access token
        """
        url = f"{FacebookLiveAPI.BASE_URL}/oauth/access_token"
        params = {
            'client_id': FACEBOOK_APP_ID,
            'client_secret': FACEBOOK_APP_SECRET,
            'redirect_uri': FACEBOOK_REDIRECT_URI,
            'code': auth_code
        }
        
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            return data.get('access_token')
        except Exception as e:
            logger.error(f"Error exchanging code for token: {str(e)}")
            return None
    
    @staticmethod
    def get_live_video_status(video_id, access_token):
        """
        Get current status of Facebook Live video
        Returns: dict with status, viewer_count, etc.
        """
        if not video_id or not access_token:
            return None
            
        url = f"{FacebookLiveAPI.BASE_URL}/{video_id}"
        params = {
            'fields': 'status,live_views,title,description,created_time',
            'access_token': access_token
        }
        
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            return {
                'status': data.get('status', 'unknown'),
                'live_views': data.get('live_views', 0),
                'title': data.get('title', ''),
                'description': data.get('description', ''),
                'created_time': data.get('created_time', ''),
            }
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching live video status: {str(e)}")
            return None
    
    @staticmethod
    def get_user_live_videos(access_token):
        """
        Get list of user's live videos
        """
        url = f"{FacebookLiveAPI.BASE_URL}/me/live_videos"
        params = {
            'fields': 'id,title,status,live_views,created_time',
            'access_token': access_token
        }
        
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            return data.get('data', [])
        except Exception as e:
            logger.error(f"Error fetching user live videos: {str(e)}")
            return []
    
    @staticmethod
    def validate_facebook_live_url(url):
        """
        Validate if the URL is a valid Facebook Live URL
        """
        if not url:
            return False, "URL is required"
            
        # Check if it's a Facebook URL
        if 'facebook.com' not in url and 'fb.watch' not in url:
            return False, "Must be a Facebook URL"
        
        # Try to extract video ID
        video_id = FacebookLiveAPI.extract_video_id_from_url(url)
        if not video_id:
            return False, "Could not extract video ID from URL"
        
        return True, video_id

def update_campaign_live_status(campaign):
    """
    Update campaign's live status by checking Facebook API
    """
    if not campaign.facebook_video_id or not campaign.facebook_access_token:
        return False
    
    status_data = FacebookLiveAPI.get_live_video_status(
        campaign.facebook_video_id, 
        campaign.facebook_access_token
    )
    
    if status_data:
        # Map Facebook status to our status
        fb_status = status_data.get('status', '').lower()
        if fb_status == 'live':
            campaign.live_status = 'live'
        elif fb_status in ['vod', 'scheduled_unpublished']:
            campaign.live_status = 'ended'
        else:
            campaign.live_status = 'none'
        
        campaign.live_viewer_count = status_data.get('live_views', 0)
        campaign.save(update_fields=['live_status', 'live_viewer_count'])
        
        logger.info(f"Updated campaign {campaign.id} live status: {campaign.live_status}")
        return True
    
    return False