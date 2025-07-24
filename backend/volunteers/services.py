# volunteers/services.py
from django.db.models import Q, Case, When, IntegerField, FloatField
from django.utils import timezone
from .models import VolunteerProfile, VolunteerRequest, VolunteerInvitation, VolunteerNotification
import json
from datetime import datetime, timedelta


class VolunteerMatchingService:
    """Service for matching volunteers to requests"""
    
    @staticmethod
    def calculate_match_score(volunteer, request):
        """Calculate match score between volunteer and request (0-100)"""
        score = 0
        max_score = 0
        match_details = {
            'required_matches': {},
            'preferred_matches': {},
            'blocking_issues': []
        }
        
        # Must-have requirements (blocking if not met)
        # Age requirement
        if request.min_age or request.max_age:
            max_score += 20
            if request.min_age and volunteer.age < request.min_age:
                match_details['blocking_issues'].append(f'Age too low (required: ≥{request.min_age})')
                return 0, match_details
            if request.max_age and volunteer.age > request.max_age:
                match_details['blocking_issues'].append(f'Age too high (required: ≤{request.max_age})')
                return 0, match_details
            score += 20
            match_details['required_matches']['age'] = True
        
        # Required skills
        required_skills = request.get_required_skills_list()
        if required_skills:
            max_score += 25
            volunteer_skills = [skill.lower() for skill in volunteer.get_skills_list()]
            missing_skills = []
            matched_skills = []
            
            for skill in required_skills:
                if skill.lower() in volunteer_skills:
                    matched_skills.append(skill)
                else:
                    missing_skills.append(skill)
            
            if missing_skills:
                match_details['blocking_issues'].append(f'Missing required skills: {missing_skills}')
                return 0, match_details
            
            score += 25
            match_details['required_matches']['skills'] = matched_skills
        
        # Required languages
        required_languages = request.get_required_languages_list()
        if required_languages:
            max_score += 15
            volunteer_languages = [lang.lower() for lang in volunteer.get_languages_list()]
            missing_languages = []
            matched_languages = []
            
            for language in required_languages:
                if language.lower() in volunteer_languages:
                    matched_languages.append(language)
                else:
                    missing_languages.append(language)
            
            if missing_languages:
                match_details['blocking_issues'].append(f'Missing required languages: {missing_languages}')
                return 0, match_details
            
            score += 15
            match_details['required_matches']['languages'] = matched_languages
        
        # Required locations
        required_locations = request.get_required_locations_data()
        if required_locations:
            max_score += 20
            volunteer_locations = volunteer.get_available_locations_data()
            
            location_match = False
            for req_loc in required_locations:
                for vol_loc in volunteer_locations:
                    if VolunteerMatchingService._locations_match(req_loc, vol_loc):
                        location_match = True
                        break
                if location_match:
                    break
            
            if not location_match:
                match_details['blocking_issues'].append('No matching required locations')
                return 0, match_details
            
            score += 20
            match_details['required_matches']['location'] = True
        
        # Nice-to-have preferences (add bonus points)
        # Preferred skills
        preferred_skills = request.get_preferred_skills_list()
        if preferred_skills:
            max_score += 15
            volunteer_skills = [skill.lower() for skill in volunteer.get_skills_list()]
            matched_preferred_skills = []
            
            for skill in preferred_skills:
                if skill.lower() in volunteer_skills:
                    matched_preferred_skills.append(skill)
            
            if matched_preferred_skills:
                bonus = (len(matched_preferred_skills) / len(preferred_skills)) * 15
                score += bonus
                match_details['preferred_matches']['skills'] = matched_preferred_skills
        
        # Preferred languages
        preferred_languages = request.get_preferred_languages_list()
        if preferred_languages:
            max_score += 10
            volunteer_languages = [lang.lower() for lang in volunteer.get_languages_list()]
            matched_preferred_languages = []
            
            for language in preferred_languages:
                if language.lower() in volunteer_languages:
                    matched_preferred_languages.append(language)
            
            if matched_preferred_languages:
                bonus = (len(matched_preferred_languages) / len(preferred_languages)) * 10
                score += bonus
                match_details['preferred_matches']['languages'] = matched_preferred_languages
        
        # Preferred interests
        preferred_interests = request.get_preferred_interests_list()
        if preferred_interests:
            max_score += 10
            volunteer_interests = [interest.lower() for interest in volunteer.get_interests_list()]
            matched_preferred_interests = []
            
            for interest in preferred_interests:
                if interest.lower() in volunteer_interests:
                    matched_preferred_interests.append(interest)
            
            if matched_preferred_interests:
                bonus = (len(matched_preferred_interests) / len(preferred_interests)) * 10
                score += bonus
                match_details['preferred_matches']['interests'] = matched_preferred_interests
        
        # Preferred locations
        preferred_locations = request.get_preferred_locations_data()
        if preferred_locations:
            max_score += 5
            volunteer_locations = volunteer.get_available_locations_data()
            
            location_match = False
            for pref_loc in preferred_locations:
                for vol_loc in volunteer_locations:
                    if VolunteerMatchingService._locations_match(pref_loc, vol_loc):
                        location_match = True
                        break
                if location_match:
                    break
            
            if location_match:
                score += 5
                match_details['preferred_matches']['location'] = True
        
        # Calculate final percentage
        if max_score == 0:
            return 100, match_details  # No specific requirements, perfect match
        
        final_score = (score / max_score) * 100
        return round(final_score, 1), match_details
    
    @staticmethod
    def _locations_match(loc1, loc2):
        """Check if two location objects match"""
        # This depends on your location data structure
        # Assuming locations have 'city', 'state', 'country' fields
        if isinstance(loc1, dict) and isinstance(loc2, dict):
            return (loc1.get('city') == loc2.get('city') and 
                   loc1.get('state') == loc2.get('state') and 
                   loc1.get('country') == loc2.get('country'))
        return str(loc1).lower() == str(loc2).lower()
    
    @staticmethod
    def find_matching_volunteers(request, limit=50):
        """Find volunteers that match the request requirements"""
        # Start with active volunteers
        volunteers = VolunteerProfile.objects.filter(is_active=True)
        
        # Exclude already invited volunteers
        already_invited = VolunteerInvitation.objects.filter(
            request=request
        ).values_list('volunteer_id', flat=True)
        volunteers = volunteers.exclude(id__in=already_invited)
        
        # Calculate match scores
        matched_volunteers = []
        
        for volunteer in volunteers[:200]:  # Limit initial query for performance
            score, match_details = VolunteerMatchingService.calculate_match_score(volunteer, request)
            
            # Only include volunteers who meet all required criteria (score > 0)
            if score > 0:
                # Add computed fields to volunteer object
                volunteer.match_score = score
                volunteer.match_details = match_details
                matched_volunteers.append(volunteer)
        
        # Sort by match score (highest first)
        matched_volunteers.sort(key=lambda v: v.match_score, reverse=True)
        
        return matched_volunteers[:limit]
    
    @staticmethod
    def check_availability_conflict(volunteer, request):
        """Check if volunteer has any scheduling conflicts"""
        volunteer_availability = volunteer.get_availability_data()
        
        # This is a simplified check - you'd implement more complex logic
        # based on your availability data structure
        event_date = request.event_date
        event_end = request.event_end_date or (event_date + timedelta(hours=request.duration_hours))
        
        # Check if volunteer is available during the event time
        # Implementation depends on your availability data structure
        return True  # Placeholder - implement based on your needs


class VolunteerNotificationService:
    """Service for managing volunteer notifications"""
    
    @staticmethod
    def create_invitation_notification(invitation):
        """Create notification when volunteer receives invitation"""
        notification = VolunteerNotification.objects.create(
            volunteer=invitation.volunteer,
            notification_type='invitation',
            title=f'New Volunteer Opportunity: {invitation.request.title}',
            message=f'You have been invited to volunteer for "{invitation.request.title}" by {invitation.request.organization.get_full_name()}. The event is on {invitation.request.event_date.strftime("%B %d, %Y at %I:%M %p")}.',
            invitation=invitation,
            request=invitation.request
        )
        return notification
    
    @staticmethod
    def create_status_update_notification(invitation, old_status, new_status):
        """Create notification when invitation status changes"""
        if new_status == 'accepted':
            title = f'Invitation Accepted: {invitation.request.title}'
            message = f'Great! You have accepted the invitation for "{invitation.request.title}". The organization will contact you soon with more details.'
        elif new_status == 'declined':
            title = f'Invitation Declined: {invitation.request.title}'
            message = f'You have declined the invitation for "{invitation.request.title}". Thank you for considering the opportunity.'
        elif new_status == 'expired':
            title = f'Invitation Expired: {invitation.request.title}'
            message = f'Your invitation for "{invitation.request.title}" has expired. Contact the organization if you are still interested.'
        else:
            return None
        
        notification = VolunteerNotification.objects.create(
            volunteer=invitation.volunteer,
            notification_type='invitation_update',
            title=title,
            message=message,
            invitation=invitation,
            request=invitation.request
        )
        return notification
    
    @staticmethod
    def create_request_update_notification(request, volunteers, update_type, message):
        """Create notifications for multiple volunteers about request updates"""
        notifications = []
        
        for volunteer in volunteers:
            notification = VolunteerNotification.objects.create(
                volunteer=volunteer,
                notification_type='request_update',
                title=f'Update: {request.title}',
                message=message,
                request=request
            )
            notifications.append(notification)
        
        return notifications
    
    @staticmethod
    def mark_as_read(notification_ids, volunteer):
        """Mark notifications as read for a volunteer"""
        return VolunteerNotification.objects.filter(
            id__in=notification_ids,
            volunteer=volunteer
        ).update(is_read=True)
    
    @staticmethod
    def get_unread_count(volunteer):
        """Get count of unread notifications for volunteer"""
        return VolunteerNotification.objects.filter(
            volunteer=volunteer,
            is_read=False
        ).count()


class VolunteerInvitationService:
    """Service for managing volunteer invitations"""
    
    @staticmethod
    def send_bulk_invitations(request, volunteer_ids, message="", user=None):
        """Send invitations to multiple volunteers"""
        volunteers = VolunteerProfile.objects.filter(
            id__in=volunteer_ids,
            is_active=True
        )
        
        # Check permission
        if user and user != request.organization:
            raise PermissionError("Only the organization that created the request can send invitations")
        
        # Check if request is still open
        if request.status not in ['open', 'in_progress']:
            raise ValueError("Cannot send invitations for closed requests")
        
        invitations = []
        notifications = []
        
        for volunteer in volunteers:
            # Check if already invited
            if VolunteerInvitation.objects.filter(request=request, volunteer=volunteer).exists():
                continue
            
            # Calculate match score
            match_score, match_details = VolunteerMatchingService.calculate_match_score(volunteer, request)
            
            # Create invitation
            invitation = VolunteerInvitation.objects.create(
                request=request,
                volunteer=volunteer,
                match_score=match_score,
                message=message,
                expires_at=timezone.now() + timedelta(days=7)  # 7 days to respond
            )
            invitations.append(invitation)
            
            # Create notification
            notification = VolunteerNotificationService.create_invitation_notification(invitation)
            notifications.append(notification)
        
        return invitations, notifications
    
    @staticmethod
    def respond_to_invitation(invitation, status, response_message="", user=None):
        """Volunteer responds to invitation"""
        # Check permission
        if user and user != invitation.volunteer.user:
            raise PermissionError("Only the invited volunteer can respond to this invitation")
        
        # Check if still pending
        if invitation.status != 'pending':
            raise ValueError("This invitation has already been responded to")
        
        # Check if expired
        if invitation.expires_at and timezone.now() > invitation.expires_at:
            invitation.status = 'expired'
            invitation.save()
            raise ValueError("This invitation has expired")
        
        old_status = invitation.status
        invitation.status = status
        invitation.response_message = response_message
        invitation.responded_at = timezone.now()
        invitation.save()
        
        # Create notification
        VolunteerNotificationService.create_status_update_notification(
            invitation, old_status, status
        )
        
        return invitation
    
    @staticmethod
    def get_volunteer_invitations(volunteer, status=None):
        """Get invitations for a volunteer"""
        queryset = VolunteerInvitation.objects.filter(volunteer=volunteer)
        
        if status:
            queryset = queryset.filter(status=status)
        
        return queryset.select_related('request', 'request__organization').order_by('-invited_at')
    
    @staticmethod
    def get_request_invitations(request, status=None):
        """Get invitations for a request"""
        queryset = VolunteerInvitation.objects.filter(request=request)
        
        if status:
            queryset = queryset.filter(status=status)
        
        return queryset.select_related('volunteer', 'volunteer__user').order_by('-invited_at')
    
    @staticmethod
    def expire_old_invitations():
        """Expire invitations that have passed their expiry date"""
        expired_invitations = VolunteerInvitation.objects.filter(
            status='pending',
            expires_at__lt=timezone.now()
        )
        
        count = 0
        for invitation in expired_invitations:
            invitation.status = 'expired'
            invitation.save()
            
            # Create notification
            VolunteerNotificationService.create_status_update_notification(
                invitation, 'pending', 'expired'
            )
            count += 1
        
        return count