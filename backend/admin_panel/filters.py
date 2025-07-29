import django_filters
from accounts.models import User
from django.db.models import Q, F
from campaign.models import Campaign, Category, Donation
from django.utils import timezone
from datetime import timedelta
from organizations.models import OrganizationProfile

class CampaignFilter(django_filters.FilterSet):
    """Filter set for campaign management"""
    
    # Basic filters
    category = django_filters.ModelChoiceFilter(queryset=Category.objects.all())
    featured = django_filters.BooleanFilter()
    
    # Owner filters
    owner_role = django_filters.ChoiceFilter(
        field_name='owner__role',
        choices=[('user', 'User'), ('organization', 'Organization')]
    )
    is_verified_org = django_filters.BooleanFilter(method='filter_verified_organization')
    
    # Date filters
    created_after = django_filters.DateFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateFilter(field_name='created_at', lookup_expr='lte')
    
    # Financial filters
    min_target = django_filters.NumberFilter(field_name='target', lookup_expr='gte')
    max_target = django_filters.NumberFilter(field_name='target', lookup_expr='lte')
    min_raised = django_filters.NumberFilter(field_name='current_amount', lookup_expr='gte')
    max_raised = django_filters.NumberFilter(field_name='current_amount', lookup_expr='lte')
    min_donors = django_filters.NumberFilter(field_name='number_of_donors', lookup_expr='gte')
    
    # Performance filters
    success_rate_min = django_filters.NumberFilter(field_name='success_rate', lookup_expr='gte')
    success_rate_max = django_filters.NumberFilter(field_name='success_rate', lookup_expr='lte')
    min_donations = django_filters.NumberFilter(field_name='donation_count', lookup_expr='gte')
    
    # Status filters
    campaign_status = django_filters.ChoiceFilter(
        choices=[
            ('new', 'New (No donations)'),
            ('active', 'Active (Has donations, not completed)'),
            ('completed', 'Completed (Target reached)')
        ],
        method='filter_campaign_status'
    )
    
    # Content filters
    has_files = django_filters.BooleanFilter(method='filter_has_files')
    has_live_stream = django_filters.BooleanFilter(method='filter_has_live_stream')
    
    # Time-based filters
    trending = django_filters.BooleanFilter(method='filter_trending')
    recent_activity = django_filters.NumberFilter(method='filter_recent_activity')
    
    class Meta:
        model = Campaign
        fields = ['category', 'featured', 'owner_role']
    
    def filter_verified_organization(self, queryset, name, value):
        if value:
            return queryset.filter(owner__organization_profile__is_verified=True)
        return queryset.filter(
            Q(owner__organization_profile__is_verified=False) |
            Q(owner__organization_profile__isnull=True)
        )
    
    def filter_campaign_status(self, queryset, name, value):
        if value == 'new':
            return queryset.filter(current_amount=0)
        elif value == 'active':
            return queryset.filter(current_amount__gt=0, current_amount__lt=F('target'))
        elif value == 'completed':
            return queryset.filter(current_amount__gte=F('target'))
        return queryset
    
    def filter_has_files(self, queryset, name, value):
        if value:
            return queryset.filter(files__isnull=False).distinct()
        return queryset.filter(files__isnull=True)
    
    def filter_has_live_stream(self, queryset, name, value):
        if value:
            return queryset.exclude(facebook_live_url='')
        return queryset.filter(facebook_live_url='')
    
    def filter_trending(self, queryset, name, value):
        if value:
            # Campaigns with recent donation activity
            recent_cutoff = timezone.now() - timedelta(days=3)
            return queryset.filter(
                donations__created_at__gte=recent_cutoff,
                donations__status='completed'
            ).distinct()
        return queryset
    
    def filter_recent_activity(self, queryset, name, value):
        # Filter by campaigns with activity in last N days
        try:
            days = int(value)
            cutoff = timezone.now() - timedelta(days=days)
            return queryset.filter(
                donations__created_at__gte=cutoff,
                donations__status='completed'
            ).distinct()
        except (ValueError, TypeError):
            return queryset


class OrganizationFilter(django_filters.FilterSet):
    """Filter set for organization management"""
    
    is_verified = django_filters.BooleanFilter()
    
    # Date filters
    created_after = django_filters.DateFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateFilter(field_name='created_at', lookup_expr='lte')
    updated_after = django_filters.DateFilter(field_name='updated_at', lookup_expr='gte')
    updated_before = django_filters.DateFilter(field_name='updated_at', lookup_expr='lte')
    
    # Document filters
    has_documents = django_filters.BooleanFilter(method='filter_has_documents')
    
    # Activity filters
    min_campaigns = django_filters.NumberFilter(field_name='campaign_count', lookup_expr='gte')
    min_raised = django_filters.NumberFilter(field_name='total_raised', lookup_expr='gte')
    
    # Payment method filters
    has_payment_methods = django_filters.BooleanFilter(method='filter_has_payment_methods')
    
    # Health status
    verification_status = django_filters.ChoiceFilter(
        choices=[
            ('verified', 'Verified'),
            ('pending_review', 'Pending Review'),
            ('incomplete', 'Incomplete')
        ],
        method='filter_verification_status'
    )
    
    class Meta:
        model = OrganizationProfile
        fields = ['is_verified']
    
    def filter_has_documents(self, queryset, name, value):
        if value:
            return queryset.exclude(document_url='')
        return queryset.filter(document_url='')
    
    def filter_has_payment_methods(self, queryset, name, value):
        if value:
            return queryset.filter(
                Q(manual_payments__is_active=True) | 
                Q(nextpay_payments__is_active=True)
            ).distinct()
        return queryset.exclude(
            Q(manual_payments__is_active=True) | 
            Q(nextpay_payments__is_active=True)
        )
    
    def filter_verification_status(self, queryset, name, value):
        if value == 'verified':
            return queryset.filter(is_verified=True)
        elif value == 'pending_review':
            return queryset.filter(is_verified=False).exclude(document_url='')
        elif value == 'incomplete':
            return queryset.filter(is_verified=False, document_url='')
        return queryset
    
class UserFilter(django_filters.FilterSet):
    """Filter set for user management"""
    
    role = django_filters.ChoiceFilter(choices=User.ROLE_CHOICES)
    is_active = django_filters.BooleanFilter()
    is_platform_admin = django_filters.BooleanFilter()
    
    # Date filters
    date_joined_after = django_filters.DateFilter(field_name='date_joined', lookup_expr='gte')
    date_joined_before = django_filters.DateFilter(field_name='date_joined', lookup_expr='lte')
    last_login_after = django_filters.DateFilter(field_name='last_login', lookup_expr='gte')
    last_login_before = django_filters.DateFilter(field_name='last_login', lookup_expr='lte')
    
    # Profile filters
    has_organization_profile = django_filters.BooleanFilter(method='filter_organization_profile')
    has_volunteer_profile = django_filters.BooleanFilter(method='filter_volunteer_profile')
    is_verified_organization = django_filters.BooleanFilter(method='filter_verified_organization')
    
    # Activity filters
    min_donations = django_filters.NumberFilter(field_name='donation_count', lookup_expr='gte')
    min_campaigns = django_filters.NumberFilter(field_name='campaign_count', lookup_expr='gte')
    
    # Search across multiple fields
    search = django_filters.CharFilter(method='filter_search')
    
    class Meta:
        model = User
        fields = ['role', 'is_active', 'is_platform_admin']
    
    def filter_organization_profile(self, queryset, name, value):
        if value:
            return queryset.filter(organization_profile__isnull=False)
        return queryset.filter(organization_profile__isnull=True)
    
    def filter_volunteer_profile(self, queryset, name, value):
        if value:
            return queryset.filter(volunteer_profile__isnull=False)
        return queryset.filter(volunteer_profile__isnull=True)
    
    def filter_verified_organization(self, queryset, name, value):
        if value:
            return queryset.filter(organization_profile__is_verified=True)
        return queryset.filter(
            Q(organization_profile__is_verified=False) | 
            Q(organization_profile__isnull=True)
        )
    
    def filter_search(self, queryset, name, value):
        return queryset.filter(
            Q(username__icontains=value) |
            Q(email__icontains=value) |
            Q(first_name__icontains=value) |
            Q(last_name__icontains=value) |
            Q(organization_profile__org_name__icontains=value)
        ).distinct()
    

class DonationFilter(django_filters.FilterSet):
    """Filter set for donation management"""
    
    # Status filters
    status = django_filters.ChoiceFilter(choices=Donation.STATUS_CHOICES)
    
    # Amount filters
    min_amount = django_filters.NumberFilter(field_name='amount', lookup_expr='gte')
    max_amount = django_filters.NumberFilter(field_name='amount', lookup_expr='lte')
    
    # Date filters
    created_after = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    completed_after = django_filters.DateTimeFilter(field_name='completed_at', lookup_expr='gte')
    completed_before = django_filters.DateTimeFilter(field_name='completed_at', lookup_expr='lte')
    
    # Payment method filters
    payment_method = django_filters.CharFilter(lookup_expr='icontains')
    currency = django_filters.CharFilter()
    
    # Donor filters
    is_anonymous = django_filters.BooleanFilter()
    has_registered_donor = django_filters.BooleanFilter(method='filter_registered_donor')
    
    # Campaign filters
    campaign_featured = django_filters.BooleanFilter(field_name='campaign__featured')
    campaign_category = django_filters.NumberFilter(field_name='campaign__category')
    verified_organization = django_filters.BooleanFilter(method='filter_verified_org')
    
    # Risk filters
    large_donation = django_filters.BooleanFilter(method='filter_large_donation')
    recent_activity = django_filters.NumberFilter(method='filter_recent_activity')
    
    # Processing time filters
    fast_processing = django_filters.BooleanFilter(method='filter_fast_processing')
    slow_processing = django_filters.BooleanFilter(method='filter_slow_processing')
    
    class Meta:
        model = Donation
        fields = ['status', 'currency', 'is_anonymous']
    
    def filter_registered_donor(self, queryset, name, value):
        if value:
            return queryset.filter(donor__isnull=False)
        return queryset.filter(donor__isnull=True)
    
    def filter_verified_org(self, queryset, name, value):
        if value:
            return queryset.filter(campaign__owner__organization_profile__is_verified=True)
        return queryset.filter(
            Q(campaign__owner__organization_profile__is_verified=False) |
            Q(campaign__owner__organization_profile__isnull=True)
        )
    
    def filter_large_donation(self, queryset, name, value):
        if value:
            return queryset.filter(amount__gte=1000)  # Donations >= 1000 MRU
        return queryset.filter(amount__lt=1000)
    
    def filter_recent_activity(self, queryset, name, value):
        try:
            hours = int(value)
            cutoff = timezone.now() - timedelta(hours=hours)
            return queryset.filter(created_at__gte=cutoff)
        except (ValueError, TypeError):
            return queryset
    
    def filter_fast_processing(self, queryset, name, value):
        if value:
            # Donations completed within 1 minute
            return queryset.filter(
                status='completed',
                completed_at__isnull=False
            ).extra(
                where=["EXTRACT(EPOCH FROM (completed_at - created_at)) < 60"]
            )
        return queryset
    
    def filter_slow_processing(self, queryset, name, value):
        if value:
            # Donations that took more than 1 hour to complete
            return queryset.filter(
                status='completed',
                completed_at__isnull=False
            ).extra(
                where=["EXTRACT(EPOCH FROM (completed_at - created_at)) > 3600"]
            )
        return queryset