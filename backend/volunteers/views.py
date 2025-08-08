# volunteers/views.py
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from .models import VolunteerProfile, VolunteerRequest, VolunteerInvitation, VolunteerNotification
from django.db.models import Count, Q
from .serializers import VolunteerProfileSerializer, VolunteerRequestSerializer, VolunteerInvitationSerializer, VolunteerNotificationSerializer, BulkInviteSerializer \
    , ExportInvitedVolunteersSerializer
from .services import VolunteerMatchingService, VolunteerInvitationService, VolunteerNotificationService
import requests
from django.http import HttpResponse
import csv
from datetime import datetime
from django.http import HttpResponse, JsonResponse
from django.utils.text import slugify

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
        

class VolunteerRequestViewSet(viewsets.ModelViewSet):
    """ViewSet for volunteer requests"""
    serializer_class = VolunteerRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        if user.role == 'organization':
            # Organizations see their own requests with annotations
            from django.db.models import Count, Q
            return VolunteerRequest.objects.filter(organization=user).annotate(
                accepted_count=Count('invitations', filter=Q(invitations__status='accepted')),
                pending_count=Count('invitations', filter=Q(invitations__status='pending')),
                total_invited=Count('invitations')
            ).select_related('organization', 'campaign').prefetch_related('invitations')
        else:
            # Regular users see requests they've been invited to or public requests
            from django.db.models import Count, Q
            return VolunteerRequest.objects.filter(
                Q(status='open') | Q(invitations__volunteer__user=user)
            ).distinct().annotate(
                accepted_count=Count('invitations', filter=Q(invitations__status='accepted')),
                pending_count=Count('invitations', filter=Q(invitations__status='pending')),
                total_invited=Count('invitations')
            ).select_related('organization', 'campaign').prefetch_related('invitations')
    
    def create(self, request, *args, **kwargs):
        """Create volunteer request - only for organizations"""
        if request.user.role != 'organization':
            return Response(
                {'error': 'Only organizations can create volunteer requests'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().create(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        """Update volunteer request - only by owner organization"""
        instance = self.get_object()
        
        if request.user != instance.organization:
            return Response(
                {'error': 'Only the organization that created this request can update it'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Delete volunteer request - only by owner organization"""
        instance = self.get_object()
        
        if request.user != instance.organization:
            return Response(
                {'error': 'Only the organization that created this request can delete it'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=True, methods=['get'])
    def matches(self, request, pk=None):
        """Get matching volunteers for a request"""
        volunteer_request = self.get_object()
        
        # Only organization that created the request can see matches
        if request.user != volunteer_request.organization:
            return Response(
                {'error': 'Only the organization that created this request can view matches'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get query parameters
        limit = int(request.query_params.get('limit', 20))
        min_score = float(request.query_params.get('min_score', 0))
        
        # Find matching volunteers
        matched_volunteers = VolunteerMatchingService.find_matching_volunteers(
            volunteer_request, limit=limit
        )
        
        # Filter by minimum score if specified
        if min_score > 0:
            matched_volunteers = [v for v in matched_volunteers if v.match_score >= min_score]
        
        # Serialize results using VolunteerProfileSerializer with extra fields
        serialized_volunteers = []
        for volunteer in matched_volunteers:
            # Use the existing VolunteerProfileSerializer
            serializer = VolunteerProfileSerializer(volunteer)
            volunteer_data = serializer.data
            
            # Add match-specific fields
            volunteer_data['match_score'] = volunteer.match_score
            volunteer_data['match_details'] = volunteer.match_details
            
            serialized_volunteers.append(volunteer_data)
        
        return Response({
            'request_id': volunteer_request.id,
            'request_title': volunteer_request.title,
            'matches_found': len(matched_volunteers),
            'volunteers': serialized_volunteers
        })
    
    @action(detail=True, methods=['post'])
    def invite_volunteers(self, request, pk=None):
        """Send bulk invitations to volunteers"""
        volunteer_request = self.get_object()
        
        # Only organization that created the request can invite volunteers
        if request.user != volunteer_request.organization:
            return Response(
                {'error': 'Only the organization that created this request can invite volunteers'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = BulkInviteSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            invitations, notifications = VolunteerInvitationService.send_bulk_invitations(
                request=volunteer_request,
                volunteer_ids=serializer.validated_data['volunteer_ids'],
                message=serializer.validated_data.get('message', ''),
                user=request.user
            )
            
            return Response({
                'message': f'Successfully sent {len(invitations)} invitations',
                'invitations_sent': len(invitations),
                'notifications_created': len(notifications)
            }, status=status.HTTP_201_CREATED)
        
        except (PermissionError, ValueError) as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def invitations(self, request, pk=None):
        """Get invitations for a request"""
        volunteer_request = self.get_object()
        
        # Only organization that created the request can see invitations
        if request.user != volunteer_request.organization:
            return Response(
                {'error': 'Only the organization that created this request can view invitations'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get query parameters
        invitation_status = request.query_params.get('status')
        
        invitations = VolunteerInvitationService.get_request_invitations(
            volunteer_request, status=invitation_status
        )
        
        serializer = VolunteerInvitationSerializer(invitations, many=True)
        
        return Response({
            'request_id': volunteer_request.id,
            'request_title': volunteer_request.title,
            'invitations': serializer.data
        })


class VolunteerInvitationViewSet(viewsets.ModelViewSet):
    """ViewSet for volunteer invitations"""
    serializer_class = VolunteerInvitationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        if user.role == 'organization':
            # Organizations see invitations for their requests
            return VolunteerInvitation.objects.filter(
                request__organization=user
            ).select_related(
                'request', 
                'request__organization', 
                'request__organization__organization_profile',  # Add this
                'request__campaign',
                'volunteer', 
                'volunteer__user'
            )
        else:
            # Regular users see their own invitations
            try:
                volunteer_profile = VolunteerProfile.objects.get(user=self.request.user)
                return VolunteerInvitation.objects.filter(
                    volunteer=volunteer_profile
                ).select_related(
                    'request', 
                    'request__organization',
                    'request__organization__organization_profile',  # Add this
                    'request__campaign',
                    'volunteer',
                    'volunteer__user'
                )
            except VolunteerProfile.DoesNotExist:
                return VolunteerInvitation.objects.none()
    
    @action(detail=False, methods=['get'])
    def my_invitations(self, request):
        """Get current user's invitations - only for volunteers"""
        if request.user.role == 'organization':
            return Response(
                {'error': 'Organizations do not receive invitations'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            volunteer_profile = VolunteerProfile.objects.get(user=request.user)
        except VolunteerProfile.DoesNotExist:
            return Response(
                {'error': 'Volunteer profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get query parameters
        invitation_status = request.query_params.get('status')
        
        invitations = VolunteerInvitationService.get_volunteer_invitations(
            volunteer_profile, status=invitation_status
        )
        
        serializer = self.get_serializer(invitations, many=True)
        
        return Response({
            'volunteer_id': volunteer_profile.id,
            'invitations': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def respond(self, request, pk=None):
        """Respond to an invitation - only for volunteers"""
        invitation = self.get_object()
        
        if request.user.role == 'organization':
            return Response(
                {'error': 'Organizations cannot respond to invitations'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Validate request data
        response_status = request.data.get('status')
        if response_status not in ['accepted', 'declined']:
            return Response(
                {'error': 'Status must be either "accepted" or "declined"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        response_message = request.data.get('response_message', '')
        
        try:
            updated_invitation = VolunteerInvitationService.respond_to_invitation(
                invitation=invitation,
                status=response_status,
                response_message=response_message,
                user=request.user
            )
            
            serializer = self.get_serializer(updated_invitation)
            
            return Response({
                'message': f'Invitation {response_status} successfully',
                'invitation': serializer.data
            })
        
        except (PermissionError, ValueError) as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class VolunteerNotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for volunteer notifications"""
    serializer_class = VolunteerNotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        if user.role == 'organization':
            return VolunteerNotification.objects.none()
        
        try:
            volunteer_profile = VolunteerProfile.objects.get(user=user)
            return VolunteerNotification.objects.filter(
                volunteer=volunteer_profile
            ).select_related('invitation', 'request')
        except VolunteerProfile.DoesNotExist:
            return VolunteerNotification.objects.none()
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread notifications"""
        if request.user.role == 'organization':
            return Response({'unread_count': 0})
        
        try:
            volunteer_profile = VolunteerProfile.objects.get(user=request.user)
            count = VolunteerNotificationService.get_unread_count(volunteer_profile)
            return Response({'unread_count': count})
        except VolunteerProfile.DoesNotExist:
            return Response({'unread_count': 0})
    
    @action(detail=False, methods=['post'])
    def mark_read(self, request):
        """Mark notifications as read"""
        if request.user.role == 'organization':
            return Response(
                {'error': 'Organizations do not have notifications'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            volunteer_profile = VolunteerProfile.objects.get(user=request.user)
        except VolunteerProfile.DoesNotExist:
            return Response(
                {'error': 'Volunteer profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        notification_ids = request.data.get('notification_ids', [])
        
        if not notification_ids:
            return Response(
                {'error': 'notification_ids required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        updated_count = VolunteerNotificationService.mark_as_read(
            notification_ids, volunteer_profile
        )
        
        return Response({
            'message': f'{updated_count} notifications marked as read',
            'updated_count': updated_count
        })
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read"""
        if request.user.role == 'organization':
            return Response(
                {'error': 'Organizations do not have notifications'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            volunteer_profile = VolunteerProfile.objects.get(user=request.user)
        except VolunteerProfile.DoesNotExist:
            return Response(
                {'error': 'Volunteer profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        updated_count = VolunteerNotification.objects.filter(
            volunteer=volunteer_profile,
            is_read=False
        ).update(is_read=True)
        
        return Response({
            'message': f'All {updated_count} notifications marked as read',
            'updated_count': updated_count
        })


# a view to export volunteers who have accepted invitations to a CSV file



def export_volunteer_invitations(request, request_id):
    """Export only accepted volunteer invitations to CSV with clean rows"""
    if request.method == 'GET':
        try:
            volunteer_request = VolunteerRequest.objects.get(id=request_id)
        except VolunteerRequest.DoesNotExist:
            return HttpResponse('Volunteer request not found', status=404)

        invitations = VolunteerInvitation.objects.filter(
            request=volunteer_request,
            status='accepted'
        ).select_related('volunteer__user')

        if not invitations.exists():
            return HttpResponse('No accepted volunteers found for this request', status=404)

        serializer = ExportInvitedVolunteersSerializer(invitations, many=True)

        # CSV Header with UTF-8 BOM
        csv_data = "\ufeff"
        csv_data += (
            "Volunteer Name,Email,Phone,Age,Profession,Location,Skills,"
            "Languages,Interests,Match Score,Status,Invited At,Responded At,"
            "Organization Message,Volunteer Response\n"
        )

        for invitation in serializer.data:
            # Format fields
            def escape(field):
                if not field:
                    return ""
                field = str(field).replace('"', '""')
                return f'"{field}"' if any(c in field for c in [',', '\n', '"']) else field

            csv_data += ",".join([
                escape(invitation.get('volunteer_name')),
                escape(invitation.get('volunteer_email')),
                escape(invitation.get('volunteer_phone')),
                str(invitation.get('volunteer_age') or ''),
                escape(invitation.get('volunteer_profession')),
                escape(invitation.get('volunteer_location')),
                escape(", ".join(invitation.get('volunteer_skills', []))),
                escape(", ".join(invitation.get('volunteer_languages', []))),
                escape(", ".join(invitation.get('volunteer_interests', []))),
                str(invitation.get('match_score') or ''),
                invitation.get('status') or '',
                invitation.get('invited_at', '')[:19],
                (invitation.get('responded_at') or '')[:19],
                escape(invitation.get('message')),
                escape(invitation.get('response_message')),
            ]) + "\n"

        # Clean file name: program_title_YYYY-MM-DD.csv
        program_title = volunteer_request.title or "volunteer_export"
        safe_title = slugify(program_title)
        date_str = datetime.now().strftime('%Y-%m-%d')
        filename = f"{safe_title}_{date_str}.csv"

        response = HttpResponse(csv_data, content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response