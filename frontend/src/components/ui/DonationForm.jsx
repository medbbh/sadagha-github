import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign, CreditCard, User, Mail, MessageSquare, CheckCircle, AlertCircle, Heart, ExternalLink } from 'lucide-react';
import api from '../../api/axiosConfig';
import DonationService from '../../api/endpoints/donationAPI';
import { useNavigate } from 'react-router-dom';
import CelebrationAnimation from './CelebrationOverlay';

export default function DonationForm({ 
  campaignId: propCampaignId, 
  currentAmount, 
  targetAmount, 
  donorsCount, 
  progress,
  onDonationSuccess 
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

  // Validation
  const validateForm = () => {
    if (!campaignId || campaignId === 'undefined') {
      return t('donationForm.errorCampaignMissing');
    }
    if (donationAmount < 1) {
      return t('donationForm.validationMinAmount');
    }
    if (donorEmail && !/\S+@\S+\.\S+/.test(donorEmail)) {
      return t('donationForm.validationEmail');
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

    // For testing purposes, show celebration immediately
    // Remove this setTimeout and uncomment the actual payment logic when ready
    setTimeout(() => {
      setIsLoading(false);
      setShowCelebration(true);
    }, 1000);

    /* 
    // UNCOMMENT THIS WHEN PAYMENT IS READY
    const donationData = {
      amount: parseFloat(donationAmount),
      donor_email: donorEmail || 'anonymous@sada9a.com',
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
        
        if (!data.widget_url || !data.session_id) {
          throw new Error('Invalid payment session data received');
        }
        
        setPaymentUrl(data.widget_url);
        
        const donationInfo = {
          donation_id: data.donation_id,
          session_id: data.session_id,
          amount: donationAmount
        };
        
        const popupWorked = tryOpenPopup(data.widget_url, data.session_id, donationInfo);
        if (!popupWorked) {
          setShowPaymentOptions(true);
        }
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
    */
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

      setupPopupHandlers(popup, sessionId, donationInfo);
      return true;
      
    } catch (error) {
      console.log('Error opening popup:', error);
      return false;
    }
  };

  const setupPopupHandlers = (popup, sessionId, donationInfo) => {
    let isPaymentCompleted = false;

    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        console.log('Payment popup closed');
        
        if (!isPaymentCompleted) {
          setTimeout(() => {
            checkPaymentStatusAndRedirect(sessionId, donationInfo);
          }, 1000);
        }
      }
    }, 1000);

    const messageHandler = (event) => {
      console.log('Received message from popup:', event.data);
      
      const allowedOrigins = [
        'http://localhost:5173', 
        'https://nextremitly.com',
        window.location.origin
      ];
      
      if (!allowedOrigins.includes(event.origin)) {
        console.warn('Unauthorized message origin:', event.origin);
        return;
      }
      
      if (event.data.type === 'payment-completed' || event.data.type === 'payment-success') {
        isPaymentCompleted = true;
        
        popup.close();
        clearInterval(checkClosed);
        window.removeEventListener('message', messageHandler);
        
        console.log('Payment completed via message - popup closed, redirecting main tab');
        
        handlePaymentSuccess(donationInfo);
        
      } else if (event.data.type === 'payment-failed') {
        popup.close();
        clearInterval(checkClosed);
        window.removeEventListener('message', messageHandler);
        setError('Payment failed. Please try again.');
        setShowPaymentOptions(false);
        
      } else if (event.data.type === 'payment-cancelled') {
        popup.close();
        clearInterval(checkClosed);
        window.removeEventListener('message', messageHandler);
        setError('Payment was cancelled.');
        setShowPaymentOptions(false);
      }
    };

    window.addEventListener('message', messageHandler);

    setTimeout(() => {
      if (!popup.closed) {
        popup.close();
        clearInterval(checkClosed);
        window.removeEventListener('message', messageHandler);
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
          handlePaymentSuccess(donationInfo);
        } else if (statusData.status === 'failed') {
          setError('Payment failed. Please try again.');
        } else if (statusData.status === 'cancelled') {
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
      console.log('Error checking payment status:', err);
      handlePaymentSuccess(donationInfo);
    }
  };

  const handlePaymentSuccess = (donationInfo) => {
    console.log('Payment successful, showing celebration...');
    
    setError(null);
    setIsLoading(false);
    setShowPaymentOptions(false);
    
    // Show celebration
    setShowCelebration(true);
    
    onDonationSuccess?.({
      donation_id: donationInfo.donation_id,
      amount: donationAmount,
      donor_name: isAnonymous ? 'Anonymous' : donorName,
      message: isAnonymous ? null : message
    });
    
    resetForm();
  };

  const handleCelebrationClose = () => {
    setShowCelebration(false);
    
    // Redirect after celebration closes
    // setTimeout(() => {
    //   redirectToSuccessPage({
    //     donation_id: 'test-donation-id',
    //     session_id: 'test-session-id',
    //     amount: donationAmount
    //   });
    // }, 500);
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
    <div className={`p-6 bg-white rounded-xl shadow-lg border border-gray-100 relative ${isRTL ? 'text-end' : 'text-start'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Celebration Animation */}
      <CelebrationAnimation
        isVisible={showCelebration}
        onComplete={handleCelebrationClose}
        duration={4000}
        type="confetti"
        intensity="medium"
      />

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
          <Heart className={`w-6 h-6 text-red-500 ${isRTL ? 'ms-2' : 'me-2'}`} />
          {t('donationForm.supportThisCampaign')}
        </h2>
        <p className="text-gray-600">{t('donationForm.makeDifference')}</p>
      </div>
      
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
          <CheckCircle className={`w-5 h-5 text-green-600 ${isRTL ? 'ms-2' : 'me-2'}`} />
          <div>
            <p className="text-green-800 font-medium">{t('donationForm.thankyouDonation')}</p>
            <p className="text-green-700 text-sm">{t('donationForm.redirectingSuccess')}</p>
          </div>
        </div>
      )}

      {/* Payment Options */}
      {showPaymentOptions && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center mb-3">
            <AlertCircle className={`w-5 h-5 text-blue-600 ${isRTL ? 'ms-2' : 'me-2'}`} />
            <p className="text-blue-800 font-medium">{t('donationForm.choosePaymentMethod')}</p>
          </div>
          <p className="text-blue-700 text-sm mb-4">
            {t('donationForm.browserBlockedPopup')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={retryPopup}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              <CreditCard className={`w-4 h-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
              {t('donationForm.tryPopupAgain')}
            </button>
            <button
              onClick={openInNewTab}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              <ExternalLink className={`w-4 h-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
              {t('donationForm.openInNewTab')}
            </button>
          </div>
          <p className="text-xs text-blue-600 mt-2">
            {t('donationForm.enablePopupsTip')}
          </p>
        </div>
      )}

      {/* Progress Summary */}
      <div className="mb-6 bg-gray-50 border border-gray-200 p-5 rounded-xl">
        <div className="flex justify-between items-center mb-3">
          <div>
            <p className="text-lg font-bold text-gray-900">{currentAmount || 0} MRU</p>
            <p className="text-sm text-gray-600">
              {t('donationForm.raised')} {t('donationForm.of')} {targetAmount || 0} MRU {t('donationForm.goal')}
            </p>
          </div>
          <div className="text-end">
            <p className="text-lg font-bold text-blue-600">{(progress || 0).toFixed(1)}%</p>
            <p className="text-sm text-gray-600">{t('donationForm.funded')}</p>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-4 mb-3 overflow-hidden">
          <div 
            className="bg-blue-500 h-full rounded-full transition-all duration-500 ease-out shadow-sm" 
            style={{ width: `${Math.min(progress || 0, 100)}%` }}
          />
        </div>
        
        <div className="flex justify-between text-sm text-gray-700">
          <span className="flex items-center">
            <User className={`w-4 h-4 ${isRTL ? 'ms-1' : 'me-1'}`} />
            {donorsCount || 0} {t('donationForm.supporters')}
          </span>
          <span>{(targetAmount || 0) - (currentAmount || 0)} MRU {t('donationForm.toGo')}</span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className={`w-5 h-5 text-red-600 flex-shrink-0 ${isRTL ? 'ms-2' : 'me-2'}`} />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Donation Amount Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('donationForm.chooseDonationAmount')}</h3>
        
        <div className="grid grid-cols-3 gap-3 mb-4">
          {quickAmounts.map((amount) => (
            <button
              key={amount}
              onClick={() => setDonationAmount(amount)}
              className={`py-3 px-2 rounded-lg border-2 transition-all duration-200 font-medium text-sm ${
                donationAmount === amount 
                  ? 'border-blue-500 bg-blue-50 text-blue-700 transform scale-105 shadow-md' 
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm'
              }`}
            >
              {amount} MRU
            </button>
          ))}
        </div>
        
<div>
  <label htmlFor="customAmount" className="block text-sm font-medium text-gray-700 mb-2">
    {t('donationForm.customAmount')}
  </label>
  <div className="relative">
    {/* Dollar Sign Icon */}
    <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
      <DollarSign className="h-5 w-5 text-gray-400" />
    </div>
    
    {/* Input Field */}
    <input
      type="number"
      id="customAmount"
      value={donationAmount}
      onChange={(e) => setDonationAmount(Number(e.target.value))}
      className={`block w-full ${isRTL ? 'pr-10 pl-16' : 'pl-10 pr-16'} py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg`}
      placeholder={t('donationForm.enterAmount')}
      min="1"
      step="0.01"
      dir={isRTL ? 'rtl' : 'ltr'}
    />
    
    {/* Currency Code */}
    <div className={`absolute inset-y-0 ${isRTL ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center pointer-events-none`}>
      <span className="text-gray-500 text-sm font-medium">MRU</span>
    </div>
  </div>
</div>
      </div>

      {/* Donor Information */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('donationForm.donorInformation')}</h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="donorName" className="block text-sm font-medium text-gray-700 mb-1">
                {t('donationForm.fullName')}
              </label>
              <div className="relative">
                <User className={`absolute ${isRTL ? 'end-3' : 'start-3'} top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400`} />
                <input
                  type="text"
                  id="donorName"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  className={`w-full ${isRTL ? 'pe-10 ps-3' : 'ps-10 pe-3'} py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  placeholder={t('donationForm.yourFullName')}
                  disabled={isAnonymous}
                />
              </div>
            </div>
          </div>
          
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
              {t('donationForm.messageOfSupport')}
            </label>
            <div className="relative">
              <MessageSquare className={`absolute ${isRTL ? 'end-3' : 'start-3'} top-3 w-4 h-4 text-gray-400`} />
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows="3"
                className={`w-full ${isRTL ? 'pe-10 ps-3' : 'ps-10 pe-3'} py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                placeholder={t('donationForm.shareMessage')}
                disabled={isAnonymous}
              />
            </div>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="anonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="anonymous" className={`text-sm text-gray-700 ${isRTL ? 'me-3' : 'ms-3'}`}>
              {t('donationForm.makeAnonymous')}
            </label>
          </div>
        </div>
      </div>

      {/* Donation Button */}
      <button 
        onClick={handleDonate}
        disabled={isLoading || donationAmount < 1 || !campaignId}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center text-lg"
      >
        {isLoading ? (
          <>
            <div className={`animate-spin rounded-full h-5 w-5 border-b-2 border-white ${isRTL ? 'ms-3' : 'me-3'}`}></div>
            {t('donationForm.processing')}
          </>
        ) : (
          <>
            {t('donationForm.donate')} {donationAmount} MRU

            <CreditCard className={`w-5 h-5 ms-2`} />
          </>
        )}
      </button>

      {/* Payment Info */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
          <CheckCircle className={`w-4 h-4 text-green-500 ${isRTL ? 'ms-2' : 'me-2'}`} />
          {t('donationForm.securePaymentInfo')}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-600">
          <div className="flex items-center">
            <CheckCircle className={`w-3 h-3 text-green-500 flex-shrink-0 ${isRTL ? 'ms-2' : 'me-2'}`} />
            <span>{t('donationForm.sslEncryption')}</span>
          </div>
          <div className="flex items-center">
            <CheckCircle className={`w-3 h-3 text-green-500 flex-shrink-0 ${isRTL ? 'ms-2' : 'me-2'}`} />
            <span>{t('donationForm.multiplePaymentMethods')}</span>
          </div>
          <div className="flex items-center">
            <CheckCircle className={`w-3 h-3 text-green-500 flex-shrink-0 ${isRTL ? 'ms-2' : 'me-2'}`} />
            <span>{t('donationForm.instantConfirmation')}</span>
          </div>
          <div className="flex items-center">
            <CheckCircle className={`w-3 h-3 text-green-500 flex-shrink-0 ${isRTL ? 'ms-2' : 'me-2'}`} />
            <span>{t('donationForm.support247')}</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {t('donationForm.poweredBy')} <span className="font-semibold text-blue-600">Nextremitly</span> - 
          {t('donationForm.supportingBanks')}
        </p>
      </div>
    </div>
  );
}