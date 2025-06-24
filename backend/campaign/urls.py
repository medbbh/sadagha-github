from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CampaignViewSet, FileViewSet,CategoryViewSet

router = DefaultRouter()
router.register(r'files', FileViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'', CampaignViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
