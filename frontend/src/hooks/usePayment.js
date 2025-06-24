// hooks/usePayment.js
import { useState, useCallback } from 'react';
import { campaignService } from '../api/campaignService';

export const usePayment = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentSession, setPaymentSession] = useState(null);

  const createDonation = useCallback(async (campaignId, donationData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await campaignService.createDonation(campaignId, donationData);
      
      if (response.data.success) {
        setPaymentSession(response.data);
        return response.data;
      } else {
        throw new Error(response.data.error || 'Failed to create donation');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Network error';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const openPaymentPopup = useCallback((paymentUrl, sessionId, onSuccess, onError) => {
    const popup = window.open(
      paymentUrl,
      'nextremitly-payment',
      'width=600,height=800,scrollbars=yes,resizable=yes,centerscreen=yes'
    );

    if (!popup) {
      const error = 'Popup blocked. Please allow popups and try again.';
      setError(error);
      onError?.(error);
      return;
    }

    // Monitor popup for closure
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        // Popup closed without explicit success/failure
        onSuccess?.('closed');
      }
    }, 1000);

    // Listen for payment completion messages
    const messageHandler = (event) => {
      // Verify origin for security
      const allowedOrigins = ['http://localhost:5173', 'https://nextremitly.com'];
      if (!allowedOrigins.includes(event.origin)) {
        return;
      }

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
        onError?.('Payment timeout');
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
    createDonation,
    openPaymentPopup,
    processPayment,
    clearError,
    clearSession,
  };
};