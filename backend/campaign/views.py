from rest_framework import viewsets, permissions, parsers, status, filters
from .models import Campaign, Category, File
from .serializers import CampaignSerializer, CategorySerializer, FileSerializer
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

logger = logging.getLogger(__name__)

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

    @action(detail=True, methods=['post'], permission_classes=[permissions.AllowAny], parser_classes=[parsers.JSONParser])
    def create_donation(self, request, pk=None):
        """
        Create a donation payment session for a campaign
        POST /api/campaigns/{id}/create_donation/
        """
        print(f"=== CREATE DONATION DEBUG ===")
        print(f"Campaign ID: {pk}")
        print(f"Request data: {request.data}")
        print(f"Content type: {request.content_type}")
        
        try:
            campaign = self.get_object()
            print(f"Campaign found: {campaign.name}")
            
            # Get donation data
            amount = request.data.get('amount')
            donor_email = request.data.get('donor_email', 'anonymous@sada9a.com')
            
            print(f"Amount: {amount}, Email: {donor_email}")
            
            # Validate amount
            if not amount:
                print("ERROR: No amount provided")
                return Response(
                    {'error': 'Donation amount is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                amount = float(amount)
                if amount <= 0:
                    print("ERROR: Invalid amount")
                    return Response(
                        {'error': 'Donation amount must be greater than 0'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except (ValueError, TypeError):
                print("ERROR: Amount conversion failed")
                return Response(
                    {'error': 'Invalid donation amount'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            print(f"Amount validated: {amount}")
            
            # Check if NEXTREMITLY_API_KEY exists
            api_key = getattr(settings, 'NEXTREMITLY_API_KEY', None)
            print(f"API Key exists: {bool(api_key)}")
            print(f"API Key preview: {api_key[:20] if api_key else 'None'}...")
            
            if not api_key:
                print("ERROR: NEXTREMITLY_API_KEY not configured")
                return Response(
                    {'error': 'Payment service not configured'}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Create payment session with Nextremitly
            payment_data = {
                'amount': amount,
                'currency': 'MRU',
                'description': f'Donation to {campaign.name}',
                'customer_email': donor_email,
                'success_url': f"http://localhost:5174/campaign/{campaign.id}/donation/success",
                'cancel_url': f"http://localhost:5174/campaign/{campaign.id}/donation/cancel",
                'webhook_url': f"http://localhost:8001/api/campaigns/donation-webhook/",
                'metadata': {
                    'campaign_id': campaign.id,
                    'campaign_name': campaign.name,
                    'donation_amount': str(amount),
                    'platform': 'sada9a'
                }
            }
            
            print(f"Payment data prepared: {payment_data}")
            
            # Test if Nextremitly is reachable
            try:
                print("Testing connection to Nextremitly...")
                test_response = requests.get('http://localhost:8000/api/merchants/wallets/providers/', timeout=5)
                print(f"Nextremitly connection test: {test_response.status_code}")
            except Exception as e:
                print(f"ERROR: Cannot connect to Nextremitly: {str(e)}")
                return Response(
                    {'error': 'Payment service unavailable. Please make sure Nextremitly is running on port 8000.'}, 
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
            
            # Call Nextremitly API
            print("Making request to Nextremitly payment sessions endpoint...")
            response = requests.post(
                'http://localhost:8000/api/payment/sessions/',
                json=payment_data,
                headers={
                    'Authorization': f'Bearer {api_key}',
                    'Content-Type': 'application/json'
                },
                timeout=30
            )
            
            print(f"Nextremitly response status: {response.status_code}")
            print(f"Nextremitly response body: {response.text}")
            
            if response.status_code == 201:
                session_data = response.json()
                print(f"Payment session created successfully: {session_data}")
                return Response({
                    'success': True,
                    'session_id': session_data['session_id'],
                    'payment_url': session_data['payment_url'],
                    'widget_url': f"http://localhost:5173/payment/{session_data['session_id']}",
                    'expires_at': session_data['expires_at']
                }, status=status.HTTP_201_CREATED)
            else:
                print(f"ERROR: Nextremitly returned {response.status_code}")
                return Response(
                    {'error': f'Payment service error: {response.status_code} - {response.text}'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except requests.exceptions.RequestException as e:
            print(f"ERROR: Request exception: {str(e)}")
            return Response(
                {'error': 'Payment service temporarily unavailable'}, 
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except Exception as e:
            print(f"ERROR: Unexpected exception: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'An unexpected error occurred: {str(e)}'}, 
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


# Simple payment webhook handler
@csrf_exempt
@require_http_methods(["POST"])
def donation_webhook(request):
    """
    Webhook endpoint to receive payment status updates from Nextremitly
    POST /api/campaigns/donation-webhook/
    """
    try:
        payload = json.loads(request.body)
        session_id = payload.get('session_id')
        payment_status = payload.get('status')
        metadata = payload.get('metadata', {})
        
        logger.info(f"Received webhook for session {session_id}: {payment_status}")
        
        if payment_status == 'completed':
            # Payment successful - update campaign
            campaign_id = metadata.get('campaign_id')
            amount = float(metadata.get('donation_amount', 0))
            
            if campaign_id and amount > 0:
                try:
                    campaign = Campaign.objects.get(id=campaign_id)
                    campaign.current_amount += amount
                    campaign.number_of_donors += 1
                    campaign.save()
                    logger.info(f"Updated campaign {campaign_id} with donation of {amount} MRU")
                except Campaign.DoesNotExist:
                    logger.error(f"Campaign {campaign_id} not found")
        
        return HttpResponse('OK', status=200)
        
    except json.JSONDecodeError:
        logger.error("Invalid JSON in webhook payload")
        return HttpResponse('Invalid JSON', status=400)
    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}")
        return HttpResponse('Internal Server Error', status=500)


# Legacy payment creation function (keeping your original)
def create_payment(request):
    data = json.loads(request.body)
    
    response = requests.post(
        'http://localhost:8000/api/payment/sessions/',
        headers={
            'Authorization': f'Bearer {settings.NEXTREMITLY_API_KEY}',
            'Content-Type': 'application/json'
        },
        json={
            'amount': data['amount'],
            'currency': 'MRU',
            'description': data.get('description', 'Payment'),
            'customer_email': data.get('email', 'customer@example.com'),
            'success_url': 'http://localhost:5174/success',
            'cancel_url': 'http://localhost:5174/cancel',
            'webhook_url': 'http://localhost:8001/api/campaigns/donation-webhook/'
        }
    )
    
    return JsonResponse(response.json())

@csrf_exempt
def webhook_handler(request):
    data = json.loads(request.body)
    session_id = data['session_id']
    status = data['status']
    
    if status == 'completed':
        # Handle successful payment
        pass
    
    return HttpResponse('OK')