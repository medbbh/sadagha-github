import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Tuple
import logging

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.database import engine

logger = logging.getLogger(__name__)


class DjangoDataLoader:
    """Service for loading data from Django tables in Supabase"""
    
    def __init__(self):
        self.engine = engine
    
    def load_all_data(self) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
        """
        Load donations, campaigns, and organizations data from Django tables
        
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
        """Load donations data with campaign information from Django tables"""
        query = """
        SELECT 
            d.id,
            d.amount,
            d.donor_name,
            d.status,
            d.created_at,
            d.message,
            d.is_anonymous,
            d.campaign_id,
            c.name as campaign_title,
            cat.name as campaign_category,
            c.target as campaign_goal,
            c.current_amount,
            c.organization_id,
            o.org_name as organization_name,
            d.donor_id,
            COALESCE(u.email, 'anonymous@example.com') as donor_email
        FROM campaign_donation d
        LEFT JOIN campaign_campaign c ON d.campaign_id = c.id
        LEFT JOIN campaign_category cat ON c.category_id = cat.id
        LEFT JOIN organizations_organizationprofile o ON c.organization_id = o.id
        LEFT JOIN accounts_user u ON d.donor_id = u.id
        WHERE d.status = 'completed'
        ORDER BY d.created_at DESC
        """
        
        # Execute query with proper UTF-8 encoding for Arabic text
        df = pd.read_sql_query(query, self.engine)
        
        # Ensure all text columns are properly encoded as UTF-8
        text_columns = ['campaign_title', 'campaign_category', 'organization_name', 'donor_name', 'message']
        for col in text_columns:
            if col in df.columns:
                df[col] = df[col].astype(str).apply(lambda x: x if x != 'nan' else None)
        
        # Ensure donor_id is integer
        if 'donor_id' in df.columns:
            df['donor_id'] = df['donor_id'].fillna(0).astype(int)
        
        # Add mock ML training fields for recommendation algorithm
        if len(df) > 0:
            df['donor_age_range'] = self._generate_age_ranges(len(df))
            df['donor_previous_donations'] = self._generate_previous_donations(len(df))
            df['referral_source'] = self._generate_referral_sources(len(df))
            df['payment_method'] = 'card'  # Default payment method
        
        return df
    
    def _load_campaigns(self) -> pd.DataFrame:
        """Load campaigns data with aggregated donation metrics from Django tables"""
        query = """
        SELECT 
            c.id,
            c.name as title,
            c.description,
            c.target as goal_amount,
            COALESCE(c.current_amount, 0) as current_amount,
            cat.name as category,
            c.created_at,
            c.updated_at,
            c.organization_id,
            c.featured as is_featured,
            CASE WHEN c.target > 0 THEN TRUE ELSE FALSE END as is_active,
            o.org_name as organization_name,
            o.is_verified as organization_verified,
            COALESCE(d.donation_count, 0) as donation_count,
            COALESCE(d.avg_donation, 0) as avg_donation_amount,
            COALESCE(d.max_donation, 0) as max_donation_amount,
            COALESCE(d.min_donation, 0) as min_donation_amount,
            CASE 
                WHEN c.target > 0 THEN 
                    LEAST((COALESCE(c.current_amount, 0) / c.target) * 100, 100)
                ELSE 0 
            END as progress_percentage
        FROM campaign_campaign c
        LEFT JOIN campaign_category cat ON c.category_id = cat.id
        LEFT JOIN organizations_organizationprofile o ON c.organization_id = o.id
        LEFT JOIN (
            SELECT 
                campaign_id,
                COUNT(*) as donation_count,
                AVG(amount) as avg_donation,
                MAX(amount) as max_donation,
                MIN(amount) as min_donation
            FROM campaign_donation 
            WHERE status = 'completed'
            GROUP BY campaign_id
        ) d ON c.id = d.campaign_id
        ORDER BY c.created_at DESC
        """
        
        # Execute query with proper UTF-8 encoding for Arabic text
        df = pd.read_sql_query(query, self.engine)
        
        # Ensure all text columns are properly encoded as UTF-8
        text_columns = ['title', 'description', 'category', 'organization_name']
        for col in text_columns:
            if col in df.columns:
                df[col] = df[col].astype(str).apply(lambda x: x if x != 'nan' else None)
        
        return df
    
    def _load_organizations(self) -> pd.DataFrame:
        """Load organizations data from Django tables"""
        query = """
        SELECT 
            id,
            org_name as name,
            description,
            website,
            phone_number as phone,
            address,
            city,
            country,
            is_verified,
            created_at,
            updated_at,
            'nonprofit' as org_type
        FROM organizations_organizationprofile
        ORDER BY created_at DESC
        """
        
        return pd.read_sql_query(query, self.engine)
    
    def load_donations_by_campaign(self, campaign_id: int) -> pd.DataFrame:
        """Load donations for a specific campaign"""
        query = """
        SELECT d.*, c.name as campaign_title 
        FROM campaign_donation d
        LEFT JOIN campaign_campaign c ON d.campaign_id = c.id
        WHERE d.campaign_id = %(campaign_id)s 
        ORDER BY d.created_at DESC
        """
        
        return pd.read_sql_query(query, self.engine, params={"campaign_id": campaign_id})
    
    def load_campaigns_by_category(self, category: str) -> pd.DataFrame:
        """Load campaigns filtered by category"""
        query = """
        SELECT c.*, cat.name as category_name
        FROM campaign_campaign c
        LEFT JOIN campaign_category cat ON c.category_id = cat.id
        WHERE cat.name = %(category)s
        ORDER BY c.created_at DESC
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
        FROM campaign_donation 
        WHERE created_at >= NOW() - INTERVAL '%(days)s days'
        AND status = 'completed'
        GROUP BY DATE(created_at)
        ORDER BY donation_date DESC
        """
        
        return pd.read_sql_query(query, self.engine, params={"days": days})
    
    def _generate_age_ranges(self, count: int) -> list:
        """Generate mock age ranges for ML training"""
        import random
        ranges = ['18-25', '26-35', '36-50', '51+']
        return [random.choice(ranges) for _ in range(count)]
    
    def _generate_previous_donations(self, count: int) -> list:
        """Generate mock previous donation counts"""
        import random
        return [random.randint(0, 10) for _ in range(count)]
    
    def _generate_referral_sources(self, count: int) -> list:
        """Generate mock referral sources"""
        import random
        sources = ['social_media', 'email', 'direct', 'search', 'friend_referral']
        return [random.choice(sources) for _ in range(count)]


# Convenience function for easy import
def load_django_data() -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Convenience function to load all Django data for ML processing
    
    Returns:
        Tuple of (donations_df, campaigns_df, orgs_df)
    """
    loader = DjangoDataLoader()
    return loader.load_all_data()