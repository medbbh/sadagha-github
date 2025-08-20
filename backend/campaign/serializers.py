from rest_framework import serializers
from .models import Campaign, Category, File, Donation
from organizations.serializers import OrganizationProfileSerializer
from .utils.facebook_live import FacebookLiveAPI

import logging

# Set up a logger
logger = logging.getLogger(__name__)

class CategorySerializer(serializers.ModelSerializer):
    campaign_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'campaign_count']
        read_only_fields = ['id', 'campaign_count']

class FileSerializer(serializers.ModelSerializer):
    file = serializers.FileField(write_only=True, required=False)
    campaign = serializers.PrimaryKeyRelatedField(
        queryset=Campaign.objects.all(),
        required=False
    )
    
    class Meta:
        model = File
        fields = ['id', 'name', 'url', 'path', 'campaign', 'file']
        read_only_fields = ['url', 'name', 'path']

class CampaignSerializer(serializers.ModelSerializer):
    files = FileSerializer(many=True, read_only=True)
    organization = OrganizationProfileSerializer(source='owner.organization_profile', read_only=True)
    # Get the category name directly
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    # Facebook Live fields
    facebook_live_url = serializers.URLField(required=False, allow_blank=True)
    is_live = serializers.BooleanField(read_only=True)
    has_facebook_live = serializers.BooleanField(read_only=True)
    class Meta:
        model = Campaign
        fields = [
            'id',
            'name',
            'description',
            'category',
            'category_name',
            'owner',
            'target',
            'current_amount',
            'number_of_donors',
            'featured',
            'files',
            'created_at',
            'updated_at',
            'organization',
            
            # Facebook Live fields
            'facebook_live_url',
            'facebook_video_id',
            'live_status',
            'live_viewer_count',
            'is_live',
            'has_facebook_live'
        ]
        read_only_fields = ['owner', 'current_amount', 'number_of_donors', 'created_at', 'updated_at','facebook_video_id', 'live_status', 'live_viewer_count',
            'is_live', 'has_facebook_live']
    
    def validate_facebook_live_url(self, value):
        """
        Validate Facebook Live URL and extract video ID
        """
        if not value:
            return value
        
        is_valid, result = FacebookLiveAPI.validate_facebook_live_url(value)
        if not is_valid:
            raise serializers.ValidationError(f"Invalid Facebook Live URL: {result}")
        
        return value
    
    def update(self, instance, validated_data):
        request = self.context.get('request')
        
        logger.info("=== CAMPAIGN UPDATE STARTED ===")
        logger.info(f"Request DATA: {request.data}")
        logger.info(f"Request FILES: {request.FILES}")
        logger.info(f"Request FILES keys: {list(request.FILES.keys())}")
        
        # Handle Facebook Live URL update
        facebook_live_url = validated_data.get('facebook_live_url')
        if facebook_live_url != instance.facebook_live_url:
            if facebook_live_url:
                # Extract video ID from new URL
                video_id = FacebookLiveAPI.extract_video_id_from_url(facebook_live_url)
                instance.facebook_video_id = video_id
                instance.live_status = 'none'  # Reset status, will be updated by background task
                logger.info(f"Updated Facebook Live URL and extracted video ID: {video_id}")
            else:
                # Clear Facebook Live data
                instance.facebook_video_id = None
                instance.live_status = 'none'
                instance.live_viewer_count = 0
                logger.info("Cleared Facebook Live data")
       
        # Handle file deletions first
        files_to_delete = request.data.getlist('files_to_delete', [])
        logger.info(f"Files to delete: {files_to_delete}")
        
        if files_to_delete:
            from .utils.supabase_storage import delete_file
            
            for file_url in files_to_delete:
                try:
                    logger.info(f"Attempting to delete file with URL: {file_url}")
                    
                    # Find the file in database by URL
                    file_instance = instance.files.filter(url=file_url).first()
                    if file_instance:
                        logger.info(f"Found file to delete: {file_instance.name}")
                        logger.info(f"File path: {file_instance.path}")
                        logger.info(f"File URL: {file_instance.url}")
                        
                        # Try deleting with path first, fallback to URL
                        deletion_success = False
                        if hasattr(file_instance, 'path') and file_instance.path:
                            logger.info(f"Attempting deletion with path: {file_instance.path}")
                            deletion_success = delete_file(file_instance.path)
                        
                        if not deletion_success:
                            logger.info(f"Path deletion failed, trying with URL: {file_instance.url}")
                            deletion_success = delete_file(file_instance.url)
                        
                        if deletion_success:
                            logger.info("Storage deletion successful, removing from database")
                            file_instance.delete()
                        else:
                            logger.error("Storage deletion failed, but removing from database anyway")
                            file_instance.delete()  # Remove from DB even if storage deletion fails
                            
                    else:
                        logger.warning(f"File with URL {file_url} not found in database")
                except Exception as e:
                    logger.error(f"Error deleting file {file_url}: {str(e)}")
        
        # Handle new file uploads using file_* pattern (same as create method)
        file_keys = [key for key in request.FILES.keys() if key.startswith('file_')]
        logger.info(f"Found {len(file_keys)} new files to process: {file_keys}")
        
        if file_keys:
            from .utils.supabase_storage import upload_file
            
            successful_uploads = 0
            failed_uploads = 0
            
            for key in file_keys:
                file_obj = request.FILES[key]
                logger.info(f"Processing file {key}: {file_obj.name}, size={file_obj.size}, content_type={file_obj.content_type}")
                
                try:
                    # Upload to Supabase
                    logger.info(f"Uploading file {file_obj.name} to Supabase...")
                    url, path = upload_file(file_obj, instance.id)
                    
                    if url and path:
                        logger.info(f"SUCCESS: Uploaded {file_obj.name} to {url}")
                        logger.info(f"File path: {path}")
                        
                        try:
                            file_record = File.objects.create(
                                name=file_obj.name,
                                url=url,
                                path=path,  # Store the path for future deletion
                                campaign=instance
                            )
                            logger.info(f"File record created with ID: {file_record.id}")
                            successful_uploads += 1
                        except Exception as file_db_error:
                            logger.error(f"Failed to create File DB record: {str(file_db_error)}")
                            failed_uploads += 1
                    else:
                        logger.error(f"Failed to upload file to Supabase: No URL or path returned")
                        failed_uploads += 1
                
                except Exception as upload_error:
                    logger.error(f"Error during file upload: {str(upload_error)}")
                    import traceback
                    logger.error(traceback.format_exc())
                    failed_uploads += 1
            
            logger.info(f"Upload summary: {successful_uploads} successful, {failed_uploads} failed")
        
        # Update regular fields
        instance.name = validated_data.get('name', instance.name)
        instance.description = validated_data.get('description', instance.description)
        instance.category = validated_data.get('category', instance.category)
        instance.target = validated_data.get('target', instance.target)
        instance.featured = validated_data.get('featured', instance.featured)
        instance.facebook_live_url = validated_data.get('facebook_live_url', instance.facebook_live_url)

        instance.save()
        
        logger.info("=== CAMPAIGN UPDATE COMPLETED ===")
        return instance
    
    def create(self, validated_data):
        request = self.context.get('request')
        
        # EXTENSIVE DEBUG LOGGING
        logger.info("=== CAMPAIGN CREATION STARTED ===")
        logger.info(f"Request DATA: {request.data}")
        logger.info(f"Request FILES: {request.FILES}")
        logger.info(f"Validated data: {validated_data}")

        # Handle Facebook Live URL
        facebook_live_url = validated_data.get('facebook_live_url')
        if facebook_live_url:
            video_id = FacebookLiveAPI.extract_video_id_from_url(facebook_live_url)
            validated_data['facebook_video_id'] = video_id
            logger.info(f"Extracted Facebook video ID: {video_id}")
        
        # Make sure 'owner' is not in validated_data to avoid conflicts
        if 'owner' in validated_data:
            validated_data.pop('owner')
        
        try:
            # Create the campaign
            logger.info("Creating campaign...")
            campaign = Campaign.objects.create(
                owner=request.user,
                **validated_data
            )
            logger.info(f"Campaign created: ID={campaign.id}, Name={campaign.name}")
            
            # Look for file patterns
            file_keys = [key for key in request.FILES.keys() if key.startswith('file_')]
            logger.info(f"Found {len(file_keys)} files to process: {file_keys}")
            
            from .utils.supabase_storage import upload_file
            
            for key in file_keys:
                file_obj = request.FILES[key]
                logger.info(f"Processing file {key}: {file_obj.name}, size={file_obj.size}, content_type={file_obj.content_type}")
                
                try:
                    # Upload to Supabase
                    logger.info(f"Uploading file {file_obj.name} to Supabase...")
                    url, path = upload_file(file_obj, campaign.id)
                    
                    if url:
                        logger.info(f"SUCCESS: Uploaded {file_obj.name} to {url}")
                        logger.info(f"Creating File DB record...")
                        
                        try:
                            file_record = File.objects.create(
                                name=file_obj.name,
                                url=url,
                                path=path,  # Store the path for future deletion
                                campaign=campaign
                            )
                            logger.info(f"File record created with ID: {file_record.id}")
                        except Exception as file_db_error:
                            logger.error(f"Failed to create File DB record: {str(file_db_error)}")
                    else:
                        logger.error(f"Failed to upload file to Supabase: No URL returned")
                
                except Exception as upload_error:
                    logger.error(f"Error during file upload: {str(upload_error)}")
                    import traceback
                    logger.error(traceback.format_exc())
            
            logger.info("=== CAMPAIGN CREATION COMPLETED ===")
            return campaign
        
        except Exception as campaign_error:
            logger.error(f"Error during campaign creation: {str(campaign_error)}")
            import traceback
            logger.error(traceback.format_exc())
            raise


class DonationSerializer(serializers.ModelSerializer):
    """Serializer for donation display/listing"""
    donor_display_name = serializers.ReadOnlyField()
    campaign_name = serializers.CharField(source='campaign.name', read_only=True)
    organization_name = serializers.CharField(source='campaign.organization.name', read_only=True)

    class Meta:
        model = Donation
        fields = [
            'id',
            'campaign',
            'campaign_name',
            'organization_name',
            'donor',
            'donor_display_name',
            'donor_name',
            'amount',
            'status',
            'message',
            'is_anonymous',
            'created_at',
            'completed_at'
        ]
        read_only_fields = [
            'id',
            'donor',
            'status',
            'created_at',
            'completed_at'
        ]


class DonationCreateSerializer(serializers.Serializer):
    """Serializer for creating donation payment sessions"""
    amount = serializers.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        min_value=1,
        error_messages={
            'min_value': 'Amount must be at least 1 MRU',
            'invalid': 'Please enter a valid amount'
        }
    )

    donor_name = serializers.CharField(
        max_length=255, 
        required=False, 
        allow_blank=True,
        help_text="Donor's name (optional)"
    )
    message = serializers.CharField(
        required=False, 
        allow_blank=True,
        max_length=1000,
        help_text="Optional message to the campaign (max 1000 characters)"
    )
    is_anonymous = serializers.BooleanField(
        default=False,
        help_text="Make this donation anonymous"
    )

    def validate_amount(self, value):
        """Additional amount validation"""
        if 10 < value > 1000000:  # 1 million MRU limit
            raise serializers.ValidationError("Amount cannot exceed 1,000,000 MRU")
        return value

    def validate(self, data):
        """Cross-field validation"""
        # If not anonymous, require either email or name
        if not data.get('is_anonymous', False):
            if not data.get('donor_name'):
                raise serializers.ValidationError(
                    "Please provide either your email or name, or make the donation anonymous"
                )
        return data


class DonationStatsSerializer(serializers.Serializer):
    """Serializer for donation statistics"""
    total_amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_donations = serializers.IntegerField()
    completed_donations = serializers.IntegerField()
    pending_donations = serializers.IntegerField()
    average_donation = serializers.DecimalField(max_digits=10, decimal_places=2)
    currency = serializers.CharField(default='MRU')