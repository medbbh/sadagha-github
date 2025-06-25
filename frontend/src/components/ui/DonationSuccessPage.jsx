// components/DonationSuccessPage.jsx
import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Heart, ArrowLeft, Share2, Download } from 'lucide-react';

export default function DonationSuccessPage() {
  const { campaignId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get data from navigation state or URL params
  const [donationData, setDonationData] = useState(null);
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get donation data from state or URL params
    const stateData = location.state;
    const urlParams = new URLSearchParams(location.search);
    
    const data = {
      donationId: stateData?.donationId || urlParams.get('donation_id'),
      amount: stateData?.amount || urlParams.get('amount'),
      donorName: stateData?.donorName || urlParams.get('donor_name'),
      campaignId: campaignId
    };
    
    setDonationData(data);
    
    // Fetch campaign details
    fetchCampaignDetails();
  }, [campaignId, location]);

  const fetchCampaignDetails = async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/`);
      if (response.ok) {
        const campaignData = await response.json();
        setCampaign(campaignData);
      }
    } catch (error) {
      console.error('Error fetching campaign:', error);
    } finally {
      setLoading(false);
    }
  };

  const shareSuccess = async () => {
    const shareData = {
      title: `I just supported ${campaign?.name || 'this campaign'}!`,
      text: `I donated ${donationData?.amount} MRU to help make a difference. Join me in supporting this cause!`,
      url: window.location.origin + `/campaign/${campaignId}`
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareData.url);
      alert('Campaign link copied to clipboard!');
    }
  };

  const downloadReceipt = () => {
    // Simple receipt download - you could make this more sophisticated
    const receiptContent = `
DONATION RECEIPT
===============

Campaign: ${campaign?.name || 'N/A'}
Donor: ${donationData?.donorName || 'Anonymous'}
Amount: ${donationData?.amount} MRU
Date: ${new Date().toLocaleDateString()}
Donation ID: ${donationData?.donationId || 'N/A'}

Thank you for your generous contribution!
    `;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `donation-receipt-${donationData?.donationId || 'unknown'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Thank You for Your Donation! 🎉
          </h1>
          <p className="text-lg text-gray-600">
            Your contribution makes a real difference
          </p>
        </div>

        {/* Donation Details Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="border-b border-gray-200 pb-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Heart className="w-5 h-5 text-red-500 mr-2" />
              Donation Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Amount Donated</p>
                <p className="text-2xl font-bold text-green-600">
                  {donationData?.amount} MRU
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-1">Donor Name</p>
                <p className="text-lg font-medium text-gray-900">
                  {donationData?.donorName || 'Anonymous'}
                </p>
              </div>
              
              {donationData?.donationId && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Donation ID</p>
                  <p className="text-sm font-mono text-gray-700">
                    {donationData.donationId}
                  </p>
                </div>
              )}
              
              <div>
                <p className="text-sm text-gray-600 mb-1">Date</p>
                <p className="text-sm text-gray-700">
                  {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Campaign Info */}
          {campaign && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Campaign Supported
              </h3>
              <div className="flex items-start space-x-4">
                {campaign.image && (
                  <img
                    src={campaign.image}
                    alt={campaign.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
                <div>
                  <h4 className="font-medium text-gray-900">{campaign.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {campaign.description?.substring(0, 150)}...
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <button
            onClick={() => navigate(`/campaign/${campaignId}`)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Campaign
          </button>
          
          <button
            onClick={shareSuccess}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share Success
          </button>
          
          <button
            onClick={downloadReceipt}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Receipt
          </button>
        </div>

        {/* What's Next */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">What's Next?</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <p className="text-gray-700">
                You'll receive a confirmation email with your donation receipt
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <p className="text-gray-700">
                Campaign updates will be sent to keep you informed of progress
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <p className="text-gray-700">
                Share this campaign with friends to amplify your impact
              </p>
            </div>
          </div>
        </div>

        {/* Footer Message */}
        <div className="text-center mt-8">
          <p className="text-gray-600">
            Together, we're making a difference. Thank you for being part of the change! ❤️
          </p>
        </div>
      </div>
    </div>
  );
}