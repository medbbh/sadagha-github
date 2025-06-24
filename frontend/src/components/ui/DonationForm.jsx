import { useState } from 'react';
import { DollarSign, Phone, Copy, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DonationForm({ campaignId, currentAmount, targetAmount, donorsCount, progress, paymentNumbers, formatPaymentNumber }) {
  const navigate = useNavigate();
  const [donationAmount, setDonationAmount] = useState(10);
  const [showPaymentNumbers, setShowPaymentNumbers] = useState(false);
  const [copiedPaymentNumber, setCopiedPaymentNumber] = useState(null);

  const activePaymentNumbers = paymentNumbers?.filter(pn => pn.is_active) || [];

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPaymentNumber(id);
      setTimeout(() => setCopiedPaymentNumber(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Med Yahya service
  async function initiatePayment(orderData) {
  // Create payment session on your backend
  const response = await fetch('http://127.0.0.1:8001/api/campaigns/create_payment/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  });
  
  const session = await response.json();
  
  // Redirect to Nextremitly payment page
  window.location.href = session.payment_url;
}

// Or open in popup
function openPaymentPopup(paymentUrl) {
  const popup = window.open(
    paymentUrl,
    'nextremitly-payment',
    'width=600,height=800,scrollbars=yes'
  );
  
  // Listen for payment completion
  window.addEventListener('message', (event) => {
    if (event.data.type === 'payment-completed') {
      popup.close();
      window.location.href = '/success';
    }
  });
}

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Support This Campaign</h2>
      
      {/* Progress Summary */}
      <div className="mb-6 bg-blue-50 p-4 rounded-lg">
        <div className="flex justify-between mb-1 text-sm font-medium text-gray-700">
          <span>{currentAmount} MRU raised</span>
          <span>{targetAmount} MRU goal</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div 
            className="bg-blue-600 h-2 rounded-full" 
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>{progress.toFixed(1)}% funded</span>
          <span>{donorsCount} donors</span>
        </div>
      </div>

      {/* Donation Amount Selection */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Select donation amount</h3>
        <div className="grid grid-cols-2 gap-3">
          {[10, 25, 50, 100].map((amount) => (
            <button
              key={amount}
              onClick={() => setDonationAmount(amount)}
              className={`py-3 px-4 rounded-lg border transition-all ${donationAmount === amount ? 
                'border-blue-500 bg-blue-50 text-blue-600 font-medium' : 
                'border-gray-200 hover:border-blue-300'}`}
            >
              {amount} MRU
            </button>
          ))}
        </div>
        <div className="mt-4">
          <label htmlFor="customAmount" className="block text-sm font-medium text-gray-700 mb-1">
            Or enter custom amount
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="number"
              id="customAmount"
              value={donationAmount}
              onChange={(e) => setDonationAmount(Number(e.target.value))}
              className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
              min="1"
            />
          </div>
        </div>
      </div>

      {/* Donation Button */}
      <button 
      // onclick navigate to the payment page with the selected amount
        // onClick={() => navigate(`/campaign/${campaignId}/donate/${donationAmount}`)}
        onClick={() => initiatePayment({ campaignId, amount: donationAmount })}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg shadow transition-colors flex items-center justify-center"
      >
        <Phone className="w-4 h-4 mr-2" />
        Donate {donationAmount} MRU
      </button>

      {/* Payment Numbers Section */}
      {showPaymentNumbers && activePaymentNumbers.length > 0 && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-semibold text-green-800 mb-3">Send your donation to:</h4>
          <div className="space-y-3">
            {activePaymentNumbers.map((paymentNumber) => (
              <div key={paymentNumber.id} className="bg-white rounded-lg p-3 border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-mono font-bold text-gray-900">
                    {formatPaymentNumber(paymentNumber.number)}
                  </span>
                  <button
                    onClick={() => copyToClipboard(paymentNumber.number, paymentNumber.id)}
                    className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                    title="Copy payment number"
                  >
                    {copiedPaymentNumber === paymentNumber.id ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                
                {paymentNumber.wallets && paymentNumber.wallets.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {paymentNumber.wallets.map((wallet) => (
                      <span
                        key={wallet.id}
                        className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full"
                      >
                        {wallet.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-green-100 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>Amount to send:</strong> {donationAmount} MRU
            </p>
            <p className="text-xs text-green-700 mt-1">
              After sending, please contact the organization to confirm your donation.
            </p>
          </div>
        </div>
      )}

      {/* No Payment Numbers Available */}
      {showPaymentNumbers && activePaymentNumbers.length === 0 && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            Payment information is not available for this campaign. Please contact the organization directly.
          </p>
        </div>
      )}

      {/* Trust Badges */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Secure</span>
          </div>
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>24/7 Support</span>
          </div>
        </div>
      </div>
    </div>
  );
}