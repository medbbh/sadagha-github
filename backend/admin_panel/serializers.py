from rest_framework import serializers
from accounts.models import User
from campaign.models import Donation, Campaign, Category
from organizations.models import OrganizationProfile
from volunteers.models import VolunteerProfile
from django.contrib.auth.hashers import make_password
from django.db import models
from django.db.models import Count, Q, Sum, Avg
from django.utils import timezone
from datetime import timedelta

class AdminUserSerializer(serializers.ModelSerializer):
    """Base serializer for user management in admin panel"""
    
    # Computed fields from annotations
    donation_count = serializers.IntegerField(read_only=True)
    total_donated = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    campaign_count = serializers.IntegerField(read_only=True)
    volunteer_invitations = serializers.IntegerField(read_only=True)
    
    # Profile existence flags
    has_organization_profile = serializers.SerializerMethodField()
    has_volunteer_profile = serializers.SerializerMethodField()
    
    # Display fields
    full_name = serializers.SerializerMethodField()
    account_status = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'is_active', 'is_platform_admin', 'date_joined', 'last_login',
            'phone_number', 'account_status',
            # Computed fields
            'donation_count', 'total_donated', 'campaign_count', 'volunteer_invitations',
            'has_organization_profile', 'has_volunteer_profile'
        ]
        read_only_fields = ['id', 'date_joined', 'username']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username
    
    def get_account_status(self, obj):
        if not obj.is_active:
            return 'inactive'
        elif obj.last_login:
            days_since_login = (timezone.now() - obj.last_login).days
            if days_since_login > 30:
                return 'dormant'
            elif days_since_login > 7:
                return 'low_activity'
        return 'active'
    
    def get_has_organization_profile(self, obj):
        return hasattr(obj, 'organization_profile')
    
    def get_has_volunteer_profile(self, obj):
        return hasattr(obj, 'volunteer_profile')

class AdminUserDetailSerializer(AdminUserSerializer):
    """Detailed user serializer with all related data"""
    
    organization_profile = serializers.SerializerMethodField()
    volunteer_profile = serializers.SerializerMethodField()
    recent_donations = serializers.SerializerMethodField()
    recent_campaigns = serializers.SerializerMethodField()
    activity_summary = serializers.SerializerMethodField()
    
    class Meta(AdminUserSerializer.Meta):
        fields = AdminUserSerializer.Meta.fields + [
            'organization_profile', 'volunteer_profile', 
            'recent_donations', 'recent_campaigns', 'activity_summary'
        ]
    
    def get_organization_profile(self, obj):
        if hasattr(obj, 'organization_profile'):
            return {
                'id': obj.organization_profile.id,
                'org_name': obj.organization_profile.org_name,
                'description': obj.organization_profile.description[:100] + '...' if len(obj.organization_profile.description) > 100 else obj.organization_profile.description,
                'is_verified': obj.organization_profile.is_verified,
                'address': obj.organization_profile.address,
                'website': obj.organization_profile.website,
                'created_at': obj.organization_profile.created_at
            }
        return None
    
    def get_volunteer_profile(self, obj):
        if hasattr(obj, 'volunteer_profile'):
            return {
                'id': obj.volunteer_profile.id,
                'phone': obj.volunteer_profile.phone,
                'age': obj.volunteer_profile.age,
                'profession': obj.volunteer_profile.profession,
                'skills': obj.volunteer_profile.get_skills_list()[:3],  # First 3 skills
                'is_active': obj.volunteer_profile.is_active,
                'created_at': obj.volunteer_profile.created_at
            }
        return None
    
    def get_recent_donations(self, obj):
        recent_donations = obj.donations.filter(status='completed').order_by('-created_at')[:3]
        return [{
            'id': d.id,
            'amount': str(d.amount),
            'campaign_name': d.campaign.name,
            'created_at': d.created_at
        } for d in recent_donations]
    
    def get_recent_campaigns(self, obj):
        if obj.role == 'organization':
            recent_campaigns = obj.campaigns.all().order_by('-created_at')[:3]
            return [{
                'id': c.id,
                'name': c.name,
                'target': str(c.target),
                'current_amount': str(c.current_amount),
                'created_at': c.created_at
            } for c in recent_campaigns]
        return []
    
    def get_activity_summary(self, obj):
        
        thirty_days_ago = timezone.now() - timedelta(days=30)
        
        return {
            'donations_last_30_days': obj.donations.filter(
                created_at__gte=thirty_days_ago, 
                status='completed'
            ).count(),
            'campaigns_last_30_days': obj.campaigns.filter(
                created_at__gte=thirty_days_ago
            ).count() if obj.role == 'organization' else 0,
            'last_login': obj.last_login,
            'account_age_days': (timezone.now() - obj.date_joined).days
        }

class UserActivitySerializer(serializers.Serializer):
    """Serializer for user activity logs"""
    activity_type = serializers.CharField()
    description = serializers.CharField()
    timestamp = serializers.DateTimeField()
    metadata = serializers.JSONField()


class AdminOrganizationSerializer(serializers.ModelSerializer):
    """Base serializer for organization management in admin panel"""
    
    # Owner information
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    owner_email = serializers.CharField(source='owner.email', read_only=True)
    owner_full_name = serializers.SerializerMethodField()
    
    # Computed fields from annotations
    campaign_count = serializers.IntegerField(read_only=True)
    total_raised = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total_donors = serializers.IntegerField(read_only=True)
    completed_donations = serializers.IntegerField(read_only=True)
    
    # Status indicators
    verification_status = serializers.SerializerMethodField()
    account_health = serializers.SerializerMethodField()
    
    class Meta:
        model = OrganizationProfile
        fields = [
            'id', 'org_name', 'description', 'address', 'phone_number', 'website',
            'is_verified', 'created_at', 'updated_at',
            # Owner info
            'owner_username', 'owner_email', 'owner_full_name',
            # Computed fields
            'campaign_count', 'total_raised', 'total_donors', 'completed_donations',
           
            # Status indicators
            'verification_status','account_health'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_owner_full_name(self, obj):
        return f"{obj.owner.first_name} {obj.owner.last_name}".strip() or obj.owner.username
    
    def get_verification_status(self, obj):
        if obj.is_verified:
            return 'verified'
        elif obj.document_url:
            return 'pending_review'
        else:
            return 'incomplete'
    
    def get_account_health(self, obj):
        """Determine account health based on various factors"""
        score = 0
        
        # Verification status
        if obj.is_verified:
            score += 30
        elif obj.document_url:
            score += 25
        
        # Profile completeness
        if obj.org_name:
            score += 10
        if obj.description:
            score += 20
        if obj.website:
            score += 5
        if obj.address:
            score += 5
        
        # Activity (if available from annotations)
        campaign_count = getattr(obj, 'campaign_count', 0)
        if campaign_count > 0:
            score += 20
        
        if score >= 80:
            return 'excellent'
        elif score >= 60:
            return 'good'
        elif score >= 40:
            return 'fair'
        else:
            return 'poor'

class AdminOrganizationDetailSerializer(AdminOrganizationSerializer):
    """Detailed organization serializer with all related data"""
    
    recent_campaigns = serializers.SerializerMethodField()
    financial_summary = serializers.SerializerMethodField()
    document_info = serializers.SerializerMethodField()
    
    class Meta(AdminOrganizationSerializer.Meta):
        fields = AdminOrganizationSerializer.Meta.fields + [
            'recent_campaigns', 'financial_summary', 'document_info'
        ]
    
    def get_recent_campaigns(self, obj):
        recent_campaigns = obj.owner.campaigns.order_by('-created_at')[:5]
        return [{
            'id': campaign.id,
            'name': campaign.name,
            'target': str(campaign.target),
            'current_amount': str(campaign.current_amount),
            'number_of_donors': campaign.number_of_donors,
            'success_rate': round((campaign.current_amount / campaign.target * 100) if campaign.target > 0 else 0, 2),
            'created_at': campaign.created_at,
            'featured': campaign.featured
        } for campaign in recent_campaigns]
    
    
    def get_financial_summary(self, obj):
        from django.utils import timezone
        
        campaigns = obj.owner.campaigns.all()
        thirty_days_ago = timezone.now() - timedelta(days=30)
        
        # Recent donations
        recent_donations = Donation.objects.filter(
            campaign__in=campaigns,
            status='completed',
            created_at__gte=thirty_days_ago
        )
        
        return {
            'total_campaigns': campaigns.count(),
            'active_campaigns': campaigns.filter(current_amount__lt=models.F('target')).count(),
            'total_raised_all_time': str(campaigns.aggregate(total=Sum('current_amount'))['total'] or 0),
            'total_donors_all_time': campaigns.aggregate(total=Sum('number_of_donors'))['total'] or 0,
            'donations_last_30_days': recent_donations.count(),
            'amount_raised_last_30_days': str(recent_donations.aggregate(total=Sum('amount'))['total'] or 0),
            'average_donation': str(recent_donations.aggregate(avg=Avg('amount'))['avg'] or 0)
        }
    
    def get_document_info(self, obj):
        if obj.document_url:
            return {
                'has_document': True,
                'document_url': obj.document_url,
                'document_path': obj.document_path,
                'uploaded_at': obj.updated_at  # Assuming document upload updates the record
            }
        return {
            'has_document': False,
            'document_url': None,
            'document_path': None,
            'uploaded_at': None
        }

class OrganizationVerificationSerializer(serializers.Serializer):
    """Serializer for organization verification actions"""
    notes = serializers.CharField(required=False, allow_blank=True, max_length=1000)
    reason = serializers.CharField(required=False, allow_blank=True, max_length=1000)


class AdminCampaignSerializer(serializers.ModelSerializer):
    """Base serializer for campaign management in admin panel"""
    
    # Owner information
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    owner_email = serializers.CharField(source='owner.email', read_only=True)
    organization_name = serializers.SerializerMethodField()
    
    # Category information
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    # Computed fields from annotations
    donation_count = serializers.IntegerField(read_only=True)
    pending_donations = serializers.IntegerField(read_only=True)
    failed_donations = serializers.IntegerField(read_only=True)
    success_rate = serializers.FloatField(read_only=True)
    avg_donation = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    file_count = serializers.IntegerField(read_only=True)
    days_active = serializers.SerializerMethodField(read_only=True)
    
    # Status indicators
    campaign_status = serializers.SerializerMethodField()
    performance_rating = serializers.SerializerMethodField()
    has_live_stream = serializers.SerializerMethodField()
    
    class Meta:
        model = Campaign
        fields = [
            'id', 'name', 'description', 'target', 'current_amount', 'number_of_donors',
            'featured', 'created_at', 'updated_at',
            # Owner info
            'owner_username', 'owner_email', 'organization_name',
            # Category info
            'category', 'category_name',
            # Computed fields
            'donation_count', 'pending_donations', 'failed_donations', 'success_rate',
            'avg_donation', 'file_count', 'days_active',
            # Status indicators
            'campaign_status', 'performance_rating', 'has_live_stream',
            # Facebook Live fields
            'facebook_live_url', 'live_status', 'live_viewer_count'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'current_amount', 'number_of_donors']
    
    def get_organization_name(self, obj):
        if hasattr(obj.owner, 'organization_profile') and obj.owner.organization_profile.org_name:
            return obj.owner.organization_profile.org_name
        return f"{obj.owner.first_name} {obj.owner.last_name}".strip() or obj.owner.username
    
    def get_campaign_status(self, obj):
        if obj.current_amount >= obj.target:
            return 'completed'
        elif obj.current_amount > 0:
            return 'active'
        else:
            return 'new'
    
    def get_days_active(self, obj):
        value = getattr(obj, 'days_active', None)
        if isinstance(value, timedelta):
            return value.days
        return int(value or 0)

    
    def get_performance_rating(self, obj):
        """Rate campaign performance based on various factors"""
        success_rate = getattr(obj, 'success_rate', 0) or 0
        donation_count = getattr(obj, 'donation_count', 0) or 0
        # Convert timedelta to int if needed
        days_active = getattr(obj, 'days_active', 0)
        if isinstance(days_active, timedelta):
            days_active = days_active.days
        else:
            days_active = int(days_active or 0)
        
        score = 0
        
        # Success rate scoring
        if success_rate >= 75:
            score += 40
        elif success_rate >= 50:
            score += 30
        elif success_rate >= 25:
            score += 20
        elif success_rate > 0:
            score += 10
        
        # Activity scoring
        if days_active > 0:
            donations_per_day = donation_count / days_active
            if donations_per_day >= 2:
                score += 30
            elif donations_per_day >= 1:
                score += 20
            elif donations_per_day >= 0.5:
                score += 10
        
        # Engagement scoring
        if donation_count >= 50:
            score += 30
        elif donation_count >= 20:
            score += 20
        elif donation_count >= 5:
            score += 10
        
        if score >= 80:
            return 'excellent'
        elif score >= 60:
            return 'good'
        elif score >= 40:
            return 'fair'
        else:
            return 'poor'
    
    def get_has_live_stream(self, obj):
        return bool(obj.facebook_live_url)

class AdminCampaignDetailSerializer(AdminCampaignSerializer):
    """Detailed campaign serializer with all related data"""
    
    recent_donations = serializers.SerializerMethodField()
    file_details = serializers.SerializerMethodField()
    donation_trends = serializers.SerializerMethodField()
    owner_details = serializers.SerializerMethodField()
    
    class Meta(AdminCampaignSerializer.Meta):
        fields = AdminCampaignSerializer.Meta.fields + [
            'recent_donations', 'file_details', 'donation_trends', 'owner_details'
        ]
    
    def get_recent_donations(self, obj):
        recent = obj.donations.filter(status='completed').order_by('-created_at')[:5]
        return [{
            'id': d.id,
            'amount': str(d.amount),
            'donor_name': d.donor_display_name,
            'created_at': d.created_at,
            'is_anonymous': d.is_anonymous
        } for d in recent]
    
    def get_file_details(self, obj):
        files = obj.files.all().order_by('-created_at')
        return [{
            'id': f.id,
            'name': f.name,
            'url': f.url,
            'created_at': f.created_at
        } for f in files]
    
    def get_donation_trends(self, obj):
        from django.utils import timezone
        
        now = timezone.now()
        trends = {}
        
        for days in [1, 7, 30]:
            cutoff = now - timedelta(days=days)
            donations = obj.donations.filter(
                status='completed',
                created_at__gte=cutoff
            )
            trends[f'last_{days}_days'] = {
                'count': donations.count(),
                'total': str(donations.aggregate(total=Sum('amount'))['total'] or 0)
            }
        
        return trends
    
    def get_owner_details(self, obj):
        owner_data = {
            'id': obj.owner.id,
            'username': obj.owner.username,
            'email': obj.owner.email,
            'role': obj.owner.role,
            'is_active': obj.owner.is_active
        }
        
        if hasattr(obj.owner, 'organization_profile'):
            org = obj.owner.organization_profile
            owner_data['organization'] = {
                'org_name': org.org_name,
                'is_verified': org.is_verified,
                'address': org.address,
                'website': org.website,
                'total_campaigns': obj.owner.campaigns.count()
            }
        
        return owner_data

class CampaignModerationSerializer(serializers.Serializer):
    """Serializer for campaign moderation actions"""
    action = serializers.ChoiceField(choices=['approve', 'flag', 'suspend'])
    reason = serializers.CharField(required=False, allow_blank=True, max_length=1000)

class AdminCategorySerializer(serializers.ModelSerializer):
    """Admin category serializer with statistics"""
    
    campaign_count = serializers.IntegerField(read_only=True)
    active_campaigns = serializers.IntegerField(read_only=True)
    total_raised = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    
    class Meta:
        model = Category
        fields = [
            'id', 'name', 'description', 'created_at', 'updated_at',
            'campaign_count', 'active_campaigns', 'total_raised'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class AdminDonationSerializer(serializers.ModelSerializer):
    """Base serializer for donation monitoring in admin panel"""
    
    # Donor information
    donor_username = serializers.CharField(source='donor.username', read_only=True)
    donor_display = serializers.SerializerMethodField()
    
    # Campaign information
    campaign_name = serializers.CharField(source='campaign.name', read_only=True)
    campaign_owner = serializers.SerializerMethodField()
    
    # Computed fields from annotations
    days_since_created = serializers.SerializerMethodField(read_only=True)
    processing_time_seconds = serializers.SerializerMethodField()
    
    # Status indicators
    transaction_status = serializers.SerializerMethodField()
    risk_level = serializers.SerializerMethodField()
    
    class Meta:
        model = Donation
        fields = [
            'id', 'amount', 'status',
            'created_at', 'completed_at', 'is_anonymous', 'message',
            # Payment tracking
            'payment_session_id',
            # Donor info
            'donor_username', 'donor_name', 'donor_display',
            # Campaign info
            'campaign_name', 'campaign_owner',
            # Computed fields
            'days_since_created', 'processing_time_seconds',
            # Status indicators
            'transaction_status', 'risk_level'
        ]
        read_only_fields = ['id', 'created_at', 'completed_at']
    
    def get_donor_display(self, obj):
        if obj.is_anonymous:
            return "Anonymous Donor"
        if obj.donor:
            return f"{obj.donor.first_name} {obj.donor.last_name}".strip() or obj.donor.username
        return obj.donor_name or "Unknown"
    
    def get_campaign_owner(self, obj):
        if hasattr(obj.campaign.owner, 'organization_profile') and obj.campaign.owner.organization_profile.org_name:
            return obj.campaign.owner.organization_profile.org_name
        return f"{obj.campaign.owner.first_name} {obj.campaign.owner.last_name}".strip() or obj.campaign.owner.username
    
    def get_processing_time_seconds(self, obj):
        if obj.completed_at and obj.created_at:
            delta = obj.completed_at - obj.created_at
            return int(delta.total_seconds())
        return None
    
    def get_transaction_status(self, obj):
        if obj.status == 'completed':
            processing_time = self.get_processing_time_seconds(obj)
            if processing_time and processing_time < 60:  # Less than 1 minute
                return 'fast_completion'
            elif processing_time and processing_time > 3600:  # More than 1 hour
                return 'slow_completion'
            return 'normal_completion'
        elif obj.status == 'pending':
            hours_pending = (timezone.now() - obj.created_at).total_seconds() / 3600
            if hours_pending > 24:
                return 'stuck_pending'
            return 'normal_pending'
        elif obj.status == 'failed':
            return 'failed_transaction'
        return obj.status
    
    def get_risk_level(self, obj):
        """Basic risk assessment"""
        risk_score = 0
        
        # Large amount
        if obj.amount > 5000:
            risk_score += 30
        elif obj.amount > 1000:
            risk_score += 10
        
        # Anonymous donation
        if obj.is_anonymous:
            risk_score += 15
        
        # Very fast processing
        processing_time = self.get_processing_time_seconds(obj)
        if processing_time and processing_time < 30:
            risk_score += 20
        
        # No registered donor
        if not obj.donor:
            risk_score += 25
        
        if risk_score >= 50:
            return 'high'
        elif risk_score >= 30:
            return 'medium'
        else:
            return 'low'
        
    def get_days_since_created(self, obj):
        delta = getattr(obj, 'days_since_created', None)
        if isinstance(delta, timedelta):
            return delta.days
        return int(delta or 0)

class AdminDonationDetailSerializer(AdminDonationSerializer):
    """Detailed donation serializer with all related data"""
    donor_details = serializers.SerializerMethodField()
    campaign_details = serializers.SerializerMethodField()
    transaction_timeline = serializers.SerializerMethodField()
    
    class Meta(AdminDonationSerializer.Meta):
        fields = AdminDonationSerializer.Meta.fields + [
            'donor_details', 
            'campaign_details', 'transaction_timeline'
        ]
    
    
    def get_donor_details(self, obj):
        if obj.donor:
            # Get donor's donation history
            other_donations = Donation.objects.filter(
                donor=obj.donor,
                status='completed'
            ).exclude(id=obj.id)
            
            return {
                'donor_id': obj.donor.id,
                'username': obj.donor.username,
                'full_name': f"{obj.donor.first_name} {obj.donor.last_name}".strip(),
                'role': obj.donor.role,
                'is_active': obj.donor.is_active,
                'join_date': obj.donor.date_joined,
                'total_donations': other_donations.count(),
                'total_donated': str(other_donations.aggregate(total=Sum('amount'))['total'] or 0),
                'first_donation_date': other_donations.order_by('created_at').first().created_at if other_donations.exists() else None
            }
        return {
            'donor_name': obj.donor_name,
            'is_guest_donor': True
        }
    
    def get_campaign_details(self, obj):
        campaign = obj.campaign
        return {
            'campaign_id': campaign.id,
            'name': campaign.name,
            'description': campaign.description[:200] + '...' if len(campaign.description) > 200 else campaign.description,
            'target': str(campaign.target),
            'current_amount': str(campaign.current_amount),
            'number_of_donors': campaign.number_of_donors,
            'success_rate': round((campaign.current_amount / campaign.target * 100) if campaign.target > 0 else 0, 2),
            'featured': campaign.featured,
            'created_at': campaign.created_at,
            'owner_info': {
                'username': campaign.owner.username,
                'organization_name': campaign.owner.organization_profile.org_name if hasattr(campaign.owner, 'organization_profile') else None,
                'is_verified': campaign.owner.organization_profile.is_verified if hasattr(campaign.owner, 'organization_profile') else False
            }
        }
    
    def get_transaction_timeline(self, obj):
        timeline = [
            {
                'event': 'Transaction Created',
                'timestamp': obj.created_at,
                'status': 'pending'
            }
        ]
        
        if obj.completed_at:
            timeline.append({
                'event': 'Transaction Completed',
                'timestamp': obj.completed_at,
                'status': 'completed'
            })

        
        return sorted(timeline, key=lambda x: x['timestamp'])

class PaymentAnalyticsSerializer(serializers.Serializer):
    """Serializer for payment analytics data"""
    transaction_count = serializers.IntegerField()
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    average_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    success_rate = serializers.FloatField()

class RevenueAnalyticsSerializer(serializers.Serializer):
    """Serializer for revenue analytics data"""
    date = serializers.DateField()
    total_donations = serializers.IntegerField()
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    platform_fees = serializers.DecimalField(max_digits=10, decimal_places=2)
    net_revenue = serializers.DecimalField(max_digits=10, decimal_places=2)


