from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from .models import User
from organizations.models import OrganizationProfile

@receiver(post_save, sender=User)
def create_organization_profile(sender, instance, created, **kwargs):
    """
    Create an OrganizationProfile for the user when the role is set to 'organization'.
    """
    if created and instance.role == 'organization':
        # Only create the profile if the user is newly created and has role 'organization'
        OrganizationProfile.objects.create(owner=instance)
