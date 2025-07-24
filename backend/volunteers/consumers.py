import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import VolunteerProfile, VolunteerNotification


class VolunteerNotificationConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for real-time volunteer notifications"""
    
    async def connect(self):
        """Accept WebSocket connection"""
        self.user = self.scope['user']
        
        if not self.user.is_authenticated:
            await self.close()
            return
        
        # Only volunteers can connect
        if self.user.role == 'organization':
            await self.close()
            return
        
        # Check if volunteer profile exists
        volunteer_profile = await self.get_volunteer_profile()
        if not volunteer_profile:
            await self.close()
            return
        
        self.volunteer_profile = volunteer_profile
        self.room_group_name = f'volunteer_{volunteer_profile.id}'
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Send unread count on connection
        unread_count = await self.get_unread_count()
        await self.send(text_data=json.dumps({
            'type': 'unread_count',
            'count': unread_count
        }))
    
    async def disconnect(self, close_code):
        """Leave room group"""
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
    
    async def receive(self, text_data):
        """Handle received WebSocket messages"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'get_unread_count':
                unread_count = await self.get_unread_count()
                await self.send(text_data=json.dumps({
                    'type': 'unread_count',
                    'count': unread_count
                }))
            
        except json.JSONDecodeError:
            pass
    
    async def notification_message(self, event):
        """Send notification to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'notification': event['notification']
        }))
    
    async def unread_count_update(self, event):
        """Send unread count update to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'unread_count',
            'count': event['count']
        }))
    
    @database_sync_to_async
    def get_volunteer_profile(self):
        """Get volunteer profile for current user"""
        try:
            return VolunteerProfile.objects.get(user=self.user)
        except VolunteerProfile.DoesNotExist:
            return None
    
    @database_sync_to_async
    def get_unread_count(self):
        """Get unread notification count"""
        if hasattr(self, 'volunteer_profile'):
            return VolunteerNotification.objects.filter(
                volunteer=self.volunteer_profile,
                is_read=False
            ).count()
        return 0