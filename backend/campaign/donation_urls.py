# campaign/donation_urls.py (create this new file)
from django.urls import path
from . import views  # or wherever your donation views are

urlpatterns = [
    path('my-donations/', views.user_donations, name='user_donations'),
    path('summary/', views.donation_summary, name='donation_summary'),
]