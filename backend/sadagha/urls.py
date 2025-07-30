from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("api/auth/", include("accounts.urls")),
    path("api/org/", include("organizations.urls")),
    path("api/campaigns/", include("campaign.urls")),
    path("api/donations/", include("campaign.donation_urls")),
    path("api/volunteers/", include("volunteers.urls")),
    path("api/admin/", include("admin_panel.urls")), 
    
    path("admin/", admin.site.urls),
]
