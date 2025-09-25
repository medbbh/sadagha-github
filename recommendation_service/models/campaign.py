from sqlalchemy import Column, Integer, String, Text, DateTime, Numeric, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class Campaign(Base):
    __tablename__ = "campaigns"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text)
    goal_amount = Column(Numeric(10, 2), nullable=False)
    current_amount = Column(Numeric(10, 2), default=0.00)
    category = Column(String(50), index=True)
    location = Column(String(100))
    
    # Status and visibility
    is_active = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    deadline = Column(DateTime(timezone=True))
    
    # Creator info (simplified)
    creator_name = Column(String(100))
    creator_email = Column(String(100))
    
    # Organization relationship
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True, index=True)
    
    # Relationships
    donations = relationship("Donation", back_populates="campaign")
    organization = relationship("Organization", back_populates="campaigns")
    
    @property
    def progress_percentage(self):
        """Calculate funding progress as percentage"""
        if self.goal_amount > 0:
            return min((float(self.current_amount) / float(self.goal_amount)) * 100, 100)
        return 0
    
    @property
    def donation_count(self):
        """Count of donations for this campaign"""
        return len(self.donations)
    
    def __repr__(self):
        return f"<Campaign(id={self.id}, title='{self.title}', goal={self.goal_amount})>"