from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Donation
from django.core.cache import cache

@receiver(post_save, sender=Donation)
def invalidate_campaign_caches(sender, instance, **kwargs):
    if instance.status == 'completed':
        cache.delete('urgent_campaigns')
        cache.delete(f'organization:detail:{instance.campaign.organization_id}')
        cache.delete(f'similar_campaigns:campaign:{instance.campaign_id}')