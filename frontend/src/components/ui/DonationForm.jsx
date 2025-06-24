import { useState, useEffect } from 'react';
import { DollarSign, CreditCard, User, Mail, MessageSquare, CheckCircle, AlertCircle, Heart, ExternalLink } from 'lucide-react';

export default function DonationForm({ 
  campaignId: propCampaignId, 
  currentAmount, 
  targetAmount, 
  donorsCount, 
  progress,
  onDonationSuccess 
}) {
  // Try to get campaign ID from URL if not provided as prop
  const urlCampaignId = window.location.pathname.split('/')[2];
  const campaignId = propCampaignId || urlCampaignId;
  
  const [donationAmount, setDonationAmount] = useState(25);
  const [donorEmail, setDonorEmail] = useState('');
  const [donorName, setDonorName] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);

  // Validation
  const validateForm = () => {
    if (!campaignId || campaignId === 'undefined') {
      return 'Campaign ID is missing or invalid';
    }
    if (donationAmount < 1) {
      return 'Please enter a valid donation amount (minimum 1 MRU)';
    }
    if (donorEmail && !/\S+@\S+\.\S+/.test(donorEmail)) {
      return 'Please enter a valid email address';
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

    const donationData = {
      amount: donationAmount,
      donor_email: donorEmail || 'anonymous@sada9a.com',
      donor_name: donorName || '',
      message: message || '',
      is_anonymous: isAnonymous
    };

    console.log('Creating donation for campaign:', campaignId, 'with data:', donationData);

    try {
      // Create donation session
      const response = await fetch(`http://127.0.0.1:8001/api/campaigns/${campaignId}/create_donation/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(donationData)
      });

      const data = await response.json();
      console.log('Donation response:', data);

      if (data.success) {
        setPaymentUrl(data.widget_url);
        // Try popup first, fallback to options if blocked
        const popupWorked = tryOpenPopup(data.widget_url, data.session_id);
        if (!popupWorked) {
          setShowPaymentOptions(true);
        }
      } else {
        setError(data.error || 'Failed to create donation session');
      }
    } catch (err) {
      console.error('Donation error:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const tryOpenPopup = (paymentUrl, sessionId) => {
    try {
      console.log('Attempting to open payment popup:', paymentUrl);
      
      const popup = window.open(
        paymentUrl,
        'nextremitly-payment',
        'width=600,height=800,scrollbars=yes,resizable=yes,centerscreen=yes'
      );

      // Check if popup was blocked
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        console.log('Popup was blocked');
        return false;
      }

      // Popup opened successfully
      setupPopupHandlers(popup, sessionId);
      return true;
      
    } catch (error) {
      console.log('Error opening popup:', error);
      return false;
    }
  };

  const setupPopupHandlers = (popup, sessionId) => {
    // Monitor popup for completion
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        console.log('Payment popup closed');
        // Refresh the page to show updated donation info
        setTimeout(() => window.location.reload(), 1000);
      }
    }, 1000);

    // Listen for payment completion messages
    const messageHandler = (event) => {
      console.log('Received message from popup:', event.data);
      
      if (event.data.type === 'payment-completed') {
        popup.close();
        clearInterval(checkClosed);
        window.removeEventListener('message', messageHandler);
        
        setShowSuccessMessage(true);
        setShowPaymentOptions(false);
        setTimeout(() => setShowSuccessMessage(false), 5000);
        
        onDonationSuccess?.({
          amount: donationAmount,
          donor_name: isAnonymous ? 'Anonymous' : donorName,
          message: isAnonymous ? null : message
        });
        
        // Reset form
        resetForm();
        
      } else if (event.data.type === 'payment-failed') {
        popup.close();
        clearInterval(checkClosed);
        window.removeEventListener('message', messageHandler);
        setError('Payment failed. Please try again.');
        setShowPaymentOptions(false);
      }
    };

    window.addEventListener('message', messageHandler);

    // Clean up after 15 minutes
    setTimeout(() => {
      if (!popup.closed) {
        popup.close();
        clearInterval(checkClosed);
        window.removeEventListener('message', messageHandler);
      }
    }, 900000);
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

  const openInNewTab = () => {
    if (paymentUrl) {
      window.open(paymentUrl, '_blank');
      setShowPaymentOptions(false);
      // Show success message after a delay since we can't track the new tab
      setTimeout(() => {
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 5000);
      }, 2000);
    }
  };

  const retryPopup = () => {
    if (paymentUrl) {
      const popupWorked = tryOpenPopup(paymentUrl, 'retry');
      if (!popupWorked) {
        setError('Popup is still blocked. Please try the "Open in New Tab" option or allow popups for this site.');
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
          <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
          <p className="text-red-700 font-medium">Error: Campaign ID is missing</p>
        </div>
      </div>
    );
  }

  const quickAmounts = [10, 25, 50, 100, 250, 500];

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-100">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
          <Heart className="w-6 h-6 mr-2 text-red-500" />
          Support This Campaign
        </h2>
        <p className="text-gray-600">Make a difference with your contribution</p>
        <p className="text-xs text-gray-400 mt-1">Campaign ID: {campaignId}</p>
      </div>
      
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
          <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
          <div>
            <p className="text-green-800 font-medium">Thank you for your donation! 🎉</p>
            <p className="text-green-700 text-sm">Your contribution makes a real difference.</p>
          </div>
        </div>
      )}

      {/* Payment Options (when popup is blocked) */}
      {showPaymentOptions && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center mb-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mr-2" />
            <p className="text-blue-800 font-medium">Choose Payment Method</p>
          </div>
          <p className="text-blue-700 text-sm mb-4">
            Your browser blocked the payment popup. Please choose how you'd like to proceed:
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={retryPopup}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Try Popup Again
            </button>
            <button
              onClick={openInNewTab}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in New Tab
            </button>
          </div>
          <p className="text-xs text-blue-600 mt-2">
            💡 Tip: You can enable popups for this site in your browser settings for a smoother experience.
          </p>
        </div>
      )}

      {/* Progress Summary */}
      <div className="mb-6 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 p-5 rounded-xl border">
        <div className="flex justify-between items-center mb-3">
          <div>
            <p className="text-lg font-bold text-gray-900">{currentAmount || 0} MRU</p>
            <p className="text-sm text-gray-600">raised of {targetAmount || 0} MRU goal</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-blue-600">{(progress || 0).toFixed(1)}%</p>
            <p className="text-sm text-gray-600">funded</p>
          </div>
        </div>
        
        <div className="w-full bg-white bg-opacity-50 rounded-full h-4 mb-3 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-full rounded-full transition-all duration-500 ease-out shadow-sm" 
            style={{ width: `${Math.min(progress || 0, 100)}%` }}
          />
        </div>
        
        <div className="flex justify-between text-sm text-gray-700">
          <span className="flex items-center">
            <User className="w-4 h-4 mr-1" />
            {donorsCount || 0} supporters
          </span>
          <span>{(targetAmount || 0) - (currentAmount || 0)} MRU to go</span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Donation Amount Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Choose your donation amount</h3>
        
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
            Custom Amount
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="number"
              id="customAmount"
              value={donationAmount}
              onChange={(e) => setDonationAmount(Number(e.target.value))}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
              placeholder="Enter amount"
              min="1"
              step="0.01"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 text-sm">MRU</span>
            </div>
          </div>
        </div>
      </div>

      {/* Donor Information */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Donor Information</h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="donorName" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  id="donorName"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Your full name"
                  disabled={isAnonymous}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="donorEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  id="donorEmail"
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="your@email.com"
                />
              </div>
            </div>
          </div>
          
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
              Message of Support
            </label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows="3"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Share a message of encouragement..."
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
            <label htmlFor="anonymous" className="ml-3 text-sm text-gray-700">
              Make this donation anonymous
            </label>
          </div>
        </div>
      </div>

      {/* Donation Button */}
      <button 
        onClick={handleDonate}
        disabled={isLoading || donationAmount < 1 || !campaignId}
        className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center text-lg"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5 mr-3" />
            Donate {donationAmount} MRU
          </>
        )}
      </button>

      {/* Payment Info */}
      <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border">
        <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
          <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
          Secure Payment Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-600">
          <div className="flex items-center">
            <CheckCircle className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
            <span>256-bit SSL encryption</span>
          </div>
          <div className="flex items-center">
            <CheckCircle className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
            <span>Multiple payment methods</span>
          </div>
          <div className="flex items-center">
            <CheckCircle className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
            <span>Instant confirmation</span>
          </div>
          <div className="flex items-center">
            <CheckCircle className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
            <span>24/7 support</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Powered by <span className="font-semibold text-blue-600">Nextremitly</span> - 
          Supporting Bankily, Sedad, Bimbank & more
        </p>
      </div>
    </div>
  );
}