import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  Settings, 
  ExternalLink,
  RefreshCw,
  Shield,
  Key,
  Power,
  PowerOff
} from 'lucide-react';
import Loading from '../common/Loading';
import organizationApi from '../../api/endpoints/OrgAPI';
import PaymentSetupModal from './PaymentSetupModal';

const NextRemitlyStatusCard = ({ status, onManage, onTest, testing }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const isConfigured = status.nextremitly_configured && status.payment_enabled;

  return (
    <div className={`rounded-lg border-2 p-6 transition-all duration-200 ${
      isConfigured 
        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-sm' 
        : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className={`flex items-center space-x-3 mb-4 ${isRTL ? 'space-x-reverse' : ''}`}>
            <div className={`p-2 rounded-lg ${isConfigured ? 'bg-green-100' : 'bg-amber-100'}`}>
              <CreditCard className={`w-6 h-6 ${isConfigured ? 'text-green-600' : 'text-amber-600'}`} />
            </div>
            <div className={isRTL ? 'text-right' : 'text-left'}>
              <h3 className="text-xl font-semibold text-gray-900">NextRemitly</h3>
              <p className="text-sm text-gray-600">{t('organization.payments.nextRemitlyDescription')}</p>
            </div>
          </div>
          
          <div className={`space-y-3 ${isRTL ? 'text-right' : 'text-left'}`}>
            {/* Status Indicator */}
            <div className={`flex items-center space-x-2 ${isRTL ? 'space-x-reverse' : ''}`}>
              {isConfigured ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-700">{t('organization.payments.connected')}</span>
                  <div className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    <Power className="w-3 h-3 me-1" />
                    {t('organization.payments.active')}
                  </div>
                </>
              ) : status.configured ? (
                <>
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <span className="font-medium text-amber-700">{t('organization.payments.configured')}</span>
                  <div className="inline-flex items-center px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                    <PowerOff className="w-3 h-3 me-1" />
                    {t('organization.payments.disabled')}
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <span className="font-medium text-amber-700">{t('organization.payments.notConfigured')}</span>
                  <div className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                    {t('organization.payments.setupRequired')}
                  </div>
                </>
              )}
            </div>

            {/* API Key Display */}
            {status.api_key_set && (
              <div className={`flex items-center space-x-2 text-sm text-gray-600 ${isRTL ? 'space-x-reverse' : ''}`}>
                <Key className="w-4 h-4" />
                <span>{t('organization.payments.apiKey')}: {organizationApi.formatApiKeyDisplay('api_key_configured')}</span>
              </div>
            )}

            {/* Description based on status */}
            <div className="text-sm text-gray-600">
              {isConfigured ? (
                <div className="space-y-1">
                  <p className="text-green-700">{t('organization.payments.readyToReceiveDonations')}</p>
                  <p>{t('organization.payments.donationsWillGoDirectly')}</p>
                </div>
              ) : status.configured ? (
                <p className="text-amber-700">{t('organization.payments.configuredButDisabled')}</p>
              ) : (
                <p className="text-amber-700">{t('organization.payments.setupRequiredDescription')}</p>
              )}
            </div>

            {/* Setup Steps Hint */}
            {!status.configured && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                <h4 className="font-medium text-blue-900 text-sm mb-1">{t('organization.payments.quickSetup')}</h4>
                <p className="text-xs text-blue-700">{t('organization.payments.setupStepsHint')}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className={`flex flex-col space-y-2 ml-6 ${isRTL ? 'mr-6 ml-0' : ''}`}>
          <button
            onClick={onManage}
            className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isConfigured
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isConfigured ? (
              <>
                <Settings className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('organization.payments.manage')}
              </>
            ) : (
              <>
                <CreditCard className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('organization.payments.setup')}
              </>
            )}
          </button>
          
          {isConfigured && (
            <button
              onClick={onTest}
              disabled={testing}
              className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 border border-green-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'} ${testing ? 'animate-spin' : ''}`} />
              {testing ? t('organization.payments.testing') : t('organization.payments.testConnection')}
            </button>
          )}

          <a
            href="https://next-remitly-frontend.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-colors"
          >
            <ExternalLink className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('organization.payments.visitNextRemitly')}
          </a>
        </div>
      </div>
    </div>
  );
};

export default function PaymentMethodsManagement({ onUpdate }) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const [paymentStatus, setPaymentStatus] = useState({});
  const [organizationId, setOrganizationId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadPaymentStatus();
  }, []);

  const loadPaymentStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get organization profile first
      const profileResponse = await organizationApi.fetchOrgProfile();
      const profile = profileResponse?.data || profileResponse;
      setOrganizationId(profile.id);
      
      // Get payment status
      const statusResponse = await organizationApi.fetchPaymentMethods(profile.id);
      console.log('Payment status response:', statusResponse);
      setPaymentStatus(statusResponse || {});
      
    } catch (err) {
      console.error('Error loading payment status:', err);
      setError(err.message || t('organization.payments.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!organizationId) return;
    
    setTesting(true);
    setError(null);
    setSuccessMessage('');

    try {
      const response = await organizationApi.testPaymentConnection(organizationId);
      
      if (response.data?.valid) {
        setSuccessMessage(t('organization.payments.connectionTestSuccess'));
        // Refresh status
        await loadPaymentStatus();
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

  const handleSetupSuccess = () => {
    setShowSetupModal(false);
    setSuccessMessage(t('organization.payments.setupSuccessful'));
    loadPaymentStatus(); // Refresh status
    onUpdate?.(); // Notify parent component
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <Loading />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      {/* Header */}
      <div className={`flex items-center justify-between mb-6 ${isRTL ? 'text-right' : 'text-left'}`}>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t('organization.payments.paymentMethods')}</h2>
          <p className="text-sm text-gray-600 mt-1">
            {t('organization.payments.manageYourPaymentIntegration')}
          </p>
        </div>
        
        <div className={`flex items-center space-x-2 ${isRTL ? 'space-x-reverse' : ''}`}>
          <button
            onClick={loadPaymentStatus}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'} ${loading ? 'animate-spin' : ''}`} />
            {t('organization.payments.refresh')}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          <div className={`flex items-center ${isRTL ? 'space-x-reverse' : 'space-x-2'}`}>
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          <div className={`flex items-center justify-between ${isRTL ? 'space-x-reverse' : 'space-x-2'}`}>
            <div className={`flex items-center ${isRTL ? 'space-x-reverse' : 'space-x-2'}`}>
              <CheckCircle className="w-5 h-5" />
              <span>{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage('')}
              className="text-green-500 hover:text-green-700 text-xl"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* NextRemitly Status Card */}
      <NextRemitlyStatusCard
        status={paymentStatus}
        onManage={() => setShowSetupModal(true)}
        onTest={handleTestConnection}
        testing={testing}
      />

      {/* Information Section */}
      <div className="mt-6 space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className={`flex items-start space-x-3 ${isRTL ? 'space-x-reverse' : ''}`}>
            <Shield className={`w-5 h-5 text-blue-600 mt-0.5`} />
            <div className={isRTL ? 'text-right' : 'text-left'}>
              <h4 className="font-medium text-blue-900">{t('organization.payments.howItWorks')}</h4>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>• {t('organization.payments.directPayments')}</li>
                <li>• {t('organization.payments.secureTransactions')}</li>
                <li>• {t('organization.payments.realTimeNotifications')}</li>
                <li>• {t('organization.payments.easyManagement')}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-1">{t('organization.payments.benefit1Title')}</h4>
            <p className="text-sm text-gray-600">{t('organization.payments.benefit1Description')}</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-1">{t('organization.payments.benefit2Title')}</h4>
            <p className="text-sm text-gray-600">{t('organization.payments.benefit2Description')}</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <RefreshCw className="w-6 h-6 text-purple-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-1">{t('organization.payments.benefit3Title')}</h4>
            <p className="text-sm text-gray-600">{t('organization.payments.benefit3Description')}</p>
          </div>
        </div>
      </div>

      {/* Payment Setup Modal */}
      {showSetupModal && (
        <PaymentSetupModal
          isOpen={showSetupModal}
          onClose={() => setShowSetupModal(false)}
          onSuccess={handleSetupSuccess}
          organizationId={organizationId}
          currentStatus={paymentStatus}
        />
      )}
    </div>
  );
}