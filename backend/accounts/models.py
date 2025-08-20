from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        ('organization', 'Organization'),
        ('user', 'User'),
        ('admin', 'Admin'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')
    phone_number = models.CharField(max_length=8, blank=True, null=True)
    # user id from Supabase
    supabase_id = models.CharField(max_length=100)
    
    is_platform_admin = models.BooleanField(default=False)


