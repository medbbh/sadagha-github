# volunteers/serializers.py
from rest_framework import serializers
from .models import VolunteerProfile, VolunteerRequest, VolunteerInvitation, VolunteerNotification
import json


class VolunteerProfileSerializer(serializers.ModelSerializer):
    
    # Accept JSON data from frontend
    available_locations_data = serializers.JSONField(write_only=True, required=False)
    availability_data = serializers.JSONField(write_only=True, required=False)
    
    class Meta:
        model = VolunteerProfile
        fields = [
            'id', 'phone', 'available_locations', 'age', 'profession',
            'motivation', 'skills', 'interests', 'languages', 'availability',
            'is_active', 'created_at', 'updated_at',
            'available_locations_data', 'availability_data'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_age(self, value):
        if value < 16 or value > 100:
            raise serializers.ValidationError("Age must be between 16 and 100")
        return value
    
    def validate_phone(self, value):
        if not value.strip():
            raise serializers.ValidationError("Phone number is required")
        return value.strip()
    
    def validate_motivation(self, value):
        if not value.strip():
            raise serializers.ValidationError("Motivation is required")
        if len(value.strip()) < 20:
            raise serializers.ValidationError("Please provide more details (at least 20 characters)")
        return value.strip()
    
    def create(self, validated_data):
        # Extract JSON data
        locations_data = validated_data.pop('available_locations_data', [])
        availability_data = validated_data.pop('availability_data', {})
        
        # Create profile
        volunteer_profile = VolunteerProfile.objects.create(
            user=self.context['request'].user,
            **validated_data
        )
        
        # Set JSON data
        volunteer_profile.set_available_locations_data(locations_data)
        volunteer_profile.set_availability_data(availability_data)
        volunteer_profile.save()
        
        return volunteer_profile
    
    def update(self, instance, validated_data):
        # Extract JSON data
        locations_data = validated_data.pop('available_locations_data', None)
        availability_data = validated_data.pop('availability_data', None)
        
        # Update basic fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Update JSON data if provided
        if locations_data is not None:
            instance.set_available_locations_data(locations_data)
        if availability_data is not None:
            instance.set_availability_data(availability_data)
        
        instance.save()
        return instance
    
    def to_representation(self, instance):
        """Return parsed JSON data in response"""
        data = super().to_representation(instance)
        
        # Add parsed JSON data for frontend
        data['available_locations_data'] = instance.get_available_locations_data()
        data['availability_data'] = instance.get_availability_data()
        
        return data
    

class VolunteerRequestSerializer(serializers.ModelSerializer):
    # JSON field handlers
    required_locations_data = serializers.JSONField(write_only=True, required=False)
    preferred_locations_data = serializers.JSONField(write_only=True, required=False)
    
    # Read-only computed fields - these come from annotations, not model properties
    organization_name = serializers.SerializerMethodField()
    campaign_title = serializers.CharField(source='campaign.name', read_only=True)
    
    # These will be set by the view's annotations, not the model properties
    accepted_count = serializers.IntegerField(read_only=True)
    pending_count = serializers.IntegerField(read_only=True)
    total_invited = serializers.IntegerField(read_only=True)
    
    # Parsed lists for frontend
    required_skills_list = serializers.ListField(source='get_required_skills_list', read_only=True)
    preferred_skills_list = serializers.ListField(source='get_preferred_skills_list', read_only=True)
    required_languages_list = serializers.ListField(source='get_required_languages_list', read_only=True)
    preferred_languages_list = serializers.ListField(source='get_preferred_languages_list', read_only=True)
    preferred_interests_list = serializers.ListField(source='get_preferred_interests_list', read_only=True)
    
    class Meta:
        model = VolunteerRequest
        fields = [
            'id', 'organization', 'campaign', 'title', 'description',
            'required_skills', 'required_locations', 'min_age', 'max_age', 'required_languages',
            'preferred_skills', 'preferred_locations', 'preferred_languages', 'preferred_interests',
            'event_date', 'event_end_date', 'duration_hours', 'volunteers_needed',
            'priority', 'status', 'special_requirements',
            'created_at', 'updated_at',
            # Write-only fields
            'required_locations_data', 'preferred_locations_data',
            # Read-only computed fields (from annotations)
            'organization_name', 'campaign_title', 'accepted_count', 'pending_count', 'total_invited',
            'required_skills_list', 'preferred_skills_list', 'required_languages_list',
            'preferred_languages_list', 'preferred_interests_list'
        ]
        read_only_fields = ['id', 'organization', 'created_at', 'updated_at', 'accepted_count', 'pending_count', 'total_invited']
    
    def get_organization_name(self, obj):
        """Get organization name from OrganizationProfile"""
        try:
            return obj.organization.organization_profile.org_name or f"{obj.organization.first_name} {obj.organization.last_name}".strip()
        except AttributeError:
            return obj.organization.username if hasattr(obj.organization, 'username') else "Unknown Organization"
    
    def validate(self, data):
        # Validate age range
        if data.get('min_age') and data.get('max_age'):
            if data['min_age'] > data['max_age']:
                raise serializers.ValidationError("Minimum age cannot be greater than maximum age")
        
        # Validate event dates
        if data.get('event_end_date') and data.get('event_date'):
            if data['event_end_date'] <= data['event_date']:
                raise serializers.ValidationError("Event end date must be after start date")
        
        # Validate volunteers needed
        if data.get('volunteers_needed', 0) <= 0:
            raise serializers.ValidationError("Number of volunteers needed must be greater than 0")
        
        return data
    
    def create(self, validated_data):
        # Extract JSON data
        required_locations_data = validated_data.pop('required_locations_data', [])
        preferred_locations_data = validated_data.pop('preferred_locations_data', [])
        
        # Set organization from request
        validated_data['organization'] = self.context['request'].user
        
        # Create request
        volunteer_request = VolunteerRequest.objects.create(**validated_data)
        
        # Set JSON data
        if required_locations_data:
            volunteer_request.required_locations = json.dumps(required_locations_data)
        if preferred_locations_data:
            volunteer_request.preferred_locations = json.dumps(preferred_locations_data)
        volunteer_request.save()
        
        return volunteer_request
    
    def update(self, instance, validated_data):
        # Extract JSON data
        required_locations_data = validated_data.pop('required_locations_data', None)
        preferred_locations_data = validated_data.pop('preferred_locations_data', None)
        
        # Update basic fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Update JSON data if provided
        if required_locations_data is not None:
            instance.required_locations = json.dumps(required_locations_data)
        if preferred_locations_data is not None:
            instance.preferred_locations = json.dumps(preferred_locations_data)
        
        instance.save()
        return instance
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['required_locations_data'] = instance.get_required_locations_data()
        data['preferred_locations_data'] = instance.get_preferred_locations_data()
        return data

class VolunteerInvitationSerializer(serializers.ModelSerializer):
    # Read-only computed fields
    request_title = serializers.CharField(source='request.title', read_only=True)
    request_description = serializers.CharField(source='request.description', read_only=True)
    
    # Organization name from OrganizationProfile
    organization_name = serializers.SerializerMethodField()
    
    volunteer_name = serializers.CharField(source='volunteer.user.get_full_name', read_only=True)
    volunteer_tel = serializers.CharField(source='volunteer.phone', read_only=True)
    event_date = serializers.DateTimeField(source='request.event_date', read_only=True)
    event_end_date = serializers.DateTimeField(source='request.event_end_date', read_only=True)
    duration_hours = serializers.IntegerField(source='request.duration_hours', read_only=True)
    
    # Campaign fields - using 'name' instead of 'title'
    campaign_id = serializers.IntegerField(source='request.campaign.id', read_only=True)
    campaign_title = serializers.CharField(source='request.campaign.name', read_only=True)  # Changed from 'title' to 'name'
    
    class Meta:
        model = VolunteerInvitation
        fields = [
            'id', 'request', 'volunteer', 'status', 'match_score',
            'message', 'response_message', 'invited_at', 'responded_at', 'expires_at',
            # Read-only computed fields
            'request_title', 'request_description', 'organization_name', 'volunteer_name','volunteer_tel',
            'event_date', 'event_end_date', 'duration_hours',
            # Campaign fields
            'campaign_id', 'campaign_title'
        ]
        read_only_fields = ['id', 'match_score', 'invited_at']
    
    def get_organization_name(self, obj):
        """Get organization name from OrganizationProfile"""
        try:
            # Access organization profile through the relationship
            org_profile = obj.request.organization.organization_profile
            if org_profile.org_name:
                return org_profile.org_name
            else:
                # Fallback to user's full name if org_name is empty
                user = obj.request.organization
                if hasattr(user, 'first_name') and hasattr(user, 'last_name'):
                    return f"{user.first_name} {user.last_name}".strip()
                return user.username if hasattr(user, 'username') else "Unknown Organization"
        except AttributeError:
            # If organization_profile doesn't exist, fallback to user info
            user = obj.request.organization
            if hasattr(user, 'first_name') and hasattr(user, 'last_name'):
                return f"{user.first_name} {user.last_name}".strip()
            return user.username if hasattr(user, 'username') else "Unknown Organization"
    
    def update(self, instance, validated_data):
        # Handle status changes
        if 'status' in validated_data and validated_data['status'] in ['accepted', 'declined']:
            from django.utils import timezone
            instance.responded_at = timezone.now()
        
        return super().update(instance, validated_data)

class BulkInviteSerializer(serializers.Serializer):
    """Serializer for bulk invitations"""
    volunteer_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1,
        max_length=100,  # Maximum 100 invitations at once
    )
    message = serializers.CharField(max_length=1000, required=False, allow_blank=True)
    
    def validate_volunteer_ids(self, value):
        # Check if all volunteer profiles exist and are active
        existing_ids = set(VolunteerProfile.objects.filter(
            id__in=value, 
            is_active=True
        ).values_list('id', flat=True))
        
        invalid_ids = set(value) - existing_ids
        if invalid_ids:
            raise serializers.ValidationError(f"Invalid or inactive volunteer IDs: {list(invalid_ids)}")
        
        return value

class VolunteerNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = VolunteerNotification
        fields = [
            'id', 'notification_type', 'title', 'message',
            'invitation', 'request', 'is_read', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


# a serializer for exporting invited volunteers that has accepted invitations
class ExportInvitedVolunteersSerializer(serializers.ModelSerializer):
    # Volunteer basic info
    volunteer_name = serializers.CharField(source='volunteer.user.get_full_name', read_only=True)
    volunteer_email = serializers.EmailField(source='volunteer.user.email', read_only=True)
    volunteer_phone = serializers.CharField(source='volunteer.phone', read_only=True)
    volunteer_age = serializers.IntegerField(source='volunteer.age', read_only=True)
    volunteer_profession = serializers.CharField(source='volunteer.profession', read_only=True)
    
    # Volunteer location (from JSON data)
    volunteer_location = serializers.SerializerMethodField()
    volunteer_skills = serializers.SerializerMethodField()
    volunteer_languages = serializers.SerializerMethodField()
    volunteer_interests = serializers.SerializerMethodField()
    
    # Request/Program info
    request_id = serializers.IntegerField(source='request.id', read_only=True)
    request_title = serializers.CharField(source='request.title', read_only=True)
    request_description = serializers.CharField(source='request.description', read_only=True)
    organization_name = serializers.CharField(source='request.organization.get_full_name', read_only=True)
    
    # Campaign info (if exists)
    campaign_name = serializers.CharField(source='request.campaign.name', read_only=True, allow_null=True)
    campaign_description = serializers.CharField(source='request.campaign.description', read_only=True, allow_null=True)
    
    # Event details
    event_date = serializers.DateTimeField(source='request.event_date', read_only=True)
    event_end_date = serializers.DateTimeField(source='request.event_end_date', read_only=True, allow_null=True)
    duration_hours = serializers.IntegerField(source='request.duration_hours', read_only=True)
    
    # Invitation details
    match_score = serializers.FloatField(read_only=True)
    status = serializers.CharField(read_only=True)
    invited_at = serializers.DateTimeField(read_only=True)
    responded_at = serializers.DateTimeField(read_only=True, allow_null=True)
    message = serializers.CharField(read_only=True)
    response_message = serializers.CharField(read_only=True)

    class Meta:
        model = VolunteerInvitation
        fields = [
            'id', 'request_id', 'request_title', 'request_description', 'organization_name',
            'campaign_name', 'campaign_description', 'event_date', 'event_end_date', 'duration_hours',
            'volunteer_name', 'volunteer_email', 'volunteer_phone', 'volunteer_age', 'volunteer_profession',
            'volunteer_location', 'volunteer_skills', 'volunteer_languages', 'volunteer_interests',
            'match_score', 'status', 'invited_at', 'responded_at', 'message', 'response_message'
        ]

    def get_volunteer_location(self, obj):
        """Get volunteer locations from JSON data"""
        try:
            locations_data = obj.volunteer.get_available_locations_data()
            if locations_data:
                if isinstance(locations_data, list):
                    # Extract names from location objects
                    names = []
                    for loc in locations_data:
                        if isinstance(loc, dict) and 'name' in loc:
                            names.append(loc['name'])
                        elif isinstance(loc, str):
                            names.append(loc)
                        else:
                            names.append(str(loc))
                    return ', '.join(names)
                elif isinstance(locations_data, dict):
                    # Single location object
                    return locations_data.get('name', str(locations_data))
                else:
                    return str(locations_data)
            return ""
        except Exception as e:
            print(f"Error parsing location data: {e}")
            return ""

    def get_volunteer_skills(self, obj):
        """Get volunteer skills as list"""
        return obj.volunteer.get_skills_list()

    def get_volunteer_languages(self, obj):
        """Get volunteer languages as list"""
        return obj.volunteer.get_languages_list()

    def get_volunteer_interests(self, obj):
        """Get volunteer interests as list"""
        return obj.volunteer.get_interests_list()