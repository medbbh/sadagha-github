# campaign/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CampaignViewSet, FileViewSet, CategoryViewSet, facebook_oauth_url, facebook_oauth_callback, user_facebook_live_videos, campaign_live_status, update_live_status,campaign_donations    

router = DefaultRouter()
router.register(r'files', FileViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'', CampaignViewSet)

urlpatterns = [
    path('', include(router.urls)),

    path('facebook/oauth-url/', facebook_oauth_url, name='facebook-oauth-url'),
    path('facebook/oauth-callback/', facebook_oauth_callback, name='facebook-oauth-callback'),
    path('facebook/live-videos/', user_facebook_live_videos, name='facebook-live-videos'),
    path('campaigns/<int:campaign_id>/live-status/', campaign_live_status, name='campaign-live-status'),
    path('campaigns/<int:campaign_id>/update-live-status/', update_live_status, name='update-live-status'),
    path('<int:campaign_id>/donations-list/', campaign_donations, name='donations-list'),

]