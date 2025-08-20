from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrganizationProfileViewSet, OrganizationDashboardViewSet \
    , AnalyticsViewSet, PublicOrganizationViewSet

router = DefaultRouter()

# Your existing organization profile viewset
router.register(r'organization-profile', OrganizationProfileViewSet, basename='organization-profile')


router.register(r'analytics', AnalyticsViewSet, basename='analytics')

# New dashboard viewset
router.register(r'dashboard', OrganizationDashboardViewSet, basename='organization-dashboard')

router.register(r'public-organizations', PublicOrganizationViewSet, basename='public-organization')


urlpatterns = [
    path('', include(router.urls)),
]

