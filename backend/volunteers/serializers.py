# volunteers/serializers.py
from rest_framework import serializers
from .models import VolunteerProfile
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