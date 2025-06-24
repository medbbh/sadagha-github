# campaign/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CampaignViewSet, FileViewSet, CategoryViewSet, donation_webhook

router = DefaultRouter()
router.register(r'files', FileViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'', CampaignViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('donation-webhook/', donation_webhook, name='donation-webhook'),
]