# volunteers/models.py
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
import json
from django.db.models import Q

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

    def get_skills_list(self):
        """Return skills as list"""
        return [skill.strip() for skill in self.skills.split(',') if skill.strip()]
    
    def get_languages_list(self):
        """Return languages as list"""
        return [lang.strip() for lang in self.languages.split(',') if lang.strip()]
    
    def get_interests_list(self):
        """Return interests as list"""
        return [interest.strip() for interest in self.interests.split(',') if interest.strip()]
    

class VolunteerRequest(models.Model):
    """Organization's request for volunteers"""
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    organization = models.ForeignKey(User, on_delete=models.CASCADE, related_name='volunteer_requests')
    campaign = models.ForeignKey('campaign.Campaign', on_delete=models.CASCADE, null=True, blank=True, 
                                related_name='volunteer_requests')
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    
    # Must-have requirements
    required_skills = models.TextField(blank=True, help_text="Comma-separated must-have skills")
    required_locations = models.TextField(blank=True, help_text="JSON string of required locations")
    min_age = models.IntegerField(null=True, blank=True)
    max_age = models.IntegerField(null=True, blank=True)
    required_languages = models.TextField(blank=True, help_text="Comma-separated required languages")
    
    # Nice-to-have preferences
    preferred_skills = models.TextField(blank=True, help_text="Comma-separated preferred skills")
    preferred_locations = models.TextField(blank=True, help_text="JSON string of preferred locations")
    preferred_languages = models.TextField(blank=True, help_text="Comma-separated preferred languages")
    preferred_interests = models.TextField(blank=True, help_text="Comma-separated preferred interests")
    
    # Event details
    event_date = models.DateTimeField()
    event_end_date = models.DateTimeField(null=True, blank=True)
    duration_hours = models.IntegerField()
    volunteers_needed = models.IntegerField()
    
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Additional requirements
    special_requirements = models.TextField(blank=True, help_text="Any special requirements or notes")

    def __str__(self):
        return f"{self.title} - {self.organization.get_full_name()}"

    class Meta:
        db_table = 'volunteer_requests'
        ordering = ['-created_at']

    def get_required_skills_list(self):
        """Return required skills as list"""
        return [skill.strip() for skill in self.required_skills.split(',') if skill.strip()]
    
    def get_preferred_skills_list(self):
        """Return preferred skills as list"""
        return [skill.strip() for skill in self.preferred_skills.split(',') if skill.strip()]
    
    def get_required_languages_list(self):
        """Return required languages as list"""
        return [lang.strip() for lang in self.required_languages.split(',') if lang.strip()]
    
    def get_preferred_languages_list(self):
        """Return preferred languages as list"""
        return [lang.strip() for lang in self.preferred_languages.split(',') if lang.strip()]
    
    def get_preferred_interests_list(self):
        """Return preferred interests as list"""
        return [interest.strip() for interest in self.preferred_interests.split(',') if interest.strip()]
    
    def get_required_locations_data(self):
        """Return required locations as parsed JSON"""
        try:
            return json.loads(self.required_locations) if self.required_locations else []
        except json.JSONDecodeError:
            return []
    
    def get_preferred_locations_data(self):
        """Return preferred locations as parsed JSON"""
        try:
            return json.loads(self.preferred_locations) if self.preferred_locations else []
        except json.JSONDecodeError:
            return []

    # Remove the @property decorators since we're using annotations in the view
    def get_accepted_count(self):
        """Get count of accepted invitations - use this method if needed"""
        return self.invitations.filter(status='accepted').count()
    
    def get_pending_count(self):
        """Get count of pending invitations - use this method if needed"""
        return self.invitations.filter(status='pending').count()
    
    def get_total_invited(self):
        """Get total invitations sent - use this method if needed"""
        return self.invitations.count()


class VolunteerInvitation(models.Model):
    """Invitation sent to specific volunteer"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
        ('expired', 'Expired'),
    ]
    
    request = models.ForeignKey(VolunteerRequest, on_delete=models.CASCADE, related_name='invitations')
    volunteer = models.ForeignKey(VolunteerProfile, on_delete=models.CASCADE, related_name='invitations')
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    match_score = models.FloatField(default=0.0, help_text="Matching score (0-100)")
    
    # Message from organization
    message = models.TextField(blank=True, help_text="Personal message to volunteer")
    
    # Response from volunteer
    response_message = models.TextField(blank=True, help_text="Volunteer's response message")
    
    invited_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.request.title} -> {self.volunteer.user.get_full_name()}"

    class Meta:
        db_table = 'volunteer_invitations'
        unique_together = ['request', 'volunteer']  # Prevent duplicate invitations
        ordering = ['-invited_at']


class VolunteerNotification(models.Model):
    """In-app notifications for volunteers"""
    NOTIFICATION_TYPES = [
        ('invitation', 'New Invitation'),
        ('invitation_update', 'Invitation Update'),
        ('request_update', 'Request Update'),
        ('general', 'General'),
    ]
    
    volunteer = models.ForeignKey(VolunteerProfile, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    
    # Optional links
    invitation = models.ForeignKey(VolunteerInvitation, on_delete=models.CASCADE, null=True, blank=True)
    request = models.ForeignKey(VolunteerRequest, on_delete=models.CASCADE, null=True, blank=True)
    
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} -> {self.volunteer.user.get_full_name()}"

    class Meta:
        db_table = 'volunteer_notifications'
        ordering = ['-created_at']
