from django.urls import path, include
from .views import protected_view, update_role, register_user, check_user_exists
from rest_framework.routers import DefaultRouter

router = DefaultRouter()

urlpatterns = [
    path("test", protected_view, name="protected_view"),
    path("update-role", update_role, name="update_role"),
    path('register/', register_user, name='register_user'),
    path('check-user/', check_user_exists, name='check_user_exists'),
    path('', include(router.urls)),
]