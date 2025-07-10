from rest_framework import viewsets, permissions, parsers, status, filters
from .models import Campaign, Category, Donation, DonationWebhookLog, File
from .serializers import CampaignSerializer, CategorySerializer, FileSerializer, DonationSerializer, DonationCreateSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Case, When, Q
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
from .services.payment_service import payment_client
from django.utils import timezone
from .utils.facebook_live import FacebookLiveAPI, update_campaign_live_status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.utils.decorators import method_decorator


logger = logging.getLogger(__name__)


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
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]
    
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
    
    def perform_create(self, serializer):
        return serializer.save()
    
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
    
    def get_serializer_context(self):
        """
        Extra context provided to the serializer class.
        """
        context = super().get_serializer_context()
        context.update({'request': self.request})
        return context
    
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
        
        
    @action(detail=True, methods=['post'], permission_classes=[permissions.AllowAny], parser_classes=[parsers.JSONParser])
    def create_donation(self, request, pk=None):
        """
        Create a donation payment session for a campaign
        POST /api/campaigns/{id}/create_donation/
        """
        logger.info(f"=== CREATE DONATION REQUEST ===")
        logger.info(f"Campaign ID: {pk}")
        logger.info(f"Request data: {request.data}")
        
        try:
            campaign = self.get_object()
            logger.info(f"Campaign found: {campaign.name}")
            
            # Validate request data using serializer
            serializer = DonationCreateSerializer(data=request.data)
            if not serializer.is_valid():
                logger.error(f"Invalid request data: {serializer.errors}")
                return Response(
                    {'error': 'Invalid request data', 'details': serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            validated_data = serializer.validated_data
            logger.info(f"Validated data: {validated_data}")
            
            # Check microservice health
            if not payment_client.health_check():
                logger.error("Payment microservice is not healthy")
                return Response(
                    {'error': 'Payment service is currently unavailable'},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
            
            # Create donation record first (with pending status)
            donation = Donation.objects.create(
                campaign=campaign,
                donor=request.user if request.user.is_authenticated else None,
                donor_email=validated_data.get('donor_email'),
                donor_name=validated_data.get('donor_name'),
                amount=validated_data['amount'],
                currency='MRU',
                status='pending',
                message=validated_data.get('message'),
                is_anonymous=validated_data.get('is_anonymous', False)
            )
            
            logger.info(f"Created donation record: {donation.id}")
            
            # Call payment microservice
            result = payment_client.create_donation_session(
                campaign=campaign,
                amount=float(validated_data['amount']),
                donor_email=validated_data.get('donor_email'),
                donor_name=validated_data.get('donor_name'),
                message=validated_data.get('message'),
                is_anonymous=validated_data.get('is_anonymous', False)
            )
            
            if result['success']:
                # Update donation with session info
                donation.payment_session_id = result['session_id']
                donation.status = 'processing'
                donation.save()
                
                logger.info(f"Payment session created successfully: {result['session_id']}")
                
                # REMOVE THESE LINES - Don't update campaign totals here!
                # campaign.number_of_donors += 1
                # campaign.current_amount += donation.amount
                # campaign.save()
                
                return Response({
                    'success': True,
                    'donation_id': donation.id,
                    'session_id': result['session_id'],
                    'payment_url': result['payment_url'],
                    'widget_url': result['widget_url'],
                    'expires_at': result.get('expires_at')
                }, status=status.HTTP_201_CREATED)
            else:
                # Update donation status to failed
                donation.status = 'failed'
                donation.save()
                
                logger.error(f"Payment session creation failed: {result['error']}")
                return Response(
                    {'error': result['error']},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            logger.error(f"Unexpected error in create_donation: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': 'An unexpected error occurred'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    
    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
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
            # Get status from microservice
            result = payment_client.get_payment_status(session_id)
            
            if result['success']:
                return Response(result['data'], status=status.HTTP_200_OK)
            else:
                return Response(
                    {'error': result['error']},
                    status=status.HTTP_404_NOT_FOUND if 'not found' in result['error'] else status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            logger.error(f"Error checking payment status: {str(e)}")
            return Response(
                {'error': 'Error checking payment status'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )



class FileViewSet(viewsets.ModelViewSet):
    queryset = File.objects.all()
    serializer_class = FileSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.annotate(campaign_count=Count('campaigns', distinct=True))
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

@require_http_methods(["POST"])
def donation_webhook(request):
    """
    Enhanced webhook endpoint with better logging and CSRF handling
    POST /api/campaigns/donation-webhook/
    """
    # Log the raw request for debugging
    logger.info(f"=== WEBHOOK RECEIVED ===")
    logger.info(f"Method: {request.method}")
    logger.info(f"Headers: {dict(request.headers)}")
    logger.info(f"Body: {request.body.decode('utf-8')}")
    logger.info(f"Content-Type: {request.content_type}")
    logger.info(f"User: {request.user}")
    
    try:
        payload = json.loads(request.body)
        logger.info(f"Parsed payload: {payload}")
        
        # Log the webhook call
        webhook_log = DonationWebhookLog.objects.create(
            session_id=payload.get('session_id'),
            payload=payload,
            processed=False
        )
        logger.info(f"Created webhook log: {webhook_log.id}")
        
        # Verify webhook with microservice (optional)
        try:
            verification_result = payment_client.verify_webhook(payload)
            if not verification_result['success']:
                logger.warning(f"Webhook verification failed: {verification_result['error']}")
        except Exception as verify_error:
            logger.error(f"Webhook verification error: {verify_error}")
        
        # Process the webhook
        session_id = payload.get('session_id')
        payment_status = payload.get('status')
        metadata = payload.get('metadata', {})
        
        logger.info(f"Processing webhook - Session: {session_id}, Status: {payment_status}")
        
        if payment_status == 'completed':
            # Find the donation by session_id
            try:
                donation = Donation.objects.get(payment_session_id=session_id)
                logger.info(f"Found donation: {donation.id}")
                
                # Update donation status
                donation.status = 'completed'
                donation.completed_at = timezone.now()
                donation.external_transaction_id = payload.get('transaction_id')
                donation.payment_metadata = payload
                donation.save()
                logger.info(f"Updated donation {donation.id} to completed")
                
                # Update campaign totals
                campaign = donation.campaign
                old_amount = campaign.current_amount
                old_donors = campaign.number_of_donors
                
                campaign.current_amount += donation.amount
                campaign.number_of_donors += 1
                campaign.save()
                
                logger.info(f"Updated campaign {campaign.id}: amount {old_amount} -> {campaign.current_amount}, donors {old_donors} -> {campaign.number_of_donors}")
                
                # Mark webhook as processed
                webhook_log.processed = True
                webhook_log.save()
                
            except Donation.DoesNotExist:
                error_msg = f"Donation with session_id {session_id} not found"
                logger.error(error_msg)
                webhook_log.error_message = error_msg
                webhook_log.save()
                
        elif payment_status in ['failed', 'cancelled']:
            # Update donation status
            try:
                donation = Donation.objects.get(payment_session_id=session_id)
                donation.status = payment_status
                donation.payment_metadata = payload
                donation.save()
                
                webhook_log.processed = True
                webhook_log.save()
                
                logger.info(f"Updated donation {donation.id} status to {payment_status}")
                
            except Donation.DoesNotExist:
                error_msg = f"Donation with session_id {session_id} not found"
                logger.error(error_msg)
                webhook_log.error_message = error_msg
                webhook_log.save()
        
        logger.info("=== WEBHOOK PROCESSED SUCCESSFULLY ===")
        return HttpResponse('OK', status=200)
        
    except json.JSONDecodeError as e:
        error_msg = f"Invalid JSON in webhook payload: {str(e)}"
        logger.error(error_msg)
        return HttpResponse('Invalid JSON', status=400)
    except Exception as e:
        error_msg = f"Error processing webhook: {str(e)}"
        logger.error(error_msg)
        import traceback
        logger.error(traceback.format_exc())
        return HttpResponse('Internal Server Error', status=500)

# Keep your existing legacy functions if needed for backward compatibility
def create_payment(request):
    """Legacy payment creation - now uses microservice"""
    data = json.loads(request.body)
    
    # This would need campaign context - consider deprecating this endpoint
    logger.warning("Legacy create_payment endpoint called - consider using create_donation instead")
    
    return JsonResponse({'error': 'Use /api/campaigns/{id}/create_donation/ instead'}, status=400)


@require_http_methods(["GET"])
def payment_health_check(request):
    """
    Standalone payment service health check
    GET /api/payment/health/
    """
    try:
        is_healthy = payment_client.health_check()
        
        return JsonResponse({
            'healthy': is_healthy,
            'service': 'payment-microservice',
            'timestamp': timezone.now().isoformat()
        }, status=200 if is_healthy else 503)
        
    except Exception as e:
        logger.error(f"Error checking payment service health: {str(e)}")
        return JsonResponse({
            'healthy': False,
            'error': 'Could not connect to payment service',
            'timestamp': timezone.now().isoformat()
        }, status=503)