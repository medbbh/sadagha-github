import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Settings, CreditCard, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import Loading from '../../../components/common/Loading';
import OrganizationProfileForm from '../../../components/ui/OrganzationProfileForm';
import PaymentMethodsManagement from '../../../components/ui/PaymentMethodsManagement';
import organizationApi from '../../../api/endpoints/OrgAPI';

const TabButton = ({ isActive, onClick, icon: Icon, children }) => (
  <button
    onClick={onClick}
    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-blue-100 text-blue-700 border border-blue-200'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
    }`}
  >
    <Icon className="w-4 h-4 mr-2" />
    {children}
  </button>
);

const ProfileCompletionBanner = ({ orgProfile, paymentMethods }) => {
  const getCompletionItems = () => {
    const hasPaymentMethods = (paymentMethods?.manual_payments?.length > 0) || 
                             (paymentMethods?.nextpay_payments?.length > 0);
    
    const items = [
      {
        key: 'basic_info',
        label: 'Basic Information',
        completed: orgProfile?.org_name && orgProfile?.description && orgProfile?.address && orgProfile?.phone_number
      },
      {
        key: 'documents',
        label: 'Organization Documents',
        completed: orgProfile?.document_url
      },
      {
        key: 'payment_methods',
        label: 'Payment Methods',
        completed: hasPaymentMethods
      },
      {
        key: 'verification',
        label: 'Verification',
        completed: orgProfile?.is_verified
      }
    ];
    return items;
  };

  const completionItems = getCompletionItems();
  const completedCount = completionItems.filter(item => item.completed).length;
  const completionPercentage = Math.round((completedCount / completionItems.length) * 100);

  if (completionPercentage === 100) {
    return null; // Don't show banner if everything is complete
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <AlertCircle className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Complete Your Profile</h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Complete your organization profile to start receiving donations and build trust with donors.
          </p>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium text-gray-900">{completedCount} of {completionItems.length} completed</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-3">
            {completionItems.map(item => (
              <div key={item.key} className="flex items-center text-sm">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  item.completed ? 'bg-green-500' : 'bg-gray-300'
                }`}></div>
                <span className={item.completed ? 'text-green-700' : 'text-gray-600'}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function OrganizationProfile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orgProfile, setOrgProfile] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState({
    manual_payments: [],
    nextpay_payments: [],
    summary: {}
  });

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get organization profile first
      const profileResponse = await organizationApi.fetchOrgProfile();
      setOrgProfile(profileResponse);

      // Then get payment methods if we have a profile
      if (profileResponse?.id) {
        try {
          const [manualPayments, nextpayPayments] = await Promise.all([
            organizationApi.fetchManualPayments().catch(err => {
              console.warn('Failed to fetch manual payments:', err);
              return { data: [] };
            }),
            organizationApi.fetchNextPayPayments().catch(err => {
              console.warn('Failed to fetch NextPay payments:', err);
              return { data: [] };
            })
          ]);

          setPaymentMethods({
            manual_payments: manualPayments || [],
            nextpay_payments: nextpayPayments || [],
            summary: {
              total_count: (manualPayments.length || 0) + (nextpayPayments.length || 0),
              manual_count: manualPayments.length || 0,
              nextpay_count: nextpayPayments.length || 0,
              has_manual: (manualPayments.length || 0) > 0,
              has_nextpay: (nextpayPayments.length || 0) > 0,
              payment_ready: (manualPayments.length || 0) > 0 || (nextpayPayments.length || 0) > 0
            }
          });
        } catch (paymentErr) {
          console.warn('Failed to fetch payment methods:', paymentErr);
          // Set empty payment methods on error
          setPaymentMethods({
            manual_payments: [],
            nextpay_payments: [],
            summary: {
              total_count: 0,
              manual_count: 0,
              nextpay_count: 0,
              has_manual: false,
              has_nextpay: false,
              payment_ready: false
            }
          });
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load profile data');
      console.error('Error loading profile data:', err);
      // Set fallback values
      setPaymentMethods({
        manual_payments: [],
        nextpay_payments: [],
        summary: {}
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = (updatedProfile) => {
    setOrgProfile(updatedProfile);
  };

  const handlePaymentMethodsUpdate = () => {
    // Reload payment methods when they change
    loadPaymentMethods();
  };

  const loadPaymentMethods = async () => {
    if (!orgProfile?.id) return;
    
    try {
      const [manualPayments, nextpayPayments] = await Promise.all([
        organizationApi.fetchManualPayments().catch(() => ({ data: [] })),
        organizationApi.fetchNextPayPayments().catch(() => ({ data: [] }))
      ]);

      setPaymentMethods({
        manual_payments: manualPayments || [],
        nextpay_payments: nextpayPayments || [],
        summary: {
          total_count: (manualPayments.length || 0) + (nextpayPayments.length || 0),
          manual_count: manualPayments.length || 0,
          nextpay_count: nextpayPayments.length || 0,
          has_manual: (manualPayments.length || 0) > 0,
          has_nextpay: (nextpayPayments.length || 0) > 0,
          payment_ready: (manualPayments.length || 0) > 0 || (nextpayPayments.length || 0) > 0
        }
      });
    } catch (err) {
      console.error('Error reloading payment methods:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-200 text-red-700 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Error Loading Profile</h3>
          <p>{error}</p>
          <button
            onClick={loadProfileData}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Organization Settings</h1>
        <p className="text-gray-600">
          Manage your organization's profile, payment methods, and verification status.
        </p>
      </div>

      {/* Completion Banner */}
      <ProfileCompletionBanner orgProfile={orgProfile} paymentMethods={paymentMethods} />

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 overflow-x-auto">
        <TabButton
          isActive={activeTab === 'profile'}
          onClick={() => setActiveTab('profile')}
          icon={Settings}
        >
          Profile Information
        </TabButton>
        
        <TabButton
          isActive={activeTab === 'payments'}
          onClick={() => setActiveTab('payments')}
          icon={CreditCard}
        >
          Payment Methods
        </TabButton>
        
        <TabButton
          isActive={activeTab === 'verification'}
          onClick={() => setActiveTab('verification')}
          icon={FileText}
        >
          Verification
        </TabButton>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'profile' && (
          <OrganizationProfileForm
            orgProfile={orgProfile}
            onProfileUpdate={handleProfileUpdate}
            loading={loading}
          />
        )}

        {activeTab === 'payments' && (
          <PaymentMethodsManagement
            paymentMethods={paymentMethods}
            onUpdate={handlePaymentMethodsUpdate}
          />
        )}

        {activeTab === 'verification' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <FileText className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Verification Status</h3>
              
              {orgProfile?.is_verified ? (
                <div className="text-green-600">
                  <p className="mb-4">Your organization is verified!</p>
                  <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Verified Organization
                  </div>
                </div>
              ) : (
                <div className="text-gray-600">
                  <p className="mb-4">
                    Your organization is pending verification. Make sure you have:
                  </p>
                  <ul className="text-left max-w-md mx-auto space-y-2 mb-6">
                    <li className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-3 ${
                        orgProfile?.org_name && orgProfile?.description ? 'bg-green-500' : 'bg-gray-300'
                      }`}></div>
                      Complete basic information
                    </li>
                    <li className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-3 ${
                        orgProfile?.document_url ? 'bg-green-500' : 'bg-gray-300'
                      }`}></div>
                      Uploaded organization documents
                    </li>
                    <li className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-3 ${
                        paymentMethods?.summary?.payment_ready ? 'bg-green-500' : 'bg-gray-300'
                      }`}></div>
                      Added at least one payment method
                    </li>
                  </ul>
                  
                  {orgProfile?.document_url && paymentMethods?.summary?.payment_ready ? (
                    <button 
                      onClick={() => organizationApi.requestVerification(orgProfile.id)}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Request Verification
                    </button>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Complete the requirements above to request verification
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {paymentMethods?.summary?.manual_count || 0}
            </div>
            <div className="text-sm text-gray-600">Manual Payments</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {paymentMethods?.summary?.nextpay_count || 0}
            </div>
            <div className="text-sm text-gray-600">NextPay Methods</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {orgProfile?.is_verified ? 'Yes' : 'No'}
            </div>
            <div className="text-sm text-gray-600">Verified Status</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {orgProfile?.created_at ? new Date(orgProfile.created_at).getFullYear() : '-'}
            </div>
            <div className="text-sm text-gray-600">Member Since</div>
          </div>
        </div>
      </div>
    </div>
  );
}