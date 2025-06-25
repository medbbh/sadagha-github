# campaign/services/payment_service.py
import requests
import logging
from django.conf import settings
from decimal import Decimal
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class PaymentMicroserviceClient:
    """Client for communicating with the NextRemitly payment microservice"""
    
    def __init__(self):
        self.microservice_url = getattr(
            settings, 
            'PAYMENT_MICROSERVICE_URL', 
            'http://localhost:8001'
        )
        self.timeout = getattr(settings, 'PAYMENT_MICROSERVICE_TIMEOUT', 30)
    
    def create_donation_session(self, campaign, amount: float, donor_email: str = None, 
                              donor_name: str = None, message: str = None, 
                              is_anonymous: bool = False) -> Dict[str, Any]:
        """
        Create a donation payment session through the microservice
        """
        try:
            # Prepare the request data
            donation_data = {
                'campaign_id': campaign.id,
                'campaign_name': campaign.name,
                'amount': float(amount),
                'donor_email': donor_email or 'anonymous@sada9a.com',
                'donor_name': donor_name,
                'message': message,
                'is_anonymous': is_anonymous,
                'success_url': f"{settings.FRONTEND_URL}/campaign/{campaign.id}/donation/success",
                'cancel_url': f"{settings.FRONTEND_URL}/campaign/{campaign.id}/donation/cancel",
                'webhook_url': f"{settings.BACKEND_URL}/api/campaigns/donation-webhook/"
            }
            
            logger.info(f"Creating donation session for campaign {campaign.id}, amount: {amount}")
            
            # Call the microservice
            response = requests.post(
                f'{self.microservice_url}/donation/create',
                json=donation_data,
                headers={'Content-Type': 'application/json'},
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    logger.info(f"Donation session created successfully: {result.get('session_id')}")
                    return {
                        'success': True,
                        'session_id': result['session_id'],
                        'payment_url': result['payment_url'],
                        'widget_url': result['widget_url'],
                        'status': result.get('status'),
                        'expires_at': result.get('expires_at')
                    }
                else:
                    logger.error(f"Microservice returned error: {result.get('error')}")
                    return {
                        'success': False,
                        'error': result.get('error', 'Unknown error from payment service')
                    }
            else:
                logger.error(f"Microservice request failed: {response.status_code} - {response.text}")
                return {
                    'success': False,
                    'error': f'Payment service error: {response.status_code}'
                }
                
        except requests.exceptions.Timeout:
            logger.error("Payment microservice timeout")
            return {
                'success': False,
                'error': 'Payment service timeout - please try again'
            }
        except requests.exceptions.ConnectionError:
            logger.error("Cannot connect to payment microservice")
            return {
                'success': False,
                'error': 'Payment service unavailable - please try again later'
            }
        except requests.exceptions.RequestException as e:
            logger.error(f"Payment microservice request error: {str(e)}")
            return {
                'success': False,
                'error': 'Payment service temporarily unavailable'
            }
        except Exception as e:
            logger.error(f"Unexpected error calling payment microservice: {str(e)}")
            return {
                'success': False,
                'error': 'An unexpected error occurred'
            }
    
    def get_payment_status(self, session_id: str) -> Dict[str, Any]:
        """
        Get payment status from the microservice
        """
        try:
            response = requests.get(
                f'{self.microservice_url}/payment/status/{session_id}',
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                return {
                    'success': True,
                    'data': response.json()
                }
            elif response.status_code == 404:
                return {
                    'success': False,
                    'error': 'Payment session not found'
                }
            else:
                return {
                    'success': False,
                    'error': f'Error retrieving payment status: {response.status_code}'
                }
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Error getting payment status: {str(e)}")
            return {
                'success': False,
                'error': 'Payment service temporarily unavailable'
            }
    
    def verify_webhook(self, webhook_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Verify webhook data with the microservice
        """
        try:
            response = requests.post(
                f'{self.microservice_url}/webhook/verify',
                json=webhook_data,
                headers={'Content-Type': 'application/json'},
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                return {
                    'success': True,
                    'data': response.json()
                }
            else:
                return {
                    'success': False,
                    'error': f'Webhook verification failed: {response.status_code}'
                }
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Error verifying webhook: {str(e)}")
            return {
                'success': False,
                'error': 'Payment service temporarily unavailable'
            }
    
    def health_check(self) -> bool:
        """
        Check if the payment microservice is healthy
        """
        try:
            response = requests.get(
                f'{self.microservice_url}/health',
                timeout=5
            )
            return response.status_code == 200
        except:
            return False

# Initialize the client
payment_client = PaymentMicroserviceClient()


# Legacy class for backward compatibility (if needed)
class NextremitlyPaymentService:
    """
    Backward compatibility wrapper - now uses microservice
    """
    def __init__(self):
        self.client = payment_client
    
    def create_payment_session(self, campaign, amount, donor_email=None):
        """Legacy method - redirects to microservice"""
        return self.client.create_donation_session(
            campaign=campaign,
            amount=amount,
            donor_email=donor_email
        )
    
    def get_payment_widget_url(self, session_id):
        """Get widget URL from session data"""
        # This would be returned in the session creation response
        return f"http://localhost:5173/payment/{session_id}"

# Keep the old instance for backward compatibility
payment_service = NextremitlyPaymentService()