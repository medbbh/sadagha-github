# nextremitly_payment_service/main.py
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
import requests
import logging
import os
from datetime import datetime
import json
from dotenv import load_dotenv
load_dotenv()
# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="NextRemitly Payment Service",
    description="Microservice for handling NextRemitly payments",
    version="1.0.0"
)

# cors headers
@app.middleware("http")
async def add_cors_headers(request, call_next):
    response = await call_next(request)
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

# Configuration
NEXTREMITLY_API_KEY = os.getenv("NEXTREMITLY_API_KEY")
NEXTREMITLY_BASE_URL = os.getenv("NEXTREMITLY_BASE_URL", "http://localhost:8000")
NEXTREMITLY_FRONTEND_URL = os.getenv("NEXTREMITLY_FRONTEND_URL", "http://localhost:5173")
print(f"NEXTREMITLY_BASE_URL: {NEXTREMITLY_API_KEY}")
if not NEXTREMITLY_API_KEY:
    logger.warning("NEXTREMITLY_API_KEY not set!")

# Pydantic Models
class PaymentSessionRequest(BaseModel):
    amount: float
    currency: str = "MRU"
    description: str
    customer_email: Optional[EmailStr] = "anonymous@sada9a.com"
    success_url: str
    cancel_url: str
    webhook_url: str
    metadata: Optional[Dict[str, Any]] = {}

class PaymentSessionResponse(BaseModel):
    success: bool
    session_id: Optional[str] = None
    payment_url: Optional[str] = None
    widget_url: Optional[str] = None
    status: Optional[str] = None
    expires_at: Optional[str] = None
    error: Optional[str] = None

class DonationRequest(BaseModel):
    campaign_id: int
    campaign_name: str
    amount: float
    donor_email: Optional[EmailStr] = "anonymous@sada9a.com"
    donor_name: Optional[str] = None
    message: Optional[str] = None
    is_anonymous: bool = False
    success_url: str
    cancel_url: str
    webhook_url: str

class WebhookPayload(BaseModel):
    session_id: str
    status: str
    amount: Optional[float] = None
    currency: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = {}
    transaction_id: Optional[str] = None

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "nextremitly-payment",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/payment/sessions", response_model=PaymentSessionResponse)
async def create_payment_session(request: PaymentSessionRequest):
    """Create a payment session with NextRemitly"""
    
    if not NEXTREMITLY_API_KEY:
        logger.error("NEXTREMITLY_API_KEY not configured")
        raise HTTPException(
            status_code=500, 
            detail="Payment service not configured"
        )
    
    # Validate amount
    if request.amount <= 0:
        raise HTTPException(
            status_code=400,
            detail="Amount must be greater than 0"
        )
    
    try:
        # Prepare payment data for NextRemitly
        payment_data = {
            "amount": request.amount,
            "currency": request.currency,
            "description": request.description,
            "customer_email": request.customer_email,
            "success_url": request.success_url,
            "cancel_url": request.cancel_url,
            "webhook_url": request.webhook_url,
            "metadata": request.metadata
        }
        
        logger.info(f"Creating payment session for amount: {request.amount} {request.currency}")
        
        # Test NextRemitly connection first
        try:
            test_response = requests.get(
                f"{NEXTREMITLY_BASE_URL}/api/merchants/wallets/providers/",
                timeout=5
            )
            if test_response.status_code >= 500:
                raise HTTPException(
                    status_code=503,
                    detail="NextRemitly service is temporarily unavailable"
                )
        except requests.exceptions.RequestException:
            raise HTTPException(
                status_code=503,
                detail="Cannot connect to NextRemitly service"
            )
        
        # Create payment session
        response = requests.post(
            f"{NEXTREMITLY_BASE_URL}/api/payment/sessions/",
            json=payment_data,
            headers={
                "Authorization": f"Bearer {NEXTREMITLY_API_KEY}",
                "Content-Type": "application/json"
            },
            timeout=30
        )
        
        logger.info(f"NextRemitly response: {response.status_code}")
        
        if response.status_code == 201:
            session_data = response.json()
            logger.info(f"Payment session created: {session_data.get('session_id')}")
            
            return PaymentSessionResponse(
                success=True,
                session_id=session_data["session_id"],
                payment_url=session_data["payment_url"],
                widget_url=f"{NEXTREMITLY_FRONTEND_URL}/payment/{session_data['session_id']}",
                status=session_data.get("status"),
                expires_at=session_data.get("expires_at")
            )
        else:
            error_msg = f"NextRemitly error: {response.status_code}"
            if response.text:
                try:
                    error_data = response.json()
                    error_msg = error_data.get("message", error_msg)
                except:
                    error_msg = response.text[:200]
            
            logger.error(f"Payment session creation failed: {error_msg}")
            return PaymentSessionResponse(
                success=False,
                error=error_msg
            )
            
    except requests.exceptions.Timeout:
        logger.error("NextRemitly request timeout")
        return PaymentSessionResponse(
            success=False,
            error="Payment service timeout"
        )
    except requests.exceptions.RequestException as e:
        logger.error(f"NextRemitly request error: {str(e)}")
        return PaymentSessionResponse(
            success=False,
            error="Payment service temporarily unavailable"
        )
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return PaymentSessionResponse(
            success=False,
            error="An unexpected error occurred"
        )

@app.post("/donation/create", response_model=PaymentSessionResponse)
async def create_donation_session(request: DonationRequest):
    """Create a donation payment session - simplified wrapper"""
    
    payment_request = PaymentSessionRequest(
        amount=request.amount,
        currency="MRU",
        description=f"Donation to {request.campaign_name}",
        customer_email=request.donor_email,
        success_url=request.success_url,
        cancel_url=request.cancel_url,
        webhook_url=request.webhook_url,
        metadata={
            "campaign_id": request.campaign_id,
            "campaign_name": request.campaign_name,
            "donation_amount": str(request.amount),
            "donor_name": request.donor_name,
            "donor_email": request.donor_email,
            "message": request.message,
            "is_anonymous": request.is_anonymous,
            "platform": "sada9a",
            "type": "donation"
        }
    )
    
    return await create_payment_session(payment_request)

@app.get("/payment/status/{session_id}")
async def get_payment_status(session_id: str):
    """Get payment status from NextRemitly"""
    
    if not NEXTREMITLY_API_KEY:
        raise HTTPException(status_code=500, detail="Payment service not configured")
    
    try:
        response = requests.get(
            f"{NEXTREMITLY_BASE_URL}/api/payment/sessions/{session_id}/",
            headers={
                "Authorization": f"Bearer {NEXTREMITLY_API_KEY}",
                "Content-Type": "application/json"
            },
            timeout=10
        )
        
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 404:
            raise HTTPException(status_code=404, detail="Payment session not found")
        else:
            raise HTTPException(
                status_code=response.status_code,
                detail="Error retrieving payment status"
            )
            
    except requests.exceptions.RequestException as e:
        logger.error(f"Error getting payment status: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail="Payment service temporarily unavailable"
        )

@app.post("/webhook/verify")
async def verify_webhook(payload: WebhookPayload, background_tasks: BackgroundTasks):
    """Verify and process webhook from NextRemitly"""
    
    logger.info(f"Received webhook for session {payload.session_id}: {payload.status}")
    
    # Add background task for webhook processing if needed
    background_tasks.add_task(log_webhook_event, payload.dict())
    
    # Return webhook data for Django to process
    return {
        "success": True,
        "session_id": payload.session_id,
        "status": payload.status,
        "metadata": payload.metadata,
        "transaction_id": payload.transaction_id,
        "amount": payload.amount,
        "currency": payload.currency
    }

async def log_webhook_event(webhook_data: dict):
    """Background task to log webhook events"""
    logger.info(f"Processing webhook: {webhook_data}")
    # Add any additional webhook processing here

# Error handlers
@app.exception_handler(requests.exceptions.RequestException)
async def request_exception_handler(request, exc):
    logger.error(f"Request exception: {str(exc)}")
    return HTTPException(
        status_code=503,
        detail="External service temporarily unavailable"
    )

@app.exception_handler(ValueError)
async def value_error_handler(request, exc):
    logger.error(f"Value error: {str(exc)}")
    return HTTPException(
        status_code=400,
        detail="Invalid request data"
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=int(os.getenv("PORT", 8001)),
        log_level="info"
    )