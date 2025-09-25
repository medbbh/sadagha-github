from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class Organization(Base):
    __tablename__ = "organizations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    description = Column(Text)
    website = Column(String(200))
    email = Column(String(100))
    phone = Column(String(20))
    
    # Location info
    address = Column(String(200))
    city = Column(String(100))
    state = Column(String(50))
    country = Column(String(50))
    
    # Organization details
    org_type = Column(String(50))  # 'nonprofit', 'charity', 'foundation', etc.
    tax_id = Column(String(50))
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    campaigns = relationship("Campaign", back_populates="organization")
    
    @property
    def total_campaigns(self):
        """Count of campaigns for this organization"""
        return len(self.campaigns)
    
    @property
    def active_campaigns(self):
        """Count of active campaigns for this organization"""
        return len([c for c in self.campaigns if c.is_active])
    
    def __repr__(self):
        return f"<Organization(id={self.id}, name='{self.name}', type='{self.org_type}')>"