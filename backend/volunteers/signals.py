from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import VolunteerNotification, VolunteerInvitation
from .serializers import VolunteerNotificationSerializer


@receiver(post_save, sender=VolunteerNotification)
def send_notification_to_websocket(sender, instance, created, **kwargs):
    """Send notification to WebSocket when a new notification is created"""
    if created:
        channel_layer = get_channel_layer()
        room_group_name = f'volunteer_{instance.volunteer.id}'
        
        # Serialize notification
        serializer = VolunteerNotificationSerializer(instance)
        
        # Send to WebSocket
        async_to_sync(channel_layer.group_send)(
            room_group_name,
            {
                'type': 'notification_message',
                'notification': serializer.data
            }
        )
        
        # Send updated unread count
        from .services import VolunteerNotificationService
        unread_count = VolunteerNotificationService.get_unread_count(instance.volunteer)
        
        async_to_sync(channel_layer.group_send)(
            room_group_name,
            {
                'type': 'unread_count_update',
                'count': unread_count
            }
        )


@receiver(post_save, sender=VolunteerNotification)
def update_unread_count_on_read(sender, instance, created, **kwargs):
    """Update unread count when notification is marked as read"""
    if not created:  # Only for updates, not new notifications
        channel_layer = get_channel_layer()
        room_group_name = f'volunteer_{instance.volunteer.id}'
        
        from .services import VolunteerNotificationService
        unread_count = VolunteerNotificationService.get_unread_count(instance.volunteer)
        
        async_to_sync(channel_layer.group_send)(
            room_group_name,
            {
                'type': 'unread_count_update',
                'count': unread_count
            }
        )