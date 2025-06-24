import requests
from django.core.files.uploadedfile import InMemoryUploadedFile, TemporaryUploadedFile
import os
import uuid
import environ
import mimetypes

# Initialize environment
env = environ.Env()
environ.Env.read_env()

# Supabase storage configuration
SUPABASE_URL = env("SUPABASE_URL")  
SUPABASE_KEY = env("SUPABASE_ANON_KEY")  
BUCKET_NAME = env("SUPABASE_STORAGE_BUCKET_ORG", default="org-documents") 

def upload_to_supabase(file, prefix=''):
    """
    Upload a file to Supabase Storage.
    
    Args:
        file: The file object to upload (django.core.files.uploadedfile.UploadedFile)
        prefix: Optional prefix for the filename
    
    Returns:
        tuple: (url, path) where url is the accessible URL and path is the storage path
    """
    if not file:
        print("No file provided")
        return None, None
        
    # Get the original filename and extension
    original_name = getattr(file, 'name', 'document')
    file_extension = os.path.splitext(original_name)[1] or '.pdf'
    
    # Generate a unique filename
    if prefix:
        filename = f"{prefix}_{uuid.uuid4()}{file_extension}"
    else:
        filename = f"{uuid.uuid4()}{file_extension}"
    
    print(f"Generated filename: {filename}")
    print(f"File size: {file.size if hasattr(file, 'size') else 'unknown'}")
    print(f"File type: {type(file)}")
    
    try:
        # Prepare the API URL for Supabase storage
        upload_url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/{filename}"
        print(f"Upload URL: {upload_url}")
        
        # Get the content type
        content_type = getattr(file, 'content_type', None)
        if not content_type:
            content_type, _ = mimetypes.guess_type(filename)
        if not content_type:
            content_type = 'application/pdf'  # Default for PDF
        
        print(f"Content type: {content_type}")
        
        # Prepare headers - simplified approach
        headers = {
            'Authorization': f'Bearer {SUPABASE_KEY}',
            'Content-Type': content_type,
        }
        
        # Handle different file objects properly
        try:
            if isinstance(file, InMemoryUploadedFile):
                file_content = file.read()
                file.seek(0)  # Reset file pointer after reading
                print("Read InMemoryUploadedFile")
            elif isinstance(file, TemporaryUploadedFile):
                with open(file.temporary_file_path(), 'rb') as f:
                    file_content = f.read()
                print("Read TemporaryUploadedFile")
            else:
                # Try a generic approach if the file type is unknown
                file_content = file.read()
                try:
                    file.seek(0)  # Attempt to reset file pointer
                except:
                    pass  # Ignore if seek fails
                print(f"Read generic file type: {type(file)}")
        except Exception as e:
            print(f"Error reading file content: {str(e)}")
            return None, None

        print(f"File content length: {len(file_content)} bytes")
        
        # Upload the file content using PUT method (recommended for Supabase)
        response = requests.put(
            upload_url,
            data=file_content,
            headers=headers,
            timeout=30  # Add timeout
        )
        
        print(f"Response status code: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")
        print(f"Response text: {response.text}")
        
        # Check response
        if response.status_code >= 200 and response.status_code < 300:
            # Create the file URL
            file_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{filename}"
            # The path reference for the file in Supabase
            file_path = f"{BUCKET_NAME}/{filename}"
            
            print(f"Upload successful! File URL: {file_url}")
            return file_url, file_path
        else:
            print(f"Error uploading to Supabase: {response.status_code}")
            print(f"Error response: {response.text}")
            
            # Try to parse error response
            try:
                error_data = response.json()
                print(f"Error details: {error_data}")
            except:
                pass
                
            return None, None
            
    except requests.exceptions.Timeout:
        print("Upload timeout - file may be too large or connection is slow")
        return None, None
    except requests.exceptions.RequestException as e:
        print(f"Request exception uploading to Supabase: {str(e)}")
        return None, None
    except Exception as e:
        print(f"General exception uploading to Supabase: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return None, None

def delete_from_supabase(path):
    """
    Delete a file from Supabase Storage.
    
    Args:
        path: The storage path of the file to delete (format: 'bucket_name/filename')
    
    Returns:
        bool: True if deletion was successful, False otherwise
    """
    if not path or '/' not in path:
        print(f"Invalid path for deletion: {path}")
        return False
    
    try:
        # Split the path into bucket and filename
        parts = path.split('/', 1)
        if len(parts) != 2:
            print(f"Invalid path format: {path}")
            return False
            
        bucket, filename = parts
        print(f"Deleting file: {filename} from bucket: {bucket}")
        
        # Prepare the API URL for deletion
        delete_url = f"{SUPABASE_URL}/storage/v1/object/{bucket}/{filename}"
        
        # Prepare headers
        headers = {
            'Authorization': f'Bearer {SUPABASE_KEY}'
        }
        
        # Delete the file
        response = requests.delete(
            delete_url,
            headers=headers,
            timeout=30
        )
        
        print(f"Delete response status: {response.status_code}")
        print(f"Delete response: {response.text}")
        
        # Check response
        if response.status_code >= 200 and response.status_code < 300:
            print("File deleted successfully")
            return True
        else:
            print(f"Error deleting from Supabase: {response.status_code}, {response.text}")
            return False
            
    except Exception as e:
        print(f"Exception deleting from Supabase: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return False

def test_supabase_connection():
    """Test the Supabase connection and bucket access"""
    try:
        # Test bucket access
        test_url = f"{SUPABASE_URL}/storage/v1/bucket/{BUCKET_NAME}"
        headers = {
            'Authorization': f'Bearer {SUPABASE_KEY}'
        }
        
        response = requests.get(test_url, headers=headers)
        print(f"Bucket test response: {response.status_code}")
        print(f"Bucket test response: {response.text}")
        
        return response.status_code < 400
        
    except Exception as e:
        print(f"Connection test failed: {str(e)}")
        return False