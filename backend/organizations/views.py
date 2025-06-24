# organizations/views.py - Simple Payment System

from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta
from .models import OrganizationProfile, WalletProvider, ManualPayment, NextPayPayment
from campaign.models import Campaign
from .serializers import (
    OrganizationProfileSerializer, 
    WalletProviderSerializer,
    ManualPaymentSerializer, 
    NextPayPaymentSerializer,
    PaymentMethodsSummarySerializer
)

from rest_framework import serializers
from django.db import models
class OrganizationProfileViewSet(viewsets.ModelViewSet):
    queryset = OrganizationProfile.objects.all()
    serializer_class = OrganizationProfileSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        """Filter based on user role"""
        base_queryset = self.queryset.prefetch_related(
            'manual_payments__wallet_provider',
            'nextpay_payments__wallet_provider'
        )
        
        if self.request.user.role == 'organization':
            return base_queryset.filter(owner=self.request.user)        
        elif self.request.user.role == 'admin':
            return base_queryset
        return base_queryset.none()

    def list(self, request, *args, **kwargs):
        """For organization users, return single object"""
        if request.user.role == 'organization':
            profile, created = OrganizationProfile.objects.get_or_create(
                owner=request.user,
                defaults={'org_name': f"{request.user.first_name or request.user.username}'s Organization"}
            )
            serializer = self.get_serializer(profile)   
            return Response(serializer.data)
        
        return super().list(request, *args, **kwargs)

    def perform_create(self, serializer):
        """Create organization profile"""
        if OrganizationProfile.objects.filter(owner=self.request.user).exists():
            raise serializers.ValidationError("Organization profile already exists for this user")
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=['get'])
    def payment_methods(self, request, pk=None):
        """Get all payment methods for this organization"""
        organization = self.get_object()
        
        # Get active payment methods
        manual_payments = organization.manual_payments.filter(is_active=True)
        nextpay_payments = organization.nextpay_payments.filter(is_active=True)
        
        summary_data = {
            'manual_payments_count': manual_payments.count(),
            'nextpay_payments_count': nextpay_payments.count(),
            'total_payment_methods': manual_payments.count() + nextpay_payments.count(),
            'has_manual_payments': manual_payments.exists(),
            'has_nextpay_payments': nextpay_payments.exists(),
            'payment_ready': manual_payments.exists() or nextpay_payments.exists(),
            'manual_payments': ManualPaymentSerializer(manual_payments, many=True).data,
            'nextpay_payments': NextPayPaymentSerializer(nextpay_payments, many=True).data,
        }
        
        return Response(summary_data)

class WalletProviderViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only endpoint for available wallet providers"""
    queryset = WalletProvider.objects.filter(is_active=True)
    serializer_class = WalletProviderSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

class ManualPaymentViewSet(viewsets.ModelViewSet):
    serializer_class = ManualPaymentSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None
    
    def get_queryset(self):
        """Filter manual payments based on user role"""
        base_queryset = ManualPayment.objects.select_related('organization', 'wallet_provider')
        
        if self.request.user.role == 'organization':
            return base_queryset.filter(organization__owner=self.request.user)
        elif self.request.user.role == 'admin':
            return base_queryset
        return base_queryset.none()
    
    def create(self, request, *args, **kwargs):
        """Create manual payment for organization"""
        # Get or create organization profile
        if request.user.role == 'organization':
            org_profile, created = OrganizationProfile.objects.get_or_create(
                owner=request.user,
                defaults={'org_name': f"{request.user.first_name or request.user.username}'s Organization"}
            )
        else:
            return Response(
                {"error": "Only organization users can create manual payments"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if this wallet already has a manual payment for this org
        wallet_provider_id = request.data.get('wallet_provider_id')
        phone_number = request.data.get('phone_number')
        
        if ManualPayment.objects.filter(
            organization=org_profile,
            wallet_provider_id=wallet_provider_id,
            phone_number=phone_number
        ).exists():
            return Response(
                {"error": "Manual payment with this wallet and phone number already exists"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(organization=org_profile)
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def perform_update(self, serializer):
        """Ensure users can only update their own manual payments"""
        manual_payment = self.get_object()
        
        if (self.request.user.role == 'organization' and 
            manual_payment.organization.owner != self.request.user):
            raise PermissionError("You can only update your own organization's manual payments")
        
        serializer.save()
    
    def perform_destroy(self, instance):
        """Ensure users can only delete their own manual payments"""
        if (self.request.user.role == 'organization' and 
            instance.organization.owner != self.request.user):
            raise PermissionError("You can only delete your own organization's manual payments")
        
        instance.delete()

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Toggle active status of manual payment"""
        manual_payment = self.get_object()
        
        # Check permissions
        if (request.user.role == 'organization' and 
            manual_payment.organization.owner != request.user):
            return Response(
                {"error": "You can only manage your own organization's manual payments"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        manual_payment.is_active = not manual_payment.is_active
        manual_payment.save()
        
        serializer = self.get_serializer(manual_payment)
        return Response(serializer.data)

class NextPayPaymentViewSet(viewsets.ModelViewSet):
    serializer_class = NextPayPaymentSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None
    
    def get_queryset(self):
        """Filter NextPay payments based on user role"""
        base_queryset = NextPayPayment.objects.select_related('organization', 'wallet_provider')
        
        if self.request.user.role == 'organization':
            return base_queryset.filter(organization__owner=self.request.user)
        elif self.request.user.role == 'admin':
            return base_queryset
        return base_queryset.none()
    
    def create(self, request, *args, **kwargs):
        """Create NextPay payment for organization"""
        # Get or create organization profile
        if request.user.role == 'organization':
            org_profile, created = OrganizationProfile.objects.get_or_create(
                owner=request.user,
                defaults={'org_name': f"{request.user.first_name or request.user.username}'s Organization"}
            )
        else:
            return Response(
                {"error": "Only organization users can create NextPay payments"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if this wallet+commercial number already exists for this org
        wallet_provider_id = request.data.get('wallet_provider_id')
        commercial_number = request.data.get('commercial_number')
        
        if NextPayPayment.objects.filter(
            organization=org_profile,
            wallet_provider_id=wallet_provider_id,
            commercial_number=commercial_number
        ).exists():
            return Response(
                {"error": "NextPay payment with this wallet and commercial number already exists"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(organization=org_profile)
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def perform_update(self, serializer):
        """Ensure users can only update their own NextPay payments"""
        nextpay_payment = self.get_object()
        
        if (self.request.user.role == 'organization' and 
            nextpay_payment.organization.owner != self.request.user):
            raise PermissionError("You can only update your own organization's NextPay payments")
        
        serializer.save()
    
    def perform_destroy(self, instance):
        """Ensure users can only delete their own NextPay payments"""
        if (self.request.user.role == 'organization' and 
            instance.organization.owner != self.request.user):
            raise PermissionError("You can only delete your own organization's NextPay payments")
        
        instance.delete()

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Toggle active status of NextPay payment"""
        nextpay_payment = self.get_object()
        
        # Check permissions
        if (request.user.role == 'organization' and 
            nextpay_payment.organization.owner != request.user):
            return Response(
                {"error": "You can only manage your own organization's NextPay payments"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        nextpay_payment.is_active = not nextpay_payment.is_active
        nextpay_payment.save()
        
        serializer = self.get_serializer(nextpay_payment)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """Mark NextPay payment as verified (admin only)"""
        if request.user.role != 'admin':
            return Response(
                {'error': 'Only admins can verify NextPay payments'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        nextpay_payment = self.get_object()
        nextpay_payment.verified_at = timezone.now()
        nextpay_payment.save()
        
        serializer = self.get_serializer(nextpay_payment)
        return Response({
            'message': 'NextPay payment verified successfully',
            'payment': serializer.data
        })

class OrganizationDashboardViewSet(viewsets.ModelViewSet):
    """
    Dashboard viewset with statistics and analytics for organizations
    """
    queryset = OrganizationProfile.objects.all()
    serializer_class = OrganizationProfileSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        """Return organization profile for the current user if they are an organization"""
        if self.request.user.role == 'organization':
            return OrganizationProfile.objects.filter(owner=self.request.user)        
        elif self.request.user.role == 'admin':
            return self.queryset
        return self.queryset.none()

    def list(self, request, *args, **kwargs):
        """For organization users, return single object as dashboard data"""
        if request.user.role == 'organization':
            profile, created = OrganizationProfile.objects.get_or_create(
                owner=request.user,
                defaults={'org_name': f"{request.user.first_name or request.user.username}'s Organization"}
            )
            serializer = self.get_serializer(profile)   
            return Response(serializer.data)
        
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get organization statistics for dashboard"""
        try:
            if request.user.role != 'organization':
                return Response(
                    {'error': 'Only organizations can access dashboard statistics'},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Get or create profile
            profile, created = OrganizationProfile.objects.get_or_create(
                owner=request.user,
                defaults={'org_name': f"{request.user.first_name or request.user.username}'s Organization"}
            )

            period = request.query_params.get('period', '30d')
            
            # Calculate date range based on period
            end_date = timezone.now()
            if period == '7d':
                start_date = end_date - timedelta(days=7)
            elif period == '30d':
                start_date = end_date - timedelta(days=30)
            elif period == '90d':
                start_date = end_date - timedelta(days=90)
            else:  # 1y
                start_date = end_date - timedelta(days=365)

            # Payment methods stats
            manual_payments = profile.manual_payments.filter(is_active=True)
            nextpay_payments = profile.nextpay_payments.filter(is_active=True)
            
            # Try to get campaign stats (you'll need to adjust based on your Campaign model)
            try:
                
                
                org_campaigns = Campaign.objects.filter(owner=profile.owner)
                total_campaigns = org_campaigns.count()
                total_raised = org_campaigns.aggregate(
                    total=models.Sum('current_amount')
                )['total'] or 0
                total_donors = org_campaigns.aggregate(
                    total=models.Sum('number_of_donors')
                )['total'] or 0
                
                # Recent campaigns in period
                recent_campaigns = org_campaigns.filter(created_at__gte=start_date)
                recent_count = recent_campaigns.count()
                recent_raised = recent_campaigns.aggregate(
                    total=models.Sum('current_amount')
                )['total'] or 0

            except ImportError:
                # Sample data if Campaign model doesn't exist
                total_campaigns = 5
                total_raised = 15000.00
                total_donors = 150
                recent_count = 2
                recent_raised = 3000.00

            statistics_data = {
                'total_campaigns': total_campaigns,
                'total_raised': float(total_raised),
                'total_donors': total_donors,
                'recent_campaigns': recent_count,
                'recent_raised': float(recent_raised),
                'period': period,
                
                # Payment methods summary
                'payment_methods': {
                    'manual_count': manual_payments.count(),
                    'nextpay_count': nextpay_payments.count(),
                    'total_methods': manual_payments.count() + nextpay_payments.count(),
                    'manual_enabled': manual_payments.exists(),
                    'nextpay_enabled': nextpay_payments.exists(),
                    'payment_ready': manual_payments.exists() or nextpay_payments.exists()
                },
                
                # Quick setup status
                'setup_status': {
                    'profile_complete': bool(profile.org_name and profile.description),
                    'payment_configured': manual_payments.exists() or nextpay_payments.exists(),
                    'verified': profile.is_verified,
                    'ready_for_campaigns': bool(
                        profile.org_name and 
                        (manual_payments.exists() or nextpay_payments.exists())
                    )
                }
            }

            return Response(statistics_data)

        except Exception as e:
            return Response(
                {'error': 'Failed to fetch statistics', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def payment_summary(self, request):
        """Get detailed payment methods summary for dashboard"""
        try:
            if request.user.role != 'organization':
                return Response(
                    {'error': 'Only organizations can access payment summary'},
                    status=status.HTTP_403_FORBIDDEN
                )

            profile, created = OrganizationProfile.objects.get_or_create(
                owner=request.user,
                defaults={'org_name': f"{request.user.first_name or request.user.username}'s Organization"}
            )
            
            # Get all payment methods
            manual_payments = profile.manual_payments.filter(is_active=True)
            nextpay_payments = profile.nextpay_payments.filter(is_active=True)
            
            # Available wallets not yet configured
            configured_manual_wallets = set(manual_payments.values_list('wallet_provider_id', flat=True))
            configured_nextpay_wallets = set(nextpay_payments.values_list('wallet_provider_id', flat=True))
            
            available_wallets = WalletProvider.objects.filter(is_active=True)
            
            recommendations = []
            
            # Suggest unconfigured wallets
            for wallet in available_wallets:
                if wallet.id not in configured_manual_wallets and wallet.id not in configured_nextpay_wallets:
                    recommendations.append({
                        'type': 'suggestion',
                        'title': f'Add {wallet.name} Payment',
                        'message': f'Consider adding {wallet.name} to reach more donors',
                        'action': 'add_payment_method',
                        'wallet_id': wallet.id,
                        'wallet_name': wallet.name
                    })
            
            # Check if no payment methods configured
            if not manual_payments.exists() and not nextpay_payments.exists():
                recommendations.insert(0, {
                    'type': 'warning',
                    'title': 'No Payment Methods',
                    'message': 'Add at least one payment method to start receiving donations',
                    'action': 'add_payment_method'
                })

            payment_summary = {
                'manual_payments': ManualPaymentSerializer(manual_payments, many=True).data,
                'nextpay_payments': NextPayPaymentSerializer(nextpay_payments, many=True).data,
                'summary': {
                    'manual_count': manual_payments.count(),
                    'nextpay_count': nextpay_payments.count(),
                    'total_count': manual_payments.count() + nextpay_payments.count(),
                    'has_manual': manual_payments.exists(),
                    'has_nextpay': nextpay_payments.exists(),
                    'payment_ready': manual_payments.exists() or nextpay_payments.exists()
                },
                'recommendations': recommendations[:5],  # Limit to 5 recommendations
                'available_wallets': WalletProviderSerializer(available_wallets, many=True).data
            }
            
            return Response(payment_summary)

        except Exception as e:
            return Response(
                {'error': 'Failed to fetch payment summary', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def overview(self, request):
        """Get comprehensive dashboard overview"""
        try:
            if request.user.role != 'organization':
                return Response(
                    {'error': 'Only organizations can access dashboard overview'},
                    status=status.HTTP_403_FORBIDDEN
                )

            profile, created = OrganizationProfile.objects.get_or_create(
                owner=request.user,
                defaults={'org_name': f"{request.user.first_name or request.user.username}'s Organization"}
            )
            
            # Get recent campaigns (you'll need to adjust based on your Campaign model)
            try:
                
                
                recent_campaigns = Campaign.objects.filter(
                    owner=profile.owner
                ).order_by('-created_at')[:5]

                campaign_data = [
                    {
                        'id': c.id,
                        'name': c.name,
                        'raised_amount': float(c.current_amount),
                        'target': float(c.target),
                        'created_at': c.created_at.isoformat(),
                        'donors_count': c.number_of_donors,
                        'progress_percentage': round((c.current_amount / c.target * 100), 1) if c.target > 0 else 0
                    } for c in recent_campaigns
                ]

            except ImportError:
                # Sample data if Campaign model doesn't exist
                campaign_data = [
                    {
                        'id': 1,
                        'name': 'Help Local Food Bank',
                        'raised_amount': 5000.0,
                        'target': 10000.0,
                        'created_at': timezone.now().isoformat(),
                        'donors_count': 45,
                        'progress_percentage': 50.0
                    }
                ]

            # Payment methods quick summary
            manual_count = profile.manual_payments.filter(is_active=True).count()
            nextpay_count = profile.nextpay_payments.filter(is_active=True).count()

            overview_data = {
                'organization': OrganizationProfileSerializer(profile).data,
                'recent_campaigns': campaign_data,
                'payment_summary': {
                    'manual_count': manual_count,
                    'nextpay_count': nextpay_count,
                    'total_count': manual_count + nextpay_count,
                    'payment_ready': manual_count > 0 or nextpay_count > 0
                },
                'quick_stats': {
                    'profile_complete': bool(profile.org_name and profile.description),
                    'verified': profile.is_verified,
                    'can_create_campaigns': manual_count > 0 or nextpay_count > 0
                }
            }

            return Response(overview_data)

        except Exception as e:
            return Response(
                {'error': 'Failed to fetch dashboard overview', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )