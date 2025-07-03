# volunteers/models.py
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator

User = get_user_model()

class VolunteerProfile(models.Model):
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='volunteer_profile')
    phone = models.CharField(max_length=20)
    
    # Location - frontend handles the options and validation
    available_locations = models.TextField(
        help_text="JSON string of selected locations from frontend"
    )
    
    age = models.IntegerField(validators=[MinValueValidator(16), MaxValueValidator(100)])
    profession = models.CharField(max_length=100, blank=True)
    motivation = models.TextField()
    skills = models.TextField(help_text="Comma-separated skills")
    interests = models.TextField(help_text="Comma-separated interests") 
    languages = models.TextField(help_text="Comma-separated languages")
    
    # Availability - frontend handles the complex scheduling logic
    availability = models.TextField(
        help_text="JSON string of availability data from frontend"
    )
    
    # Meta
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.get_full_name()} - Volunteer"

    class Meta:
        db_table = 'volunteer_profiles'
    
    # Helper methods for JSON data
    def get_available_locations_data(self):
        """Return parsed location data from frontend"""
        import json
        try:
            return json.loads(self.available_locations) if self.available_locations else []
        except json.JSONDecodeError:
            return []
    
    def set_available_locations_data(self, locations_data):
        """Set location data as JSON string"""
        import json
        self.available_locations = json.dumps(locations_data)
    
    def get_availability_data(self):
        """Return parsed availability data from frontend"""
        import json
        try:
            return json.loads(self.availability) if self.availability else {}
        except json.JSONDecodeError:
            return {}
    
    def set_availability_data(self, availability_data):
        """Set availability data as JSON string"""
        import json
        self.availability = json.dumps(availability_data)