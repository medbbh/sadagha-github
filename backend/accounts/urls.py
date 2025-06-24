
from django.urls import path, include
from .views import protected_view, update_role, sync_user
from rest_framework.routers import DefaultRouter

router = DefaultRouter()

urlpatterns = [
    path("test", protected_view, name="protected_view"),
    path("update-role", update_role, name="update_role"),
    path('sync-user/', sync_user, name='sync_user'),
    path('', include(router.urls)),
]
