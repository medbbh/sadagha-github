# campaign/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CampaignViewSet, FileViewSet, CategoryViewSet, donation_webhook, payment_health_check 

router = DefaultRouter()
router.register(r'files', FileViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'', CampaignViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('donation-webhook/', donation_webhook, name='donation-webhook'),
    path('payment/health/', payment_health_check, name='payment-health'),

]