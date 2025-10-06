# organizations/views.py - Updated Payment System

from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import OrganizationProfile
from campaign.models import Campaign, Donation
from .utils.supabase_storage import upload_organization_image, delete_organization_image

from .serializers import (
    OrganizationProfileSerializer, 
    PublicOrganizationProfileSerializer,
)
from campaign.serializers import CampaignSerializer, DonationSerializer
from campaign.services.payment_service import PaymentServiceManager

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
        base_queryset = self.queryset
        
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

    @action(detail=True, methods=['post'])
    def upload_profile_image(self, request, pk=None):
        """Upload profile image"""
        organization = self.get_object()
        
        if 'image' not in request.FILES:
            return Response({'error': 'No image file provided'}, status=400)
        
        image_file = request.FILES['image']
        
        # Validate image file
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        if image_file.content_type not in allowed_types:
            return Response({'error': 'Invalid file type. Please upload JPEG, PNG, or WebP images only.'}, status=400)
        
        # Validate file size (5MB max)
        max_size = 5 * 1024 * 1024  # 5MB
        if image_file.size > max_size:
            return Response({'error': 'File size too large. Maximum size is 5MB.'}, status=400)
        
        # Delete old image if exists
        if organization.profile_image_path:
            delete_organization_image(organization.profile_image_path)
        
        # Upload new image
        url, path = upload_organization_image(image_file, 'profile', organization.id)
        
        if url and path:
            organization.profile_image_url = url
            organization.profile_image_path = path
            organization.save()
            return Response({
                'profile_image_url': url,
                'message': 'Profile image uploaded successfully'
            })
        else:
            return Response({'error': 'Failed to upload image'}, status=500)

    @action(detail=True, methods=['post'])
    def upload_cover_image(self, request, pk=None):
        """Upload cover image"""
        organization = self.get_object()
        
        if 'image' not in request.FILES:
            return Response({'error': 'No image file provided'}, status=400)
        
        image_file = request.FILES['image']
        
        # Validate image file
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        if image_file.content_type not in allowed_types:
            return Response({'error': 'Invalid file type. Please upload JPEG, PNG, or WebP images only.'}, status=400)
        
        # Validate file size (5MB max)
        max_size = 5 * 1024 * 1024  # 5MB
        if image_file.size > max_size:
            return Response({'error': 'File size too large. Maximum size is 5MB.'}, status=400)
        
        # Delete old image if exists
        if organization.cover_image_path:
            delete_organization_image(organization.cover_image_path)
        
        # Upload new image
        url, path = upload_organization_image(image_file, 'cover', organization.id)
        
        if url and path:
            organization.cover_image_url = url
            organization.cover_image_path = path
            organization.save()
            return Response({
                'cover_image_url': url,
                'message': 'Cover image uploaded successfully'
            })
        else:
            return Response({'error': 'Failed to upload image'}, status=500)

    @action(detail=True, methods=['delete'])
    def delete_profile_image(self, request, pk=None):
        """Delete profile image"""
        organization = self.get_object()
        
        if not organization.profile_image_path:
            return Response({'error': 'No profile image to delete'}, status=400)
        
        if delete_organization_image(organization.profile_image_path):
            organization.profile_image_url = ''
            organization.profile_image_path = ''
            organization.save()
            return Response({'message': 'Profile image deleted successfully'})
        else:
            return Response({'error': 'Failed to delete profile image'}, status=500)

    @action(detail=True, methods=['delete'])
    def delete_cover_image(self, request, pk=None):
        """Delete cover image"""
        organization = self.get_object()
        
        if not organization.cover_image_path:
            return Response({'error': 'No cover image to delete'}, status=400)
        
        if delete_organization_image(organization.cover_image_path):
            organization.cover_image_url = ''
            organization.cover_image_path = ''
            organization.save()
            return Response({'message': 'Cover image deleted successfully'})
        else:
            return Response({'error': 'Failed to delete cover image'}, status=500)

    @action(detail=True, methods=['get'])
    def payment_methods(self, request, pk=None):
        """Get payment configuration for this organization"""
        organization = self.get_object()

        # Add debugging
        print(f"Organization payment_enabled: {organization.payment_enabled}")
        print(f"Organization nextremitly_api_key exists: {bool(organization.nextremitly_api_key)}")
        print(f"Organization is_verified: {organization.is_verified}")
        print(f"can_receive_payments result: {organization.can_receive_payments()}")

        # Check if NextRemitly payment is configured
        payment_configured = organization.can_receive_payments() 
        
        payment_data = {
            'nextremitly_configured': bool(organization.nextremitly_api_key),
            'payment_enabled': organization.payment_enabled,
            'can_receive_payments': payment_configured,
            'setup_required': not payment_configured,
            'api_key_set': bool(organization.nextremitly_api_key),
            'status': 'ready' if payment_configured else 'setup_required'
        }
        
        return Response(payment_data)

    @action(detail=True, methods=['post'])
    def setup_nextremitly(self, request, pk=None):
        """Setup NextRemitly payments for organization"""
        organization = self.get_object()
        
        # Check permissions (organization owner)
        if organization.owner != request.user:
            return Response({
                'error': 'Permission denied. Only organization owner can setup payments.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        api_key = request.data.get('nextremitly_api_key')
        if not api_key:
            return Response({
                'error': 'nextremitly_api_key is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate API key by testing connection
        organization.nextremitly_api_key = api_key
        validation = PaymentServiceManager.validate_organization_api_key(organization)
        
        if validation['valid']:
            organization.payment_enabled = True
            organization.save()
            
            return Response({
                'success': True,
                'message': 'NextRemitly payment integration setup successfully',
                'can_receive_payments': organization.can_receive_payments(),
                'status': 'ready'
            })
        else:
            # Don't save invalid API key
            organization.nextremitly_api_key = ''
            return Response({
                'error': f"Invalid API key: {validation['error']}"
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def test_payment_connection(self, request, pk=None):
        """Test NextRemitly connection for organization"""
        organization = self.get_object()
        
        if not organization.nextremitly_api_key:
            return Response({
                'valid': False,
                'message': 'No API key configured',
                'can_receive_payments': False
            })
        
        validation = PaymentServiceManager.validate_organization_api_key(organization)
        
        return Response({
            'valid': validation['valid'],
            'message': validation.get('message', validation.get('error')),
            'can_receive_payments': organization.can_receive_payments()
        })

    @action(detail=True, methods=['post'])
    def disable_payments(self, request, pk=None):
        """Disable payment processing for organization"""
        organization = self.get_object()
        
        # Check permissions
        if organization.owner != request.user:
            return Response({
                'error': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        organization.payment_enabled = False
        organization.save()
        
        return Response({
            'success': True,
            'message': 'Payment processing disabled',
            'can_receive_payments': organization.can_receive_payments()
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
        top_donors = period_donations.values('donor_name', 'donor_id').annotate(
            total_donated=Sum('amount'),
            donation_count=Count('id')
        ).order_by('-total_donated')[:5]

        # Campaign status breakdown for pie chart
        campaign_status = {
            'active': campaigns.filter(current_amount__lt=F('target')).count(),
            'completed': campaigns.filter(current_amount__gte=F('target')).count(),
            'new': campaigns.filter(created_at__gte=start_date).count()
        }

        # Payment method breakdown (simplified for NextRemitly only)
        payment_methods = [
            {
                'name': 'NextRemitly',
                'count': period_donations.count(),
                'total_amount': float(period_raised),
                'color': '#4F46E5'
            }
        ]

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
                'unique_donors': period_donations.values('donor_id').distinct().count(),
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
            'payment_methods': payment_methods
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


class OrganizationDashboardViewSet(viewsets.ModelViewSet):
    """Dashboard viewset with statistics and analytics for organizations"""
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

            # Initialize campaign stats
            campaign_stats = {
                'total_campaigns': 0,
                'total_raised': 0,
                'total_donors': 0,
                'recent_campaigns': 0,
                'recent_raised': 0,
                'success_rate': 0,
                'active_campaigns': 0,
                'completed_campaigns': 0,
                'avg_goal_achievement': 0
            }
            
            # Get campaign statistics
            try:
                org_campaigns = Campaign.objects.filter(owner=profile.owner)
                
                # Basic stats
                campaign_stats['total_campaigns'] = org_campaigns.count()
                campaign_stats['total_raised'] = float(org_campaigns.aggregate(
                    total=models.Sum('current_amount')
                )['total'] or 0)
                
                # Get total donors from donations
                total_donors = Donation.objects.filter(
                    campaign__owner=profile.owner,
                    status='completed'
                ).values('donor_id').distinct().count()
                campaign_stats['total_donors'] = total_donors
                
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
                    campaign_stats['completed_campaigns'] = completed_campaigns

                # Active campaigns (haven't reached target)
                campaign_stats['active_campaigns'] = org_campaigns.filter(
                    current_amount__lt=models.F('target')
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

            except Exception as e:
                print(f"Campaign stats error: {e}")

            # Payment status
            payment_status = {
                'nextremitly_configured': bool(profile.nextremitly_api_key),
                'payment_enabled': profile.payment_enabled,
                'can_receive_payments': profile.can_receive_payments(),
                'payment_ready': profile.can_receive_payments()
            }

            # Prepare final response
            statistics_data = {
                **campaign_stats,
                'period': period,
                'payment_status': payment_status,
                'setup_status': {
                    'profile_complete': bool(profile.org_name and profile.description),
                    'payment_configured': profile.can_receive_payments(),
                    'verified': profile.is_verified,
                    'ready_for_campaigns': bool(
                        profile.org_name and profile.can_receive_payments()
                    )
                }
            }

            return Response(statistics_data)

        except Exception as e:
            print(f"Statistics endpoint error: {e}")
            import traceback
            traceback.print_exc()
            
            return Response(
                {
                    'error': 'Failed to fetch statistics', 
                    'details': str(e),
                    'type': type(e).__name__
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    # recent activities - donations and campaigns in last 7 days
    @action(detail=False, methods=['get'])
    def recent_activities(self, request):
        """Get recent activities (donations and campaigns) for dashboard"""
        try:
            if request.user.role != 'organization':
                return Response(
                    {'error': 'Only organizations can access recent activities'},
                    status=status.HTTP_403_FORBIDDEN
                )

            profile, created = OrganizationProfile.objects.get_or_create(
                owner=request.user,
                defaults={'org_name': f"{request.user.first_name or request.user.username}'s Organization"}
            )
            
            seven_days_ago = timezone.now() - timedelta(days=30)
            
            # Recent donations
            recent_donations = Donation.objects.filter(
                campaign__owner=profile.owner,
                status='completed',
                created_at__gte=seven_days_ago
            ).order_by('-created_at')[:10]
            
            donation_data = DonationSerializer(recent_donations, many=True).data
            
            # Recent campaigns
            recent_campaigns = Campaign.objects.filter(
                owner=profile.owner,
                created_at__gte=seven_days_ago
            ).order_by('-created_at')[:5]
            
            campaign_data = CampaignSerializer(recent_campaigns, many=True).data
            
            activities = {
                'recent_donations': donation_data,
                'recent_campaigns': campaign_data
            }
            
            return Response(activities)

        except Exception as e:
            return Response(
                {'error': 'Failed to fetch recent activities', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )



    @action(detail=False, methods=['get'])
    def payment_summary(self, request):
        """Get payment configuration summary for dashboard"""
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
            
            # Check NextRemitly configuration
            recommendations = []
            
            if not profile.can_receive_payments():
                if not profile.nextremitly_api_key:
                    recommendations.append({
                        'type': 'warning',
                        'title': 'Setup NextRemitly Payment',
                        'message': 'Configure your NextRemitly API key to start receiving donations',
                        'action': 'setup_nextremitly'
                    })
                elif not profile.payment_enabled:
                    recommendations.append({
                        'type': 'info',
                        'title': 'Enable Payments',
                        'message': 'Your NextRemitly is configured but payments are disabled',
                        'action': 'enable_payments'
                    })
            else:
                recommendations.append({
                    'type': 'success',
                    'title': 'Payment Ready',
                    'message': 'Your organization can now receive donations via NextRemitly',
                    'action': 'none'
                })

            payment_summary = {
                'nextremitly': {
                    'configured': bool(profile.nextremitly_api_key),
                    'enabled': profile.payment_enabled,
                    'status': 'ready' if profile.can_receive_payments() else 'setup_required'
                },
                'summary': {
                    'can_receive_payments': profile.can_receive_payments(),
                    'payment_methods_count': 1 if profile.can_receive_payments() else 0,
                    'setup_complete': profile.can_receive_payments()
                },
                'recommendations': recommendations
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

            except Exception as e:
                return Response(
                    {
                        'error': 'Campaign data unavailable', 
                        'details': 'Campaign model not found or misconfigured',
                        'campaign_error': str(e)
                    },
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )

            # Payment summary
            payment_configured = profile.can_receive_payments()

            overview_data = {
                'organization': OrganizationProfileSerializer(profile).data,
                'recent_campaigns': campaign_data,
                'payment_summary': {
                    'nextremitly_configured': bool(profile.nextremitly_api_key),
                    'payment_enabled': profile.payment_enabled,
                    'can_receive_payments': payment_configured,
                    'setup_required': not payment_configured
                },
                'quick_stats': {
                    'profile_complete': bool(profile.org_name and profile.description),
                    'verified': profile.is_verified,
                    'can_create_campaigns': payment_configured
                }
            }

            return Response(overview_data)

        except Exception as e:
            return Response(
                {'error': 'Failed to fetch dashboard overview', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PublicOrganizationViewSet(viewsets.ReadOnlyModelViewSet):
    """Public endpoint for viewing organizations and their campaigns"""
    queryset = OrganizationProfile.objects.filter(is_verified=True)
    serializer_class = PublicOrganizationProfileSerializer
    permission_classes = [AllowAny]
    pagination_class = None

    def retrieve(self, request, pk=None):
        organization = self.get_object()
        serializer = self.get_serializer(organization)
        
        # Get organization's active campaigns
        campaigns = Campaign.objects.filter(
            owner=organization.owner,
            current_amount__lt=models.F('target')  # Only active campaigns
        ).order_by('-created_at')[:10]
        
        campaign_data = CampaignSerializer(campaigns, many=True).data
        
        return Response({
            'organization': serializer.data,
            'campaigns': campaign_data,
            'payment_info': {
                'can_receive_donations': organization.can_receive_payments(),
                'payment_method': 'NextRemitly' if organization.can_receive_payments() else None
            }
        })