import { useState, useCallback } from 'react';
import { DonationService } from '../api/endpoints/donationAPI';

export const usePayment = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentSession, setPaymentSession] = useState(null);
  const [serviceHealthy, setServiceHealthy] = useState(true);

  // Check if payment service is healthy
  const checkServiceHealth = useCallback(async () => {
    try {
      const health = await DonationService.checkPaymentServiceHealth();
      setServiceHealthy(health.healthy !== false);
      return health.healthy !== false;
    } catch {
      setServiceHealthy(false);
      return false;
    }
  }, []);

  const createDonation = useCallback(async (campaignId, donationData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Check service health first
      const isHealthy = await checkServiceHealth();
      if (!isHealthy) {
        throw new Error('Payment service is currently unavailable. Please try again later.');
      }

      const response = await DonationService.createDonation(campaignId, donationData);
      
      // Updated to match new microservice response structure
      if (response.data.success) {
        const sessionData = {
          success: response.data.success,
          donation_id: response.data.donation_id,
          session_id: response.data.session_id,
          payment_url: response.data.payment_url,
          widget_url: response.data.widget_url,
          expires_at: response.data.expires_at
        };
        
        setPaymentSession(sessionData);
        return sessionData;
      } else {
        throw new Error(response.data.error || 'Failed to create donation session');
      }
    } catch (err) {
      let errorMessage = 'Network error. Please try again.';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.status === 503) {
        errorMessage = 'Payment service is temporarily unavailable. Please try again later.';
      } else if (err.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [checkServiceHealth]);

  const getPaymentStatus = useCallback(async (sessionId) => {
    try {
      const response = await DonationService.getPaymentStatus(sessionId);
      return response.data;
    } catch (err) {
      console.error('Error getting payment status:', err);
      return null;
    }
  }, []);

  const openPaymentPopup = useCallback((paymentUrl, sessionId, onSuccess, onError) => {
    console.log('Opening payment popup:', paymentUrl);
    
    const popup = window.open(
      paymentUrl,
      'nextremitly-payment',
      'width=600,height=800,scrollbars=yes,resizable=yes,centerscreen=yes'
    );

    if (!popup) {
      const error = 'Popup blocked. Please allow popups and try again.';
      setError(error);
      onError?.(error);
      return null;
    }

    // Monitor popup for closure
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        console.log('Payment popup closed');
        onSuccess?.('closed');
      }
    }, 1000);

    // Listen for payment completion messages
    const messageHandler = (event) => {
      // Enhanced security - verify origin
      const allowedOrigins = [
        'https://next-remitly-frontend.vercel.app', 
        'https://nextremitly.com',
        window.location.origin // Allow same origin
      ];
      
      if (!allowedOrigins.includes(event.origin)) {
        console.warn('Received message from unauthorized origin:', event.origin);
        return;
      }

      console.log('Received payment message:', event.data);

      if (event.data.type === 'payment-completed') {
        popup.close();
        clearInterval(checkClosed);
        window.removeEventListener('message', messageHandler);
        onSuccess?.('completed', event.data);
      } else if (event.data.type === 'payment-failed') {
        popup.close();
        clearInterval(checkClosed);
        window.removeEventListener('message', messageHandler);
        onError?.('Payment failed', event.data);
      } else if (event.data.type === 'payment-cancelled') {
        popup.close();
        clearInterval(checkClosed);
        window.removeEventListener('message', messageHandler);
        onError?.('Payment cancelled', event.data);
      }
    };

    window.addEventListener('message', messageHandler);

    // Clean up after 15 minutes
    setTimeout(() => {
      if (!popup.closed) {
        popup.close();
        clearInterval(checkClosed);
        window.removeEventListener('message', messageHandler);
        onError?.('Payment timeout - session expired');
      }
    }, 900000); // 15 minutes

    return popup;
  }, []);

  const processPayment = useCallback(async (campaignId, donationData, callbacks = {}) => {
    try {
      // Create donation session
      const session = await createDonation(campaignId, donationData);
      
      // Open payment popup
      const popup = openPaymentPopup(
        session.widget_url,
        session.session_id,
        (status, data) => {
          if (status === 'completed') {
            callbacks.onSuccess?.(data);
          } else {
            callbacks.onClose?.();
          }
        },
        (error, data) => {
          callbacks.onError?.(error, data);
        }
      );

      return { session, popup };
    } catch (err) {
      callbacks.onError?.(err.message);
      throw err;
    }
  }, [createDonation, openPaymentPopup]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearSession = useCallback(() => {
    setPaymentSession(null);
  }, []);

  return {
    isLoading,
    error,
    paymentSession,
    serviceHealthy,
    createDonation,
    getPaymentStatus,
    openPaymentPopup,
    processPayment,
    checkServiceHealth,
    clearError,
    clearSession,
  };
};