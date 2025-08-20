import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  X, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  Key,
  Shield,
  RefreshCw,
  Copy
} from 'lucide-react';
import orgDashboardApi from '../../api/endpoints/OrgAPI';

const PaymentSetupModal = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  organizationId, 
  currentStatus = {} 
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [step, setStep] = useState(1); // 1: Instructions, 2: API Key Input, 3: Testing, 4: Success
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [testResult, setTestResult] = useState(null);

  // Check if already configured
  const isConfigured = currentStatus.configured && currentStatus.enabled;

  useEffect(() => {
    if (isOpen) {
      setStep(isConfigured ? 2 : 1);
      setApiKey('');
      setError('');
      setTestResult(null);
    }
  }, [isOpen, isConfigured]);

  const handleSetupApiKey = async () => {
    if (!apiKey.trim()) {
      setError(t('organization.payments.apiKeyRequired'));
      return;
    }

    if (!orgDashboardApi.validateNextRemitlyApiKey(apiKey)) {
      setError(t('organization.payments.invalidApiKeyFormat'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await orgDashboardApi.setupNextRemitly(organizationId, apiKey);
        // Add this debugging
        console.log('Full response:', response);
        console.log('Response data:', response.data);
        console.log('Response status:', response.status);

      if (response?.success) {
        setStep(4); // Success step
        setTestResult(response.data);
      } else {
        setError(response?.error || t('organization.payments.setupFailed'));
      }
    } catch (err) {
      console.error('API key setup error:', err);
      setError(err.message || t('organization.payments.setupFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setError('');

    try {
      const response = await orgDashboardApi.testPaymentConnection(organizationId);
      
      if (response.data?.valid) {
        setTestResult(response.data);
        setStep(4);
      } else {
        setError(response.data?.message || t('organization.payments.connectionTestFailed'));
      }
    } catch (err) {
      console.error('Connection test error:', err);
      setError(err.message || t('organization.payments.connectionTestFailed'));
    } finally {
      setTesting(false);
    }
  };

  const handleDisablePayments = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await orgDashboardApi.disablePayments(organizationId);
      
      if (response.data?.success) {
        onSuccess();
      } else {
        setError(response.data?.error || t('organization.payments.disableFailed'));
      }
    } catch (err) {
      console.error('Disable payments error:', err);
      setError(err.message || t('organization.payments.disableFailed'));
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleClose = () => {
    setStep(1);
    setApiKey('');
    setError('');
    setTestResult(null);
    onClose();
  };

  const handleSuccess = () => {
    onSuccess();
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className={`text-xl font-semibold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
            {isConfigured ? t('organization.payments.managePayments') : t('organization.payments.setupPayments')}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Instructions */}
          {step === 1 && (
            <div className="space-y-6">
              <div className={`text-center ${isRTL ? 'text-right' : 'text-left'}`}>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ExternalLink className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t('organization.payments.setupInstructions')}
                </h3>
                <p className="text-gray-600">
                  {t('organization.payments.followStepsBelow')}
                </p>
              </div>

              <div className="space-y-4">
                <div className={`flex items-start space-x-3 ${isRTL ? 'space-x-reverse' : ''}`}>
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    1
                  </div>
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <h4 className="font-medium text-gray-900">{t('organization.payments.step1Title')}</h4>
                    <p className="text-sm text-gray-600">{t('organization.payments.step1Description')}</p>
                    <a
                      href="https://next-remitly-frontend.vercel.app/register"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm mt-1"
                    >
                      <ExternalLink className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                      {t('organization.payments.signupNextRemitly')}
                    </a>
                  </div>
                </div>

                <div className={`flex items-start space-x-3 ${isRTL ? 'space-x-reverse' : ''}`}>
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    2
                  </div>
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <h4 className="font-medium text-gray-900">{t('organization.payments.step2Title')}</h4>
                    <p className="text-sm text-gray-600">{t('organization.payments.step2Description')}</p>
                  </div>
                </div>

                <div className={`flex items-start space-x-3 ${isRTL ? 'space-x-reverse' : ''}`}>
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    3
                  </div>
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <h4 className="font-medium text-gray-900">{t('organization.payments.step3Title')}</h4>
                    <p className="text-sm text-gray-600">{t('organization.payments.step3Description')}</p>
                  </div>
                </div>

                <div className={`flex items-start space-x-3 ${isRTL ? 'space-x-reverse' : ''}`}>
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    4
                  </div>
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <h4 className="font-medium text-gray-900">{t('organization.payments.step4Title')}</h4>
                    <p className="text-sm text-gray-600">{t('organization.payments.step4Description')}</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className={`flex items-start space-x-2 ${isRTL ? 'space-x-reverse' : ''}`}>
                  <Shield className={`w-5 h-5 text-blue-600 mt-0.5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <h4 className="font-medium text-blue-900">{t('organization.payments.securityNote')}</h4>
                    <p className="text-sm text-blue-700">{t('organization.payments.securityDescription')}</p>
                  </div>
                </div>
              </div>

              <div className={`flex justify-end space-x-3 ${isRTL ? 'space-x-reverse' : ''}`}>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t('organization.payments.cancel')}
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('organization.payments.continue')}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: API Key Input */}
          {step === 2 && (
            <div className="space-y-6">
              <div className={`text-center ${isRTL ? 'text-right' : 'text-left'}`}>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Key className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {isConfigured ? t('organization.payments.updateApiKey') : t('organization.payments.enterApiKey')}
                </h3>
                <p className="text-gray-600">
                  {t('organization.payments.pasteApiKeyBelow')}
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  <div className={`flex items-center ${isRTL ? 'space-x-reverse' : 'space-x-2'}`}>
                    <AlertCircle className="w-5 h-5" />
                    <span>{error}</span>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('organization.payments.nextRemitlyApiKey')}
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={t('organization.payments.apiKeyPlaceholder')}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm ${isRTL ? 'text-right pr-12' : 'text-left pl-4 pr-12'}`}
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 ${isRTL ? 'left-3' : 'right-3'}`}
                    >
                      {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className={`text-xs text-gray-500 mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('organization.payments.apiKeyHelp')}
                  </p>
                </div>

                {isConfigured && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className={`flex items-start space-x-2 ${isRTL ? 'space-x-reverse' : ''}`}>
                      <AlertCircle className={`w-5 h-5 text-amber-600 mt-0.5`} />
                      <div className={isRTL ? 'text-right' : 'text-left'}>
                        <h4 className="font-medium text-amber-900">{t('organization.payments.currentApiKey')}</h4>
                        <p className="text-sm text-amber-700">
                          {orgDashboardApi.formatApiKeyDisplay(currentStatus.api_key || 'api_key_hidden')}
                        </p>
                        <p className="text-xs text-amber-600 mt-1">{t('organization.payments.replaceApiKeyWarning')}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className={`flex justify-between space-x-3 ${isRTL ? 'space-x-reverse' : ''}`}>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setStep(1)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {t('organization.payments.back')}
                  </button>
                  {isConfigured && (
                    <button
                      onClick={handleTestConnection}
                      disabled={testing}
                      className="px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 flex items-center"
                    >
                      {testing ? (
                        <RefreshCw className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'} animate-spin`} />
                      ) : (
                        <RefreshCw className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      )}
                      {testing ? t('organization.payments.testing') : t('organization.payments.testConnection')}
                    </button>
                  )}
                </div>
                <div className="flex space-x-2">
                  {isConfigured && (
                    <button
                      onClick={handleDisablePayments}
                      disabled={loading}
                      className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      {t('organization.payments.disablePayments')}
                    </button>
                  )}
                  <button
                    onClick={handleSetupApiKey}
                    disabled={loading || !apiKey.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
                  >
                    {loading ? (
                      <RefreshCw className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'} animate-spin`} />
                    ) : (
                      <CheckCircle className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    )}
                    {loading ? t('organization.payments.saving') : (isConfigured ? t('organization.payments.updateKey') : t('organization.payments.saveKey'))}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div className="space-y-6">
              <div className={`text-center ${isRTL ? 'text-right' : 'text-left'}`}>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t('organization.payments.setupComplete')}
                </h3>
                <p className="text-gray-600">
                  {t('organization.payments.readyToReceive')}
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className={`space-y-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                  <div className={`flex items-center text-green-700 ${isRTL ? 'space-x-reverse' : 'space-x-2'}`}>
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">{t('organization.payments.connectionVerified')}</span>
                  </div>
                  <div className={`flex items-center text-green-700 ${isRTL ? 'space-x-reverse' : 'space-x-2'}`}>
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">{t('organization.payments.paymentsEnabled')}</span>
                  </div>
                  <div className={`flex items-center text-green-700 ${isRTL ? 'space-x-reverse' : 'space-x-2'}`}>
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">{t('organization.payments.campaignsCanReceive')}</span>
                  </div>
                </div>
              </div>

              {testResult && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className={`font-medium text-blue-900 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('organization.payments.connectionDetails')}
                  </h4>
                  <div className={`text-sm text-blue-700 space-y-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                    <div>{t('organization.payments.status')}: {testResult.message}</div>
                    <div>{t('organization.payments.canReceivePayments')}: {testResult.can_receive_payments ? t('organization.payments.yes') : t('organization.payments.no')}</div>
                  </div>
                </div>
              )}

              <div className={`flex justify-end space-x-3 ${isRTL ? 'space-x-reverse' : ''}`}>
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t('organization.payments.manageSettings')}
                </button>
                <button
                  onClick={handleSuccess}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {t('organization.payments.finish')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentSetupModal;