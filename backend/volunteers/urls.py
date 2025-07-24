# volunteers/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VolunteerProfileViewSet, VolunteerRequestViewSet, VolunteerInvitationViewSet, VolunteerNotificationViewSet

router = DefaultRouter()
router.register(r'profiles', VolunteerProfileViewSet, basename='volunteer-profile')
router.register(r'requests', VolunteerRequestViewSet, basename='volunteer-request')
router.register(r'invitations', VolunteerInvitationViewSet, basename='volunteer-invitation')
router.register(r'notifications', VolunteerNotificationViewSet, basename='volunteer-notification')

urlpatterns = [
    path('', include(router.urls)),
]