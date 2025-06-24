from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("api/auth/", include("accounts.urls")),
    path("api/org/", include("organizations.urls")),
    path("api/campaigns/", include("campaign.urls")),
    path("admin/", admin.site.urls),
]
