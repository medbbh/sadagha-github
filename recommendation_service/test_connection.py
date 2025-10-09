#!/usr/bin/env python3
"""
Simple test script to verify Supabase PostgreSQL connection
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Direct imports to avoid relative import issues
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import pandas as pd
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_database_connection():
    """Test direct PostgreSQL connection to Supabase"""
    
    print("🔍 Testing Supabase PostgreSQL Connection...")
    
    try:
        # Load environment variables
        load_dotenv()
        DATABASE_URL = os.getenv("DATABASE_URL")
        
        if not DATABASE_URL:
            print("❌ DATABASE_URL not found in environment variables")
            return False
        
        print(f"🔗 Connecting to: {DATABASE_URL[:50]}...")
        
        # Create engine and test connection
        engine = create_engine(DATABASE_URL)
        
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1 as test"))
            print("✅ Database connection successful!")
        
        # Check what tables actually exist
        print("\n📊 Discovering all tables in database...")
        
        with engine.connect() as connection:
            # Get all tables in all schemas
            all_tables_query = text("""
                SELECT table_schema, table_name 
                FROM information_schema.tables 
                WHERE table_type = 'BASE TABLE'
                ORDER BY table_schema, table_name
            """)
            
            all_tables_result = connection.execute(all_tables_query)
            all_tables = [(row[0], row[1]) for row in all_tables_result]
            
            print(f"📋 All tables found:")
            for schema, table in all_tables:
                print(f"   - {schema}.{table}")
            
            # Look for campaign/donation related tables
            relevant_tables = []
            for schema, table in all_tables:
                table_lower = table.lower()
                if any(keyword in table_lower for keyword in ['campaign', 'donation', 'org', 'user', 'profile']):
                    relevant_tables.append((schema, table))
                    print(f"🎯 Relevant table found: {schema}.{table}")
            
            # Get sample data from relevant tables
            for schema, table in relevant_tables[:3]:  # Limit to first 3 relevant tables
                try:
                    full_table_name = f'"{schema}"."{table}"' if schema != 'public' else f'"{table}"'
                    count_query = text(f"SELECT COUNT(*) FROM {full_table_name}")
                    count_result = connection.execute(count_query)
                    count = count_result.scalar()
                    print(f"   📊 {schema}.{table}: {count} records")
                    
                    if count > 0:
                        sample_query = text(f"SELECT * FROM {full_table_name} LIMIT 2")
                        sample_df = pd.read_sql_query(sample_query, connection)
                        print(f"     📋 Columns: {list(sample_df.columns)}")
                        
                except Exception as e:
                    print(f"   ❌ {schema}.{table}: Error - {str(e)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Connection Error: {str(e)}")
        return False

def test_basic_queries():
    """Test basic SQL queries that the recommendation engine will use"""
    
    print("\n🎯 Testing Basic Queries...")
    
    try:
        load_dotenv()
        DATABASE_URL = os.getenv("DATABASE_URL")
        engine = create_engine(DATABASE_URL)
        
        # First, let's see what columns exist in each table
        print("🔍 Checking table structures...")
        
        # Check campaign_campaign columns
        campaigns_columns_query = text("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'campaign_campaign' 
            AND table_schema = 'public'
            ORDER BY ordinal_position
        """)
        
        campaigns_columns = pd.read_sql_query(campaigns_columns_query, engine)
        print(f"📋 campaign_campaign columns: {list(campaigns_columns['column_name'])}")
        
        # Check campaign_donation columns  
        donations_columns_query = text("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'campaign_donation' 
            AND table_schema = 'public'
            ORDER BY ordinal_position
        """)
        
        donations_columns = pd.read_sql_query(donations_columns_query, engine)
        print(f"📋 campaign_donation columns: {list(donations_columns['column_name'])}")
        
        # Check organizations_organizationprofile columns
        orgs_columns_query = text("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'organizations_organizationprofile' 
            AND table_schema = 'public'
            ORDER BY ordinal_position
        """)
        
        orgs_columns = pd.read_sql_query(orgs_columns_query, engine)
        print(f"📋 organizations_organizationprofile columns: {list(orgs_columns['column_name'])}")
        
        # Now test with actual column names - just get all columns first
        print("\n🎯 Testing data retrieval...")
        
        # Test campaigns - get first few columns
        campaigns_query = text("SELECT * FROM campaign_campaign LIMIT 2")
        campaigns_df = pd.read_sql_query(campaigns_query, engine)
        print(f"✅ Campaigns: {len(campaigns_df)} records")
        if len(campaigns_df) > 0:
            print(f"   Sample columns: {list(campaigns_df.columns)[:10]}")  # Show first 10 columns
        
        # Test donations
        donations_query = text("SELECT * FROM campaign_donation LIMIT 2")
        donations_df = pd.read_sql_query(donations_query, engine)
        print(f"✅ Donations: {len(donations_df)} records")
        if len(donations_df) > 0:
            print(f"   Sample columns: {list(donations_df.columns)[:10]}")
        
        # Test organizations
        orgs_query = text("SELECT * FROM organizations_organizationprofile LIMIT 2")
        orgs_df = pd.read_sql_query(orgs_query, engine)
        print(f"✅ Organizations: {len(orgs_df)} records")
        if len(orgs_df) > 0:
            print(f"   Sample columns: {list(orgs_df.columns)[:10]}")
        
        return len(campaigns_df) > 0
        
    except Exception as e:
        print(f"❌ Query Error: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 Testing Supabase Connection\n")
    
    connection_ok = test_database_connection()
    
    if connection_ok:
        queries_ok = test_basic_queries()
        
        if queries_ok:
            print("\n🎉 Database tests passed! Ready to start the API server.")
            print("\nNext steps:")
            print("1. Run: uvicorn main:app --reload")
            print("2. Test APIs at: http://localhost:8000/docs")
        else:
            print("\n⚠️  Connection works but no data found in tables.")
    else:
        print("\n❌ Connection failed. Check your DATABASE_URL in .env file.")