from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from organizations.models import OrganizationProfile

User = get_user_model()

class Category(models.Model):
    name = models.CharField(max_length=255)
    icon_class = models.CharField(max_length=100, blank=True, null=True)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Campaign(models.Model):
    LIVE_STATUS_CHOICES = [
        ('none', 'No Live Stream'),
        ('live', 'Currently Live'),
        ('ended', 'Stream Ended'),
    ]
    name= models.CharField(max_length=255)
    description= models.TextField()
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='campaigns')
    organization = models.ForeignKey(OrganizationProfile, on_delete=models.CASCADE, related_name='campaigns', null=True, blank=True)

    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="campaigns")
    target = models.DecimalField(max_digits=10, decimal_places=2)
    current_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    number_of_donors = models.IntegerField(default=0)
    featured = models.BooleanField(default=False)

    # Facebook Live integration fields
    facebook_live_url = models.URLField(blank=True, null=True, help_text="Facebook Live stream URL")
    facebook_video_id = models.CharField(max_length=255, blank=True, null=True, help_text="Extracted Facebook video ID")
    live_status = models.CharField(max_length=10, choices=LIVE_STATUS_CHOICES, default='none')
    facebook_access_token = models.TextField(blank=True, null=True, help_text="Facebook access token for API calls")
    live_viewer_count = models.IntegerField(default=0, help_text="Current live viewer count")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def is_live(self):
        return self.live_status == 'live'
    
    @property
    def has_facebook_live(self):
        return bool(self.facebook_live_url and self.facebook_video_id)

class File(models.Model):
    name = models.CharField(max_length=255)
    url = models.URLField()
    path = models.CharField(max_length=500, blank=True, null=True)
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name="files")
    created_at = models.DateTimeField(auto_now_add=True)

    
    def delete(self, *args, **kwargs):
        # Delete the file from Supabase before deleting the DB record
        from .utils.supabase_storage import delete_file
        if self.path:
            delete_file(self.path)
        super().delete(*args, **kwargs)



class Donation(models.Model):
    """Model to track donations to campaigns"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='donations')
    donor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='donations')
    donor_name = models.CharField(max_length=255, blank=True, null=True)
    
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Payment session tracking
    payment_session_id = models.UUIDField(null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Additional info
    message = models.TextField(blank=True, null=True, help_text="Optional message from donor")
    is_anonymous = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['campaign', 'status']),
            models.Index(fields=['payment_session_id']),
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['donor', 'created_at']),

            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"Donation of {self.amount} {self.currency} to {self.campaign.name}"
    
    @property
    def donor_display_name(self):
        """Get the display name for the donor"""
        if self.is_anonymous:
            return "Anonymous"
        if self.donor:
            return self.donor.first_name if hasattr(self.donor, 'first_name') else str(self.donor)
        return self.donor_name or "Anonymous"
    
    def mark_completed(self):
        """Mark donation as completed and update timestamp"""
        self.status = 'completed'
        self.completed_at = timezone.now()
        self.save()
    
    def mark_failed(self, reason=None):
        """Mark donation as failed"""
        self.status = 'failed'
        if reason:
            self.payment_metadata['failure_reason'] = reason
        self.save()
