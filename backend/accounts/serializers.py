from rest_framework import serializers
from .models import User
from campaign.models import Donation
from volunteers.models import VolunteerProfile
from django.db.models import Sum, Count

class ProfileDonationSerializer(serializers.ModelSerializer):
    campaign_id = serializers.IntegerField(source='campaign.id')
    campaign_name = serializers.CharField(source='campaign.name')
    
    class Meta:
        model = Donation
        fields = [
            'id',
            'campaign_id', 
            'campaign_name',
            'amount',
            'currency',
            'status',
            'created_at',
            'is_anonymous'
        ]

class ProfileVolunteerSerializer(serializers.ModelSerializer):
    class Meta:
        model = VolunteerProfile
        fields = [
            'id',
            'phone',
            'age', 
            'profession',
            'skills',
            'interests',
            'languages',
            'is_active'
        ]

class UserProfileSerializer(serializers.ModelSerializer):
    donations = ProfileDonationSerializer(many=True, read_only=True)
    volunteer_profile = ProfileVolunteerSerializer(read_only=True)
    statistics = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'first_name',
            'last_name',
            'donations',
            'volunteer_profile', 
            'statistics'
        ]
    
    def get_statistics(self, obj):
        """Calculate user statistics"""
        completed_donations = obj.donations
        
        # Calculate total donated amount
        total_donated = completed_donations.aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        # Count unique campaigns supported
        campaigns_supported = completed_donations.values('campaign').distinct().count()
        
        # Check if user is volunteer
        has_volunteer_profile = hasattr(obj, 'volunteer_profile') and obj.volunteer_profile is not None
        
        return {
            'total_donated': str(total_donated),
            'donation_count': completed_donations.count(),
            'campaigns_supported': campaigns_supported,
            'is_volunteer': has_volunteer_profile
        }
