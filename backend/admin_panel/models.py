from django.db import models
from accounts.models import User

# admin_panel/models.py
class AdminAction(models.Model):
    """Audit trail for admin actions"""
    admin_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='admin_actions')
    action_type = models.CharField(max_length=50)
    target_model = models.CharField(max_length=50)
    target_id = models.IntegerField(null=True, blank=True)
    description = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(default=dict)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['admin_user', 'timestamp']),
            models.Index(fields=['action_type', 'timestamp']),
            models.Index(fields=['target_model', 'target_id']),
        ]
    
    def __str__(self):
        return f"{self.admin_user.username} - {self.action_type} - {self.timestamp}"
    

class SupportTicket(models.Model):
    """Customer support tickets"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    subject = models.CharField(max_length=200)
    description = models.TextField()
    status = models.CharField(max_length=20, default='open')
    priority = models.CharField(max_length=20, default='medium')
    assigned_admin = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='assigned_tickets')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


    


