from pydantic import BaseModel, EmailStr
from datetime import datetime
from decimal import Decimal
from typing import Optional, List


class DonationBase(BaseModel):
    amount: Decimal
    donor_name: Optional[str] = None
    donor_email: Optional[str] = None
    donor_location: Optional[str] = None
    message: Optional[str] = None
    is_anonymous: bool = False
    payment_method: Optional[str] = None


class DonationCreate(DonationBase):
    campaign_id: int


class DonationResponse(DonationBase):
    id: int
    campaign_id: int
    status: str
    created_at: datetime
    donor_age_range: Optional[str] = None
    referral_source: Optional[str] = None
    
    class Config:
        from_attributes = True


class CampaignBase(BaseModel):
    title: str
    description: Optional[str] = None
    goal_amount: Decimal
    category: Optional[str] = None
    location: Optional[str] = None
    creator_name: Optional[str] = None
    creator_email: Optional[str] = None


class CampaignCreate(CampaignBase):
    deadline: Optional[datetime] = None


class CampaignResponse(CampaignBase):
    id: int
    current_amount: Decimal
    organization_id: Optional[int] = None
    is_active: bool
    is_featured: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    deadline: Optional[datetime] = None
    progress_percentage: float
    donation_count: int
    donations: List[DonationResponse] = []
    
    class Config:
        from_attributes = True


class CampaignSummary(BaseModel):
    """Simplified campaign model for recommendations"""
    id: int
    title: str
    category: Optional[str] = None
    goal_amount: Decimal
    current_amount: Decimal
    progress_percentage: float
    donation_count: int
    is_featured: bool
    organization_name: Optional[str] = None
    
    class Config:
        from_attributes = True


class OrganizationBase(BaseModel):
    name: str
    description: Optional[str] = None
    website: Optional[str] = None
    email: Optional[str] = None
    org_type: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None


class OrganizationResponse(OrganizationBase):
    id: int
    is_verified: bool
    is_active: bool
    created_at: datetime
    total_campaigns: int
    active_campaigns: int
    
    class Config:
        from_attributes = True