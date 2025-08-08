# volunteers/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VolunteerProfileViewSet, VolunteerRequestViewSet, VolunteerInvitationViewSet, VolunteerNotificationViewSet, export_volunteer_invitations

router = DefaultRouter()
router.register(r'profiles', VolunteerProfileViewSet, basename='volunteer-profile')
router.register(r'requests', VolunteerRequestViewSet, basename='volunteer-request')
router.register(r'invitations', VolunteerInvitationViewSet, basename='volunteer-invitation')
router.register(r'notifications', VolunteerNotificationViewSet, basename='volunteer-notification')

urlpatterns = [
    
    # url for the export invitations to CSV
    path('invitations/<int:request_id>/export/', export_volunteer_invitations, name='export-invitations'),

    path('', include(router.urls)),

]