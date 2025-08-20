from django.db import models
from accounts.models import User

# Create your models here.
class OrganizationProfile(models.Model):
    org_name = models.CharField(max_length=255,blank=True)
    description = models.TextField(blank=True)
    owner = models.OneToOneField(User, on_delete=models.CASCADE, related_name='organization_profile')
    address = models.CharField(max_length=255,blank=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=100, default='Mauritania')
    phone_number = models.CharField(max_length=20,blank=True)
    website = models.URLField(max_length=255, blank=True)
    document_url = models.URLField(blank=True)
    document_path = models.CharField(max_length=500, blank=True, null=True)

    profile_image_url = models.URLField(blank=True)
    profile_image_path = models.CharField(max_length=500, blank=True, null=True)
    cover_image_url = models.URLField(blank=True)
    cover_image_path = models.CharField(max_length=500, blank=True, null=True)

    # Payment integration
    nextremitly_api_key = models.CharField(
        max_length=500, 
        blank=True, 
        null=True, 
        help_text="NextRemitly API key for receiving payments"
    )
    payment_enabled = models.BooleanField(
        default=False, 
        help_text="Enable payment processing for this organization"
    )

    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['org_name']
        indexes = [
            models.Index(fields=['is_verified']),
            models.Index(fields=['payment_enabled']),
        ]

    def can_receive_payments(self):
        """Check if organization can receive payments"""
        return (
            self.payment_enabled and 
            bool(self.nextremitly_api_key) and 
            self.is_verified 
        )
    
    def __str__(self):
        return self.org_name
    

    