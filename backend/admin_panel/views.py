from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Q, Sum, Case, When, FloatField, Avg, F
from django_filters.rest_framework import DjangoFilterBackend
from accounts.models import User
from campaign.models import Donation, Campaign, Category
from organizations.models import OrganizationProfile
from volunteers.models import VolunteerProfile
from .serializers import *
from .permissions import IsAdminUser
from .services import *
from .filters import UserFilter, OrganizationFilter, CampaignFilter, DonationFilter
import logging
from django.utils import timezone
from datetime import timedelta

logger = logging.getLogger(__name__)

class AdminUserViewSet(viewsets.ModelViewSet):
    """
    Admin User Management ViewSet
    Handles all user management operations for admin panel
    """
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = UserFilter
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering_fields = ['date_joined', 'last_login', 'username', 'role']
    ordering = ['-date_joined']
    
    def get_queryset(self):
        """
        Get users with related data for admin panel
        """
        return User.objects.select_related(
            'organization_profile',
            'volunteer_profile'
        ).prefetch_related(
            'donations',
            'campaigns'
        ).annotate(
            donation_count=Count('donations', filter=Q(donations__status='completed')),
            total_donated=Sum('donations__amount', filter=Q(donations__status='completed')),
            campaign_count=Count('campaigns', distinct=True),
            volunteer_invitations=Count('volunteer_profile__invitations', distinct=True)
        )
    
    def get_serializer_class(self):
        """Use detailed serializer for retrieve action"""
        if self.action == 'retrieve':
            return AdminUserDetailSerializer
        return AdminUserSerializer
    
    def create(self, request, *args, **kwargs):
        """Create new user (admin only)"""
        logger.info(f"Admin {request.user.username} creating new user")
        
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Log admin action
            UserManagementService.log_admin_action(
                admin_user=request.user,
                action_type='create_user',
                target_user=user,
                description=f"Created new user: {user.username}"
            )
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def update(self, request, *args, **kwargs):
        """Update user (admin only)"""
        instance = self.get_object()
        logger.info(f"Admin {request.user.username} updating user {instance.username}")
        
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        if serializer.is_valid():
            user = serializer.save()
            
            # Log admin action
            UserManagementService.log_admin_action(
                admin_user=request.user,
                action_type='update_user',
                target_user=user,
                description=f"Updated user: {user.username}",
                metadata={'updated_fields': list(request.data.keys())}
            )
            
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def destroy(self, request, *args, **kwargs):
        """Soft delete user (admin only)"""
        instance = self.get_object()
        logger.info(f"Admin {request.user.username} deactivating user {instance.username}")
        
        # Soft delete - deactivate instead of hard delete
        instance.is_active = False
        instance.save()
        
        # Log admin action
        UserManagementService.log_admin_action(
            admin_user=request.user,
            action_type='deactivate_user',
            target_user=instance,
            description=f"Deactivated user: {instance.username}"
        )
        
        return Response({'message': 'User deactivated successfully'}, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get user statistics for admin dashboard"""
        stats = UserManagementService.get_user_statistics()
        return Response(stats)
    
    @action(detail=False, methods=['post'])
    def bulk_actions(self, request):
        """Perform bulk actions on users"""
        action_type = request.data.get('action')
        user_ids = request.data.get('user_ids', [])
        
        if not action_type or not user_ids:
            return Response(
                {'error': 'action and user_ids are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(user_ids) > 100:
            return Response(
                {'error': 'Maximum 100 users allowed for bulk actions'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            result = UserManagementService.perform_bulk_action(
                admin_user=request.user,
                action_type=action_type,
                user_ids=user_ids,
                metadata=request.data.get('metadata', {})
            )
            
            return Response({
                'message': f'Bulk action completed successfully',
                'affected_users': result['affected_count'],
                'details': result.get('details', {})
            })
            
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Bulk action error: {str(e)}")
            return Response(
                {'error': 'An error occurred during bulk action'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def activity(self, request, pk=None):
        """Get user activity logs"""
        user = self.get_object()
        
        # Get activity data
        activity_data = UserManagementService.get_user_activity(user)
        
        serializer = UserActivitySerializer(activity_data, many=True)
        
        return Response({
            'user_id': user.id,
            'username': user.username,
            'activity': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Toggle user active status"""
        user = self.get_object()
        old_status = user.is_active
        user.is_active = not user.is_active
        user.save()
        
        # Log admin action
        UserManagementService.log_admin_action(
            admin_user=request.user,
            action_type='toggle_active',
            target_user=user,
            description=f"{'Activated' if user.is_active else 'Deactivated'} user: {user.username}"
        )
        
        return Response({
            'message': f"User {'activated' if user.is_active else 'deactivated'} successfully",
            'is_active': user.is_active
        })
    
    @action(detail=True, methods=['post'])
    def change_role(self, request, pk=None):
        """Change user role"""
        user = self.get_object()
        new_role = request.data.get('role')
        
        if new_role not in ['user', 'organization', 'admin']:
            return Response(
                {'error': 'Invalid role. Must be user, organization, or admin'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        old_role = user.role
        user.role = new_role
        user.save()
        
        # Handle role-specific logic
        if new_role == 'organization' and not hasattr(user, 'organization_profile'):
            OrganizationProfile.objects.create(owner=user)
        
        # Log admin action
        UserManagementService.log_admin_action(
            admin_user=request.user,
            action_type='change_role',
            target_user=user,
            description=f"Changed role from {old_role} to {new_role}",
            metadata={'old_role': old_role, 'new_role': new_role}
        )
        
        return Response({
            'message': f"User role changed from {old_role} to {new_role}",
            'role': new_role
        })
    
    @action(detail=True, methods=['get'])
    def profile_data(self, request, pk=None):
        """Get comprehensive user profile data"""
        user = self.get_object()
        
        profile_data = UserManagementService.get_comprehensive_profile(user)
        
        return Response(profile_data)
    
    @action(detail=False, methods=['get'])
    def recent_activity(self, request):
        """Get recent user activity across platform"""
        days = int(request.query_params.get('days', 7))
        limit = int(request.query_params.get('limit', 50))
        
        activity = UserManagementService.get_recent_platform_activity(days=days, limit=limit)
        
        return Response({
            'days': days,
            'activity_count': len(activity),
            'activity': activity
        })
    
    @action(detail=False, methods=['get'])
    def suspicious_activity(self, request):
        """Get potentially suspicious user activity"""
        suspicious_users = UserManagementService.detect_suspicious_activity()
        
        return Response({
            'suspicious_count': len(suspicious_users),
            'users': suspicious_users
        })
    

class AdminOrganizationViewSet(viewsets.ModelViewSet):
    """
    Admin Organization Management ViewSet
    Handles all organization management operations for admin panel
    """
    serializer_class = AdminOrganizationSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = OrganizationFilter
    search_fields = ['org_name', 'owner__username', 'owner__email', 'owner__first_name', 'owner__last_name']
    ordering_fields = ['created_at', 'updated_at', 'org_name', 'is_verified']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """
        Get organizations with related data and computed fields
        """
        return OrganizationProfile.objects.select_related(
            'owner'
        ).prefetch_related(
            'owner__campaigns',
            'owner__campaigns__donations',
        ).annotate(
            campaign_count=Count('owner__campaigns', distinct=True),
            total_raised=Sum('owner__campaigns__current_amount'),
            total_donors=Sum('owner__campaigns__number_of_donors'),
            completed_donations=Count(
                'owner__campaigns__donations',
                filter=Q(owner__campaigns__donations__status='completed'),
                distinct=True
            ),
        )
    
    def get_serializer_class(self):
        """Use detailed serializer for retrieve action"""
        if self.action == 'retrieve':
            return AdminOrganizationDetailSerializer
        return AdminOrganizationSerializer
    
    def update(self, request, *args, **kwargs):
        """Update organization (admin only)"""
        instance = self.get_object()
        logger.info(f"Admin {request.user.username} updating organization {instance.org_name}")
        
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        if serializer.is_valid():
            organization = serializer.save()
            
            # Log admin action
            OrganizationManagementService.log_admin_action(
                admin_user=request.user,
                action_type='update_organization',
                target_organization=organization,
                description=f"Updated organization: {organization.org_name}",
                metadata={'updated_fields': list(request.data.keys())}
            )
            
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get organization statistics for admin dashboard"""
        stats = OrganizationManagementService.get_organization_statistics()
        return Response(stats)
    
    @action(detail=False, methods=['get'])
    def verification_queue(self, request):
        """Get organizations pending verification"""
        pending_orgs = self.get_queryset().filter(is_verified=False)
        
        # Apply additional filters
        has_documents = request.query_params.get('has_documents')
        if has_documents == 'true':
            pending_orgs = pending_orgs.exclude(document_url='')
        elif has_documents == 'false':
            pending_orgs = pending_orgs.filter(document_url='')
        
        # Order by creation date (oldest first for verification queue)
        pending_orgs = pending_orgs.order_by('created_at')
        
        # Paginate
        page = self.paginate_queryset(pending_orgs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(pending_orgs, many=True)
        return Response({
            'count': pending_orgs.count(),
            'organizations': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """Verify an organization"""
        organization = self.get_object()
        
        if organization.is_verified:
            return Response(
                {'error': 'Organization is already verified'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        verification_notes = request.data.get('notes', '')
        
        # Verify the organization
        organization.is_verified = True
        organization.save()
        
        # Log admin action
        OrganizationManagementService.log_admin_action(
            admin_user=request.user,
            action_type='verify_organization',
            target_organization=organization,
            description=f"Verified organization: {organization.org_name}",
            metadata={
                'verification_notes': verification_notes,
                'verified_by': request.user.username
            }
        )
        
        # Send notification to organization owner (implement as needed)
        # OrganizationManagementService.send_verification_notification(organization, True)
        
        logger.info(f"Organization {organization.org_name} verified by admin {request.user.username}")
        
        return Response({
            'message': 'Organization verified successfully',
            'organization_id': organization.id,
            'organization_name': organization.org_name,
            'is_verified': organization.is_verified
        })
    
    @action(detail=True, methods=['post'])
    def reject_verification(self, request, pk=None):
        """Reject organization verification"""
        organization = self.get_object()
        
        if organization.is_verified:
            return Response(
                {'error': 'Cannot reject already verified organization'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        rejection_reason = request.data.get('reason', '')
        if not rejection_reason:
            return Response(
                {'error': 'Rejection reason is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Log admin action
        OrganizationManagementService.log_admin_action(
            admin_user=request.user,
            action_type='reject_verification',
            target_organization=organization,
            description=f"Rejected verification for: {organization.org_name}",
            metadata={
                'rejection_reason': rejection_reason,
                'rejected_by': request.user.username
            }
        )
        
        # Send notification to organization owner (implement as needed)
        # OrganizationManagementService.send_verification_notification(organization, False, rejection_reason)
        
        logger.info(f"Organization {organization.org_name} verification rejected by admin {request.user.username}")
        
        return Response({
            'message': 'Organization verification rejected',
            'organization_id': organization.id,
            'organization_name': organization.org_name,
            'rejection_reason': rejection_reason
        })
    
    @action(detail=True, methods=['post'])
    def revoke_verification(self, request, pk=None):
        """Revoke organization verification"""
        organization = self.get_object()
        
        if not organization.is_verified:
            return Response(
                {'error': 'Organization is not verified'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        revocation_reason = request.data.get('reason', '')
        if not revocation_reason:
            return Response(
                {'error': 'Revocation reason is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Revoke verification
        organization.is_verified = False
        organization.save()
        
        # Log admin action
        OrganizationManagementService.log_admin_action(
            admin_user=request.user,
            action_type='revoke_verification',
            target_organization=organization,
            description=f"Revoked verification for: {organization.org_name}",
            metadata={
                'revocation_reason': revocation_reason,
                'revoked_by': request.user.username
            }
        )
        
        logger.info(f"Organization {organization.org_name} verification revoked by admin {request.user.username}")
        
        return Response({
            'message': 'Organization verification revoked',
            'organization_id': organization.id,
            'organization_name': organization.org_name,
            'revocation_reason': revocation_reason,
            'is_verified': organization.is_verified
        })
    
    @action(detail=True, methods=['get'])
    def campaigns(self, request, pk=None):
        """Get organization's campaigns with analytics"""
        organization = self.get_object()
        
        campaigns = organization.owner.campaigns.annotate(
            donation_count=Count('donations', filter=Q(donations__status='completed')),
            success_rate=Case(
                When(target__gt=0, then=F('current_amount') * 100.0 / F('target')),
                default=0,
                output_field=models.FloatField()
            )
        ).order_by('-created_at')
        
        # Apply filters
        status_filter = request.query_params.get('status')
        if status_filter == 'active':
            campaigns = campaigns.filter(current_amount__lt=F('target'))
        elif status_filter == 'completed':
            campaigns = campaigns.filter(current_amount__gte=F('target'))
        
        # Paginate
        page = self.paginate_queryset(campaigns)
        if page is not None:
            serializer_data = []
            for campaign in page:
                serializer_data.append({
                    'id': campaign.id,
                    'name': campaign.name,
                    'target': str(campaign.target),
                    'current_amount': str(campaign.current_amount),
                    'number_of_donors': campaign.number_of_donors,
                    'donation_count': campaign.donation_count,
                    'success_rate': round(campaign.success_rate, 2),
                    'created_at': campaign.created_at,
                    'featured': campaign.featured
                })
            return self.get_paginated_response(serializer_data)
        
        return Response({'campaigns': []})
    
    @action(detail=True, methods=['get'])
    def financial_analytics(self, request, pk=None):
        """Get organization's financial analytics"""
        organization = self.get_object()
        
        analytics = OrganizationManagementService.get_organization_financial_analytics(organization)
        
        return Response({
            'organization_id': organization.id,
            'organization_name': organization.org_name,
            'analytics': analytics
        })
    
    @action(detail=True, methods=['get'])
    def activity_log(self, request, pk=None):
        """Get organization's activity log"""
        organization = self.get_object()
        
        # Get admin actions related to this organization
        admin_actions = AdminAction.objects.filter(
            target_model='OrganizationProfile',
            target_id=organization.id
        ).select_related('admin_user').order_by('-timestamp')[:20]
        
        activity_log = []
        for action in admin_actions:
            activity_log.append({
                'id': action.id,
                'action_type': action.action_type,
                'description': action.description,
                'admin_user': action.admin_user.username,
                'timestamp': action.timestamp,
                'metadata': action.metadata
            })
        
        return Response({
            'organization_id': organization.id,
            'organization_name': organization.org_name,
            'activity_log': activity_log
        })
    
    @action(detail=False, methods=['post'])
    def bulk_verify(self, request):
        """Bulk verify organizations"""
        organization_ids = request.data.get('organization_ids', [])
        verification_notes = request.data.get('notes', '')
        
        if not organization_ids:
            return Response(
                {'error': 'organization_ids are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(organization_ids) > 50:
            return Response(
                {'error': 'Maximum 50 organizations allowed for bulk verification'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            result = OrganizationManagementService.bulk_verify_organizations(
                admin_user=request.user,
                organization_ids=organization_ids,
                notes=verification_notes
            )
            
            return Response({
                'message': 'Bulk verification completed',
                'verified_count': result['verified_count'],
                'already_verified_count': result['already_verified_count'],
                'not_found_count': result['not_found_count']
            })
            
        except Exception as e:
            logger.error(f"Bulk verification error: {str(e)}")
            return Response(
                {'error': 'An error occurred during bulk verification'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def performance_metrics(self, request):
        """Get organization performance metrics"""
        metrics = OrganizationManagementService.get_performance_metrics()
        return Response(metrics)
    
    @action(detail=False, methods=['get'])
    def suspicious_organizations(self, request):
        """Get potentially suspicious organizations"""
        suspicious_orgs = OrganizationManagementService.detect_suspicious_organizations()
        
        return Response({
            'suspicious_count': len(suspicious_orgs),
            'organizations': suspicious_orgs
        })


class AdminCampaignViewSet(viewsets.ModelViewSet):
    """
    Admin Campaign Management ViewSet
    Handles all campaign management operations for admin panel
    """
    serializer_class = AdminCampaignSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = CampaignFilter
    search_fields = ['name', 'description', 'owner__username', 'owner__organization_profile__org_name']
    ordering_fields = ['created_at', 'updated_at', 'name', 'target', 'current_amount', 'number_of_donors']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """
        Get campaigns with related data and computed fields
        """
        return Campaign.objects.select_related(
            'owner',
            'owner__organization_profile',
            'category'
        ).prefetch_related(
            'files',
            'donations'
        ).annotate(
            donation_count=Count('donations', filter=Q(donations__status='completed')),
            pending_donations=Count('donations', filter=Q(donations__status='pending')),
            failed_donations=Count('donations', filter=Q(donations__status='failed')),
            success_rate=Case(
                When(target__gt=0, then=F('current_amount') * 100.0 / F('target')),
                default=0,
                output_field=FloatField()
            ),
            avg_donation=Avg('donations__amount', filter=Q(donations__status='completed')),
            file_count=Count('files', distinct=True),
            days_active=(timezone.now().date() - F('created_at__date'))
        )
    
    def get_serializer_class(self):
        """Use detailed serializer for retrieve action"""
        if self.action == 'retrieve':
            return AdminCampaignDetailSerializer
        return AdminCampaignSerializer
    
    def update(self, request, *args, **kwargs):
        """Update campaign (admin only)"""
        instance = self.get_object()
        logger.info(f"Admin {request.user.username} updating campaign {instance.name}")
        
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        if serializer.is_valid():
            campaign = serializer.save()
            
            # Log admin action
            CampaignManagementService.log_admin_action(
                admin_user=request.user,
                action_type='update_campaign',
                target_campaign=campaign,
                description=f"Updated campaign: {campaign.name}",
                metadata={'updated_fields': list(request.data.keys())}
            )
            
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get campaign statistics for admin dashboard"""
        stats = CampaignManagementService.get_campaign_statistics()
        return Response(stats)
    
    @action(detail=False, methods=['get'])
    def featured_campaigns(self, request):
        """Get all featured campaigns"""
        featured = self.get_queryset().filter(featured=True).order_by('-updated_at')
        
        # Paginate
        page = self.paginate_queryset(featured)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(featured, many=True)
        return Response({
            'count': featured.count(),
            'campaigns': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def set_featured(self, request, pk=None):
        """Set campaign as featured"""
        campaign = self.get_object()
        
        if campaign.featured:
            return Response(
                {'error': 'Campaign is already featured'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Optional: Check if we want to limit number of featured campaigns
        featured_count = Campaign.objects.filter(featured=True).count()
        max_featured = request.data.get('max_featured', 10)  # Default limit
        
        if featured_count >= max_featured:
            return Response(
                {'error': f'Maximum number of featured campaigns ({max_featured}) reached'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        campaign.featured = True
        campaign.save()
        
        # Log admin action
        CampaignManagementService.log_admin_action(
            admin_user=request.user,
            action_type='set_featured',
            target_campaign=campaign,
            description=f"Set campaign as featured: {campaign.name}",
            metadata={'featured_by': request.user.username}
        )
        
        logger.info(f"Campaign {campaign.name} set as featured by admin {request.user.username}")
        
        return Response({
            'message': 'Campaign set as featured successfully',
            'campaign_id': campaign.id,
            'campaign_name': campaign.name,
            'featured': campaign.featured
        })
    
    @action(detail=True, methods=['post'])
    def unset_featured(self, request, pk=None):
        """Remove campaign from featured"""
        campaign = self.get_object()
        
        if not campaign.featured:
            return Response(
                {'error': 'Campaign is not featured'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        campaign.featured = False
        campaign.save()
        
        # Log admin action
        CampaignManagementService.log_admin_action(
            admin_user=request.user,
            action_type='unset_featured',
            target_campaign=campaign,
            description=f"Removed featured status: {campaign.name}",
            metadata={'unfeatured_by': request.user.username}
        )
        
        logger.info(f"Campaign {campaign.name} removed from featured by admin {request.user.username}")
        
        return Response({
            'message': 'Campaign removed from featured successfully',
            'campaign_id': campaign.id,
            'campaign_name': campaign.name,
            'featured': campaign.featured
        })
    
    @action(detail=False, methods=['post'])
    def bulk_feature(self, request):
        """Bulk set campaigns as featured"""
        campaign_ids = request.data.get('campaign_ids', [])
        action_type = request.data.get('action', 'feature')  # 'feature' or 'unfeature'
        
        if not campaign_ids:
            return Response(
                {'error': 'campaign_ids are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(campaign_ids) > 20:
            return Response(
                {'error': 'Maximum 20 campaigns allowed for bulk operations'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            result = CampaignManagementService.bulk_feature_campaigns(
                admin_user=request.user,
                campaign_ids=campaign_ids,
                action_type=action_type
            )
            
            return Response({
                'message': f'Bulk {action_type} completed successfully',
                'affected_campaigns': result['affected_count'],
                'already_processed': result['already_processed_count'],
                'not_found': result['not_found_count']
            })
            
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Bulk feature error: {str(e)}")
            return Response(
                {'error': 'An error occurred during bulk operation'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def donations(self, request, pk=None):
        """Get campaign donations with details"""
        campaign = self.get_object()
        
        donations = campaign.donations.select_related('donor').order_by('-created_at')
        
        # Apply filters
        status_filter = request.query_params.get('status')
        if status_filter:
            donations = donations.filter(status=status_filter)
        
        # Date range filter
        days = request.query_params.get('days')
        if days:
            try:
                days_int = int(days)
                cutoff_date = timezone.now() - timedelta(days=days_int)
                donations = donations.filter(created_at__gte=cutoff_date)
            except ValueError:
                pass
        
        # Paginate
        page = self.paginate_queryset(donations)
        if page is not None:
            donation_data = []
            for donation in page:
                donation_data.append({
                    'id': donation.id,
                    'amount': str(donation.amount),
                    'status': donation.status,
                    'donor_name': donation.donor_display_name,
                    'donor_email': donation.donor.email if donation.donor else donation.donor_email,
                    'is_anonymous': donation.is_anonymous,
                    'message': donation.message,
                    'created_at': donation.created_at,
                    'completed_at': donation.completed_at
                })
            return self.get_paginated_response(donation_data)
        
        return Response({'donations': []})
    
    @action(detail=True, methods=['get'])
    def files(self, request, pk=None):
        """Get campaign files"""
        campaign = self.get_object()
        files = campaign.files.all().order_by('-created_at')
        
        file_data = []
        for file_obj in files:
            file_data.append({
                'id': file_obj.id,
                'name': file_obj.name,
                'url': file_obj.url,
                'path': file_obj.path,
                'created_at': file_obj.created_at,
                'size_mb': None  # You could add file size if needed
            })
        
        return Response({
            'campaign_id': campaign.id,
            'campaign_name': campaign.name,
            'file_count': len(file_data),
            'files': file_data
        })
    
    @action(detail=True, methods=['delete'])
    def delete_file(self, request, pk=None):
        """Delete a campaign file"""
        campaign = self.get_object()
        file_id = request.data.get('file_id')
        
        if not file_id:
            return Response(
                {'error': 'file_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            file_obj = campaign.files.get(id=file_id)
            file_name = file_obj.name
            
            # Delete the file (this will trigger the model's delete method)
            file_obj.delete()
            
            # Log admin action
            CampaignManagementService.log_admin_action(
                admin_user=request.user,
                action_type='delete_campaign_file',
                target_campaign=campaign,
                description=f"Deleted file '{file_name}' from campaign: {campaign.name}",
                metadata={
                    'file_id': file_id,
                    'file_name': file_name,
                    'deleted_by': request.user.username
                }
            )
            
            return Response({
                'message': f'File "{file_name}" deleted successfully',
                'file_id': file_id
            })
            
        except File.DoesNotExist:
            return Response(
                {'error': 'File not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"File deletion error: {str(e)}")
            return Response(
                {'error': 'Error deleting file'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def analytics(self, request, pk=None):
        """Get detailed campaign analytics"""
        campaign = self.get_object()
        analytics = CampaignManagementService.get_campaign_analytics(campaign)
        
        return Response({
            'campaign_id': campaign.id,
            'campaign_name': campaign.name,
            'analytics': analytics
        })
    
    @action(detail=True, methods=['get'])
    def activity_log(self, request, pk=None):
        """Get campaign activity log"""
        campaign = self.get_object()
        
        # Get admin actions related to this campaign
        admin_actions = AdminAction.objects.filter(
            target_model='Campaign',
            target_id=campaign.id
        ).select_related('admin_user').order_by('-timestamp')[:20]
        
        activity_log = []
        for action in admin_actions:
            activity_log.append({
                'id': action.id,
                'action_type': action.action_type,
                'description': action.description,
                'admin_user': action.admin_user.username,
                'timestamp': action.timestamp,
                'metadata': action.metadata
            })
        
        return Response({
            'campaign_id': campaign.id,
            'campaign_name': campaign.name,
            'activity_log': activity_log
        })
    
    @action(detail=False, methods=['get'])
    def performance_metrics(self, request):
        """Get campaign performance metrics"""
        metrics = CampaignManagementService.get_performance_metrics()
        return Response(metrics)
    
    @action(detail=False, methods=['get'])
    def suspicious_campaigns(self, request):
        """Get potentially suspicious campaigns"""
        suspicious_campaigns = CampaignManagementService.detect_suspicious_campaigns()
        
        return Response({
            'suspicious_count': len(suspicious_campaigns),
            'campaigns': suspicious_campaigns
        })
    
    @action(detail=False, methods=['get'])
    def trending_analysis(self, request):
        """Get trending campaigns analysis"""
        days = int(request.query_params.get('days', 7))
        trending = CampaignManagementService.get_trending_campaigns(days=days)
        
        return Response({
            'analysis_period_days': days,
            'trending_campaigns': trending
        })
    
    @action(detail=True, methods=['post'])
    def moderate(self, request, pk=None):
        """Moderate campaign content"""
        campaign = self.get_object()
        action = request.data.get('action')  # 'approve', 'flag', 'suspend'
        reason = request.data.get('reason', '')
        
        if action not in ['approve', 'flag', 'suspend']:
            return Response(
                {'error': 'Invalid moderation action'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            result = CampaignManagementService.moderate_campaign(
                admin_user=request.user,
                campaign=campaign,
                action=action,
                reason=reason
            )
            
            return Response({
                'message': f'Campaign {action}ed successfully',
                'campaign_id': campaign.id,
                'action': action,
                'reason': reason
            })
            
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Campaign moderation error: {str(e)}")
            return Response(
                {'error': 'Error during campaign moderation'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AdminCategoryViewSet(viewsets.ModelViewSet):
    """Admin Category Management ViewSet"""
    serializer_class = AdminCategorySerializer
    permission_classes = [IsAdminUser]
    queryset = Category.objects.annotate(
        campaign_count=Count('campaigns'),
        active_campaigns=Count('campaigns', filter=Q(campaigns__current_amount__lt=F('campaigns__target'))),
        total_raised=Sum('campaigns__current_amount')
    ).order_by('name')
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get category statistics"""
        stats = CampaignManagementService.get_category_statistics()
        return Response(stats)
    
    @action(detail=True, methods=['get'])
    def campaigns(self, request, pk=None):
        """Get campaigns in this category"""
        category = self.get_object()
        campaigns = category.campaigns.annotate(
            donation_count=Count('donations', filter=Q(donations__status='completed')),
            success_rate=Case(
                When(target__gt=0, then=F('current_amount') * 100.0 / F('target')),
                default=0,
                output_field=FloatField()
            )
        ).order_by('-created_at')
        
        # Apply filters
        status_filter = request.query_params.get('status')
        if status_filter == 'active':
            campaigns = campaigns.filter(current_amount__lt=F('target'))
        elif status_filter == 'completed':
            campaigns = campaigns.filter(current_amount__gte=F('target'))
        
        # Paginate
        page = self.paginate_queryset(campaigns)
        if page is not None:
            campaign_data = []
            for campaign in page:
                campaign_data.append({
                    'id': campaign.id,
                    'name': campaign.name,
                    'owner_name': campaign.owner.organization_profile.org_name if hasattr(campaign.owner, 'organization_profile') else campaign.owner.username,
                    'target': str(campaign.target),
                    'current_amount': str(campaign.current_amount),
                    'success_rate': round(campaign.success_rate, 2),
                    'donation_count': campaign.donation_count,
                    'featured': campaign.featured,
                    'created_at': campaign.created_at
                })
            return self.get_paginated_response(campaign_data)
        
        return Response({'campaigns': []})
    

class AdminFinancialViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Admin Financial Management ViewSet
    Handles all financial monitoring and analytics for admin panel
    """
    serializer_class = AdminDonationSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = DonationFilter
    search_fields = ['donor__username', 'donor__email', 'donor_email', 'donor_name', 'campaign__name']
    ordering_fields = ['created_at', 'completed_at', 'amount', 'status']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """
        Get donations with related data for financial monitoring
        """
        return Donation.objects.select_related(
            'donor',
            'campaign',
            'campaign__owner',
            'campaign__owner__organization_profile'
        ).annotate(
            days_since_created=(timezone.now().date() - F('created_at__date')),
            processing_time=Case(
                When(completed_at__isnull=False, then=F('completed_at') - F('created_at')),
                default=None
            )
        )
    
    def get_serializer_class(self):
        """Use detailed serializer for retrieve action"""
        if self.action == 'retrieve':
            return AdminDonationDetailSerializer
        return AdminDonationSerializer
    
    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """Get financial dashboard statistics"""
        stats = FinancialManagementService.get_financial_dashboard_stats()
        return Response(stats)
    
    @action(detail=False, methods=['get'])
    def transaction_monitoring(self, request):
        """Real-time transaction monitoring"""
        # Get recent transactions with filtering
        hours = int(request.query_params.get('hours', 24))
        status_filter = request.query_params.get('status', 'all')
        min_amount = request.query_params.get('min_amount')
        
        cutoff_time = timezone.now() - timedelta(hours=hours)
        
        queryset = self.get_queryset().filter(created_at__gte=cutoff_time)
        
        if status_filter != 'all':
            queryset = queryset.filter(status=status_filter)
        
        if min_amount:
            try:
                queryset = queryset.filter(amount__gte=float(min_amount))
            except ValueError:
                pass
        
        # Get summary stats
        summary = queryset.aggregate(
            total_transactions=Count('id'),
            total_amount=Sum('amount'),
            avg_amount=Avg('amount'),
            completed_count=Count('id', filter=Q(status='completed')),
            pending_count=Count('id', filter=Q(status='pending')),
            failed_count=Count('id', filter=Q(status='failed'))
        )
        
        # Get recent transactions
        recent_transactions = queryset.order_by('-created_at')[:20]
        serializer = self.get_serializer(recent_transactions, many=True)
        
        return Response({
            'time_range_hours': hours,
            'summary': {
                'total_transactions': summary['total_transactions'],
                'total_amount': str(summary['total_amount'] or 0),
                'average_amount': str(round(summary['avg_amount'] or 0, 2)),
                'completed_transactions': summary['completed_count'],
                'pending_transactions': summary['pending_count'],
                'failed_transactions': summary['failed_count'],
                'success_rate': round((summary['completed_count'] / summary['total_transactions'] * 100) if summary['total_transactions'] > 0 else 0, 2)
            },
            'recent_transactions': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def payment_analytics(self, request):
        """Payment method and provider analytics"""
        analytics = FinancialManagementService.get_payment_analytics()
        return Response(analytics)
    
    @action(detail=False, methods=['get'])
    def revenue_analytics(self, request):
        """Platform revenue analytics"""
        days = int(request.query_params.get('days', 30))
        analytics = FinancialManagementService.get_revenue_analytics(days=days)
        return Response(analytics)
    
    @action(detail=False, methods=['get'])
    def fraud_detection(self, request):
        """Fraud detection and suspicious transaction analysis"""
        suspicious_transactions = FraudDetectionService.detect_suspicious_transactions()
        fraud_patterns = FraudDetectionService.analyze_fraud_patterns()
        
        return Response({
            'suspicious_transactions': suspicious_transactions,
            'fraud_patterns': fraud_patterns,
            'total_suspicious': len(suspicious_transactions)
        })
    
    @action(detail=False, methods=['get'])
    def donation_trends(self, request):
        """Donation trends and pattern analysis"""
        days = int(request.query_params.get('days', 30))
        trends = FinancialManagementService.get_donation_trends(days=days)
        return Response(trends)
    
    @action(detail=False, methods=['get'])
    def failed_transactions(self, request):
        """Analysis of failed transactions"""
        days = int(request.query_params.get('days', 7))
        analysis = FinancialManagementService.analyze_failed_transactions(days=days)
        return Response(analysis)
    
    @action(detail=False, methods=['get'])
    def large_donations(self, request):
        """Monitor large donations (potential fraud or VIP donors)"""
        min_amount = float(request.query_params.get('min_amount', 1000))
        days = int(request.query_params.get('days', 30))
        
        cutoff_date = timezone.now() - timedelta(days=days)
        
        large_donations = self.get_queryset().filter(
            amount__gte=min_amount,
            created_at__gte=cutoff_date
        ).order_by('-amount')[:50]
        
        serializer = self.get_serializer(large_donations, many=True)
        
        # Get summary
        summary = large_donations.aggregate(
            count=Count('id'),
            total_amount=Sum('amount'),
            avg_amount=Avg('amount'),
            max_amount=Max('amount')
        )
        
        return Response({
            'filter_criteria': {
                'min_amount': min_amount,
                'days': days
            },
            'summary': {
                'count': summary['count'],
                'total_amount': str(summary['total_amount'] or 0),
                'average_amount': str(round(summary['avg_amount'] or 0, 2)),
                'largest_donation': str(summary['max_amount'] or 0)
            },
            'large_donations': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def donor_analytics(self, request):
        """Donor behavior and analytics"""
        analytics = FinancialManagementService.get_donor_analytics()
        return Response(analytics)
    
    @action(detail=False, methods=['get'])
    def refund_analysis(self, request):
        """Analysis of refunds and cancellations"""
        days = int(request.query_params.get('days', 30))
        
        analysis = FinancialManagementService.analyze_refunds_and_cancellations(days=days)
        return Response(analysis)

    
    @action(detail=True, methods=['get'])
    def transaction_details(self, request, pk=None):
        """Detailed information about a specific transaction"""
        donation = self.get_object()
        
        # Get donor's other donations
        donor_history = []
        if donation.donor:
            donor_donations = Donation.objects.filter(
                donor=donation.donor,
                status='completed'
            ).exclude(id=donation.id).order_by('-created_at')[:5]
            
            for d in donor_donations:
                donor_history.append({
                    'id': d.id,
                    'amount': str(d.amount),
                    'campaign_name': d.campaign.name,
                    'created_at': d.created_at
                })
        
        return Response({
            'donation': AdminDonationDetailSerializer(donation).data,
            'donor_history': donor_history,
            'risk_assessment': FraudDetectionService.assess_transaction_risk(donation)
        })
    
    @action(detail=False, methods=['post'])
    def flag_transaction(self, request):
        """Flag a transaction for manual review"""
        donation_id = request.data.get('donation_id')
        reason = request.data.get('reason', '')
        
        if not donation_id:
            return Response(
                {'error': 'donation_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            donation = Donation.objects.get(id=donation_id)
            
            # Log the flagging action
            FinancialManagementService.log_admin_action(
                admin_user=request.user,
                action_type='flag_transaction',
                target_donation=donation,
                description=f"Transaction flagged for review: {donation.amount} MRU",
                metadata={
                    'flag_reason': reason,
                    'flagged_by': request.user.username,
                    'transaction_amount': str(donation.amount),
                    'campaign_name': donation.campaign.name
                }
            )
            
            return Response({
                'message': 'Transaction flagged successfully',
                'donation_id': donation.id,
                'reason': reason
            })
            
        except Donation.DoesNotExist:
            return Response(
                {'error': 'Transaction not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    


class AdminActionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing admin actions.
    Read-only to preserve audit trail integrity.
    
    Provides:
    - list: Get all actions with filtering
    - retrieve: Get specific action details
    - statistics: Get dashboard statistics
    - export: Export actions to CSV
    """
    queryset = AdminAction.objects.select_related('admin_user').all()
    serializer_class = AdminActionSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    # Filtering
    filterset_fields = {
        'action_type': ['exact'],
        'target_model': ['exact'],
        'target_id': ['exact'],
        'admin_user': ['exact'],
        'timestamp': ['gte', 'lte', 'date'],
    }
    
    # Search
    search_fields = ['description', 'action_type', 'admin_user__username']
    
    # Ordering
    ordering_fields = ['timestamp', 'action_type', 'target_model']
    ordering = ['-timestamp']
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """
        Get statistics for dashboard
        
        Returns:
        - total_actions: Total count
        - today_actions: Actions today
        - week_actions: Actions this week
        - month_actions: Actions this month
        - actions_by_type: Count per action type
        - actions_by_model: Count per target model
        - active_admins: Most active admin users
        """
        now = timezone.now()
        today = now.date()
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)
        
        # Basic counts
        total_actions = AdminAction.objects.count()
        today_actions = AdminAction.objects.filter(timestamp__date=today).count()
        week_actions = AdminAction.objects.filter(timestamp__gte=week_ago).count()
        month_actions = AdminAction.objects.filter(timestamp__gte=month_ago).count()
        
        # Actions by type
        actions_by_type = list(
            AdminAction.objects.values('action_type')
            .annotate(count=Count('id'))
            .order_by('-count')[:10]
        )
        
        # Actions by target model
        actions_by_model = list(
            AdminAction.objects.values('target_model')
            .annotate(count=Count('id'))
            .order_by('-count')[:10]
        )
        
        # Most active admins
        active_admins = list(
            AdminAction.objects.values('admin_user__id', 'admin_user__username')
            .annotate(count=Count('id'))
            .order_by('-count')[:10]
        )
        
        return Response({
            'statistics': {
                'total': total_actions,
                'today': today_actions,
                'week': week_actions,
                'month': month_actions,
            },
            'actions_by_type': actions_by_type,
            'actions_by_model': actions_by_model,
            'active_admins': active_admins,
        })
    
    @action(detail=False, methods=['get'])
    def export(self, request):
        """
        Export admin actions to CSV
        
        Query params (same as list filtering):
        - action_type: Filter by action type
        - target_model: Filter by target model
        - admin_user: Filter by admin user ID
        - timestamp__gte: Filter by timestamp greater than or equal
        - timestamp__lte: Filter by timestamp less than or equal
        - search: Search in description, action_type, username
        """
        # Get filtered queryset using the same filters as list
        queryset = self.filter_queryset(self.get_queryset())
        
        # Create CSV response
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="admin_actions.csv"'
        
        writer = csv.writer(response)
        
        # Write header
        writer.writerow([
            'ID',
            'Admin User',
            'Admin Email',
            'Action Type',
            'Target Model',
            'Target ID',
            'Description',
            'Timestamp',
        ])
        
        # Write data
        for action in queryset:
            writer.writerow([
                action.id,
                action.admin_user.username,
                action.admin_user.email,
                action.action_type,
                action.target_model,
                action.target_id or '',
                action.description,
                action.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
            ])
        
        return response
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """
        Get recent actions (last 20)
        """
        recent_actions = self.queryset[:20]
        serializer = self.get_serializer(recent_actions, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def filter_options(self, request):
        """
        Get available filter options for dropdowns
        
        Returns:
        - action_types: List of unique action types
        - target_models: List of unique target models
        - admin_users: List of admin users with id and username
        """
        action_types = list(
            AdminAction.objects.values_list('action_type', flat=True)
            .distinct()
            .order_by('action_type')
        )
        
        target_models = list(
            AdminAction.objects.values_list('target_model', flat=True)
            .distinct()
            .order_by('target_model')
        )
        
        admin_users = list(
            AdminAction.objects.select_related('admin_user')
            .values('admin_user__id', 'admin_user__username')
            .distinct()
            .order_by('admin_user__username')
        )
        
        return Response({
            'action_types': action_types,
            'target_models': target_models,
            'admin_users': admin_users,
        })
