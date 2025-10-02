from rest_framework import serializers
from .models import User
from campaign.models import Donation
from volunteers.models import VolunteerProfile
from django.db.models import Sum, Count



# In your serializers.py, add this:

class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'phone_number', 'supabase_id']
        
    def validate_email(self, value):
        """Ensure email is unique"""
        user = self.instance
        if User.objects.exclude(pk=user.pk).filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def validate_phone_number(self, value):
        """Validate phone number format for Mauritania: must start with 2, 3, or 4 and be 8 digits."""
        if value and not value.isdigit():
            raise serializers.ValidationError("Phone number must contain only digits.")
        if value and len(value) != 8:
            raise serializers.ValidationError("Phone number must be exactly 8 digits.")
        if value and value[0] not in ['2', '3', '4']:
            raise serializers.ValidationError("Phone number must start with 2, 3, or 4.")
        return value

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

    volunteer_profile = ProfileVolunteerSerializer(read_only=True)
    statistics = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'first_name',
            'last_name',
            'phone_number',
            'supabase_id',
            'volunteer_profile', 
            'statistics'
        ]
    
    def get_statistics(self, obj):
        """Calculate user statistics from donations"""
        donations = obj.donations.filter(status='completed')
        
        total_donated = donations.aggregate(total=Sum('amount'))['total'] or 0
        campaigns_supported = donations.values('campaign').distinct().count()
        
        return {
            'total_donated': str(total_donated),
            'donation_count': donations.count(),
            'campaigns_supported': campaigns_supported,
            'is_volunteer': hasattr(obj, 'volunteer_profile') and obj.volunteer_profile is not None
        }

class ContactSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    subject = serializers.CharField(max_length=200)
    message = serializers.CharField(max_length=1000)


