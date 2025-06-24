from rest_framework import viewsets, permissions, parsers, status
from .models import Campaign, Category, File
from .serializers import CampaignSerializer, CategorySerializer, FileSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Case, When
from rest_framework import filters
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend

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
    
    @action(detail=False, methods=['post'], url_path='batch', permission_classes=[permissions.AllowAny],parser_classes=[parsers.JSONParser])
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


class FileViewSet(viewsets.ModelViewSet):
    queryset = File.objects.all()
    serializer_class = FileSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.annotate(campaign_count=Count('campaigns', distinct=True))
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


import requests
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
import json

def create_payment(request):
    data = json.loads(request.body)
    
    response = requests.post(
        'https://localhost:8000/api/payment/sessions/',
        headers={
            'Authorization': f'Bearer {settings.NEXTREMITLY_API_KEY}',
            'Content-Type': 'application/json'
        },
        json={
            'amount': data['amount'],
            'currency': 'MRU',
            'description': data['description'],
            'customer_email': data['email'],
            'success_url': 'https://yoursite.com/success',
            'cancel_url': 'https://yoursite.com/cancel',
            'webhook_url': 'https://yoursite.com/webhook'
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
        fulfill_order(session_id)
    
    return HttpResponse('OK')