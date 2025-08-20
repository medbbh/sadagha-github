# campaign/services/payment_service.py
import requests
import logging
from django.conf import settings
from decimal import Decimal
from typing import Dict, Any, Optional
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry



logger = logging.getLogger(__name__)

class NextRemitlyService:
    """Service for handling NextRemitly payment integration"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        # self.base_url = getattr(settings, 'NEXTREMITLY_BASE_URL')
        self.base_url = "https://medbbh.pythonanywhere.com"
        # self.frontend_url = getattr(settings, 'NEXTREMITLY_FRONTEND_URL')
        self.frontend_url = "https://next-remitly-frontend.vercel.app"
        self.timeout = 30
        
        # Setup session with retries
        self.session = requests.Session()
        retry_strategy = Retry(
            total=3,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["HEAD", "GET", "POST"],
            backoff_factor=1
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)
    
    def _get_headers(self) -> Dict[str, str]:
        """Get request headers with authorization"""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "User-Agent": "Sada9a-Platform/1.0"
        }
    
    def _handle_response(self, response: requests.Response, operation: str) -> Dict[str, Any]:
        """Handle API response and extract relevant data"""
        try:
            if response.status_code == 201:
                data = response.json()
                logger.info(f"{operation} successful: {data.get('session_id', 'N/A')}")
                return {
                    "success": True,
                    "session_id": data.get("session_id"),
                    "payment_url": data.get("payment_url"),
                    "widget_url": data.get("widget_url"),
                    "status": data.get("status"),
                    "expires_at": data.get("expires_at")
                }
            
            elif response.status_code == 200:
                return {"success": True, **response.json()}
            
            elif response.status_code == 404:
                return {"success": False, "error": "Resource not found"}
            
            elif response.status_code == 401:
                return {"success": False, "error": "Invalid API key"}
            
            elif response.status_code == 400:
                error_data = response.json() if response.text else {}
                error_msg = error_data.get("message", "Invalid request data")
                return {"success": False, "error": error_msg}
            
            else:
                error_msg = f"NextRemitly API error: {response.status_code}"
                logger.error(f"{operation} failed: {error_msg}")
                return {"success": False, "error": error_msg}
                
        except ValueError as e:
            logger.error(f"JSON decode error in {operation}: {str(e)}")
            return {"success": False, "error": "Invalid response from payment service"}
    
    def create_payment_session(self, amount: float, campaign, donor_data: Dict) -> Dict[str, Any]:
        """Create payment session directly with NextRemitly"""
        
        # Build webhook URL
        webhook_url = f"{getattr(settings, 'BACKEND_URL', 'https://medbbh.pythonanywhere.com')}/api/campaigns/donation-webhook/"
        
        payment_data = {
            "amount": amount,
            "currency": "MRU",
            "description": f"Donation to {campaign.name}",
            "customer_email": donor_data.get('email') or 'anonymous@sada9a.com',
            "success_url": f"{self.frontend_url}/donation/success",
            "cancel_url": f"{self.frontend_url}/donation/cancel",
            "webhook_url": webhook_url,
            "metadata": {
                "campaign_id": str(campaign.id),
                "campaign_name": campaign.name,
                "organization_id": str(campaign.organization.id),
                "organization_name": campaign.organization.org_name,
                "donor_name": donor_data.get('name'),
                "donor_email": donor_data.get('email'),
                "platform": "sada9a",
                "type": "donation",
                "version": "2.0"
            }
        }
        
        try:
            logger.info(f"Creating payment session for campaign {campaign.id}, amount: {amount} MRU")
            logger.debug(f"Payment data: {payment_data}")
            
            response = self.session.post(
                f"{self.base_url}/api/payment/sessions/",
                json=payment_data,
                headers=self._get_headers(),
                timeout=self.timeout
            )
            
            logger.info(f"NextRemitly response status: {response.status_code}")
            return self._handle_response(response, "Payment session creation")
            
        except requests.exceptions.Timeout:
            logger.error("NextRemitly request timeout")
            return {"success": False, "error": "Payment service timeout - please try again"}
        
        except requests.exceptions.ConnectionError:
            logger.error("NextRemitly connection error")
            return {"success": False, "error": "Cannot connect to payment service"}
        
        except requests.exceptions.RequestException as e:
            logger.error(f"NextRemitly request error: {str(e)}")
            return {"success": False, "error": "Payment service temporarily unavailable"}
        
        except Exception as e:
            logger.error(f"Unexpected error in payment session creation: {str(e)}")
            return {"success": False, "error": "An unexpected error occurred"}
    
    def get_payment_status(self, session_id: str) -> Dict[str, Any]:
        """Get payment status from NextRemitly"""
        try:
            logger.info(f"Getting payment status for session: {session_id}")
            
            response = self.session.get(
                f"{self.base_url}/api/payment/sessions/{session_id}/",
                headers=self._get_headers(),
                timeout=10
            )
            
            return self._handle_response(response, "Payment status retrieval")
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error getting payment status: {str(e)}")
            return {"success": False, "error": "Cannot retrieve payment status"}
    
    def test_connection(self) -> bool:
        """Test connection to NextRemitly API"""
        try:
            response = self.session.get(
                f"{self.base_url}/api/health/",
                headers=self._get_headers(),
                timeout=5
            )
            return response.status_code < 500
        except:
            return False


class PaymentServiceManager:
    """Manager for handling payment operations across organizations"""
    
    @staticmethod
    def create_payment_for_campaign(campaign, amount: float, donor_data: Dict) -> Dict[str, Any]:
        """Create payment session for a campaign using its organization's API key"""
        
        # Validate organization can receive payments
        if not campaign.organization.can_receive_payments():
            return {
                "success": False,
                "error": "Organization cannot receive payments. Please check API key setup."
            }
        
        # Create service instance with organization's API key
        service = NextRemitlyService(campaign.organization.nextremitly_api_key)
        
        # Test connection first
        if not service.test_connection():
            return {
                "success": False,
                "error": "Cannot connect to payment service. Please check API key."
            }
        
        # Create payment session
        return service.create_payment_session(amount, campaign, donor_data)
    
    @staticmethod
    def get_payment_status_for_donation(donation) -> Dict[str, Any]:
        """Get payment status for a specific donation"""
        
        if not donation.payment_session_id:
            return {"success": False, "error": "No payment session found"}
        
        if not donation.campaign.organization.nextremitly_api_key:
            return {"success": False, "error": "Organization API key not configured"}
        
        service = NextRemitlyService(donation.campaign.organization.nextremitly_api_key)
        return service.get_payment_status(donation.payment_session_id)
    
    @staticmethod
    def validate_organization_api_key(organization) -> Dict[str, Any]:
        """Validate an organization's API key"""
        
        if not organization.nextremitly_api_key:
            return {"valid": False, "error": "No API key configured"}
        
        logger.info(f"Validating API key for org {organization.id}")
        logger.info(f"API key length: {len(organization.nextremitly_api_key)}")
        logger.info(f"API key starts with: {organization.nextremitly_api_key[:10]}")
        
        service = NextRemitlyService(organization.nextremitly_api_key)
        
        # Add more detailed testing
        connection_result = service.test_connection()
        logger.info(f"Connection test result: {connection_result}")
        
        if connection_result:
            return {"valid": True, "message": "API key is valid"}
        else:
            return {"valid": False, "error": "API key is invalid or service unavailable"}