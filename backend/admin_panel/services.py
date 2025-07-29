from django.db import models
from django.db.models import Count, Sum, Q, Avg, F, Case, When, FloatField, Max, Min
from django.utils import timezone
from datetime import timedelta
from accounts.models import User
from campaign.models import Donation, Campaign, Category
from organizations.models import OrganizationProfile, ManualPayment, NextPayPayment
from volunteers.models import VolunteerProfile, VolunteerInvitation
from .models import AdminAction
import logging
from organizations.models import OrganizationProfile, WalletProvider

logger = logging.getLogger(__name__)

class UserManagementService:
    """Service class for user management operations"""
    
    @staticmethod
    def get_user_statistics():
        """Get comprehensive user statistics"""
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)
        seven_days_ago = now - timedelta(days=7)
        
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        
        # Role breakdown
        role_stats = User.objects.values('role').annotate(
            count=Count('id')
        ).order_by('role')
        
        # Recent activity
        new_users_30d = User.objects.filter(date_joined__gte=thirty_days_ago).count()
        new_users_7d = User.objects.filter(date_joined__gte=seven_days_ago).count()
        
        # Login activity
        recent_logins = User.objects.filter(last_login__gte=seven_days_ago).count()
        
        # Organization stats
        total_orgs = OrganizationProfile.objects.count()
        verified_orgs = OrganizationProfile.objects.filter(is_verified=True).count()
        pending_verification = OrganizationProfile.objects.filter(is_verified=False).count()
        
        # Volunteer stats
        total_volunteers = VolunteerProfile.objects.count()
        active_volunteers = VolunteerProfile.objects.filter(is_active=True).count()
        
        return {
            'total_users': total_users,
            'active_users': active_users,
            'inactive_users': total_users - active_users,
            'role_breakdown': {item['role']: item['count'] for item in role_stats},
            'growth': {
                'new_users_30d': new_users_30d,
                'new_users_7d': new_users_7d,
                'growth_rate_30d': (new_users_30d / total_users * 100) if total_users > 0 else 0
            },
            'activity': {
                'recent_logins_7d': recent_logins,
                'login_rate': (recent_logins / active_users * 100) if active_users > 0 else 0
            },
            'organizations': {
                'total': total_orgs,
                'verified': verified_orgs,
                'pending_verification': pending_verification,
                'verification_rate': (verified_orgs / total_orgs * 100) if total_orgs > 0 else 0
            },
            'volunteers': {
                'total': total_volunteers,
                'active': active_volunteers,
                'inactive': total_volunteers - active_volunteers
            }
        }
    
    @staticmethod
    def perform_bulk_action(admin_user, action_type, user_ids, metadata=None):
        """Perform bulk actions on users"""
        if metadata is None:
            metadata = {}
        
        users = User.objects.filter(id__in=user_ids)
        affected_count = 0
        details = {}
        
        if action_type == 'activate':
            affected_count = users.update(is_active=True)
            details['action'] = 'Users activated'
            
        elif action_type == 'deactivate':
            affected_count = users.update(is_active=False)
            details['action'] = 'Users deactivated'
            
        elif action_type == 'change_role':
            new_role = metadata.get('role')
            if new_role in ['user', 'organization', 'admin']:
                affected_count = users.update(role=new_role)
                details['action'] = f'Role changed to {new_role}'
            else:
                raise ValueError('Invalid role specified')
                
        elif action_type == 'delete':
            # Soft delete
            affected_count = users.update(is_active=False)
            details['action'] = 'Users soft deleted (deactivated)'
            
        else:
            raise ValueError(f'Invalid action type: {action_type}')
        
        # Log the bulk action
        UserManagementService.log_admin_action(
            admin_user=admin_user,
            action_type=f'bulk_{action_type}',
            target_user=None,
            description=f'Bulk {action_type} performed on {affected_count} users',
            metadata={
                'user_ids': user_ids,
                'affected_count': affected_count,
                **metadata
            }
        )
        
        return {
            'affected_count': affected_count,
            'details': details
        }
    
    @staticmethod
    def get_user_activity(user):
        """Get comprehensive user activity"""
        activities = []
        
        # Recent donations
        recent_donations = user.donations.filter(
            status='completed'
        ).order_by('-created_at')[:10]
        
        for donation in recent_donations:
            activities.append({
                'activity_type': 'donation',
                'description': f'Donated {donation.amount} MRU to {donation.campaign.name}',
                'timestamp': donation.created_at,
                'metadata': {
                    'donation_id': donation.id,
                    'amount': str(donation.amount),
                    'campaign_name': donation.campaign.name
                }
            })
        
        # Recent campaigns (for organizations)
        if user.role == 'organization':
            recent_campaigns = user.campaigns.order_by('-created_at')[:10]
            for campaign in recent_campaigns:
                activities.append({
                    'activity_type': 'campaign_created',
                    'description': f'Created campaign: {campaign.name}',
                    'timestamp': campaign.created_at,
                    'metadata': {
                        'campaign_id': campaign.id,
                        'campaign_name': campaign.name,
                        'target': str(campaign.target)
                    }
                })
        
        # Volunteer activities
        if hasattr(user, 'volunteer_profile'):
            recent_invitations = VolunteerInvitation.objects.filter(
                volunteer=user.volunteer_profile
            ).order_by('-invited_at')[:10]
            
            for invitation in recent_invitations:
                activities.append({
                    'activity_type': 'volunteer_invitation',
                    'description': f'Invitation {invitation.status} for {invitation.request.title}',
                    'timestamp': invitation.invited_at,
                    'metadata': {
                        'invitation_id': invitation.id,
                        'request_title': invitation.request.title,
                        'status': invitation.status
                    }
                })
        
        # Sort all activities by timestamp
        activities.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return activities[:20]  # Return last 20 activities
    
    @staticmethod
    def get_comprehensive_profile(user):
        """Get comprehensive user profile data"""
        profile_data = {
            'basic_info': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'full_name': f"{user.first_name} {user.last_name}".strip(),
                'role': user.role,
                'is_active': user.is_active,
                'is_platform_admin': user.is_platform_admin,
                'date_joined': user.date_joined,
                'last_login': user.last_login,
                'phone_number': user.phone_number
            },
            'statistics': {},
            'organization_profile': None,
            'volunteer_profile': None,
            'recent_activity': UserManagementService.get_user_activity(user)[:5]
        }
        
        # Add role-specific data
        if user.role == 'organization' and hasattr(user, 'organization_profile'):
            org_profile = user.organization_profile
            profile_data['organization_profile'] = {
                'org_name': org_profile.org_name,
                'description': org_profile.description,
                'address': org_profile.address,
                'website': org_profile.website,
                'is_verified': org_profile.is_verified,
                'created_at': org_profile.created_at,
                'has_payment_methods': org_profile.has_payment_methods_configured()
            }
            
            # Organization statistics
            profile_data['statistics'] = {
                'total_campaigns': user.campaigns.count(),
                'active_campaigns': user.campaigns.filter(
                    current_amount__lt=models.F('target')
                ).count(),
                'total_raised': user.campaigns.aggregate(
                    total=Sum('current_amount')
                )['total'] or 0,
                'total_donors': user.campaigns.aggregate(
                    total=Sum('number_of_donors')
                )['total'] or 0
            }
        
        elif hasattr(user, 'volunteer_profile'):
            vol_profile = user.volunteer_profile
            profile_data['volunteer_profile'] = {
                'phone': vol_profile.phone,
                'age': vol_profile.age,
                'profession': vol_profile.profession,
                'skills': vol_profile.get_skills_list(),
                'interests': vol_profile.get_interests_list(),
                'languages': vol_profile.get_languages_list(),
                'is_active': vol_profile.is_active,
                'created_at': vol_profile.created_at
            }
            
            # Volunteer statistics
            invitations = VolunteerInvitation.objects.filter(volunteer=vol_profile)
            profile_data['statistics'] = {
                'total_invitations': invitations.count(),
                'accepted_invitations': invitations.filter(status='accepted').count(),
                'declined_invitations': invitations.filter(status='declined').count(),
                'pending_invitations': invitations.filter(status='pending').count()
            }
        
        # User donation statistics
        donations = user.donations.filter(status='completed')
        profile_data['statistics']['donations'] = {
            'total_donated': donations.aggregate(total=Sum('amount'))['total'] or 0,
            'donation_count': donations.count(),
            'campaigns_supported': donations.values('campaign').distinct().count(),
            'average_donation': donations.aggregate(avg=Avg('amount'))['avg'] or 0
        }
        
        return profile_data
    
    @staticmethod
    def get_recent_platform_activity(days=7, limit=50):
        """Get recent activity across the platform"""
        cutoff_date = timezone.now() - timedelta(days=days)
        activities = []
        
        # Recent user registrations
        new_users = User.objects.filter(date_joined__gte=cutoff_date).order_by('-date_joined')[:limit//4]
        for user in new_users:
            activities.append({
                'type': 'user_registration',
                'user_id': user.id,
                'username': user.username,
                'description': f'New {user.role} registered',
                'timestamp': user.date_joined
            })
        
        # Recent donations
        recent_donations = Donation.objects.filter(
            created_at__gte=cutoff_date,
            status='completed'
        ).select_related('donor', 'campaign').order_by('-created_at')[:limit//4]
        
        for donation in recent_donations:
            activities.append({
                'type': 'donation',
                'user_id': donation.donor.id if donation.donor else None,
                'username': donation.donor.username if donation.donor else 'Anonymous',
                'description': f'Donated {donation.amount} MRU to {donation.campaign.name}',
                'timestamp': donation.created_at,
                'metadata': {
                    'amount': str(donation.amount),
                    'campaign_name': donation.campaign.name
                }
            })
        
        # Recent campaigns
        recent_campaigns = Campaign.objects.filter(
            created_at__gte=cutoff_date
        ).select_related('owner').order_by('-created_at')[:limit//4]
        
        for campaign in recent_campaigns:
            activities.append({
                'type': 'campaign_created',
                'user_id': campaign.owner.id,
                'username': campaign.owner.username,
                'description': f'Created campaign: {campaign.name}',
                'timestamp': campaign.created_at,
                'metadata': {
                    'campaign_name': campaign.name,
                    'target': str(campaign.target)
                }
            })
        
        # Recent organization verifications
        recent_orgs = OrganizationProfile.objects.filter(
            updated_at__gte=cutoff_date,
            is_verified=True
        ).select_related('owner').order_by('-updated_at')[:limit//4]
        
        for org in recent_orgs:
            activities.append({
                'type': 'organization_verified',
                'user_id': org.owner.id,
                'username': org.owner.username,
                'description': f'Organization verified: {org.org_name or "Unnamed Organization"}',
                'timestamp': org.updated_at,
                'metadata': {
                    'org_name': org.org_name
                }
            })
        
        # Sort all activities by timestamp
        activities.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return activities[:limit]
    
    @staticmethod
    def detect_suspicious_activity():
        """Detect potentially suspicious user activity"""
        suspicious_users = []
        now = timezone.now()
        
        # Users with unusually high donation activity
        high_donation_users = User.objects.annotate(
            donation_count_24h=Count(
                'donations',
                filter=Q(
                    donations__created_at__gte=now - timedelta(hours=24),
                    donations__status='completed'
                )
            ),
            total_donated_24h=Sum(
                'donations__amount',
                filter=Q(
                    donations__created_at__gte=now - timedelta(hours=24),
                    donations__status='completed'
                )
            )
        ).filter(
            Q(donation_count_24h__gt=10) | Q(total_donated_24h__gt=10000)
        )
        
        for user in high_donation_users:
            suspicious_users.append({
                'user_id': user.id,
                'username': user.username,
                'email': user.email,
                'reason': 'High donation activity in 24h',
                'details': {
                    'donations_24h': user.donation_count_24h,
                    'amount_24h': str(user.total_donated_24h or 0)
                },
                'risk_level': 'medium'
            })
        
        # Organizations with many campaigns created recently
        high_campaign_orgs = User.objects.filter(
            role='organization'
        ).annotate(
            campaigns_7d=Count(
                'campaigns',
                filter=Q(campaigns__created_at__gte=now - timedelta(days=7))
            )
        ).filter(campaigns_7d__gt=5)
        
        for org in high_campaign_orgs:
            suspicious_users.append({
                'user_id': org.id,
                'username': org.username,
                'email': org.email,
                'reason': 'Many campaigns created in 7 days',
                'details': {
                    'campaigns_7d': org.campaigns_7d
                },
                'risk_level': 'low'
            })
        
        # Users with failed login attempts (if you track this)
        # This would require additional login attempt tracking
        
        return suspicious_users
    
    @staticmethod
    def log_admin_action(admin_user, action_type, target_user=None, description="", metadata=None):
        """Log admin actions for audit trail"""
        if metadata is None:
            metadata = {}
        
        AdminAction.objects.create(
            admin_user=admin_user,
            action_type=action_type,
            target_model='User',
            target_id=target_user.id if target_user else None,
            description=description,
            metadata={
                'target_username': target_user.username if target_user else None,
                'target_email': target_user.email if target_user else None,
                **metadata
            }
        )


class OrganizationManagementService:
    """Service class for organization management operations"""
    
    @staticmethod
    def get_organization_statistics():
        """Get comprehensive organization statistics"""
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)
        seven_days_ago = now - timedelta(days=7)
        
        total_orgs = OrganizationProfile.objects.count()
        verified_orgs = OrganizationProfile.objects.filter(is_verified=True).count()
        pending_verification = OrganizationProfile.objects.filter(is_verified=False).count()
        
        # Document status
        orgs_with_documents = OrganizationProfile.objects.exclude(document_url='').count()
        orgs_without_documents = OrganizationProfile.objects.filter(document_url='').count()
        
        # Payment methods
        orgs_with_payment_methods = OrganizationProfile.objects.filter(
            Q(manual_payments__is_active=True) | 
            Q(nextpay_payments__is_active=True)
        ).distinct().count()
        
        # Recent activity
        new_orgs_30d = OrganizationProfile.objects.filter(created_at__gte=thirty_days_ago).count()
        new_orgs_7d = OrganizationProfile.objects.filter(created_at__gte=seven_days_ago).count()
        recent_verifications = OrganizationProfile.objects.filter(
            is_verified=True,
            updated_at__gte=seven_days_ago
        ).count()
        
        # Campaign and fundraising stats
        total_campaigns = Campaign.objects.filter(owner__role='organization').count()
        total_raised = Campaign.objects.filter(owner__role='organization').aggregate(
            total=Sum('current_amount')
        )['total'] or 0
        
        # Average performance
        avg_campaigns_per_org = Campaign.objects.filter(owner__role='organization').count() / total_orgs if total_orgs > 0 else 0
        avg_raised_per_org = total_raised / total_orgs if total_orgs > 0 else 0
        
        return {
            'overview': {
                'total_organizations': total_orgs,
                'verified_organizations': verified_orgs,
                'pending_verification': pending_verification,
                'verification_rate': (verified_orgs / total_orgs * 100) if total_orgs > 0 else 0
            },
            'documents': {
                'with_documents': orgs_with_documents,
                'without_documents': orgs_without_documents,
                'document_submission_rate': (orgs_with_documents / total_orgs * 100) if total_orgs > 0 else 0
            },
            'payment_methods': {
                'configured': orgs_with_payment_methods,
                'not_configured': total_orgs - orgs_with_payment_methods,
                'configuration_rate': (orgs_with_payment_methods / total_orgs * 100) if total_orgs > 0 else 0
            },
            'growth': {
                'new_organizations_30d': new_orgs_30d,
                'new_organizations_7d': new_orgs_7d,
                'recent_verifications_7d': recent_verifications,
                'growth_rate_30d': (new_orgs_30d / total_orgs * 100) if total_orgs > 0 else 0
            },
            'fundraising': {
                'total_campaigns': total_campaigns,
                'total_raised': str(total_raised),
                'average_campaigns_per_org': round(avg_campaigns_per_org, 2),
                'average_raised_per_org': str(round(avg_raised_per_org, 2))
            }
        }
    
    @staticmethod
    def bulk_verify_organizations(admin_user, organization_ids, notes=""):
        """Bulk verify organizations"""
        organizations = OrganizationProfile.objects.filter(id__in=organization_ids)
        
        verified_count = 0
        already_verified_count = 0
        not_found_count = len(organization_ids) - organizations.count()
        
        for org in organizations:
            if org.is_verified:
                already_verified_count += 1
            else:
                org.is_verified = True
                org.save()
                verified_count += 1
                
                # Log individual verification
                OrganizationManagementService.log_admin_action(
                    admin_user=admin_user,
                    action_type='bulk_verify_organization',
                    target_organization=org,
                    description=f"Bulk verified organization: {org.org_name}",
                    metadata={
                        'verification_notes': notes,
                        'bulk_operation': True
                    }
                )
        
        # Log bulk operation summary
        OrganizationManagementService.log_admin_action(
            admin_user=admin_user,
            action_type='bulk_verification_summary',
            target_organization=None,
            description=f"Bulk verification completed: {verified_count} verified, {already_verified_count} already verified",
            metadata={
                'organization_ids': organization_ids,
                'verified_count': verified_count,
                'already_verified_count': already_verified_count,
                'not_found_count': not_found_count,
                'notes': notes
            }
        )
        
        return {
            'verified_count': verified_count,
            'already_verified_count': already_verified_count,
            'not_found_count': not_found_count
        }
    
    @staticmethod
    def get_organization_financial_analytics(organization):
        """Get detailed financial analytics for an organization"""
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)
        ninety_days_ago = now - timedelta(days=90)
        
        campaigns = organization.owner.campaigns.all()
        
        # Overall stats
        total_campaigns = campaigns.count()
        active_campaigns = campaigns.filter(current_amount__lt=F('target')).count()
        completed_campaigns = campaigns.filter(current_amount__gte=F('target')).count()
        
        # Financial metrics
        total_raised = campaigns.aggregate(total=Sum('current_amount'))['total'] or 0
        total_target = campaigns.aggregate(total=Sum('target'))['total'] or 0
        total_donors = campaigns.aggregate(total=Sum('number_of_donors'))['total'] or 0
        
        # Recent performance
        recent_campaigns = campaigns.filter(created_at__gte=thirty_days_ago)
        recent_raised = recent_campaigns.aggregate(total=Sum('current_amount'))['total'] or 0
        recent_campaigns_count = recent_campaigns.count()
        
        # Donation analytics
        all_donations = Donation.objects.filter(
            campaign__in=campaigns,
            status='completed'
        )
        
        recent_donations = all_donations.filter(created_at__gte=thirty_days_ago)
        avg_donation = all_donations.aggregate(avg=Avg('amount'))['avg'] or 0
        recent_avg_donation = recent_donations.aggregate(avg=Avg('amount'))['avg'] or 0
        
        # Success rates
        overall_success_rate = (total_raised / total_target * 100) if total_target > 0 else 0
        campaign_completion_rate = (completed_campaigns / total_campaigns * 100) if total_campaigns > 0 else 0
        
        # Monthly breakdown (last 6 months)
        monthly_data = []
        for i in range(6):
            month_start = now - timedelta(days=(i+1)*30)
            month_end = now - timedelta(days=i*30)
            
            month_donations = all_donations.filter(
                created_at__gte=month_start,
                created_at__lt=month_end
            )
            
            monthly_data.append({
                'month': month_start.strftime('%Y-%m'),
                'donations_count': month_donations.count(),
                'amount_raised': str(month_donations.aggregate(total=Sum('amount'))['total'] or 0),
                'unique_donors': month_donations.values('donor').distinct().count()
            })
        
        return {
            'overview': {
                'total_campaigns': total_campaigns,
                'active_campaigns': active_campaigns,
                'completed_campaigns': completed_campaigns,
                'campaign_completion_rate': round(campaign_completion_rate, 2)
            },
            'financial': {
                'total_raised': str(total_raised),
                'total_target': str(total_target),
                'overall_success_rate': round(overall_success_rate, 2),
                'total_donors': total_donors,
                'average_donation': str(round(avg_donation, 2))
            },
            'recent_performance': {
                'campaigns_last_30d': recent_campaigns_count,
                'raised_last_30d': str(recent_raised),
                'donations_last_30d': recent_donations.count(),
                'avg_donation_last_30d': str(round(recent_avg_donation, 2)),
                'donors_last_30d': recent_donations.values('donor').distinct().count()
            },
            'monthly_breakdown': monthly_data
        }
    
    @staticmethod
    def get_performance_metrics():
        """Get organization performance metrics"""
        # Top performing organizations
        top_fundraisers = OrganizationProfile.objects.select_related('owner').annotate(
            total_raised=Sum('owner__campaigns__current_amount'),
            campaign_count=Count('owner__campaigns'),
            donor_count=Sum('owner__campaigns__number_of_donors')
        ).filter(total_raised__gt=0).order_by('-total_raised')[:10]
        
        # Most active organizations
        most_active = OrganizationProfile.objects.select_related('owner').annotate(
            campaign_count=Count('owner__campaigns')
        ).filter(campaign_count__gt=0).order_by('-campaign_count')[:10]
        
        # Recently verified organizations
        recently_verified = OrganizationProfile.objects.filter(
            is_verified=True,
            updated_at__gte=timezone.now() - timedelta(days=7)
        ).select_related('owner').order_by('-updated_at')[:10]
        
        # Organizations needing attention (no campaigns, no verification)
        needs_attention = OrganizationProfile.objects.select_related('owner').annotate(
            campaign_count=Count('owner__campaigns')
        ).filter(
            is_verified=False,
            campaign_count=0,
            created_at__lte=timezone.now() - timedelta(days=30)
        ).order_by('created_at')[:10]
        
        return {
            'top_fundraisers': [{
                'id': org.id,
                'org_name': org.org_name or 'Unnamed Organization',
                'owner_name': f"{org.owner.first_name} {org.owner.last_name}".strip() or org.owner.username,
                'total_raised': str(org.total_raised or 0),
                'campaign_count': org.campaign_count,
                'donor_count': org.donor_count or 0,
                'is_verified': org.is_verified
            } for org in top_fundraisers],
            
            'most_active': [{
                'id': org.id,
                'org_name': org.org_name or 'Unnamed Organization',
                'owner_name': f"{org.owner.first_name} {org.owner.last_name}".strip() or org.owner.username,
                'campaign_count': org.campaign_count,
                'is_verified': org.is_verified,
                'created_at': org.created_at
            } for org in most_active],
            
            'recently_verified': [{
                'id': org.id,
                'org_name': org.org_name or 'Unnamed Organization',
                'owner_name': f"{org.owner.first_name} {org.owner.last_name}".strip() or org.owner.username,
                'verified_at': org.updated_at,
                'created_at': org.created_at
            } for org in recently_verified],
            
            'needs_attention': [{
                'id': org.id,
                'org_name': org.org_name or 'Unnamed Organization',
                'owner_name': f"{org.owner.first_name} {org.owner.last_name}".strip() or org.owner.username,
                'created_at': org.created_at,
                'days_since_creation': (timezone.now() - org.created_at).days,
                'has_documents': bool(org.document_url)
            } for org in needs_attention]
        }
    
    @staticmethod
    def detect_suspicious_organizations():
        """Detect potentially suspicious organizations"""
        suspicious_orgs = []
        now = timezone.now()
        
        # Organizations with unusually high campaign creation
        high_campaign_orgs = OrganizationProfile.objects.select_related('owner').annotate(
            campaigns_7d=Count(
                'owner__campaigns',
                filter=Q(owner__campaigns__created_at__gte=now - timedelta(days=7))
            ),
            total_campaigns=Count('owner__campaigns')
        ).filter(campaigns_7d__gt=3)  # More than 3 campaigns in 7 days
        
        for org in high_campaign_orgs:
            suspicious_orgs.append({
                'organization_id': org.id,
                'org_name': org.org_name or 'Unnamed Organization',
                'owner_username': org.owner.username,
                'owner_email': org.owner.email,
                'reason': 'High campaign creation rate',
                'details': {
                    'campaigns_7d': org.campaigns_7d,
                    'total_campaigns': org.total_campaigns
                },
                'risk_level': 'medium',
                'is_verified': org.is_verified
            })
        
        # Unverified organizations raising significant funds
        unverified_high_earners = OrganizationProfile.objects.select_related('owner').annotate(
            total_raised=Sum('owner__campaigns__current_amount')
        ).filter(
            is_verified=False,
            total_raised__gt=5000  # Raised more than 5000 MRU without verification
        )
        
        for org in unverified_high_earners:
            suspicious_orgs.append({
                'organization_id': org.id,
                'org_name': org.org_name or 'Unnamed Organization',
                'owner_username': org.owner.username,
                'owner_email': org.owner.email,
                'reason': 'High fundraising without verification',
                'details': {
                    'total_raised': str(org.total_raised),
                    'is_verified': org.is_verified,
                    'has_documents': bool(org.document_url)
                },
                'risk_level': 'high',
                'is_verified': org.is_verified
            })
        
        # Organizations with duplicate information
        # Check for organizations with same phone number or very similar names
        duplicate_phones = OrganizationProfile.objects.values('phone_number').annotate(
            count=Count('id')
        ).filter(count__gt=1, phone_number__isnull=False).exclude(phone_number='')
        
        for phone_data in duplicate_phones:
            orgs_with_phone = OrganizationProfile.objects.filter(
                phone_number=phone_data['phone_number']
            ).select_related('owner')
            
            for org in orgs_with_phone:
                suspicious_orgs.append({
                    'organization_id': org.id,
                    'org_name': org.org_name or 'Unnamed Organization',
                    'owner_username': org.owner.username,
                    'owner_email': org.owner.email,
                    'reason': 'Duplicate phone number',
                    'details': {
                        'phone_number': org.phone_number,
                        'duplicate_count': phone_data['count']
                    },
                    'risk_level': 'low',
                    'is_verified': org.is_verified
                })
        
        return suspicious_orgs
    
    @staticmethod
    def log_admin_action(admin_user, action_type, target_organization=None, description="", metadata=None):
        """Log admin actions for organization management"""
        if metadata is None:
            metadata = {}
        
        AdminAction.objects.create(
            admin_user=admin_user,
            action_type=action_type,
            target_model='OrganizationProfile',
            target_id=target_organization.id if target_organization else None,
            description=description,
            metadata={
                'target_org_name': target_organization.org_name if target_organization else None,
                'target_owner_username': target_organization.owner.username if target_organization else None,
                **metadata
            }
        )


class CampaignManagementService:
    """Service class for campaign management operations"""
    
    @staticmethod
    def get_campaign_statistics():
        """Get comprehensive campaign statistics"""
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)
        seven_days_ago = now - timedelta(days=7)
        
        total_campaigns = Campaign.objects.count()
        featured_campaigns = Campaign.objects.filter(featured=True).count()
        
        # Campaign status breakdown
        new_campaigns = Campaign.objects.filter(current_amount=0).count()
        active_campaigns = Campaign.objects.filter(
            current_amount__gt=0, 
            current_amount__lt=F('target')
        ).count()
        completed_campaigns = Campaign.objects.filter(
            current_amount__gte=F('target')
        ).count()
        
        # Recent activity
        new_campaigns_30d = Campaign.objects.filter(created_at__gte=thirty_days_ago).count()
        new_campaigns_7d = Campaign.objects.filter(created_at__gte=seven_days_ago).count()
        
        # Financial metrics
        total_raised = Campaign.objects.aggregate(total=Sum('current_amount'))['total'] or 0
        total_target = Campaign.objects.aggregate(total=Sum('target'))['total'] or 0
        total_donors = Campaign.objects.aggregate(total=Sum('number_of_donors'))['total'] or 0
        
        # Performance metrics
        avg_success_rate = Campaign.objects.annotate(
            success_rate=Case(
                When(target__gt=0, then=F('current_amount') * 100.0 / F('target')),
                default=0,
                output_field=FloatField()
            )
        ).aggregate(avg=Avg('success_rate'))['avg'] or 0
        
        # Category distribution
        category_stats = Category.objects.annotate(
            campaign_count=Count('campaigns')
        ).filter(campaign_count__gt=0).order_by('-campaign_count')[:5]
        
        # Recent donation activity
        recent_donations = Donation.objects.filter(
            created_at__gte=seven_days_ago,
            status='completed'
        ).count()
        
        # Live streaming stats
        live_campaigns = Campaign.objects.exclude(facebook_live_url='').count()
        currently_live = Campaign.objects.filter(live_status='live').count()
        
        return {
            'overview': {
                'total_campaigns': total_campaigns,
                'featured_campaigns': featured_campaigns,
                'new_campaigns': new_campaigns,
                'active_campaigns': active_campaigns,
                'completed_campaigns': completed_campaigns,
                'completion_rate': (completed_campaigns / total_campaigns * 100) if total_campaigns > 0 else 0
            },
            'growth': {
                'new_campaigns_30d': new_campaigns_30d,
                'new_campaigns_7d': new_campaigns_7d,
                'growth_rate_30d': (new_campaigns_30d / total_campaigns * 100) if total_campaigns > 0 else 0
            },
            'financial': {
                'total_raised': str(total_raised),
                'total_target': str(total_target),
                'overall_success_rate': round((total_raised / total_target * 100) if total_target > 0 else 0, 2),
                'total_donors': total_donors,
                'average_campaign_success_rate': round(avg_success_rate, 2)
            },
            'activity': {
                'recent_donations_7d': recent_donations,
                'donations_per_day': round(recent_donations / 7, 1)
            },
            'categories': [{
                'name': cat.name,
                'campaign_count': cat.campaign_count
            } for cat in category_stats],
            'live_streaming': {
                'campaigns_with_streaming': live_campaigns,
                'currently_live': currently_live,
                'streaming_adoption_rate': (live_campaigns / total_campaigns * 100) if total_campaigns > 0 else 0
            }
        }
    
    @staticmethod
    def bulk_feature_campaigns(admin_user, campaign_ids, action_type='feature'):
        """Bulk feature/unfeature campaigns"""
        campaigns = Campaign.objects.filter(id__in=campaign_ids)
        
        affected_count = 0
        already_processed_count = 0
        not_found_count = len(campaign_ids) - campaigns.count()
        
        for campaign in campaigns:
            if action_type == 'feature':
                if campaign.featured:
                    already_processed_count += 1
                else:
                    campaign.featured = True
                    campaign.save()
                    affected_count += 1
            elif action_type == 'unfeature':
                if not campaign.featured:
                    already_processed_count += 1
                else:
                    campaign.featured = False
                    campaign.save()
                    affected_count += 1
            
            # Log individual action
            CampaignManagementService.log_admin_action(
                admin_user=admin_user,
                action_type=f'bulk_{action_type}_campaign',
                target_campaign=campaign,
                description=f"Bulk {action_type}d campaign: {campaign.name}",
                metadata={'bulk_operation': True}
            )
        
        # Log bulk operation summary
        CampaignManagementService.log_admin_action(
            admin_user=admin_user,
            action_type=f'bulk_{action_type}_summary',
            target_campaign=None,
            description=f"Bulk {action_type} completed: {affected_count} campaigns processed",
            metadata={
                'campaign_ids': campaign_ids,
                'affected_count': affected_count,
                'already_processed_count': already_processed_count,
                'not_found_count': not_found_count,
                'action_type': action_type
            }
        )
        
        return {
            'affected_count': affected_count,
            'already_processed_count': already_processed_count,
            'not_found_count': not_found_count
        }
    
    @staticmethod
    def get_campaign_analytics(campaign):
        """Get detailed analytics for a specific campaign"""
        now = timezone.now()
        
        # Basic metrics
        donations = campaign.donations.filter(status='completed')
        total_donations = donations.count()
        total_amount = donations.aggregate(total=Sum('amount'))['total'] or 0
        avg_donation = donations.aggregate(avg=Avg('amount'))['avg'] or 0
        
        # Time-based analysis
        daily_data = []
        for i in range(30):  # Last 30 days
            day = now - timedelta(days=i)
            day_donations = donations.filter(
                created_at__date=day.date()
            )
            daily_data.append({
                'date': day.strftime('%Y-%m-%d'),
                'donations': day_donations.count(),
                'amount': str(day_donations.aggregate(total=Sum('amount'))['total'] or 0)
            })
        
        # Donor analysis
        unique_donors = donations.values('donor').distinct().count()
        anonymous_donations = donations.filter(is_anonymous=True).count()
        repeat_donors = donations.values('donor').annotate(
            donation_count=Count('id')
        ).filter(donation_count__gt=1).count()
        
        # Performance metrics
        success_rate = (campaign.current_amount / campaign.target * 100) if campaign.target > 0 else 0
        days_active = (now.date() - campaign.created_at.date()).days + 1
        donations_per_day = total_donations / days_active if days_active > 0 else 0
        
        # Payment method breakdown
        payment_methods = donations.values('payment_method').annotate(
            count=Count('id'),
            total=Sum('amount')
        ).order_by('-count')
        
        return {
            'overview': {
                'total_donations': total_donations,
                'total_amount': str(total_amount),
                'average_donation': str(round(avg_donation, 2)),
                'success_rate': round(success_rate, 2),
                'days_active': days_active,
                'donations_per_day': round(donations_per_day, 2)
            },
            'donors': {
                'unique_donors': unique_donors,
                'anonymous_donations': anonymous_donations,
                'anonymous_rate': round((anonymous_donations / total_donations * 100) if total_donations > 0 else 0, 2),
                'repeat_donors': repeat_donors,
                'repeat_rate': round((repeat_donors / unique_donors * 100) if unique_donors > 0 else 0, 2)
            },
            'daily_breakdown': daily_data[:7],  # Last 7 days for response size
            'payment_methods': [{
                'method': pm['payment_method'] or 'Unknown',
                'count': pm['count'],
                'total': str(pm['total'])
            } for pm in payment_methods],
            'files': {
                'total_files': campaign.files.count(),
                'file_list': [f.name for f in campaign.files.all()[:5]]  # First 5 files
            },
            'live_streaming': {
                'has_stream': bool(campaign.facebook_live_url),
                'live_status': campaign.live_status,
                'viewer_count': campaign.live_viewer_count if campaign.live_status == 'live' else 0
            }
        }
    
    @staticmethod
    def get_performance_metrics():
        """Get campaign performance metrics"""
        # Top performing campaigns
        top_performers = Campaign.objects.annotate(
            success_rate=Case(
                When(target__gt=0, then=F('current_amount') * 100.0 / F('target')),
                default=0,
                output_field=FloatField()
            )
        ).filter(current_amount__gt=0).order_by('-success_rate')[:10]
        
        # Most funded campaigns
        most_funded = Campaign.objects.filter(
            current_amount__gt=0
        ).order_by('-current_amount')[:10]
        
        # Most active campaigns (by donor count)
        most_active = Campaign.objects.filter(
            number_of_donors__gt=0
        ).order_by('-number_of_donors')[:10]
        
        # Recently created trending campaigns
        trending = Campaign.objects.filter(
            created_at__gte=timezone.now() - timedelta(days=7)
        ).annotate(
            donation_count=Count('donations', filter=Q(donations__status='completed'))
        ).filter(donation_count__gt=0).order_by('-donation_count')[:10]
        
        # Featured campaigns performance
        featured_performance = Campaign.objects.filter(featured=True).aggregate(
            avg_success_rate=Avg(
                Case(
                    When(target__gt=0, then=F('current_amount') * 100.0 / F('target')),
                    default=0,
                    output_field=FloatField()
                )
            ),
            total_raised=Sum('current_amount'),
            avg_donors=Avg('number_of_donors')
        )
        
        return {
            'top_performers': [{
                'id': c.id,
                'name': c.name,
                'owner_name': c.owner.organization_profile.org_name if hasattr(c.owner, 'organization_profile') else c.owner.username,
                'target': str(c.target),
                'current_amount': str(c.current_amount),
                'success_rate': round(c.success_rate, 2),
                'featured': c.featured,
                'created_at': c.created_at
            } for c in top_performers],
            
            'most_funded': [{
                'id': c.id,
                'name': c.name,
                'owner_name': c.owner.organization_profile.org_name if hasattr(c.owner, 'organization_profile') else c.owner.username,
                'current_amount': str(c.current_amount),
                'number_of_donors': c.number_of_donors,
                'featured': c.featured,
                'created_at': c.created_at
            } for c in most_funded],
            
            'most_active': [{
                'id': c.id,
                'name': c.name,
                'owner_name': c.owner.organization_profile.org_name if hasattr(c.owner, 'organization_profile') else c.owner.username,
                'number_of_donors': c.number_of_donors,
                'current_amount': str(c.current_amount),
                'featured': c.featured,
                'created_at': c.created_at
            } for c in most_active],
            
            'trending': [{
                'id': c.id,
                'name': c.name,
                'owner_name': c.owner.organization_profile.org_name if hasattr(c.owner, 'organization_profile') else c.owner.username,
                'donation_count': c.donation_count,
                'current_amount': str(c.current_amount),
                'created_at': c.created_at
            } for c in trending],
            
            'featured_performance': {
                'average_success_rate': round(featured_performance['avg_success_rate'] or 0, 2),
                'total_raised': str(featured_performance['total_raised'] or 0),
                'average_donors': round(featured_performance['avg_donors'] or 0, 1)
            }
        }
    
    @staticmethod
    def detect_suspicious_campaigns():
        """Detect potentially suspicious campaigns"""
        suspicious_campaigns = []
        now = timezone.now()
        
        # Campaigns with unusually high donation amounts from single donors
        high_single_donations = Campaign.objects.filter(
            donations__amount__gt=5000,  # Single donations over 5000 MRU
            donations__status='completed'
        ).distinct()
        
        for campaign in high_single_donations:
            max_donation = campaign.donations.filter(status='completed').aggregate(
                max=Max('amount')
            )['max']
            
            suspicious_campaigns.append({
                'campaign_id': campaign.id,
                'campaign_name': campaign.name,
                'owner_username': campaign.owner.username,
                'reason': 'Large single donation',
                'details': {
                    'max_donation': str(max_donation),
                    'total_raised': str(campaign.current_amount)
                },
                'risk_level': 'medium',
                'created_at': campaign.created_at
            })
        
        # New campaigns with rapid fundraising
        rapid_campaigns = Campaign.objects.filter(
            created_at__gte=now - timedelta(days=3),
            current_amount__gt=2000  # Raised over 2000 MRU in 3 days
        )
        
        for campaign in rapid_campaigns:
            days_old = (now - campaign.created_at).days + 1
            daily_rate = campaign.current_amount / days_old
            
            suspicious_campaigns.append({
                'campaign_id': campaign.id,
                'campaign_name': campaign.name,
                'owner_username': campaign.owner.username,
                'reason': 'Rapid fundraising for new campaign',
                'details': {
                    'days_old': days_old,
                    'daily_fundraising_rate': str(round(daily_rate, 2)),
                    'total_raised': str(campaign.current_amount)
                },
                'risk_level': 'high',
                'created_at': campaign.created_at
            })
        
        # Campaigns with unusually high success rates and low donor counts
        suspicious_ratios = Campaign.objects.annotate(
            success_rate=Case(
                When(target__gt=0, then=F('current_amount') * 100.0 / F('target')),
                default=0,
                output_field=FloatField()
            )
        ).filter(
            success_rate__gt=50,  # More than 50% funded
            number_of_donors__lt=5  # But less than 5 donors
        )
        
        for campaign in suspicious_ratios:
            avg_donation = campaign.current_amount / campaign.number_of_donors if campaign.number_of_donors > 0 else 0
            
            suspicious_campaigns.append({
                'campaign_id': campaign.id,
                'campaign_name': campaign.name,
                'owner_username': campaign.owner.username,
                'reason': 'High funding with few donors',
                'details': {
                    'success_rate': round(campaign.success_rate, 2),
                    'number_of_donors': campaign.number_of_donors,
                    'average_donation': str(round(avg_donation, 2))
                },
                'risk_level': 'medium',
                'created_at': campaign.created_at
            })
        
        return suspicious_campaigns
    
    @staticmethod
    def get_trending_campaigns(days=7):
        """Get trending campaigns based on recent activity"""
        cutoff_date = timezone.now() - timedelta(days=days)
        
        trending = Campaign.objects.annotate(
            recent_donations=Count(
                'donations',
                filter=Q(
                    donations__created_at__gte=cutoff_date,
                    donations__status='completed'
                )
            ),
            recent_amount=Sum(
                'donations__amount',
                filter=Q(
                    donations__created_at__gte=cutoff_date,
                    donations__status='completed'
                )
            ),
            momentum_score=F('recent_donations') * 2 + F('recent_amount') / 100
        ).filter(
            recent_donations__gt=0
        ).order_by('-momentum_score')[:20]
        
        return [{
            'id': campaign.id,
            'name': campaign.name,
            'owner_name': campaign.owner.organization_profile.org_name if hasattr(campaign.owner, 'organization_profile') else campaign.owner.username,
            'recent_donations': campaign.recent_donations,
            'recent_amount': str(campaign.recent_amount or 0),
            'momentum_score': float(campaign.momentum_score or 0),
            'current_amount': str(campaign.current_amount),
            'success_rate': round((campaign.current_amount / campaign.target * 100) if campaign.target > 0 else 0, 2),
            'featured': campaign.featured
        } for campaign in trending]
    
    @staticmethod
    def moderate_campaign(admin_user, campaign, action, reason=""):
        """Moderate campaign content"""
        if action == 'approve':
            # Campaign is approved - no specific action needed, just log
            pass
        elif action == 'flag':
            # Flag campaign for review - could add a flag field to model if needed
            pass
        elif action == 'suspend':
            # Suspend campaign - could add suspension logic if needed
            pass
        else:
            raise ValueError(f"Invalid moderation action: {action}")
        
        # Log moderation action
        CampaignManagementService.log_admin_action(
            admin_user=admin_user,
            action_type=f'moderate_campaign_{action}',
            target_campaign=campaign,
            description=f"Campaign {action}ed: {campaign.name}",
            metadata={
                'moderation_action': action,
                'reason': reason,
                'moderated_by': admin_user.username
            }
        )
        
        return True
    
    @staticmethod
    def get_category_statistics():
        """Get category statistics"""
        categories = Category.objects.annotate(
            campaign_count=Count('campaigns'),
            active_campaigns=Count('campaigns', filter=Q(campaigns__current_amount__lt=F('campaigns__target'))),
            completed_campaigns=Count('campaigns', filter=Q(campaigns__current_amount__gte=F('campaigns__target'))),
            total_raised=Sum('campaigns__current_amount'),
            total_target=Sum('campaigns__target'),
            avg_success_rate=Avg(
                Case(
                    When(campaigns__target__gt=0, then=F('campaigns__current_amount') * 100.0 / F('campaigns__target')),
                    default=0,
                    output_field=FloatField()
                )
            )
        ).order_by('-campaign_count')
        
        return [{
            'id': cat.id,
            'name': cat.name,
            'description': cat.description,
            'campaign_count': cat.campaign_count,
            'active_campaigns': cat.active_campaigns,
            'completed_campaigns': cat.completed_campaigns,
            'completion_rate': round((cat.completed_campaigns / cat.campaign_count * 100) if cat.campaign_count > 0 else 0, 2),
            'total_raised': str(cat.total_raised or 0),
            'total_target': str(cat.total_target or 0),
            'avg_success_rate': round(cat.avg_success_rate or 0, 2)
        } for cat in categories]
    
    @staticmethod
    def log_admin_action(admin_user, action_type, target_campaign=None, description="", metadata=None):
        """Log admin actions for campaign management"""
        if metadata is None:
            metadata = {}
        
        AdminAction.objects.create(
            admin_user=admin_user,
            action_type=action_type,
            target_model='Campaign',
            target_id=target_campaign.id if target_campaign else None,
            description=description,
            metadata={
                'target_campaign_name': target_campaign.name if target_campaign else None,
                'target_owner_username': target_campaign.owner.username if target_campaign else None,
                **metadata
            }
        )


class FinancialManagementService:
    """Service class for financial management operations"""
    
    @staticmethod
    def get_financial_dashboard_stats():
        """Get comprehensive financial dashboard statistics"""
        now = timezone.now()
        today = now.date()
        yesterday = today - timedelta(days=1)
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)
        
        # Overall statistics
        total_donations = Donation.objects.filter(status='completed').aggregate(
            count=Count('id'),
            total_amount=Sum('amount'),
            avg_amount=Avg('amount')
        )
        
        # Today's statistics
        today_stats = Donation.objects.filter(
            created_at__date=today,
            status='completed'
        ).aggregate(
            count=Count('id'),
            total_amount=Sum('amount')
        )
        
        # Yesterday's statistics for comparison
        yesterday_stats = Donation.objects.filter(
            created_at__date=yesterday,
            status='completed'
        ).aggregate(
            count=Count('id'),
            total_amount=Sum('amount')
        )
        
        # Status breakdown
        status_breakdown = Donation.objects.values('status').annotate(
            count=Count('id'),
            total_amount=Sum('amount')
        ).order_by('-count')
        
        # Recent activity (last 7 days)
        recent_activity = Donation.objects.filter(
            created_at__gte=week_ago,
            status='completed'
        ).aggregate(
            count=Count('id'),
            total_amount=Sum('amount')
        )
        
        # Monthly trends
        monthly_stats = Donation.objects.filter(
            created_at__gte=month_ago,
            status='completed'
        ).aggregate(
            count=Count('id'),
            total_amount=Sum('amount')
        )
        
        # Transaction success rate
        total_transactions = Donation.objects.count()
        completed_transactions = Donation.objects.filter(status='completed').count()
        success_rate = (completed_transactions / total_transactions * 100) if total_transactions > 0 else 0
        
        # Platform health indicators
        pending_transactions = Donation.objects.filter(status='pending').count()
        failed_transactions = Donation.objects.filter(status='failed').count()
        
        # Calculate growth rates
        today_growth = 0
        if yesterday_stats['count'] and yesterday_stats['count'] > 0:
            today_growth = ((today_stats['count'] - yesterday_stats['count']) / yesterday_stats['count'] * 100)
        
        return {
            'overview': {
                'total_donations': total_donations['count'],
                'total_amount': str(total_donations['total_amount'] or 0),
                'average_donation': str(round(total_donations['avg_amount'] or 0, 2)),
                'success_rate': round(success_rate, 2)
            },
            'today': {
                'donations': today_stats['count'],
                'amount': str(today_stats['total_amount'] or 0),
                'growth_rate': round(today_growth, 2)
            },
            'recent_activity': {
                'donations_7d': recent_activity['count'],
                'amount_7d': str(recent_activity['total_amount'] or 0),
                'donations_30d': monthly_stats['count'],
                'amount_30d': str(monthly_stats['total_amount'] or 0)
            },
            'status_breakdown': [{
                'status': item['status'],
                'count': item['count'],
                'total_amount': str(item['total_amount'] or 0)
            } for item in status_breakdown],
            'health_indicators': {
                'pending_transactions': pending_transactions,
                'failed_transactions': failed_transactions,
                'total_transactions': total_transactions
            }
        }
    
    @staticmethod
    def get_payment_analytics():
        """Get payment method analytics"""
        # Payment method breakdown
        payment_methods = Donation.objects.filter(
            status='completed'
        ).values('payment_method').annotate(
            count=Count('id'),
            total_amount=Sum('amount'),
            avg_amount=Avg('amount')
        ).order_by('-total_amount')
        
        # Success rates by payment method
        payment_success_rates = {}
        for method_data in payment_methods:
            method = method_data['payment_method']
            total_attempts = Donation.objects.filter(payment_method=method).count()
            completed = method_data['count']
            success_rate = (completed / total_attempts * 100) if total_attempts > 0 else 0
            
            payment_success_rates[method or 'Unknown'] = {
                'success_rate': round(success_rate, 2),
                'total_attempts': total_attempts,
                'completed': completed
            }
        
        # Wallet provider analysis (if available)
        wallet_providers = WalletProvider.objects.annotate(
            manual_payment_count=Count('manualpayment'),
            nextpay_payment_count=Count('nextpaypayment')
        ).filter(
            Q(manual_payment_count__gt=0) | Q(nextpay_payment_count__gt=0)
        )
        
        # Processing time analysis
        processing_times = Donation.objects.filter(
            status='completed',
            completed_at__isnull=False
        ).extra(
            select={
                'processing_seconds': 'EXTRACT(EPOCH FROM (completed_at - created_at))'
            }
        ).values_list('processing_seconds', flat=True)[:1000]  # Sample for performance
        
        avg_processing_time = sum(processing_times) / len(processing_times) if processing_times else 0
        
        return {
            'payment_methods': [{
                'method': item['payment_method'] or 'Unknown',
                'transaction_count': item['count'],
                'total_amount': str(item['total_amount']),
                'average_amount': str(round(item['avg_amount'], 2)),
                'success_rate': payment_success_rates.get(item['payment_method'] or 'Unknown', {}).get('success_rate', 0)
            } for item in payment_methods],
            
            'wallet_providers': [{
                'name': provider.name,
                'is_active': provider.is_active,
                'manual_accounts': provider.manual_payment_count,
                'nextpay_accounts': provider.nextpay_payment_count,
                'total_accounts': provider.manual_payment_count + provider.nextpay_payment_count
            } for provider in wallet_providers],
            
            'processing_performance': {
                'average_processing_time_seconds': round(avg_processing_time, 2),
                'sample_size': len(processing_times)
            }
        }
    
    @staticmethod
    def get_revenue_analytics(days=30):
        """Get platform revenue analytics"""
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)
        
        # Daily revenue breakdown
        daily_revenue = []
        current_date = start_date
        
        while current_date <= end_date:
            day_donations = Donation.objects.filter(
                created_at__date=current_date,
                status='completed'
            ).aggregate(
                count=Count('id'),
                total_amount=Sum('amount')
            )
            
            # Calculate platform fees (assuming 2.5% platform fee)
            total_amount = day_donations['total_amount'] or 0
            platform_fees = total_amount * 0.025  # 2.5% fee
            
            daily_revenue.append({
                'date': current_date.isoformat(),
                'donation_count': day_donations['count'],
                'total_donations': str(total_amount),
                'platform_fees': str(round(platform_fees, 2)),
                'net_to_campaigns': str(round(total_amount - platform_fees, 2))
            })
            
            current_date += timedelta(days=1)
        
        # Overall period summary
        period_totals = Donation.objects.filter(
            created_at__date__gte=start_date,
            created_at__date__lte=end_date,
            status='completed'
        ).aggregate(
            total_donations=Count('id'),
            total_amount=Sum('amount'),
            avg_donation=Avg('amount')
        )
        
        total_amount = period_totals['total_amount'] or 0
        total_platform_fees = total_amount * 0.025
        
        return {
            'period': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
                'days': days
            },
            'summary': {
                'total_donations': period_totals['total_donations'],
                'total_amount': str(total_amount),
                'average_donation': str(round(period_totals['avg_donation'] or 0, 2)),
                'total_platform_fees': str(round(total_platform_fees, 2)),
                'net_to_campaigns': str(round(total_amount - total_platform_fees, 2))
            },
            'daily_breakdown': daily_revenue[-7:] if len(daily_revenue) > 7 else daily_revenue  # Last 7 days for response size
        }
    
    @staticmethod
    def get_donation_trends(days=30):
        """Get donation trends and patterns"""
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)
        
        # Hourly patterns (for last 7 days)
        hourly_patterns = {}
        for hour in range(24):
            hour_donations = Donation.objects.filter(
                created_at__gte=end_date - timedelta(days=7),
                created_at__hour=hour,
                status='completed'
            ).count()
            hourly_patterns[f'{hour:02d}:00'] = hour_donations
        
        # Daily of week patterns
        weekday_patterns = {}
        for weekday in range(7):  # 0=Monday, 6=Sunday
            weekday_donations = Donation.objects.filter(
                created_at__gte=start_date,
                created_at__week_day=weekday + 2,  # Django uses 1=Sunday
                status='completed'
            ).count()
            weekday_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
            weekday_patterns[weekday_names[weekday]] = weekday_donations
        
        # Donation size distribution
        size_distribution = {
            'small': Donation.objects.filter(amount__lt=100, status='completed').count(),
            'medium': Donation.objects.filter(amount__gte=100, amount__lt=500, status='completed').count(),
            'large': Donation.objects.filter(amount__gte=500, amount__lt=1000, status='completed').count(),
            'very_large': Donation.objects.filter(amount__gte=1000, status='completed').count()
        }
        
        # Geographic patterns (if you have location data)
        # This would require additional location fields in your models
        
        return {
            'hourly_patterns': hourly_patterns,
            'weekday_patterns': weekday_patterns,
            'size_distribution': size_distribution,
            'analysis_period': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
                'days': days
            }
        }
    
    @staticmethod
    def analyze_failed_transactions(days=7):
        """Analyze failed transactions for patterns"""
        cutoff_date = timezone.now() - timedelta(days=days)
        
        failed_donations = Donation.objects.filter(
            status='failed',
            created_at__gte=cutoff_date
        )
        
        # Failure reasons (from payment metadata if available)
        failure_reasons = {}
        payment_method_failures = {}
        
        for donation in failed_donations:
            # Extract failure reason from metadata
            if donation.payment_metadata:
                reason = donation.payment_metadata.get('error_reason', 'Unknown')
                failure_reasons[reason] = failure_reasons.get(reason, 0) + 1
            
            # Track failures by payment method
            method = donation.payment_method or 'Unknown'
            payment_method_failures[method] = payment_method_failures.get(method, 0) + 1
        
        # Amount patterns in failures
        failed_amounts = failed_donations.aggregate(
            count=Count('id'),
            total_amount=Sum('amount'),
            avg_amount=Avg('amount'),
            min_amount=Min('amount'),
            max_amount=Max('amount')
        )
        
        return {
            'summary': {
                'total_failed': failed_amounts['count'],
                'total_amount_failed': str(failed_amounts['total_amount'] or 0),
                'average_failed_amount': str(round(failed_amounts['avg_amount'] or 0, 2)),
                'min_failed_amount': str(failed_amounts['min_amount'] or 0),
                'max_failed_amount': str(failed_amounts['max_amount'] or 0)
            },
            'failure_reasons': failure_reasons,
            'payment_method_failures': payment_method_failures,
            'analysis_period_days': days
        }
    
    @staticmethod
    def get_donor_analytics():
        """Get donor behavior analytics"""
        # Unique donors
        total_unique_donors = Donation.objects.filter(
            status='completed',
            donor__isnull=False
        ).values('donor').distinct().count()
        
        # Repeat donors
        repeat_donors = Donation.objects.filter(
            status='completed',
            donor__isnull=False
        ).values('donor').annotate(
            donation_count=Count('id')
        ).filter(donation_count__gt=1)
        
        repeat_donor_count = repeat_donors.count()
        repeat_rate = (repeat_donor_count / total_unique_donors * 100) if total_unique_donors > 0 else 0
        
        # Anonymous vs registered donor breakdown
        anonymous_donations = Donation.objects.filter(status='completed', is_anonymous=True).count()
        registered_donations = Donation.objects.filter(status='completed', donor__isnull=False).count()
        guest_donations = Donation.objects.filter(status='completed', donor__isnull=True, is_anonymous=False).count()
        
        # Top donors
        top_donors = Donation.objects.filter(
            status='completed',
            donor__isnull=False
        ).values('donor').annotate(
            total_donated=Sum('amount'),
            donation_count=Count('id')
        ).order_by('-total_donated')[:10]
        
        # Enhance top donors with user details
        top_donor_details = []
        for donor_data in top_donors:
            try:
                user = User.objects.get(id=donor_data['donor'])
                top_donor_details.append({
                    'donor_id': user.id,
                    'username': user.username,
                    'full_name': f"{user.first_name} {user.last_name}".strip() or user.username,
                    'total_donated': str(donor_data['total_donated']),
                    'donation_count': donor_data['donation_count'],
                    'is_active': user.is_active
                })
            except User.DoesNotExist:
                continue
        
        return {
            'overview': {
                'total_unique_donors': total_unique_donors,
                'repeat_donors': repeat_donor_count,
                'repeat_rate': round(repeat_rate, 2)
            },
            'donation_types': {
                'anonymous_donations': anonymous_donations,
                'registered_donations': registered_donations,
                'guest_donations': guest_donations
            },
            'top_donors': top_donor_details
        }
    
    @staticmethod
    def analyze_refunds_and_cancellations(days=30):
        """Analyze refunds and cancellations"""
        cutoff_date = timezone.now() - timedelta(days=days)
        
        # Cancelled donations
        cancelled_donations = Donation.objects.filter(
            status='cancelled',
            created_at__gte=cutoff_date
        ).aggregate(
            count=Count('id'),
            total_amount=Sum('amount')
        )
        
        # Failed donations (which might be considered refunds)
        failed_donations = Donation.objects.filter(
            status='failed',
            created_at__gte=cutoff_date
        ).aggregate(
            count=Count('id'),
            total_amount=Sum('amount')
        )
        
        # Refund rate calculation
        total_donations = Donation.objects.filter(created_at__gte=cutoff_date).count()
        refund_rate = ((cancelled_donations['count'] + failed_donations['count']) / total_donations * 100) if total_donations > 0 else 0
        
        return {
            'period_days': days,
            'cancelled_donations': {
                'count': cancelled_donations['count'],
                'total_amount': str(cancelled_donations['total_amount'] or 0)
            },
            'failed_donations': {
                'count': failed_donations['count'],
                'total_amount': str(failed_donations['total_amount'] or 0)
            },
            'refund_rate': round(refund_rate, 2),
            'total_donations_period': total_donations
        }
    
    @staticmethod
    def calculate_platform_fees(days=30):
        """Calculate platform fees and revenue"""
        cutoff_date = timezone.now() - timedelta(days=days)
        
        completed_donations = Donation.objects.filter(
            status='completed',
            created_at__gte=cutoff_date
        ).aggregate(
            count=Count('id'),
            total_amount=Sum('amount')
        )
        
        total_amount = completed_donations['total_amount'] or 0
        
        # Assuming different fee structures
        platform_fee_rate = 0.025  # 2.5%
        payment_gateway_fee_rate = 0.015  # 1.5%
        
        platform_fees = total_amount * platform_fee_rate
        gateway_fees = total_amount * payment_gateway_fee_rate
        net_revenue = platform_fees - gateway_fees  # Platform's net revenue
        
        return {
            'period_days': days,
            'transaction_volume': {
                'count': completed_donations['count'],
                'total_amount': str(total_amount)
            },
            'fee_breakdown': {
                'platform_fees': str(round(platform_fees, 2)),
                'gateway_fees': str(round(gateway_fees, 2)),
                'net_platform_revenue': str(round(net_revenue, 2))
            },
            'fee_rates': {
                'platform_fee_rate': f"{platform_fee_rate * 100}%",
                'gateway_fee_rate': f"{payment_gateway_fee_rate * 100}%"
            }
        }
    
    @staticmethod
    def log_admin_action(admin_user, action_type, target_donation=None, description="", metadata=None):
        """Log admin actions for financial management"""
        if metadata is None:
            metadata = {}
        
        AdminAction.objects.create(
            admin_user=admin_user,
            action_type=action_type,
            target_model='Donation',
            target_id=target_donation.id if target_donation else None,
            description=description,
            metadata={
                'target_amount': str(target_donation.amount) if target_donation else None,
                'target_campaign': target_donation.campaign.name if target_donation else None,
                **metadata
            }
        )


class FraudDetectionService:
    """Service class for fraud detection and risk assessment"""
    
    @staticmethod
    def detect_suspicious_transactions():
        """Detect potentially suspicious transactions"""
        suspicious_transactions = []
        now = timezone.now()
        
        # Large single donations
        large_donations = Donation.objects.filter(
            amount__gte=2000,  # Large donations over 2000 MRU
            status='completed',
            created_at__gte=now - timedelta(days=7)
        ).select_related('donor', 'campaign')
        
        for donation in large_donations:
            suspicious_transactions.append({
                'donation_id': donation.id,
                'amount': str(donation.amount),
                'donor_info': donation.donor_display_name if hasattr(donation, 'donor_display_name') else 'Unknown',
                'campaign_name': donation.campaign.name,
                'reason': 'Large donation amount',
                'risk_level': 'medium',
                'created_at': donation.created_at
            })
        
        # Very fast processing times (potential automated/bot donations)
        fast_donations = Donation.objects.filter(
            status='completed',
            completed_at__isnull=False,
            created_at__gte=now - timedelta(days=1)
        ).extra(
            where=["EXTRACT(EPOCH FROM (completed_at - created_at)) < 10"]  # Less than 10 seconds
        ).select_related('donor', 'campaign')
        
        for donation in fast_donations:
            suspicious_transactions.append({
                'donation_id': donation.id,
                'amount': str(donation.amount),
                'donor_info': donation.donor_display_name if hasattr(donation, 'donor_display_name') else 'Unknown',
                'campaign_name': donation.campaign.name,
                'reason': 'Extremely fast processing time',
                'risk_level': 'high',
                'created_at': donation.created_at
            })
        
        # Multiple donations from same donor in short time
        repeat_donors_today = Donation.objects.filter(
            created_at__gte=now.replace(hour=0, minute=0, second=0),
            status='completed',
            donor__isnull=False
        ).values('donor').annotate(
            donation_count=Count('id'),
            total_amount=Sum('amount')
        ).filter(donation_count__gte=5)  # 5 or more donations today
        
        for donor_data in repeat_donors_today:
            try:
                user = User.objects.get(id=donor_data['donor'])
                suspicious_transactions.append({
                    'donation_id': None,
                    'amount': str(donor_data['total_amount']),
                    'donor_info': user.username,
                    'campaign_name': 'Multiple campaigns',
                    'reason': f"{donor_data['donation_count']} donations in one day",
                    'risk_level': 'medium',
                    'created_at': now
                })
            except User.DoesNotExist:
                continue
        
        return suspicious_transactions
    
    @staticmethod
    def analyze_fraud_patterns():
        """Analyze patterns that might indicate fraud"""
        now = timezone.now()
        week_ago = now - timedelta(days=7)
        
        patterns = {}
        
        # Pattern 1: Spike in failed transactions
        failed_count = Donation.objects.filter(
            status='failed',
            created_at__gte=week_ago
        ).count()
        
        total_count = Donation.objects.filter(
            created_at__gte=week_ago
        ).count()
        
        failure_rate = (failed_count / total_count * 100) if total_count > 0 else 0
        
        patterns['high_failure_rate'] = {
            'failure_rate': round(failure_rate, 2),
            'failed_count': failed_count,
            'total_count': total_count,
            'is_suspicious': failure_rate > 20  # More than 20% failure rate
        }
        
        # Pattern 2: Unusual donation amounts (very round numbers)
        round_amounts = Donation.objects.filter(
            status='completed',
            amount__in=[1000, 2000, 5000, 10000],  # Very round amounts
            created_at__gte=week_ago
        ).count()
        
        patterns['round_amount_donations'] = {
            'count': round_amounts,
            'percentage': round((round_amounts / total_count * 100) if total_count > 0 else 0, 2),
            'is_suspicious': round_amounts > total_count * 0.3  # More than 30% are round amounts
        }
        
        # Pattern 3: Geographic clustering (if you have location data)
        # This would require additional implementation based on your location tracking
        
        # Pattern 4: Time-based patterns (donations at unusual hours)
        night_donations = Donation.objects.filter(
            created_at__gte=week_ago,
            created_at__hour__in=[1, 2, 3, 4, 5],  # Between 1 AM and 5 AM
            status='completed'
        ).count()
        
        patterns['unusual_time_donations'] = {
            'count': night_donations,
            'percentage': round((night_donations / total_count * 100) if total_count > 0 else 0, 2),
            'is_suspicious': night_donations > total_count * 0.15  # More than 15% at night
        }
        
        return patterns
    
    @staticmethod
    def assess_transaction_risk(donation):
        """Assess risk level for a specific transaction"""
        risk_factors = []
        risk_score = 0
        
        # Amount-based risk
        if donation.amount >= 5000:
            risk_factors.append("Very large amount")
            risk_score += 40
        elif donation.amount >= 1000:
            risk_factors.append("Large amount")
            risk_score += 20
        
        # Processing time risk
        if donation.completed_at and donation.created_at:
            processing_time = (donation.completed_at - donation.created_at).total_seconds()
            if processing_time < 10:
                risk_factors.append("Extremely fast processing")
                risk_score += 30
        
        # Anonymous donation risk
        if donation.is_anonymous:
            risk_factors.append("Anonymous donation")
            risk_score += 15
        
        # No registered donor
        if not donation.donor:
            risk_factors.append("Guest donor")
            risk_score += 25
        
        # Round amount risk
        if donation.amount in [100, 500, 1000, 2000, 5000, 10000]:
            risk_factors.append("Round amount")
            risk_score += 10
        
        # Determine risk level
        if risk_score >= 60:
            risk_level = 'high'
        elif risk_score >= 30:
            risk_level = 'medium'
        else:
            risk_level = 'low'
        
        return {
            'risk_level': risk_level,
            'risk_score': risk_score,
            'risk_factors': risk_factors,
            'recommendation': FraudDetectionService._get_risk_recommendation(risk_level, risk_factors)
        }
    
    @staticmethod
    def _get_risk_recommendation(risk_level, risk_factors):
        """Get recommendation based on risk assessment"""
        if risk_level == 'high':
            return "Manual review required. Consider flagging for investigation."
        elif risk_level == 'medium':
            return "Monitor closely. Review if part of pattern."
        else:
            return "Low risk. Normal processing."

