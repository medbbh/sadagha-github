from sqlalchemy import Column, Integer, String, Numeric, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class Donation(Base):
    __tablename__ = "donations"
    
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Numeric(10, 2), nullable=False)
    
    # Donor information (simplified for AI training)
    donor_name = Column(String(100))
    donor_email = Column(String(100), index=True)
    donor_location = Column(String(100))
    
    # Donation details
    message = Column(Text)
    is_anonymous = Column(Boolean, default=False)
    payment_method = Column(String(20))  # 'card', 'paypal', 'bank_transfer', etc.
    
    # Status tracking
    status = Column(String(20), default='completed')  # 'pending', 'completed', 'failed', 'refunded'
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    processed_at = Column(DateTime(timezone=True))
    
    # Foreign key to campaign
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=False, index=True)
    
    # Relationships
    campaign = relationship("Campaign", back_populates="donations")
    
    # Additional fields for AI training features
    donor_age_range = Column(String(20))  # '18-25', '26-35', '36-50', '51+'
    donor_previous_donations = Column(Integer, default=0)  # Count of previous donations
    referral_source = Column(String(50))  # 'social_media', 'email', 'direct', 'search'
    
    def __repr__(self):
        return f"<Donation(id={self.id}, amount={self.amount}, campaign_id={self.campaign_id})>"