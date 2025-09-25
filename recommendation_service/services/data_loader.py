import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Tuple
import logging

try:
    from ..models.database import engine, SessionLocal
    from ..models import Campaign, Donation, Organization
except ImportError:
    # Handle direct script execution
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from models.database import engine, SessionLocal
    from models import Campaign, Donation, Organization

logger = logging.getLogger(__name__)


class DataLoaderService:
    """Service for loading data from PostgreSQL into Pandas DataFrames"""
    
    def __init__(self):
        self.engine = engine
    
    def load_all_data(self) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
        """
        Load donations, campaigns, and organizations data into DataFrames
        
        Returns:
            Tuple of (donations_df, campaigns_df, orgs_df)
        """
        try:
            donations_df = self._load_donations()
            campaigns_df = self._load_campaigns()
            orgs_df = self._load_organizations()
            
            logger.info(f"Loaded {len(donations_df)} donations, {len(campaigns_df)} campaigns, {len(orgs_df)} organizations")
            
            return donations_df, campaigns_df, orgs_df
            
        except Exception as e:
            logger.error(f"Error loading data: {str(e)}")
            raise
    
    def _load_donations(self) -> pd.DataFrame:
        """Load donations data with campaign information"""
        query = """
        SELECT 
            d.id,
            d.amount,
            d.donor_name,
            d.donor_email,
            d.donor_location,
            d.donor_age_range,
            d.donor_previous_donations,
            d.referral_source,
            d.payment_method,
            d.is_anonymous,
            d.status,
            d.created_at,
            d.processed_at,
            d.campaign_id,
            c.title as campaign_title,
            c.category as campaign_category,
            c.location as campaign_location,
            c.creator_name,
            c.organization_id,
            c.goal_amount as campaign_goal,
            o.name as organization_name,
            o.org_type as organization_type
        FROM donations d
        LEFT JOIN campaigns c ON d.campaign_id = c.id
        LEFT JOIN organizations o ON c.organization_id = o.id
        ORDER BY d.created_at DESC
        """
        
        return pd.read_sql_query(query, self.engine)
    
    def _load_campaigns(self) -> pd.DataFrame:
        """Load campaigns data with aggregated donation metrics"""
        query = """
        SELECT 
            c.id,
            c.title,
            c.description,
            c.goal_amount,
            c.current_amount,
            c.category,
            c.location,
            c.creator_name,
            c.creator_email,
            c.organization_id,
            c.is_active,
            c.is_featured,
            c.created_at,
            c.updated_at,
            c.deadline,
            o.name as organization_name,
            o.org_type as organization_type,
            o.is_verified as organization_verified,
            COALESCE(d.donation_count, 0) as donation_count,
            COALESCE(d.avg_donation, 0) as avg_donation_amount,
            COALESCE(d.max_donation, 0) as max_donation_amount,
            COALESCE(d.min_donation, 0) as min_donation_amount,
            CASE 
                WHEN c.goal_amount > 0 THEN 
                    LEAST((c.current_amount / c.goal_amount) * 100, 100)
                ELSE 0 
            END as progress_percentage
        FROM campaigns c
        LEFT JOIN organizations o ON c.organization_id = o.id
        LEFT JOIN (
            SELECT 
                campaign_id,
                COUNT(*) as donation_count,
                AVG(amount) as avg_donation,
                MAX(amount) as max_donation,
                MIN(amount) as min_donation
            FROM donations 
            WHERE status = 'completed'
            GROUP BY campaign_id
        ) d ON c.id = d.campaign_id
        ORDER BY c.created_at DESC
        """
        
        return pd.read_sql_query(query, self.engine)
    
    def _load_organizations(self) -> pd.DataFrame:
        """Load organizations data"""
        query = """
        SELECT 
            id,
            name,
            description,
            website,
            email,
            phone,
            address,
            city,
            state,
            country,
            org_type,
            tax_id,
            is_verified,
            is_active,
            created_at,
            updated_at
        FROM organizations
        ORDER BY created_at DESC
        """
        
        return pd.read_sql_query(query, self.engine)
    
    def load_donations_by_campaign(self, campaign_id: int) -> pd.DataFrame:
        """Load donations for a specific campaign"""
        query = """
        SELECT * FROM donations 
        WHERE campaign_id = :campaign_id 
        ORDER BY created_at DESC
        """
        
        return pd.read_sql_query(query, self.engine, params={"campaign_id": campaign_id})
    
    def load_campaigns_by_category(self, category: str) -> pd.DataFrame:
        """Load campaigns filtered by category"""
        query = """
        SELECT * FROM campaigns 
        WHERE category = :category AND is_active = true
        ORDER BY created_at DESC
        """
        
        return pd.read_sql_query(query, self.engine, params={"category": category})
    
    def get_donation_trends(self, days: int = 30) -> pd.DataFrame:
        """Get donation trends over the last N days"""
        query = """
        SELECT 
            DATE(created_at) as donation_date,
            COUNT(*) as donation_count,
            SUM(amount) as total_amount,
            AVG(amount) as avg_amount
        FROM donations 
        WHERE created_at >= NOW() - INTERVAL ':days days'
        AND status = 'completed'
        GROUP BY DATE(created_at)
        ORDER BY donation_date DESC
        """
        
        return pd.read_sql_query(query, self.engine, params={"days": days})


# Convenience function for easy import
def load_data_for_ml() -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Convenience function to load all data for ML processing
    
    Returns:
        Tuple of (donations_df, campaigns_df, orgs_df)
    """
    loader = DataLoaderService()
    return loader.load_all_data()