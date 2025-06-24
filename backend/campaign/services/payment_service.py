# campaign/services/payment_service.py
import requests
import logging
from django.conf import settings
from decimal import Decimal

logger = logging.getLogger(__name__)

class NextremitlyPaymentService:
    def __init__(self):
        self.api_key = settings.NEXTREMITLY_API_KEY
        self.base_url = getattr(settings, 'NEXTREMITLY_BASE_URL', 'http://localhost:8000')
        self.frontend_url = getattr(settings, 'NEXTREMITLY_FRONTEND_URL', 'http://localhost:5173')
    
    def create_payment_session(self, campaign, amount, donor_email=None):
        """
        Create a payment session with Nextremitly for campaign donation
        """
        try:
            # Prepare payment data
            payment_data = {
                'amount': float(amount),
                'currency': 'MRU',
                'description': f'Donation to {campaign.name}',
                'customer_email': donor_email or 'anonymous@sada9a.com',
                'success_url': f"{settings.FRONTEND_URL}/campaign/{campaign.id}/donation/success",
                'cancel_url': f"{settings.FRONTEND_URL}/campaign/{campaign.id}/donation/cancel",
                'webhook_url': f"{settings.BACKEND_URL}/api/campaigns/donation-webhook/",
                'metadata': {
                    'campaign_id': campaign.id,
                    'campaign_name': campaign.name,
                    'donation_amount': str(amount),
                    'platform': 'sada9a'
                }
            }
            
            logger.info(f"Creating payment session for campaign {campaign.id}, amount: {amount}")
            
            # Make request to Nextremitly
            response = requests.post(
                f'{self.base_url}/api/payment/sessions/',
                json=payment_data,
                headers={
                    'Authorization': f'Bearer {self.api_key}',
                    'Content-Type': 'application/json'
                },
                timeout=30
            )
            
            if response.status_code == 201:
                session_data = response.json()
                logger.info(f"Payment session created successfully: {session_data['session_id']}")
                return {
                    'success': True,
                    'session_id': session_data['session_id'],
                    'payment_url': session_data['payment_url'],
                    'status': session_data['status'],
                    'expires_at': session_data['expires_at']
                }
            else:
                logger.error(f"Failed to create payment session: {response.status_code} - {response.text}")
                return {
                    'success': False,
                    'error': f'Payment service error: {response.status_code}'
                }
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Network error creating payment session: {str(e)}")
            return {
                'success': False,
                'error': 'Payment service temporarily unavailable'
            }
        except Exception as e:
            logger.error(f"Unexpected error creating payment session: {str(e)}")
            return {
                'success': False,
                'error': 'An unexpected error occurred'
            }
    
    def get_payment_widget_url(self, session_id):
        """
        Get the payment widget URL for embedding
        """
        return f"{self.frontend_url}/payment/{session_id}"

# Initialize service instance
payment_service = NextremitlyPaymentService()