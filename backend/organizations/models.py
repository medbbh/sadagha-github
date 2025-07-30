from django.db import models
from accounts.models import User

# Create your models here.
class OrganizationProfile(models.Model):
    org_name = models.CharField(max_length=255,blank=True)
    description = models.TextField(blank=True)
    owner = models.OneToOneField(User, on_delete=models.CASCADE, related_name='organization_profile')
    address = models.CharField(max_length=255,blank=True)
    phone_number = models.CharField(max_length=20,blank=True)
    website = models.URLField(max_length=255, blank=True)
    document_url = models.URLField(blank=True)
    document_path = models.CharField(max_length=500, blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def has_payment_methods_configured(self):
        """Check if organization has any payment methods configured"""
        return bool(self.phone_number)

class WalletProvider(models.Model):
    name = models.CharField(max_length=50, unique=True) # Bankily, Sedad ...
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return self.name
    
class ManualPayment(models.Model):
    """Manual payment method - donors send money and provide proof"""
    organization = models.ForeignKey(
        OrganizationProfile, 
        on_delete=models.CASCADE, 
        related_name='manual_payments'
    )
    wallet_provider = models.ForeignKey(WalletProvider, on_delete=models.CASCADE)
    phone_number = models.CharField(max_length=20)  # The actual payment phone number
    account_name = models.CharField(max_length=100, blank=True)  # Account holder name
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['organization', 'wallet_provider', 'phone_number']  # Prevent duplicates
    
    def clean(self):
        from django.core.exceptions import ValidationError
        
        # Check max 5 manual payments per organization
        if not self.pk:  # Only check for new instances
            existing_count = ManualPayment.objects.filter(
                organization=self.organization
            ).count()
            if existing_count >= 5:
                raise ValidationError("Organization can have maximum 5 manual payment methods")
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

class NextPayPayment(models.Model):
    """NextPay payment method - automatic instant payments"""
    organization = models.ForeignKey(
        OrganizationProfile, 
        on_delete=models.CASCADE, 
        related_name='nextpay_payments'
    )
    wallet_provider = models.ForeignKey(WalletProvider, on_delete=models.CASCADE)
    commercial_number = models.CharField(max_length=20)  # Commercial account number
    account_name = models.CharField(max_length=100, blank=True)  # Account holder name
    is_active = models.BooleanField(default=True)
    verified_at = models.DateTimeField(null=True, blank=True)  # When wallet provider verified
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['organization', 'wallet_provider', 'commercial_number']  # Prevent duplicates
    
    def clean(self):
        from django.core.exceptions import ValidationError
        
        # Check max 5 NextPay payments per organization
        if not self.pk:  # Only check for new instances
            existing_count = NextPayPayment.objects.filter(
                organization=self.organization
            ).count()
            if existing_count >= 5:
                raise ValidationError("Organization can have maximum 5 NextPay payment methods")
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)