# admin_panel/permissions.py
from rest_framework import permissions

class IsAdminUser(permissions.BasePermission):
    """Check if user is admin"""
    def has_permission(self, request, view):
        return (request.user.is_authenticated and 
                (request.user.role == 'admin' or request.user.is_platform_admin))

class AdminViewPermission(permissions.BasePermission):
    """Granular admin permissions"""
    def has_permission(self, request, view):
        if not IsAdminUser().has_permission(request, view):
            return False
        # Add specific permission logic here
        return True