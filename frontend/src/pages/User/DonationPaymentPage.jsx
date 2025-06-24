import React, { useState } from 'react';
import { Copy, Upload, CreditCard, Phone, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { useParams } from 'react-router-dom';

const DonationPaymentPage = () => {
  const { donationAmount } = useParams() // This would come from the previous form

  const [selectedMethod, setSelectedMethod] = useState(null);

  const [campaignName] = useState("Help Local Food Bank"); // This would come from props
  
  // Manual payment state
  const [uploadedImage, setUploadedImage] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  
  // NextPay payment state
  const [senderNumber, setSenderNumber] = useState('');
  const [transactionCode, setTransactionCode] = useState('');
  
  // Mock data - this would come from your API
  const manualPayments = [
    { id: 1, wallet: 'Bankily', number: '22334455', name: 'Mohamed Ahmed' },
    { id: 2, wallet: 'Sedad', number: '77889900', name: 'Fatima Ali' }
  ];
  
  const nextpayPayments = [
    { id: 1, wallet: 'Bankily', commercial: 'COM123456', name: 'Help Foundation' },
    { id: 2, wallet: 'Sedad', commercial: 'COM789012', name: 'Help Foundation' }
  ];

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadedImage(e.dataTransfer.files[0]);
    }
  };

  const handleImageUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedImage(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    if (selectedMethod === 'manual' && uploadedImage) {
      console.log('Submitting manual payment with image:', uploadedImage);
      // Handle manual payment submission
    } else if (selectedMethod === 'nextpay' && senderNumber && transactionCode) {
      console.log('Submitting NextPay payment:', { senderNumber, transactionCode });
      // Handle NextPay payment submission
    }
  };

  const isSubmitDisabled = () => {
    if (selectedMethod === 'manual') return !uploadedImage;
    if (selectedMethod === 'nextpay') return !senderNumber || !transactionCode;
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" onClick={() => window.history.back()}>
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Complete Your Donation</h1>
              <p className="text-gray-600">Choose your preferred payment method</p>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-green-700">Donating to</p>
                <p className="font-semibold text-green-900">{campaignName}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-green-700">Amount</p>
                <p className="text-2xl font-bold text-green-900">{donationAmount} MRU</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method Selection */}
        {!selectedMethod && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Choose Payment Method</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Manual Payment Option */}
              <div 
                onClick={() => setSelectedMethod('manual')}
                className="border-2 border-gray-200 rounded-lg p-6 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200">
                    <Phone className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Manual Payment</h3>
                    <p className="text-gray-600 text-sm">Send money & upload receipt</p>
                  </div>
                </div>
                <p className="text-gray-700">
                  Send money to one of our wallet numbers and upload a screenshot of your transaction as proof.
                </p>
              </div>

              {/* NextPay Option */}
              <div 
                onClick={() => setSelectedMethod('nextpay')}
                className="border-2 border-gray-200 rounded-lg p-6 cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all group"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200">
                    <CreditCard className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">NextPay</h3>
                    <p className="text-gray-600 text-sm">Instant verification</p>
                  </div>
                </div>
                <p className="text-gray-700">
                  Send money to our commercial number and provide your transaction details for instant verification.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Manual Payment Flow */}
        {selectedMethod === 'manual' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Manual Payment</h2>
                <button 
                  onClick={() => setSelectedMethod(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Change Method
                </button>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-blue-800 font-medium mb-2">📱 Instructions:</p>
                <ol className="text-blue-700 text-sm space-y-1">
                  <li>1. Choose a wallet number below</li>
                  <li>2. Send exactly <strong>{donationAmount} MRU</strong> to that number</li>
                  <li>3. Take a screenshot of the transaction</li>
                  <li>4. Upload the screenshot below</li>
                </ol>
              </div>

              <h3 className="font-semibold mb-4">Available Wallet Numbers:</h3>
              <div className="space-y-3">
                {manualPayments.map((payment) => (
                  <div key={payment.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-lg">{payment.wallet}</span>
                        </div>
                        <p className="text-2xl font-mono font-bold text-blue-600">{payment.number}</p>
                        <p className="text-sm text-gray-600">Account: {payment.name}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(payment.number)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                        Copy
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Image Upload */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="font-semibold mb-4">Upload Transaction Screenshot</h3>
              
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {uploadedImage ? (
                  <div className="space-y-4">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                    <p className="text-green-700 font-medium">{uploadedImage.name}</p>
                    <button
                      onClick={() => setUploadedImage(null)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove and upload different image
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-gray-700 font-medium">Drop your screenshot here</p>
                      <p className="text-gray-500 text-sm">or click to browse</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      Choose Image
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* NextPay Payment Flow */}
        {selectedMethod === 'nextpay' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">NextPay Payment</h2>
                <button 
                  onClick={() => setSelectedMethod(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Change Method
                </button>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                <p className="text-purple-800 font-medium mb-2">⚡ Instructions:</p>
                <ol className="text-purple-700 text-sm space-y-1">
                  <li>1. Send exactly <strong>{donationAmount} MRU</strong> to a commercial number below</li>
                  <li>2. Note the phone number you sent from</li>
                  <li>3. Enter the transaction code you received</li>
                  <li>4. Submit for instant verification</li>
                </ol>
              </div>

              <h3 className="font-semibold mb-4">Available Commercial Numbers:</h3>
              <div className="space-y-3 mb-6">
                {nextpayPayments.map((payment) => (
                  <div key={payment.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-lg">{payment.wallet}</span>
                        </div>
                        <p className="text-2xl font-mono font-bold text-purple-600">{payment.commercial}</p>
                        <p className="text-sm text-gray-600">Account: {payment.name}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(payment.commercial)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                        Copy
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Transaction Details Form */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold mb-4">Transaction Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Phone Number (the number you sent money from)
                    </label>
                    <input
                      type="tel"
                      value={senderNumber}
                      onChange={(e) => setSenderNumber(e.target.value)}
                      placeholder="e.g., 22334455"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Transaction Code (received via SMS)
                    </label>
                    <input
                      type="text"
                      value={transactionCode}
                      onChange={(e) => setTransactionCode(e.target.value.toUpperCase())}
                      placeholder="e.g., TXN123456789"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        {selectedMethod && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="text-sm text-gray-600">
                {selectedMethod === 'manual' && 'Upload your transaction screenshot to complete the donation'}
                {selectedMethod === 'nextpay' && 'Provide transaction details for instant verification'}
              </div>
              
              <button
                onClick={handleSubmit}
                disabled={isSubmitDisabled()}
                className={`px-8 py-3 rounded-lg font-semibold transition-all ${
                  isSubmitDisabled()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {selectedMethod === 'manual' ? 'Submit Donation' : 'Verify & Complete'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DonationPaymentPage;