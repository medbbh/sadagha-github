# volunteers/views.py
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import VolunteerProfile
from .serializers import VolunteerProfileSerializer


class VolunteerProfileViewSet(viewsets.ModelViewSet):
    """ViewSet for volunteer profiles"""
    serializer_class = VolunteerProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # If user is organization, return all active volunteer profiles
        if self.request.user.role == 'organization':
            return VolunteerProfile.objects.filter(is_active=True)
        # Otherwise, only return the current user's volunteer profile
        return VolunteerProfile.objects.filter(user=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """Create volunteer profile - only for regular users"""
        # Only regular users can create volunteer profiles
        if request.user.role == 'organization':
            return Response(
                {'error': 'Organizations cannot create volunteer profiles'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if user already has a volunteer profile
        if VolunteerProfile.objects.filter(user=request.user).exists():
            return Response(
                {'error': 'You already have a volunteer profile'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            volunteer_profile = serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def my_profile(self, request):
        """Get current user's volunteer profile - only for regular users"""
        if request.user.role == 'organization':
            return Response(
                {'error': 'Organizations do not have volunteer profiles'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            volunteer_profile = VolunteerProfile.objects.get(user=request.user)
            serializer = self.get_serializer(volunteer_profile)
            return Response(serializer.data)
        except VolunteerProfile.DoesNotExist:
            return Response(
                {'error': 'Volunteer profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['post'])
    def toggle_active(self, request):
        """Toggle volunteer profile active status - only for regular users"""
        if request.user.role == 'organization':
            return Response(
                {'error': 'Organizations cannot toggle volunteer profiles'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            volunteer_profile = VolunteerProfile.objects.get(user=request.user)
            volunteer_profile.is_active = not volunteer_profile.is_active
            volunteer_profile.save()
            
            return Response({
                'message': f'Profile {"activated" if volunteer_profile.is_active else "deactivated"}',
                'is_active': volunteer_profile.is_active
            })
        except VolunteerProfile.DoesNotExist:
            return Response(
                {'error': 'Volunteer profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )