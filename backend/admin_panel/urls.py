from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AdminUserViewSet, AdminOrganizationViewSet, AdminCampaignViewSet, AdminCategoryViewSet, AdminFinancialViewSet, AdminActionViewSet

router = DefaultRouter()
router.register(r'users', AdminUserViewSet, basename='admin-user')
router.register(r'organizations', AdminOrganizationViewSet, basename='admin-organization')
router.register(r'campaigns', AdminCampaignViewSet, basename='admin-campaign')
router.register(r'categories', AdminCategoryViewSet, basename='admin-category')
router.register(r'financial', AdminFinancialViewSet, basename='admin-financial')
router.register(r'actions', AdminActionViewSet, basename='admin-action')


urlpatterns = [
    path('', include(router.urls)),
]