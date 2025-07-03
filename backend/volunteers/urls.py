# volunteers/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VolunteerProfileViewSet

router = DefaultRouter()
router.register(r'profiles', VolunteerProfileViewSet, basename='volunteer-profile')

urlpatterns = [
    path('', include(router.urls)),
]