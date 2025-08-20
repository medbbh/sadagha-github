# organizations/serializers.py - Simple Payment System

from rest_framework import serializers
from .models import OrganizationProfile
from django.core.exceptions import ValidationError as DjangoValidationError
from campaign.models import Campaign


class OrganizationProfileSerializer(serializers.ModelSerializer):
    owner_email = serializers.EmailField(source='owner.email', read_only=True)
    owner_id = serializers.IntegerField(source='owner.id', read_only=True)
    
    # Payment summary fields
    
    class Meta:
        model = OrganizationProfile
        fields = [
            'id', 'org_name', 'description', 'owner', 'owner_email', 'owner_id',
            'address', 'phone_number', 'website', 'document_url', 'document_path',
            'profile_image_url', 'profile_image_path', 'cover_image_url', 'cover_image_path',
            'is_verified', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'owner', 'owner_email', 'owner_id', 'document_url', 'document_path',
            'profile_image_url', 'profile_image_path', 'cover_image_url', 'cover_image_path',
            'created_at', 'updated_at'
        ]


class OrganizationPaymentSerializer(serializers.ModelSerializer):
    """Serializer for organization payment settings"""
    can_receive_payments = serializers.ReadOnlyField()
    
    class Meta:
        model = OrganizationProfile
        fields = [
            'id',
            'name',
            'nextremitly_api_key',
            'payment_enabled',
            'can_receive_payments'
        ]
        extra_kwargs = {
            'nextremitly_api_key': {
                'write_only': True,
                'help_text': 'Your NextRemitly API key (kept secure)'
            }
        }

    def validate_nextremitly_api_key(self, value):
        """Validate API key format"""
        if value and len(value.strip()) < 10:
            raise serializers.ValidationError("API key seems too short")
        return value.strip() if value else value





# This for the user

class PublicOrganizationProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrganizationProfile
        fields = [
            'id', 'org_name', 'description', 'address', 'phone_number', 'website',
            'profile_image_url', 'cover_image_url', 'is_verified', 'created_at'
        ]