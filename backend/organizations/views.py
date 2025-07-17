# organizations/views.py - Simple Payment System

from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import OrganizationProfile, WalletProvider, ManualPayment, NextPayPayment
from campaign.models import Campaign, Donation
from .serializers import (
    OrganizationProfileSerializer, 
    WalletProviderSerializer,
    ManualPaymentSerializer, 
    NextPayPaymentSerializer,
    PaymentMethodsSummarySerializer
)

from rest_framework import serializers
from django.db import models
from django.db.models import Sum, Count, Avg, Q, F
from django.db.models.functions import TruncDate, TruncMonth, TruncWeek
from django.http import HttpResponse
from datetime import datetime, timedelta

from io import BytesIO
import xlsxwriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer

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


class AnalyticsViewSet(viewsets.ViewSet):
    """Analytics endpoints for organization dashboard"""
    permission_classes = [IsAuthenticated]

    def get_organization_profile(self, user):
        """Get or create organization profile"""
        profile, created = OrganizationProfile.objects.get_or_create(
            owner=user,
            defaults={'org_name': f"{user.first_name or user.username}'s Organization"}
        )
        return profile

    def get_date_range(self, request):
        """Get date range based on period parameter"""
        period = request.query_params.get('period', '30d')
        end_date = timezone.now()
        
        if period == '7d':
            start_date = end_date - timedelta(days=7)
        elif period == '30d':
            start_date = end_date - timedelta(days=30)
        elif period == '90d':
            start_date = end_date - timedelta(days=90)
        elif period == '1y':
            start_date = end_date - timedelta(days=365)
        elif period == 'custom':
            start_str = request.query_params.get('start_date')
            end_str = request.query_params.get('end_date')
            
            if start_str and end_str:
                try:
                    start_date = datetime.strptime(start_str, '%Y-%m-%d').replace(tzinfo=timezone.get_current_timezone())
                    end_date = datetime.strptime(end_str, '%Y-%m-%d').replace(tzinfo=timezone.get_current_timezone())
                    end_date = end_date.replace(hour=23, minute=59, second=59)
                except ValueError:
                    start_date = end_date - timedelta(days=30)
            else:
                start_date = end_date - timedelta(days=30)
        else:
            start_date = end_date - timedelta(days=30)
        
        return start_date, end_date, period

    @action(detail=False, methods=['get'])
    def overview(self, request):
        """Get comprehensive analytics overview"""
        if request.user.role != 'organization':
            return Response(
                {'error': 'Only organizations can access analytics'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            profile = self.get_organization_profile(request.user)
            start_date, end_date, period = self.get_date_range(request)

            # Get campaigns and donations
            campaigns = Campaign.objects.filter(owner=profile.owner)
            all_donations = Donation.objects.filter(
                campaign__owner=profile.owner,
                status='completed'
            )
            period_donations = all_donations.filter(created_at__range=[start_date, end_date])

            # Calculate analytics data
            analytics_data = self._calculate_analytics(campaigns, all_donations, period_donations, start_date, end_date, period)
            
            return Response(analytics_data)

        except Exception as e:
            return Response(
                {'error': 'Failed to fetch analytics data', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _calculate_analytics(self, campaigns, all_donations, period_donations, start_date, end_date, period):
        """Calculate all analytics metrics"""
        # Basic statistics
        total_campaigns = campaigns.count()
        total_raised = all_donations.aggregate(total=Sum('amount'))['total'] or 0
        period_raised = period_donations.aggregate(total=Sum('amount'))['total'] or 0
        avg_donation = period_donations.aggregate(avg=Avg('amount'))['avg'] or 0

        # Campaign performance
        top_campaigns = campaigns.annotate(
            total_raised=Sum('donations__amount', filter=Q(donations__status='completed')),
            donors_count=Count('donations', filter=Q(donations__status='completed'))
        ).order_by('-total_raised')[:5]

        # Donation trends with filled gaps for charts
        if period in ['7d', '30d']:
            trend_donations = period_donations.annotate(
                date=TruncDate('created_at')
            ).values('date').annotate(
                total_amount=Sum('amount'),
                count=Count('id')
            ).order_by('date')
            trend_label = 'Daily'
        else:
            trend_donations = period_donations.annotate(
                date=TruncWeek('created_at')
            ).values('date').annotate(
                total_amount=Sum('amount'),
                count=Count('id')
            ).order_by('date')
            trend_label = 'Weekly'

        # Fill missing dates for smooth charts
        trend_data = self._fill_missing_dates(trend_donations, start_date, end_date, period)

        # Top donors
        top_donors = period_donations.values('donor_name', 'donor_email').annotate(
            total_donated=Sum('amount'),
            donation_count=Count('id')
        ).order_by('-total_donated')[:5]

        # Campaign status breakdown for pie chart
        campaign_status = {
            'active': campaigns.filter(current_amount__lt=F('target')).count(),
            'completed': campaigns.filter(current_amount__gte=F('target')).count(),
            'new': campaigns.filter(created_at__gte=start_date).count()
        }

        # Payment method breakdown for pie chart
        payment_methods = period_donations.values('payment_method').annotate(
            count=Count('id'),
            total_amount=Sum('amount')
        ).order_by('-total_amount')

        # Monthly comparison (for growth indicators)
        prev_start = start_date - (end_date - start_date)
        prev_donations = all_donations.filter(created_at__range=[prev_start, start_date])
        prev_raised = prev_donations.aggregate(total=Sum('amount'))['total'] or 0
        
        growth_rate = 0
        if prev_raised > 0:
            growth_rate = round(((period_raised - prev_raised) / prev_raised) * 100, 1)

        return {
            'period': period,
            'date_range': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat()
            },
            'overview': {
                'total_campaigns': total_campaigns,
                'total_raised': float(total_raised),
                'period_raised': float(period_raised),
                'period_donations': period_donations.count(),
                'avg_donation': float(avg_donation),
                'unique_donors': period_donations.values('donor_email').distinct().count(),
                'growth_rate': growth_rate,
                'prev_period_raised': float(prev_raised)
            },
            'campaign_performance': [
                {
                    'id': c.id,
                    'name': c.name,
                    'total_raised': float(c.total_raised or 0),
                    'target': float(c.target),
                    'donors_count': c.donors_count,
                    'progress_percentage': round((c.total_raised or 0) / c.target * 100, 1) if c.target > 0 else 0,
                } for c in top_campaigns
            ],
            'donation_trends': {
                'label': trend_label,
                'data': trend_data
            },
            'top_donors': [
                {
                    'name': d['donor_name'] or 'Anonymous',
                    'total_donated': float(d['total_donated']),
                    'donation_count': d['donation_count']
                } for d in top_donors
            ],
            'campaign_status': [
                {'name': 'Active', 'value': campaign_status['active'], 'color': '#4F46E5'},
                {'name': 'Completed', 'value': campaign_status['completed'], 'color': '#10B981'},
                {'name': 'New This Period', 'value': campaign_status['new'], 'color': '#F59E0B'}
            ],
            'payment_methods': [
                {
                    'name': p['payment_method'] or 'Unknown',
                    'value': p['count'],
                    'amount': float(p['total_amount'] or 0),
                    'color': self._get_color_for_index(i)
                } for i, p in enumerate(payment_methods)
            ]
        }

    def _fill_missing_dates(self, trend_data, start_date, end_date, period):
        """Fill missing dates with zero values for smooth charts"""
        from collections import defaultdict
        
        # Convert to dict for easy lookup
        data_dict = {item['date']: item for item in trend_data if item['date']}
        
        filled_data = []
        current_date = start_date.date()
        end_date = end_date.date()
        
        if period in ['7d', '30d']:
            # Daily intervals
            while current_date <= end_date:
                if current_date in data_dict:
                    item = data_dict[current_date]
                    filled_data.append({
                        'date': current_date.isoformat(),
                        'amount': float(item['total_amount'] or 0),
                        'count': item['count']
                    })
                else:
                    filled_data.append({
                        'date': current_date.isoformat(),
                        'amount': 0.0,
                        'count': 0
                    })
                current_date += timedelta(days=1)
        else:
            # Weekly intervals
            while current_date <= end_date:
                # Find the Monday of this week
                monday = current_date - timedelta(days=current_date.weekday())
                
                if monday in data_dict:
                    item = data_dict[monday]
                    filled_data.append({
                        'date': monday.isoformat(),
                        'amount': float(item['total_amount'] or 0),
                        'count': item['count']
                    })
                else:
                    filled_data.append({
                        'date': monday.isoformat(),
                        'amount': 0.0,
                        'count': 0
                    })
                current_date += timedelta(days=7)
        
        return filled_data

    def _calculate_campaign_health(self, campaigns, all_donations, start_date, end_date):
        """Calculate health metrics for each campaign"""
        from datetime import datetime, timedelta
        from django.utils import timezone
        
        campaign_health = []
        now = timezone.now()
        
        for campaign in campaigns:
            # Get donations for this campaign
            campaign_donations = all_donations.filter(campaign=campaign)
            
            # Days since last donation
            last_donation = campaign_donations.order_by('-created_at').first()
            if last_donation:
                days_since_last = (now - last_donation.created_at).days
            else:
                days_since_last = (now - campaign.created_at).days
            
            # Weekly trend (this week vs last week)
            week_start = now - timedelta(days=7)
            this_week_donations = campaign_donations.filter(created_at__gte=week_start).count()
            last_week_start = week_start - timedelta(days=7)
            last_week_donations = campaign_donations.filter(
                created_at__gte=last_week_start, 
                created_at__lt=week_start
            ).count()
            
            # Determine trend
            if this_week_donations > last_week_donations:
                weekly_trend = 'increasing'
            elif this_week_donations < last_week_donations:
                weekly_trend = 'decreasing'
            else:
                weekly_trend = 'stable'
            
            # Momentum based on recent activity
            if days_since_last <= 3:
                momentum = 'hot'
            elif days_since_last <= 7:
                momentum = 'warm'
            else:
                momentum = 'cold'
            
            # Completion rate
            completion_rate = round((campaign.current_amount / campaign.target * 100), 1) if campaign.target > 0 else 0
            
            # Donor engagement (unique donors in last 30 days)
            recent_donors = campaign_donations.filter(
                created_at__gte=now - timedelta(days=30)
            ).values('donor_email').distinct().count()
            
            if recent_donors >= 5:
                donor_engagement = 'high'
            elif recent_donors >= 2:
                donor_engagement = 'medium'
            else:
                donor_engagement = 'low'
            
            campaign_health.append({
                'campaign_id': campaign.id,
                'name': campaign.name,
                'days_since_last_donation': days_since_last,
                'momentum': momentum,
                'weekly_trend': weekly_trend,
                'completion_rate': completion_rate,
                'donor_engagement': donor_engagement,
                'total_donors': campaign_donations.values('donor_email').distinct().count(),
                'this_week_donations': this_week_donations,
                'last_week_donations': last_week_donations
            })
        
        # Sort by priority (cold campaigns with low completion first)
        campaign_health.sort(key=lambda x: (
            x['momentum'] == 'cold',  # Cold campaigns first
            -x['completion_rate'],    # Lower completion rate first
            x['days_since_last_donation']  # More days since last donation first
        ), reverse=True)
        
        return campaign_health

    def _get_color_for_index(self, index):
        """Get color for chart elements"""
        colors = ['#4F46E5', '#7C3AED', '#EC4899', '#EF4444', '#F59E0B', '#10B981', '#06B6D4']
        return colors[index % len(colors)]


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
            
            # Initialize campaign stats with defaults
            campaign_stats = {
                'total_campaigns': 0,
                'total_raised': 0,
                'total_donors': 0,
                'recent_campaigns': 0,
                'recent_raised': 0,
                'success_rate': 0,
                'active_campaigns': 0,
                'pending_campaigns': 0,
                'completed_campaigns': 0,
                'avg_goal_achievement': 0
            }
            
            # Try to get real campaign stats
            try:
                # Check if Campaign model exists and is properly imported
                from campaign.models import Campaign
                
                # Verify the Campaign model has the expected fields
                campaign_fields = [field.name for field in Campaign._meta.get_fields()]
                print(f"Available Campaign fields: {campaign_fields}")  # Debug log
                
                # Check required fields exist
                required_fields = ['owner', 'current_amount', 'target', 'number_of_donors', 'created_at']
                missing_fields = [field for field in required_fields if field not in campaign_fields]
                
                if missing_fields:
                    print(f"Missing required Campaign fields: {missing_fields}")
                    raise AttributeError(f"Campaign model missing fields: {missing_fields}")
                
                # Get campaigns for this organization
                org_campaigns = Campaign.objects.filter(owner=profile.owner)
                
                # Basic stats
                campaign_stats['total_campaigns'] = org_campaigns.count()
                campaign_stats['total_raised'] = float(org_campaigns.aggregate(
                    total=models.Sum('current_amount')
                )['total'] or 0)
                campaign_stats['total_donors'] = org_campaigns.aggregate(
                    total=models.Sum('number_of_donors')
                )['total'] or 0
                
                # Recent campaigns in period
                recent_campaigns = org_campaigns.filter(created_at__gte=start_date)
                campaign_stats['recent_campaigns'] = recent_campaigns.count()
                campaign_stats['recent_raised'] = float(recent_campaigns.aggregate(
                    total=models.Sum('current_amount')
                )['total'] or 0)

                # Calculate success rate (campaigns that reached their target)
                if campaign_stats['total_campaigns'] > 0:
                    completed_campaigns = org_campaigns.filter(
                        current_amount__gte=models.F('target')
                    ).count()
                    campaign_stats['success_rate'] = round((completed_campaigns / campaign_stats['total_campaigns'] * 100), 1)

                # Campaign status breakdown - ONLY if status field exists
                if 'status' in campaign_fields:
                    campaign_stats['active_campaigns'] = org_campaigns.filter(status='active').count()
                    campaign_stats['pending_campaigns'] = org_campaigns.filter(status='pending').count()
                    campaign_stats['completed_campaigns'] = org_campaigns.filter(status='completed').count()
                else:
                    print("Campaign model doesn't have 'status' field - using alternative logic")
                    # Alternative logic without status field
                    # You can add your own logic here based on available fields
                    # For example, using dates or other criteria
                    
                    # Example: Consider campaigns as "active" if they haven't reached target and are recent
                    if 'target' in campaign_fields and 'current_amount' in campaign_fields:
                        campaign_stats['active_campaigns'] = org_campaigns.filter(
                            current_amount__lt=models.F('target'),
                            created_at__gte=start_date
                        ).count()
                        
                        campaign_stats['completed_campaigns'] = org_campaigns.filter(
                            current_amount__gte=models.F('target')
                        ).count()
                        
                        # Pending could be very recent campaigns with no donations yet
                        campaign_stats['pending_campaigns'] = org_campaigns.filter(
                            current_amount=0,
                            created_at__gte=start_date
                        ).count()

                # Average goal achievement
                campaigns_with_targets = org_campaigns.filter(target__gt=0)
                if campaigns_with_targets.exists():
                    avg_achievement = campaigns_with_targets.aggregate(
                        avg=models.Avg(
                            models.Case(
                                models.When(target__gt=0, then=models.F('current_amount') * 100.0 / models.F('target')),
                                default=0,
                                output_field=models.FloatField()
                            )
                        )
                    )['avg'] or 0
                    campaign_stats['avg_goal_achievement'] = round(avg_achievement, 1)

                print(f"Campaign stats calculated successfully: {campaign_stats}")  # Debug log

            except ImportError as e:
                print(f"Campaign model import error: {e}")
                # Return response indicating campaign module is not available
                return Response(
                    {
                        'error': 'Campaign module not available',
                        'details': f'Campaign model could not be imported: {str(e)}',
                        'payment_methods': {
                            'manual_count': manual_payments.count(),
                            'nextpay_count': nextpay_payments.count(),
                            'total_methods': manual_payments.count() + nextpay_payments.count(),
                            'manual_enabled': manual_payments.exists(),
                            'nextpay_enabled': nextpay_payments.exists(),
                            'payment_ready': manual_payments.exists() or nextpay_payments.exists()
                        }
                    },
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
                
            except AttributeError as e:
                print(f"Campaign model attribute error: {e}")
                return Response(
                    {
                        'error': 'Campaign model configuration error',
                        'details': f'Campaign model fields mismatch: {str(e)}',
                        'payment_methods': {
                            'manual_count': manual_payments.count(),
                            'nextpay_count': nextpay_payments.count(),
                            'total_methods': manual_payments.count() + nextpay_payments.count(),
                            'manual_enabled': manual_payments.exists(),
                            'nextpay_enabled': nextpay_payments.exists(),
                            'payment_ready': manual_payments.exists() or nextpay_payments.exists()
                        }
                    },
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
                
            except Exception as e:
                print(f"Campaign data processing error: {e}")
                # Log the error but continue with default values
                pass

            # Prepare final response
            statistics_data = {
                **campaign_stats,
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
            print(f"Statistics endpoint error: {e}")  # Debug log
            import traceback
            traceback.print_exc()  # Print full traceback for debugging
            
            return Response(
                {
                    'error': 'Failed to fetch statistics', 
                    'details': str(e),
                    'type': type(e).__name__
                },
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
            
            # Get recent campaigns
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

            except (ImportError, AttributeError) as e:
                return Response(
                    {
                        'error': 'Campaign data unavailable', 
                        'details': 'Campaign model not found or misconfigured',
                        'campaign_error': str(e)
                    },
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )

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