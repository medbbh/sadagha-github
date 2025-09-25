from rest_framework import viewsets, permissions, parsers, status, filters
from .models import Campaign, Category, Donation, File
from .serializers import CampaignSerializer, CategorySerializer, FileSerializer, DonationSerializer, DonationCreateSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Case, When, Sum, Count, Q, F, FloatField, Value
from rest_framework import filters
from django_filters.rest_framework import DjangoFilterBackend
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import requests
import json
from django.conf import settings
import logging
from rest_framework import parsers
from .services.payment_service import PaymentServiceManager
from django.utils import timezone
from .utils.facebook_live import FacebookLiveAPI, update_campaign_live_status
from rest_framework.decorators import api_view, permission_classes,authentication_classes
from rest_framework.permissions import IsAuthenticated
from django.utils.decorators import method_decorator
from datetime import datetime, timedelta
from accounts.authentication import SupabaseAuthentication
from django.db import transaction
from .utils.supabase_storage import delete_file
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import PermissionDenied


logger = logging.getLogger(__name__)

class FileViewSet(viewsets.ModelViewSet):
    queryset = File.objects.all()
    serializer_class = FileSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]


class CategoryViewSet(viewsets.ModelViewSet):
    # sort them by dated created
    queryset = Category.objects.annotate(campaign_count=Count('campaigns', distinct=True))
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def facebook_oauth_url(request):
    """
    Get Facebook OAuth URL for user authentication
    """
    oauth_url = FacebookLiveAPI.get_oauth_url()
    return Response({
        'oauth_url': oauth_url,
        'message': 'Redirect user to this URL to authorize Facebook access'
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def facebook_oauth_callback(request):
    """
    Handle Facebook OAuth callback and exchange code for token
    """
    auth_code = request.data.get('code')
    campaign_id = request.data.get('campaign_id')
    
    if not auth_code:
        return Response(
            {'error': 'Authorization code is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not campaign_id:
        return Response(
            {'error': 'Campaign ID is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Exchange code for access token
    access_token = FacebookLiveAPI.exchange_code_for_token(auth_code)
    
    if not access_token:
        return Response(
            {'error': 'Failed to get access token from Facebook'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Get the campaign and verify ownership
        campaign = Campaign.objects.get(id=campaign_id, owner=request.user)
        
        # Store the access token
        campaign.facebook_access_token = access_token
        campaign.save(update_fields=['facebook_access_token'])
        
        # If campaign already has a Facebook Live URL, update its status
        if campaign.facebook_video_id:
            update_campaign_live_status(campaign)
        
        return Response({
            'message': 'Facebook access granted successfully',
            'campaign_id': campaign.id,
            'has_access_token': True
        })
        
    except Campaign.DoesNotExist:
        return Response(
            {'error': 'Campaign not found or you do not have permission to access it'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error in Facebook OAuth callback: {str(e)}")
        return Response(
            {'error': 'Internal server error'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_facebook_live_videos(request):
    """
    Get user's Facebook Live videos
    """
    access_token = request.GET.get('access_token')
    
    if not access_token:
        return Response(
            {'error': 'Access token is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    live_videos = FacebookLiveAPI.get_user_live_videos(access_token)
    
    return Response({
        'live_videos': live_videos,
        'count': len(live_videos)
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_live_status(request, campaign_id):
    """
    Manually update campaign's live status
    """
    try:
        campaign = Campaign.objects.get(id=campaign_id, owner=request.user)
        
        if not campaign.facebook_video_id or not campaign.facebook_access_token:
            return Response(
                {'error': 'Campaign does not have Facebook Live configured'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        success = update_campaign_live_status(campaign)
        
        if success:
            # Refresh from database to get updated values
            campaign.refresh_from_db()
            return Response({
                'message': 'Live status updated successfully',
                'live_status': campaign.live_status,
                'live_viewer_count': campaign.live_viewer_count,
                'is_live': campaign.is_live
            })
        else:
            return Response(
                {'error': 'Failed to update live status'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
    except Campaign.DoesNotExist:
        return Response(
            {'error': 'Campaign not found or you do not have permission to access it'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error updating live status: {str(e)}")
        return Response(
            {'error': 'Internal server error'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def campaign_live_status(request, campaign_id):
    """
    Get campaign's current live status (public endpoint)
    """
    try:
        campaign = Campaign.objects.get(id=campaign_id)
        
        return Response({
            'campaign_id': campaign.id,
            'live_status': campaign.live_status,
            'live_viewer_count': campaign.live_viewer_count,
            'is_live': campaign.is_live,
            'has_facebook_live': campaign.has_facebook_live,
            'facebook_live_url': campaign.facebook_live_url
        })
        
    except Campaign.DoesNotExist:
        return Response(
            {'error': 'Campaign not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
class CampaignViewSet(viewsets.ModelViewSet):
    # Add prefetch_related to avoid N+1 queries
    queryset = Campaign.objects.select_related('category', 'owner').prefetch_related('files').all().order_by('-created_at')
    serializer_class = CampaignSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    parser_classes = [parsers.JSONParser, parsers.MultiPartParser, parsers.FormParser]
    
    # Add filtering and search capabilities
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'featured']
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'current_amount', 'number_of_donors', 'target']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """
        Optimized queryset with proper prefetching
        """
        queryset = Campaign.objects.select_related('category', 'owner').prefetch_related('files').all().order_by('-created_at')
        
        # Category filtering
        category_id = self.request.query_params.get('category', None)
        if category_id is not None:
            try:
                category_id = int(category_id)
                queryset = queryset.filter(category_id=category_id)
            except (ValueError, TypeError):
                pass
        
        # Search filtering
        search = self.request.query_params.get('search', None)
        if search is not None:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(description__icontains=search)
            )
        
        # Featured filtering
        featured = self.request.query_params.get('featured', None)
        if featured is not None:
            queryset = queryset.filter(featured=True)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def urgent(self, request):
        """Get 5 most urgent campaigns based on multiple factors"""
        
        now = timezone.now()
        
        # Calculate urgency score using existing fields
        urgent_campaigns = self.get_queryset().annotate(
            # Calculate funding ratio (0-1)
            funding_ratio=Case(
                When(target__gt=0, then=F('current_amount') / F('target')),
                default=Value(0),
                output_field=FloatField()
            ),
            
            # Calculate urgency score based on conditions
            urgency_score=Case(
                # Funding gap score (40% weight)
                When(funding_ratio__lt=0.20, then=Value(0.4)),  # 1.0 * 0.4
                When(funding_ratio__lt=0.50, then=Value(0.32)), # 0.8 * 0.4
                default=Value(0.12),  # 0.3 * 0.4
                output_field=FloatField()
            ) + Case(
                # Time pressure score (30% weight) - older campaigns more urgent
                When(created_at__lt=now - timedelta(days=30), then=Value(0.27)), # 0.9 * 0.3
                When(created_at__lt=now - timedelta(days=14), then=Value(0.21)), # 0.7 * 0.3
                default=Value(0.12),  # 0.4 * 0.3
                output_field=FloatField()
            ) + Case(
                # Activity momentum score (20% weight) - stagnant campaigns more urgent
                When(updated_at__lt=now - timedelta(days=7), then=Value(0.18)),  # 0.9 * 0.2
                When(updated_at__lt=now - timedelta(days=3), then=Value(0.12)),  # 0.6 * 0.2
                default=Value(0.04),  # 0.2 * 0.2
                output_field=FloatField()
            ) + Case(
                # Donor engagement score (10% weight)
                When(number_of_donors__lt=5, then=Value(0.10)),   # 1.0 * 0.1
                When(number_of_donors__lt=20, then=Value(0.06)),  # 0.6 * 0.1
                default=Value(0.03),  # 0.3 * 0.1
                output_field=FloatField()
            )
        ).filter(
            # Only active campaigns (not fully funded)
            current_amount__lt=F('target'),
            # Exclude very new campaigns (less than 2 days old)
            created_at__lt=now - timedelta(days=2)
        ).order_by(
            '-urgency_score', '-created_at'
        )[:5]  # Get top 5 most urgent
        
        # Serialize the campaigns
        serializer = self.get_serializer(urgent_campaigns, many=True)
        
        # Add urgency metadata to each campaign
        campaigns_with_urgency = []
        for campaign_data, campaign_obj in zip(serializer.data, urgent_campaigns):
            # Calculate days manually for response
            days_created = (now - campaign_obj.created_at).days if campaign_obj.created_at else 0
            days_updated = (now - campaign_obj.updated_at).days if campaign_obj.updated_at else 0
            
            campaign_data['urgency_score'] = round(campaign_obj.urgency_score, 2)
            campaign_data['funding_percentage'] = round(
                (float(campaign_obj.current_amount) / float(campaign_obj.target)) * 100, 1
            ) if campaign_obj.target > 0 else 0
            campaign_data['days_since_created'] = days_created
            campaign_data['days_since_update'] = days_updated
            campaign_data['urgency_level'] = (
                'critical' if campaign_obj.urgency_score >= 0.8 else
                'high' if campaign_obj.urgency_score >= 0.6 else
                'medium'
            )
            campaigns_with_urgency.append(campaign_data)
        
        return Response({
            'urgent_campaigns': campaigns_with_urgency,
            'total_count': len(campaigns_with_urgency),
            'last_updated': now,
            'criteria': {
                'funding_gap': 'Campaigns with less than 50% funding get higher urgency',
                'time_pressure': 'Older campaigns (14+ days) get higher urgency',  
                'activity': 'Campaigns without recent updates (3+ days) get higher urgency',
                'engagement': 'Campaigns with fewer donors (<20) get higher urgency'
            }
        })
    
    def perform_create(self, serializer):
        user = self.request.user
        
        # Ensure only verified orgs can create campaigns
        if user.role != "organization":
            raise PermissionDenied("Only organizations can create campaigns.")
        
        if not hasattr(user, "organization_profile") or not user.organization_profile.is_verified:
            raise PermissionDenied("Organization must be verified to create campaigns.")
        
        return serializer.save(owner=user)
    
    def update(self, request, *args, **kwargs):
        """
        Ensure that a user can only update their own campaigns.
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        if instance.owner != request.user:
            return Response(
                {'detail': 'You do not have permission to update this campaign.'}, 
                status=403
            )
        
        # Check if campaign already has donations
        if instance.current_amount > 0 or instance.number_of_donors > 0:
            return Response(
                {'detail': 'This campaign already has donations and cannot be updated.'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        serializer = self.get_serializer(
            instance, 
            data=request.data, 
            partial=partial,
            context={'request': request}
        )
        
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        updated_instance = self.get_queryset().get(pk=instance.pk)
        return_serializer = self.get_serializer(updated_instance)
        return Response(return_serializer.data)
    


    def destroy(self, request, *args, **kwargs):
        """
        Ensure that a user can only delete their own campaigns,
        and campaigns with donations cannot be deleted.
        Also deletes related files from Supabase storage.
        """
        instance = self.get_object()

        # Check if user is owner
        if instance.owner != request.user:
            return Response(
                {'detail': 'You do not have permission to delete this campaign.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check if campaign already has donations
        if instance.current_amount > 0 or instance.number_of_donors > 0:
            return Response(
                {'detail': 'This campaign already has donations and cannot be deleted.'},
                status=status.HTTP_400_BAD_REQUEST
            )
            # Delete related files (will also remove them from Supabase via File.delete override)
        instance.files.all().delete()

        # Now delete the campaign
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    def get_serializer_context(self):
        """
        Extra context provided to the serializer class.
        """
        context = super().get_serializer_context()
        context.update({'request': self.request})
        return context
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def create_donation(self, request, pk=None):
        """
        Create a donation payment session for a campaign
        POST /api/campaigns/{id}/create_donation/
        """
        logger.info(f"=== CREATE DONATION REQUEST ===")
        logger.info(f"Campaign ID: {pk}")
        logger.info(f"Content-Type: {request.content_type}")
        logger.info(f"Request method: {request.method}")
        logger.info(f"Raw body: {request.body}")
        logger.info(f"Parsed data: {request.data}")
        logger.info(f"Headers: {dict(request.headers)}")
        
        try:
            campaign = self.get_object()
            logger.info(f"Campaign found: {campaign.name} (Org: {campaign.organization.org_name})")
            
            # Check if organization can receive payments
            if not campaign.organization.can_receive_payments():
                logger.error(f"Organization {campaign.organization.org_name} cannot receive payments")
                return Response({
                    'error': 'This campaign cannot accept payments. The organization needs to set up NextRemitly integration.',
                    'details': 'Please contact the campaign organizer to enable payments.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate request data
            serializer = DonationCreateSerializer(data=request.data)
            if not serializer.is_valid():
                logger.error(f"Invalid request data: {serializer.errors}")
                return Response({
                    'error': 'Invalid request data', 
                    'details': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            validated_data = serializer.validated_data
            logger.info(f"Validated data: {validated_data}")
            
            # Use database transaction to ensure data consistency
            with transaction.atomic():
                # Create donation record first (with pending status)
                donation = Donation.objects.create(
                    campaign=campaign,
                    donor=request.user if request.user.is_authenticated else None,
                    donor_name=validated_data.get('donor_name'),
                    amount=validated_data['amount'],
                    status='pending',
                    message=validated_data.get('message'),
                    is_anonymous=validated_data.get('is_anonymous', False)
                )
                
                logger.info(f"Created donation record: {donation.id}")
                
                # Create payment session using the service manager
                result = PaymentServiceManager.create_payment_for_campaign(
                    campaign=campaign,
                    amount=float(validated_data['amount']),
                    donor_data={
                        'name': validated_data.get('donor_name'),
                    }
                )
                
                if result['success']:
                    # Update donation with session info
                    donation.payment_session_id = result['session_id']
                    donation.status = 'processing'
                    donation.save()
                    
                    logger.info(f"Payment session created successfully: {result['session_id']}")
                    
                    return Response({
                        'success': True,
                        'donation_id': donation.id,
                        'session_id': result['session_id'],
                        'payment_url': result['payment_url'],
                        'widget_url': result.get('widget_url'),
                        'expires_at': result.get('expires_at'),
                        'amount': str(donation.amount),
                    }, status=status.HTTP_201_CREATED)
                else:
                    # Update donation status to failed
                    donation.status = 'failed'
                    donation.payment_metadata = {'error': result['error']}
                    donation.save()
                    
                    logger.error(f"Payment session creation failed: {result['error']}")
                    return Response({
                        'error': result['error'],
                        'donation_id': donation.id
                    }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Unexpected error in create_donation: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({
                'error': 'An unexpected error occurred. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def sync_donation_status(self, request):
        """Manually trigger status sync for a specific donation"""
        session_id = request.data.get('session_id')
        
        if not session_id:
            return Response({'error': 'session_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            donation = Donation.objects.select_related('campaign').get(payment_session_id=session_id)
            result = PaymentServiceManager.get_payment_status_for_donation(donation)
            
            if result['success']:
                old_status = donation.status
                new_status = result.get('status')
                
                if new_status and new_status != donation.status:
                    with transaction.atomic():
                        donation.status = new_status
                        
                        if new_status == 'completed' and old_status != 'completed':
                            donation.completed_at = timezone.now()
                            # Update campaign totals
                            donation.campaign.current_amount += donation.amount
                            donation.campaign.number_of_donors += 1
                            donation.campaign.save()
                        
                        donation.save()
                        logger.info(f"Synced donation {donation.id}: {old_status} -> {donation.status}")
                
                return Response({
                    'status': donation.status,
                    'updated': new_status != old_status,
                    'donation_id': donation.id
                })
            else:
                return Response({'error': result['error']}, status=status.HTTP_400_BAD_REQUEST)
                
        except Donation.DoesNotExist:
            return Response({'error': 'Donation not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error syncing donation status: {str(e)}")
            return Response({'error': 'Sync failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def donation_webhook(self, request):
        """
        Handle webhooks from NextRemitly for donation status updates
        POST /api/campaigns/donation-webhook/
        """
        logger.info(f"=== DONATION WEBHOOK RECEIVED ===")
        logger.info(f"Webhook payload: {request.data}")
        
        try:
            session_id = request.data.get('session_id')
            status_value = request.data.get('status')
            
            if not session_id:
                logger.error("No session_id in webhook payload")
                return Response({
                    'error': 'Missing session_id'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            logger.info(f"Processing webhook - Session: {session_id}, Status: {status_value}")
            
            # Find the donation by session_id
            try:
                donation = Donation.objects.select_related('campaign', 'campaign__organization').get(
                    payment_session_id=session_id
                )
                logger.info(f"Found donation: {donation.id} for campaign: {donation.campaign.name}")
            except Donation.DoesNotExist:
                logger.error(f"No donation found for session_id: {session_id}")
                return Response({
                    'error': 'Donation not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Process webhook with database transaction
            with transaction.atomic():
                old_status = donation.status
                
                if status_value == 'completed':
                    donation.status = 'completed'
                    donation.completed_at = timezone.now()
                    
                    # Update campaign totals when payment is completed
                    campaign = donation.campaign
                    campaign.current_amount += donation.amount
                    campaign.number_of_donors += 1
                    campaign.save()
                    
                    logger.info(f"Donation completed: {donation.id}, Campaign totals updated")
                    
                elif status_value == 'failed':
                    donation.status = 'failed'
                    logger.info(f"Donation failed: {donation.id}")
                    
                elif status_value == 'cancelled':
                    donation.status = 'cancelled'
                    logger.info(f"Donation cancelled: {donation.id}")
                
                elif status_value == 'processing':
                    donation.status = 'processing'
                    logger.info(f"Donation processing: {donation.id}")
                
                # Store webhook data for debugging/audit
                donation.payment_metadata = {
                    **donation.payment_metadata,
                    'last_webhook': request.data,
                    'webhook_timestamp': timezone.now().isoformat()
                }
                
                # Store transaction ID if provided
                if request.data.get('transaction_id'):
                    donation.payment_metadata['transaction_id'] = request.data.get('transaction_id')
                
                donation.save()
                
                logger.info(f"Donation status updated from {old_status} to {donation.status}")
            
            return Response({
                'status': 'ok',
                'donation_id': donation.id,
                'updated_status': donation.status,
                'processed_at': timezone.now().isoformat()
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error processing webhook: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({
                'error': 'Webhook processing failed'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get'])
    def donation_status(self, request, pk=None):
        """
        Get donation status for a campaign
        GET /api/campaigns/{id}/donation_status/?session_id=xxx
        """
        session_id = request.query_params.get('session_id')
        
        if not session_id:
            return Response({
                'error': 'session_id parameter is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            campaign = self.get_object()
            donation = get_object_or_404(
                Donation, 
                campaign=campaign, 
                payment_session_id=session_id
            )
            
            # Get latest status from NextRemitly
            result = PaymentServiceManager.get_payment_status_for_donation(donation)
            
            if result['success']:
                # Update donation with latest status if different
                if result.get('status') and result['status'] != donation.status:
                    donation.status = result['status']
                    donation.save()
                    logger.info(f"Updated donation {donation.id} status to {donation.status}")
                
                serializer = DonationSerializer(donation)
                return Response({
                    'donation': serializer.data,
                    'payment_status': result
                })
            else:
                return Response({
                    'error': result['error']
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Error getting donation status: {str(e)}")
            return Response({
                'error': 'Could not retrieve donation status'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def payment_status(self, request):
        """
        Check payment status
        GET /api/campaigns/payment_status/?session_id=xxx
        """
        session_id = request.query_params.get('session_id')
        if not session_id:
            return Response(
                {'error': 'session_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Find the donation first
            donation = Donation.objects.get(payment_session_id=session_id)
            
            # Get status using the donation object
            result = PaymentServiceManager.get_payment_status_for_donation(donation)
            
            if result['success']:
                return Response(result, status=status.HTTP_200_OK)
            else:
                return Response(
                    {'error': result['error']},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Donation.DoesNotExist:
            return Response(
                {'error': 'Donation not found for this session'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error checking payment status: {str(e)}")
            return Response(
                {'error': 'Error checking payment status'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_campaigns(self, request):
        """
        Custom action to retrieve campaigns owned by the logged-in user.
        """
        user = request.user
        campaigns = self.get_queryset().filter(owner=user)
        serializer = self.get_serializer(campaigns, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def featured(self, request):
        """
        Returns campaigns where 'featured' is True.
        """
        featured_campaigns = self.get_queryset().filter(featured=True)
        serializer = self.get_serializer(featured_campaigns, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], url_path='batch', permission_classes=[permissions.AllowAny], parser_classes=[parsers.JSONParser])
    def get_multiple(self, request):
        """
        Get multiple campaigns by IDs
        POST /api/campaigns/batch/
        Body: {"ids": [1, 2, 3, 4]}
        """
        ids = request.data.get('ids', [])
        
        # Validation
        if not isinstance(ids, list):
            return Response(
                {'error': 'IDs must be provided as a list.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not ids:
            return Response(
                {'error': 'No IDs provided.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Convert to integers and validate
        try:
            ids = [int(id) for id in ids]
        except (ValueError, TypeError):
            return Response(
                {'error': 'All IDs must be integers.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Limit the number of IDs to prevent abuse
        if len(ids) > 50:
            return Response(
                {'error': 'Too many IDs. Maximum 50 allowed.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get campaigns with optimized query
        campaigns = Campaign.objects.select_related('category', 'owner').prefetch_related('files').filter(id__in=ids)
        
        # Preserve the order of requested IDs
        preserved_order = Case(
            *[When(id=pk, then=pos) for pos, pk in enumerate(ids)]
        )
        campaigns = campaigns.annotate(ordering=preserved_order).order_by('ordering')
        
        serializer = self.get_serializer(campaigns, many=True)
        
        # Include metadata about missing IDs
        found_ids = {campaign.id for campaign in campaigns}
        missing_ids = [id for id in ids if id not in found_ids]
        
        response_data = {
            'campaigns': serializer.data,
            'requested_count': len(ids),
            'found_count': len(campaigns),
        }
        
        if missing_ids:
            response_data['missing_ids'] = missing_ids
            
        return Response(response_data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def refresh_live_status(self, request, pk=None):
        """
        Refresh Facebook Live status for a specific campaign
        """
        campaign = self.get_object()
        
        if campaign.owner != request.user:
            return Response(
                {'detail': 'You do not have permission to update this campaign.'}, 
                status=403
            )
        
        if not campaign.facebook_video_id or not campaign.facebook_access_token:
            return Response(
                {'error': 'Campaign does not have Facebook Live configured'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        success = update_campaign_live_status(campaign)
        
        if success:
            serializer = self.get_serializer(campaign)
            return Response(serializer.data)
        else:
            return Response(
                {'error': 'Failed to refresh live status'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        


@api_view(['GET'])
@authentication_classes([SupabaseAuthentication])
@permission_classes([IsAuthenticated])
def user_donations(request):
    """
    Get user's donation history with filtering, sorting, and statistics
    """
    user = request.user
    
    # Base queryset - just select_related for campaign
    queryset = Donation.objects.filter(donor=user).select_related('campaign')
    
    # Apply filters
    status_filter = request.query_params.get('status')
    if status_filter:
        queryset = queryset.filter(status=status_filter)
    
    campaign_filter = request.query_params.get('campaign')
    if campaign_filter:
        queryset = queryset.filter(campaign_id=campaign_filter)
    
    # Date range filtering
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    
    if start_date:
        try:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            queryset = queryset.filter(created_at__date__gte=start_date)
        except ValueError:
            return Response(
                {'error': 'Invalid start_date format. Use YYYY-MM-DD'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    if end_date:
        try:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
            queryset = queryset.filter(created_at__date__lte=end_date)
        except ValueError:
            return Response(
                {'error': 'Invalid end_date format. Use YYYY-MM-DD'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    # Search functionality
    search = request.query_params.get('search')
    if search:
        queryset = queryset.filter(
            Q(campaign__name__icontains=search) |
            Q(message__icontains=search)
        )
    
    # Sorting
    sort_field = request.query_params.get('sort', '-created_at')
    valid_sort_fields = ['created_at', '-created_at', 'amount', '-amount', 'campaign__name', '-campaign__name']
    
    if sort_field in valid_sort_fields:
        queryset = queryset.order_by(sort_field)
    else:
        queryset = queryset.order_by('-created_at')
    
    # Calculate statistics
    stats = queryset.aggregate(
        total_donated=Sum('amount'),
        donation_count=Count('id'),
        completed_donations=Count('id', filter=Q(status='completed')),
        pending_donations=Count('id', filter=Q(status='pending')),
        failed_donations=Count('id', filter=Q(status='failed')),
        campaigns_supported=Count('campaign', distinct=True)
    )
    
    # Calculate average donation (avoid division by zero)
    stats['average_donation'] = (
        stats['total_donated'] / stats['donation_count'] 
        if stats['donation_count'] > 0 else 0
    )
    
    # Pagination
    page = int(request.query_params.get('page', 1))
    limit = int(request.query_params.get('limit', 20))
    
    # Ensure reasonable limits
    if limit > 100:
        limit = 100
    if limit < 1:
        limit = 20
    
    offset = (page - 1) * limit
    total_count = queryset.count()
    donations = queryset[offset:offset + limit]
    
    # Serialize data
    serializer = DonationSerializer(donations, many=True)
    
    return Response({
        'donations': serializer.data,
        'statistics': {
            'total_donated': str(stats['total_donated'] or 0),
            'donation_count': stats['donation_count'],
            'completed_donations': stats['completed_donations'],
            'pending_donations': stats['pending_donations'],
            'failed_donations': stats['failed_donations'],
            'campaigns_supported': stats['campaigns_supported'],
            'average_donation': str(stats['average_donation'] or 0)
        },
        'pagination': {
            'page': page,
            'limit': limit,
            'total_count': total_count,
            'total_pages': (total_count + limit - 1) // limit,
            'has_next': offset + limit < total_count,
            'has_previous': page > 1
        }
    })

@api_view(['GET'])
@authentication_classes([SupabaseAuthentication])
@permission_classes([IsAuthenticated])
def donation_summary(request):
    """
    Optimized donation summary - much faster than full donation list
    """
    user = request.user
    
    # Use only aggregations - no individual record fetching
    summary = Donation.objects.filter(donor=user).aggregate(
        total_donated=Sum('amount'),
        total_donations=Count('id'),
        campaigns_supported=Count('campaign', distinct=True)
    )
    
    return Response({
        'summary': {
            'total_donated': str(summary['total_donated'] or 0),
            'total_donations': summary['total_donations'],
            'campaigns_supported': summary['campaigns_supported']
        }
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@authentication_classes([SupabaseAuthentication])
@permission_classes([permissions.AllowAny])
def campaign_donations(request, campaign_id):
    """
    Return all donations for a specific campaign.
    """
    # Ensure campaign exists
    campaign = get_object_or_404(Campaign, id=campaign_id)

    # Get donations related to this campaign
    donations = Donation.objects.filter(campaign=campaign,status='completed').order_by('-created_at')

    serializer = DonationSerializer(donations, many=True)

    return Response(
        {"donations": serializer.data},
        status=status.HTTP_200_OK
    )




# New view functions to integrate with FastAPI microservice for recommendations

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def user_recommendations(request, user_id):
    """
    Get campaign recommendations for a user (via FastAPI + Django campaigns)
    """
    fastapi_url = f"{settings.FASTAPI_URL}/recommendations/{user_id}"
    resp = requests.get(fastapi_url)

    if resp.status_code != 200:
        return Response(
            {"error": "Failed to fetch from recommendation service"},
            status=status.HTTP_502_BAD_GATEWAY
        )

    recommendations = resp.json().get("recommendations", [])
    campaign_ids = [rec["campaign_id"] for rec in recommendations]

    campaigns = Campaign.objects.filter(id__in=campaign_ids)
    serializer = CampaignSerializer(campaigns, many=True)

    # Merge recommendation metadata
    enriched = []
    for rec in recommendations:
        campaign = next((c for c in serializer.data if c["id"] == rec["campaign_id"]), None)
        if campaign:
            campaign["score"] = rec["score"]
            campaign["reason"] = rec["reason"]
            enriched.append(campaign)

    return Response({"user_id": user_id, "recommendations": enriched})


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def similar_campaigns(request, campaign_id):
    """
    Get similar campaigns for a given campaign (via FastAPI + Django campaigns)
    """
    fastapi_url = f"{settings.FASTAPI_URL}/recommendations/similar/{campaign_id}"
    resp = requests.get(fastapi_url)

    if resp.status_code != 200:
        return Response(
            {"error": "Failed to fetch from recommendation service"},
            status=status.HTTP_502_BAD_GATEWAY
        )

    recommendations = resp.json().get("similar_campaigns", [])
    campaign_ids = [rec["campaign_id"] for rec in recommendations]

    campaigns = Campaign.objects.filter(id__in=campaign_ids)
    serializer = CampaignSerializer(campaigns, many=True)

    # Merge recommendation metadata
    enriched = []
    for rec in recommendations:
        campaign = next((c for c in serializer.data if c["id"] == rec["campaign_id"]), None)
        if campaign:
            campaign["score"] = rec["score"]
            campaign["reason"] = rec["reason"]
            enriched.append(campaign)

    return Response({"campaign_id": campaign_id, "similar_campaigns": enriched})