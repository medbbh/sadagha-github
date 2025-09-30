import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign, CreditCard, User, Mail, MessageSquare, CheckCircle, AlertCircle, Heart, ExternalLink } from 'lucide-react';
import api from '../../api/axiosConfig';
import DonationService from '../../api/endpoints/donationAPI';
import { useNavigate } from 'react-router-dom';
import CelebrationAnimation from './CelebrationOverlay';
import { useAuth } from '../../contexts/AuthContext';
import CampaignDonationsMessages from './CampaignDonationsMessages';
import CombinedProgressDonors from './CombinedProgressDonors';


export default function DonationForm({
  campaignId: propCampaignId,
  currentAmount,
  targetAmount,
  donorsCount,
  progress,
  onDonationSuccess,
  refreshCampaign
}) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // Try to get campaign ID from URL if not provided as prop
  const urlCampaignId = window.location.pathname.split('/')[2];
  const campaignId = propCampaignId || urlCampaignId;
  const navigate = useNavigate();
  const [donationAmount, setDonationAmount] = useState(25);
  const [donorEmail, setDonorEmail] = useState('');
  const [donorName, setDonorName] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [pollingMessage, setPollingMessage] = useState('');
  const [currentPopup, setCurrentPopup] = useState(null);
  const { user } = useAuth();

  // Cleanup celebration animation on unmount
  useEffect(() => {
    return () => {
      setShowCelebration(false);
    };
  }, []);

  // Validation
  const validateForm = () => {
    if (!campaignId || campaignId === 'undefined') {
      return t('donationForm.errorCampaignMissing');
    }
    if (donationAmount < 1) {
      return t('donationForm.validationMinAmount');
    }

    return null;
  };

  const handleDonate = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);
    setShowPaymentOptions(false);


    // UNCOMMENT THIS WHEN PAYMENT IS READY
    const donationData = {
      amount: parseFloat(donationAmount),
      donor_name: donorName || '',
      message: message || '',
      is_anonymous: isAnonymous
    };

    console.log('Creating donation for campaign:', campaignId, 'with data:', donationData);

    try {
      const response = await DonationService.createDonation(campaignId, donationData);

      console.log('Full response object:', response);

      const data = response.data;
      console.log('Donation response data:', data);

      if (data && data.success) {
        console.log('Donation session created successfully');

        if (!data.payment_url || !data.session_id) {
          throw new Error('Invalid payment session data received');
        }

        setPaymentUrl(data.payment_url);

        const donationInfo = {
          donation_id: data.donation_id,
          session_id: data.session_id,
          amount: donationAmount
        };

        const popupWorked = tryOpenPopup(data.payment_url, data.session_id, donationInfo);
        if (!popupWorked) {
          setShowPaymentOptions(true);
        }

        // Start polling for payment status
        pollPaymentStatus(data.session_id, data.donation_id);
      } else {
        const errorMessage = data?.error || 'Failed to create donation session';
        console.error('Donation creation failed:', errorMessage);
        setError(errorMessage);
      }

    } catch (err) {
      console.error('Donation error:', err);

      let errorMessage = 'An unexpected error occurred';

      if (err.message) {
        errorMessage = err.message;
      } else if (err.status) {
        switch (err.status) {
          case 400:
            errorMessage = 'Invalid request. Please check your input.';
            break;
          case 404:
            errorMessage = 'Campaign not found.';
            break;
          case 503:
            errorMessage = 'Payment service is temporarily unavailable. Please try again later.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
          default:
            errorMessage = `Server error (${err.status}). Please try again.`;
        }
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }

  };

  const pollPaymentStatus = async (sessionId, donationId) => {
    const maxAttempts = 30; // Poll for 5 minutes
    let attempts = 0;

    setPollingMessage('Checking payment status...');

    const poll = async () => {
      try {
        const response = await DonationService.syncDonationStatus(sessionId);
        const data = response.data;

        console.log(`Polling attempt ${attempts + 1}: Status = ${data.status}`);

        if (data.status === 'completed') {
          setPollingMessage('');

          // Close popup immediately when payment is completed
          if (currentPopup && !currentPopup.closed) {
            try {
              currentPopup.close();
              console.log('Popup closed due to payment completion detected in polling');
            } catch (e) {
              console.warn('Could not close popup from polling:', e);
            }
          }

          console.log('Payment completed successfully!');

          // Handle payment success
          const donationInfo = {
            donation_id: donationId,
            session_id: sessionId,
            amount: donationAmount
          };

          handlePaymentSuccess(donationInfo);
          return;
        } else if (data.status === 'failed' || data.status === 'cancelled') {
          setPollingMessage('');

          // Close popup on failure/cancellation too
          if (currentPopup && !currentPopup.closed) {
            try {
              currentPopup.close();
              console.log('Popup closed due to payment failure/cancellation');
            } catch (e) {
              console.warn('Could not close popup:', e);
            }
          }

          setError('Payment was not completed');
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000); // Poll every 10 seconds
        } else {
          setPollingMessage('');
          setError('Payment status check timed out. Please contact support if payment was completed.');
        }
      } catch (error) {
        console.error('Error polling payment status:', error);
        setPollingMessage('');
        setError('Could not check payment status');
      }
    };

    poll();
  };

  const tryOpenPopup = (paymentUrl, sessionId, donationInfo) => {
    try {
      console.log('Attempting to open payment popup:', paymentUrl);

      const popup = window.open(
        paymentUrl,
        'nextremitly-payment',
        'width=600,height=800,scrollbars=yes,resizable=yes,centerscreen=yes'
      );

      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        console.log('Popup was blocked');
        return false;
      }

      // Store popup reference for polling function
      setCurrentPopup(popup);
      setupPopupHandlers(popup, sessionId, donationInfo);
      return true;

    } catch (error) {
      console.log('Error opening popup:', error);
      return false;
    }
  };

  const setupPopupHandlers = (popup, sessionId, donationInfo) => {
    let isPaymentCompleted = false;
    let cleanupDone = false;

    const forceClosePopup = () => {
      if (!popup.closed) {
        try {
          popup.close();
          console.log('Popup force-closed');
        } catch (e) {
          console.warn('Could not force close popup:', e);
        }
      }
    };

    const cleanup = () => {
      if (cleanupDone) return;
      cleanupDone = true;

      clearInterval(checkClosed);
      window.removeEventListener('message', messageHandler);
      forceClosePopup();

      // Clear popup reference
      setCurrentPopup(null);
    };

    const checkClosed = setInterval(() => {
      if (popup.closed) {
        console.log('Payment popup closed');
        cleanup();

        if (!isPaymentCompleted) {
          setTimeout(() => {
            checkPaymentStatusAndRedirect(sessionId, donationInfo);
          }, 1000);
        }
      }
    }, 500); // Check more frequently

    const messageHandler = (event) => {
      console.log('Received message from popup:', event.data);

      const allowedOrigins = [
        'https://next-remitly-frontend.vercel.app',
        window.location.origin
      ];

      if (!allowedOrigins.includes(event.origin)) {
        console.warn('Unauthorized message origin:', event.origin);
        return;
      }

      // Handle any success-related messages
      if (event.data.type === 'payment-completed' ||
        event.data.type === 'payment-success' ||
        event.data.type === 'success' ||
        event.data.status === 'completed' ||
        event.data.status === 'success') {

        isPaymentCompleted = true;
        console.log('Payment completed via message - immediately closing popup');

        // Immediately close popup
        forceClosePopup();
        cleanup();

        // Handle success immediately
        setTimeout(() => {
          handlePaymentSuccess(donationInfo);
        }, 100);

      } else if (event.data.type === 'payment-failed' || event.data.status === 'failed') {
        console.log('Payment failed - closing popup');
        forceClosePopup();
        cleanup();
        setError('Payment failed. Please try again.');
        setShowPaymentOptions(false);

      } else if (event.data.type === 'payment-cancelled' || event.data.status === 'cancelled') {
        console.log('Payment cancelled - closing popup');
        forceClosePopup();
        cleanup();
        setError('Payment was cancelled.');
        setShowPaymentOptions(false);
      }
    };

    window.addEventListener('message', messageHandler);

    // Also listen for URL changes in popup that might indicate success
    const urlCheckInterval = setInterval(() => {
      if (popup.closed) return;

      try {
        const popupUrl = popup.location.href;
        if (popupUrl.includes('success') || popupUrl.includes('completed')) {
          console.log('Success detected in popup URL - closing popup');
          isPaymentCompleted = true;
          forceClosePopup();
          cleanup();
          clearInterval(urlCheckInterval);
          handlePaymentSuccess(donationInfo);
        }
      } catch (e) {
        // Cross-origin restrictions prevent URL access, this is normal
      }
    }, 1000);

    // Timeout to close popup after 15 minutes
    setTimeout(() => {
      if (!popup.closed) {
        console.log('Payment session expired - closing popup');
        clearInterval(urlCheckInterval);
        cleanup();
        setError('Payment session expired. Please try again.');
      }
    }, 900000);
  };

  const checkPaymentStatusAndRedirect = async (sessionId, donationInfo) => {
    try {
      console.log('Checking payment status for session:', sessionId);

      const response = await fetch(`/api/campaigns/payment_status/?session_id=${sessionId}`);
      if (response.ok) {
        const statusData = await response.json();
        console.log('Payment status:', statusData);

        if (statusData.status === 'completed' || statusData.status === 'success') {
          console.log('Payment confirmed as successful - handling success');
          handlePaymentSuccess(donationInfo);
        } else if (statusData.status === 'failed') {
          console.log('Payment confirmed as failed');
          setError('Payment failed. Please try again.');
        } else if (statusData.status === 'cancelled') {
          console.log('Payment confirmed as cancelled');
          setError('Payment was cancelled.');
        } else {
          console.log('Payment status unclear, assuming success and redirecting');
          handlePaymentSuccess(donationInfo);
        }
      } else {
        console.log('Could not verify payment status, assuming success');
        handlePaymentSuccess(donationInfo);
      }
    } catch (err) {
      console.log('Error checking payment status:', err, 'assuming success');
      handlePaymentSuccess(donationInfo);
    }
  };

  const handlePaymentSuccess = (donationInfo) => {
    console.log('Payment successful, showing celebration...');

    // Clear any existing celebration first to prevent stacking
    setShowCelebration(false);

    setError(null);
    setIsLoading(false);
    setShowPaymentOptions(false);
    setPollingMessage('');

    // Show celebration after a brief delay to ensure previous one is cleared
    setTimeout(() => {
      setShowCelebration(true);

      // Auto-hide celebration after duration
      setTimeout(() => {
        setShowCelebration(false);
      }, 4000);
    }, 100);

    if (refreshCampaign) {
      refreshCampaign();
    }

    // Update parent component with new donation
    onDonationSuccess?.({
      donation_id: donationInfo.donation_id,
      amount: donationAmount,
      donor_name: isAnonymous ? 'Anonymous' : donorName,
      message: isAnonymous ? null : message,
    });

    resetForm();
  };


  const redirectToSuccessPage = (donationInfo) => {
    if (typeof navigate !== 'undefined') {
      navigate(`/campaign/${campaignId}/donation/success`, {
        state: {
          donationId: donationInfo.donation_id,
          amount: donationAmount,
          campaignId: campaignId,
          donorName: isAnonymous ? 'Anonymous' : donorName
        }
      });
      return;
    }

    const successUrl = `/campaign/${campaignId}/donation/success?` +
      `donation_id=${donationInfo.donation_id}&` +
      `amount=${donationAmount}&` +
      `donor_name=${encodeURIComponent(isAnonymous ? 'Anonymous' : donorName || 'Anonymous')}`;

    window.location.href = successUrl;
  };

  const openInNewTab = () => {
    if (paymentUrl) {
      const newTab = window.open(paymentUrl, '_blank');
      setShowPaymentOptions(false);

      setShowSuccessMessage(true);

      setTimeout(() => {
        setShowSuccessMessage(false);
        redirectToSuccessPage({
          donation_id: 'unknown',
          session_id: 'unknown',
          amount: donationAmount
        });
      }, 3000);
    }
  };

  const resetForm = () => {
    setDonationAmount(25);
    setDonorEmail('');
    setDonorName('');
    setMessage('');
    setIsAnonymous(false);
    setPaymentUrl(null);
    setShowPaymentOptions(false);
    setShowCelebration(false);
    setPollingMessage('');
    setCurrentPopup(null);
  };

  const retryPopup = () => {
    if (paymentUrl) {
      const popupWorked = tryOpenPopup(paymentUrl, 'retry');
      if (!popupWorked) {
        setError(t('donationForm.popupBlocked'));
      } else {
        setShowPaymentOptions(false);
      }
    }
  };

  // Don't render if no campaign ID
  if (!campaignId || campaignId === 'undefined') {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-red-600 me-2" />
          <p className="text-red-700 font-medium">{t('donationForm.errorCampaignMissing')}</p>
        </div>
      </div>
    );
  }


  const quickAmounts = [10, 25, 50, 100, 250, 500];

  return (
    <>
      {user ?

        <div className={`p-4 sm:p-6 bg-white rounded-xl shadow-lg border border-gray-100 relative ${isRTL ? 'text-end' : 'text-start'}`} dir={isRTL ? 'rtl' : 'ltr'}>
  {/* Celebration Animation */}
  <CelebrationAnimation
    isVisible={showCelebration}
    duration={4000}
    type="confetti"
    intensity="medium"
  />

  <div className="mb-4">
    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 flex items-center">
      <Heart className={`w-5 h-5 sm:w-6 sm:h-6 text-red-500 ${isRTL ? 'ms-2' : 'me-2'}`} />
      {t('donationForm.supportThisCampaign')}
    </h2>
    <p className="text-sm text-gray-600">{t('donationForm.makeDifference')}</p>
  </div>

  {/* Success Message */}
  {showSuccessMessage && (
    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
      <CheckCircle className={`w-5 h-5 text-green-600 flex-shrink-0 ${isRTL ? 'ms-2' : 'me-2'}`} />
      <div>
        <p className="text-green-800 font-medium text-sm">{t('donationForm.thankyouDonation')}</p>
        <p className="text-green-700 text-xs">{t('donationForm.redirectingSuccess')}</p>
      </div>
    </div>
  )}

  {/* Combined Progress & Donors */}
  <CombinedProgressDonors
    campaignId={campaignId}
    currentAmount={currentAmount}
    targetAmount={targetAmount}
    donorsCount={donorsCount}
    isRTL={isRTL}
  />

  {/* Polling Message */}
  {pollingMessage && (
    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center">
      <div className={`animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 flex-shrink-0 ${isRTL ? 'ms-2' : 'me-2'}`}></div>
      <p className="text-sm text-blue-700">{pollingMessage}</p>
    </div>
  )}

  {/* Error Display */}
  {error && (
    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
      <AlertCircle className={`w-5 h-5 text-red-600 flex-shrink-0 ${isRTL ? 'ms-2' : 'me-2'}`} />
      <p className="text-sm text-red-700">{error}</p>
    </div>
  )}

  {/* Donation Amount - Compact */}
  <div className="mb-4">
    <h3 className="text-base font-semibold text-gray-800 mb-3">{t('donationForm.chooseDonationAmount')}</h3>

    {/* Quick amounts in 2 rows on mobile, 1 row on desktop */}
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
      {quickAmounts.map((amount) => (
        <button
          key={amount}
          onClick={() => setDonationAmount(amount)}
          className={`py-2 px-2 rounded-lg border-2 transition-all font-medium text-xs sm:text-sm ${
            donationAmount === amount
              ? 'border-blue-500 bg-blue-50 text-blue-700 scale-105 shadow'
              : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
          }`}
        >
          {amount}
        </button>
      ))}
    </div>

    {/* Custom amount inline */}
    <div className="relative">
      <input
        type="number"
        value={donationAmount}
        onChange={(e) => setDonationAmount(Number(e.target.value))}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
        placeholder={t('donationForm.customAmount')}
        min="1"
        dir={isRTL ? 'rtl' : 'ltr'}
      />
      <div className={`absolute inset-y-0 ${isRTL ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center pointer-events-none`}>
        <span className="text-gray-500 text-sm font-medium">MRU</span>
      </div>
    </div>
  </div>

  {/* Donor Info - Compact */}
  <div className="mb-4">
    <h3 className="text-base font-semibold text-gray-800 mb-3">{t('donationForm.donorInformation')}</h3>

    <div className="space-y-3">
      {/* Name input */}
      <div className="relative">
        <User className={`absolute ${isRTL ? 'end-3' : 'start-3'} top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400`} />
        <input
          type="text"
          value={donorName}
          onChange={(e) => setDonorName(e.target.value)}
          className={`w-full ${isRTL ? 'pe-10 ps-3' : 'ps-10 pe-3'} py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm`}
          placeholder={t('donationForm.yourFullName')}
          disabled={isAnonymous}
        />
      </div>

      {/* Message */}
      <div className="relative">
        <MessageSquare className={`absolute ${isRTL ? 'end-3' : 'start-3'} top-3 w-4 h-4 text-gray-400`} />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows="2"
          className={`w-full ${isRTL ? 'pe-10 ps-3' : 'ps-10 pe-3'} py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm`}
          placeholder={t('donationForm.shareMessage')}
        />
      </div>

      {/* Anonymous checkbox */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="anonymous"
          checked={isAnonymous}
          onChange={(e) => setIsAnonymous(e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="anonymous" className={`text-sm text-gray-700 ${isRTL ? 'me-2' : 'ms-2'}`}>
          {t('donationForm.makeAnonymous')}
        </label>
      </div>
    </div>
  </div>

  {/* Donation Button */}
  <button
    onClick={handleDonate}
    disabled={isLoading || donationAmount < 1 || !campaignId}
    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center"
  >
    {isLoading ? (
      <>
        <div className={`animate-spin rounded-full h-5 w-5 border-b-2 border-white ${isRTL ? 'ms-2' : 'me-2'}`}></div>
        <span className="text-sm sm:text-base">{t('donationForm.processing')}</span>
      </>
    ) : (
      <>
        <span className="text-sm sm:text-base">{t('donationForm.donate')} {donationAmount} MRU</span>
        <CreditCard className={`w-5 h-5 ${isRTL ? 'me-2' : 'ms-2'}`} />
      </>
    )}
  </button>
</div>
        :

        (
          <div className={`p-8 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl shadow-lg border border-blue-200 text-center`}>
            <div className="max-w-md mx-auto">
              {/* Icon */}
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-blue-600" />
              </div>

              {/* Title */}
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t('donationForm.loginRequired')}
              </h3>

              {/* Description */}
              <p className="text-gray-600 mb-6 leading-relaxed">
                {t('donationForm.loginDescription')}
              </p>

              {/* Login Button */}
              <button
                onClick={() => navigate('/login')} // Adjust navigation path as needed
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 flex items-center justify-center"
              >
                <User className={`w-5 h-5 ${isRTL ? 'ms-2' : 'me-2'}`} />
                {t('donationForm.loginButton')}
              </button>

              {/* Additional Info */}
              <div className="mt-4 pt-4 border-t border-blue-200">
                <p className="text-sm text-gray-500">
                  {t('donationForm.noAccount')}{' '}
                  <button
                    onClick={() => navigate('/signup')} // Adjust navigation path as needed
                    className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                  >
                    {t('donationForm.signUp')}
                  </button>
                </p>
              </div>
            </div>
          </div>)

      }
    </>
  );
}