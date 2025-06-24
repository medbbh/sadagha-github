from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ManualPaymentViewSet, NextPayPaymentViewSet, OrganizationProfileViewSet, OrganizationProfileViewSet, WalletProviderViewSet

router = DefaultRouter()

# Your existing organization profile viewset
router.register(r'organization-profile', OrganizationProfileViewSet, basename='organization-profile')
# Wallet providers (read-only)
router.register(r'wallet-providers', WalletProviderViewSet, basename='wallet-provider')

# Manual payment methods
router.register(r'manual-payments', ManualPaymentViewSet, basename='manual-payment')

router.register(r'nextpay-payments', NextPayPaymentViewSet, basename='nextpay-payment')

# New dashboard viewset
router.register(r'dashboard', OrganizationProfileViewSet, basename='organization-dashboard')

urlpatterns = [
    path('', include(router.urls)),
]