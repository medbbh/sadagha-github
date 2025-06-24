# utils/supabase_storage.py
import os
import uuid
import environ
import logging
from supabase import create_client, Client
import io

# Set up logger
logger = logging.getLogger(__name__)

# Initialize environment
env = environ.Env()
environ.Env.read_env()

# Get Supabase credentials
supabase_url = env("SUPABASE_URL")
supabase_key = env("SUPABASE_ANON_KEY")
bucket_name = env("SUPABASE_STORAGE_BUCKET", default="campaign")

def test_supabase_connection():
    """
    Test function to verify Supabase connection and bucket access
    """
    if not supabase:
        logger.error("Supabase client not initialized")
        return False
    
    try:
        # List buckets to test connection
        buckets = supabase.storage.list_buckets()
        logger.info(f"Successfully connected to Supabase. Available buckets: {[b['name'] for b in buckets]}")
        
        # Check if our bucket exists
        if bucket_name not in [b['name'] for b in buckets]:
            logger.warning(f"Bucket '{bucket_name}' not found. Available buckets: {[b['name'] for b in buckets]}")
            return False
        
        # Check if we can list files in the bucket
        try:
            files = supabase.storage.from_(bucket_name).list()
            logger.info(f"Successfully listed files in bucket '{bucket_name}': {files[:5] if files else 'No files'}")
            return True
        except Exception as e:
            logger.error(f"Error listing files in bucket '{bucket_name}': {str(e)}")
            return False
            
    except Exception as e:
        logger.error(f"Failed to test Supabase connection: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return False

# Initialize Supabase client
try:
    supabase: Client = create_client(supabase_url, supabase_key)
    logger.info(f"Supabase client initialized with URL: {supabase_url[:20]}...")

except Exception as e:
    logger.error(f"Failed to initialize Supabase client: {str(e)}")
    supabase = None

def upload_file(file_obj, campaign_id):
    """
    Upload any file to Supabase Storage under campaign folder
    Returns: (url, path) tuple or (None, None) if upload fails
    """
    if supabase:
        test_supabase_connection()
        
    if not file_obj:
        logger.warning("No file object provided for upload")
        return None, None
    
    if not supabase:
        logger.error("Supabase client not initialized")
        return None, None
    
    logger.info(f"Starting upload for file: {file_obj.name} to campaign_{campaign_id}")
    
    try:
        # Create unique file name
        ext = os.path.splitext(file_obj.name)[1]
        unique_name = f"{uuid.uuid4()}{ext}"
        file_path = f"campaign_{campaign_id}/{unique_name}"
        
        logger.info(f"Generated path: {file_path}")
        
        # Read file content
        file_content = file_obj.read()
        logger.info(f"Read file content, size: {len(file_content)} bytes")
        
        # Debug: Check if bucket exists
        try:
            buckets = supabase.storage.list_buckets()
            logger.info(f"Available buckets: {[b['name'] for b in buckets]}")
            
            if bucket_name not in [b['name'] for b in buckets]:
                logger.warning(f"Bucket '{bucket_name}' not found in Supabase")
        except Exception as e:
            logger.error(f"Error checking buckets: {str(e)}")
        
        # Upload file
        logger.info(f"Uploading file to bucket: {bucket_name}, path: {file_path}")
        upload_response = supabase.storage.from_(bucket_name).upload(
            file_path,
            file_content,
            {"content-type": getattr(file_obj, 'content_type', 'application/octet-stream')}
        )
        
        logger.info(f"Upload response: {upload_response}")
        
        # Get public URL
        url = supabase.storage.from_(bucket_name).get_public_url(file_path)
        logger.info(f"Generated public URL: {url}")
        
        return url, file_path
    
    except Exception as e:
        logger.error(f"Error uploading to Supabase: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return None, None

def delete_file(file_path):
    """
    Delete a file from Supabase Storage
    """
    if not file_path:
        logger.warning("No file path provided for deletion")
        return False
    
    if not supabase:
        logger.error("Supabase client not initialized")
        return False
    
    logger.info(f"Deleting file: {file_path}")
    
    try:
        supabase.storage.from_(bucket_name).remove([file_path])
        logger.info(f"Successfully deleted file: {file_path}")
        return True
    except Exception as e:
        logger.error(f"Error deleting from Supabase: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return False

