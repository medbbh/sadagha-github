import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import {
  BarChart3,
  FileText,
  Users,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Plus,
  TrendingUp,
  Activity,
  RefreshCw,
  AlertTriangle,
  Heart,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Loading from '../../../components/common/Loading';
import orgDashboardApi from '../../../api/endpoints/OrgAPI';

export default function OrganizationDashboard() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [campaignError, setCampaignError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [recentActivities, setRecentActivities] = useState([]);


  // Fetch dashboard data with better error handling
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      setCampaignError(null);

      try {
        // Fetch essential data first (profile and payments)
        const profileData = await orgDashboardApi.fetchOrgProfile();

        // Try to fetch dashboard statistics (might fail if Campaign model doesn't exist)
        let statisticsData = null;
        let paymentSummaryData = null;
        let overviewData = null;

        try {
          statisticsData = await orgDashboardApi.fetchOrgStatistics('30d');
          console.log('Statistics data fetched successfully:', statisticsData);
        } catch (statErr) {
          console.warn('Statistics data unavailable:', statErr);
          if (statErr.status === 503) {
            setCampaignError(t('organization.dashboard.campaignSystemNotConfigured'));
          }
        }

        try {
          paymentSummaryData = await orgDashboardApi.fetchPaymentSummary();
          console.log('Payment summary fetched successfully:', paymentSummaryData);
        } catch (payErr) {
          console.warn('Payment summary unavailable:', payErr);
        }

        try {
          overviewData = await orgDashboardApi.fetchDashboardOverview();
          console.log('Overview data fetched successfully:', overviewData);
        } catch (overErr) {
          console.warn('Overview data unavailable:', overErr);
        }

        setDashboardData({
          profile: profileData,
          statistics: statisticsData,
          paymentSummary: paymentSummaryData,
          overview: overviewData
        });

      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError(err.message || t('organization.dashboard.failedToLoadData'));
      } finally {
        setLoading(false);
      }
    };

    const recentActivity = async () => {
      try {
        const activitiesData = await orgDashboardApi.fetchRecentActivities();
        setRecentActivities(activitiesData || []);
        console.log('Recent activities fetched:', activitiesData);
      } catch (err) {
        console.error('Failed to fetch recent activities:', err);
      }
    };

    recentActivity();

    fetchDashboardData();
  }, [t]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    setCampaignError(null);

    try {
      // Same approach as initial fetch
      const profileData = await orgDashboardApi.fetchOrgProfile();

      let statisticsData = null;
      let paymentSummaryData = null;
      let overviewData = null;

      try {
        statisticsData = await orgDashboardApi.fetchOrgStatistics('30d');
      } catch (statErr) {
        if (statErr.status === 503) {
          setCampaignError(t('organization.dashboard.campaignSystemNotConfigured'));
        }
      }

      try {
        paymentSummaryData = await orgDashboardApi.fetchPaymentSummary();
      } catch (payErr) {
        console.warn('Payment summary unavailable:', payErr);
      }

      try {
        overviewData = await orgDashboardApi.fetchDashboardOverview();
      } catch (overErr) {
        console.warn('Overview data unavailable:', overErr);
      }

      setDashboardData({
        profile: profileData,
        statistics: statisticsData,
        paymentSummary: paymentSummaryData,
        overview: overviewData
      });

    } catch (err) {
      console.error('Refresh error:', err);
      setError(err.message || t('organization.dashboard.failedToRefreshData'));
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading />
      </div>
    );
  }

  // Helper function to safely get data
  const getProfileData = () => {
    return dashboardData?.profile || dashboardData?.profile || {};
  };

  const getStatisticsData = () => {
    return dashboardData?.statistics || dashboardData?.statistics || {};
  };

  const getPaymentSummaryData = () => {
    return dashboardData?.paymentSummary || dashboardData?.paymentSummary || {};
  };

  const profileData = getProfileData();
  const statisticsData = getStatisticsData();
  const paymentSummaryData = getPaymentSummaryData();

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {
        !profileData.is_verified &&

        (<div className="mb-4 rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-yellow-800 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
          <p className="text-sm">
            {t('organization.dashboard.verificationNotice')}
          </p>
        </div>)
      }

      {/* Welcome Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between `}>
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h1 className="text-2xl font-semibold text-gray-900">
              {t('organization.dashboard.welcomeBack', {
                name: profileData.org_name || user?.first_name || t('organization.dashboard.organization')
              })}
            </h1>
            <p className="text-gray-600 mt-1">
              {t('organization.dashboard.overviewSubtitle')}
            </p>
          </div>

          <div className={`flex items-center space-x-3 mt-4 sm:mt-0 ${isRTL ? 'space-x-reverse' : ''}`}>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={`px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center `}
            >
              <RefreshCw className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'} ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? t('organization.dashboard.refreshing') : t('organization.dashboard.refreshData')}
            </button>

            {profileData.is_verified ? (
              <div className={`flex items-center text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-200 `}>
                <CheckCircle className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                <span className="text-sm font-medium">{t('organization.dashboard.verified')}</span>
              </div>
            ) : (
              <div className={`flex items-center text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 `}>
                <AlertCircle className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                <span className="text-sm font-medium">{t('organization.dashboard.pendingVerification')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className={`flex justify-between items-center `}>
            <div className={`flex items-center `}>
              <AlertTriangle className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 text-xl"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Campaign Error Display */}
      {campaignError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg">
          <div className={`flex justify-between items-start `}>
            <div className={`flex items-start `}>
              <AlertCircle className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'} mt-0.5`} />
              <div className={isRTL ? 'text-right' : 'text-left'}>
                <p className="font-medium">{t('organization.dashboard.campaignDataUnavailable')}</p>
                <p className="text-sm mt-1">{t('organization.dashboard.campaignDataDescription')}</p>
              </div>
            </div>
            <button
              onClick={() => setCampaignError(null)}
              className="text-amber-500 hover:text-amber-700 text-xl"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className={`flex items-center `}>
            <div className="p-2 rounded-lg bg-gray-100">
              <FileText className="w-5 h-5 text-gray-600" />
            </div>
            <div className={`${isRTL ? 'mr-3 text-right' : 'ml-3 text-left'}`}>
              <p className="text-sm text-gray-600">{t('organization.dashboard.totalCampaigns')}</p>
              <p className="text-xl font-semibold text-gray-900">
                {campaignError ? t('organization.dashboard.notAvailable') : (statisticsData.total_campaigns || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className={`flex items-center `}>
            <div className="p-2 rounded-lg bg-gray-100">
              <DollarSign className="w-5 h-5 text-gray-600" />
            </div>
            <div className={`${isRTL ? 'mr-3 text-right' : 'ml-3 text-left'}`}>
              <p className="text-sm text-gray-600">{t('organization.dashboard.totalRaised')}</p>
              <p className="text-xl font-semibold text-gray-900">
                {campaignError ? t('organization.dashboard.notAvailable') : orgDashboardApi.formatCurrency(statisticsData.total_raised || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className={`flex items-center `}>
            <div className="p-2 rounded-lg bg-gray-100">
              <Users className="w-5 h-5 text-gray-600" />
            </div>
            <div className={`${isRTL ? 'mr-3 text-right' : 'ml-3 text-left'}`}>
              <p className="text-sm text-gray-600">{t('organization.dashboard.totalDonors')}</p>
              <p className="text-xl font-semibold text-gray-900">
                {campaignError ? t('organization.dashboard.notAvailable') : orgDashboardApi.formatNumber(statisticsData.total_donors || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className={`flex items-center `}>
            <div className="p-2 rounded-lg bg-gray-100">
              <TrendingUp className="w-5 h-5 text-gray-600" />
            </div>
            <div className={`${isRTL ? 'mr-3 text-right' : 'ml-3 text-left'}`}>
              <p className="text-sm text-gray-600">{t('organization.dashboard.successRate')}</p>
              <p className="text-xl font-semibold text-gray-900">
                {campaignError ? t('organization.dashboard.notAvailable') : `${statisticsData.success_rate || 0}%`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className={`flex items-center gap-3`}>
              <Activity className={`w-5 h-5 text-gray-600`} />
              <h3 className="text-lg font-semibold text-gray-900">{t('organization.dashboard.recentActivity')} (7d)</h3>
            </div>
          </div>

          {(recentActivities.recent_donations.length === 0 && recentActivities.recent_campaigns.length === 0) ? (
            <div className="text-center py-12 px-6">
              <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-base font-medium text-gray-900 mb-1">{t('organization.dashboard.noRecentActivity')}</p>
              <p className="text-sm text-gray-500">{t('organization.dashboard.activityDescription')}</p>
              {campaignError && (
                <p className="text-xs text-amber-600 mt-2">{t('organization.dashboard.campaignSystemRequired')}</p>
              )}
            </div>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Donations by Campaign Chart */}
                {recentActivities.recent_donations.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200" dir="ltr">
                    <div className="flex items-center gap-2 mb-4">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <h4 className="text-sm font-semibold text-gray-700">{t('organization.dashboard.donationsByCampaign')}</h4>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={(() => {
                        const grouped = {};
                        recentActivities.recent_donations.forEach(d => {
                          const name = d.campaign_name.substring(0, 20) + '...';
                          grouped[name] = (grouped[name] || 0) + parseFloat(d.amount);
                        });
                        return Object.entries(grouped).map(([name, amount]) => ({ name, amount }));
                      })()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(value) => `${value.toLocaleString()} MRU`} />
                        <Bar dataKey="amount" fill="#2563eb" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Campaign Progress Chart */}
                {recentActivities.recent_campaigns.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200" dir="ltr">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <h4 className="text-sm font-semibold text-gray-700">{t('organization.dashboard.campaignProgress')}</h4>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={recentActivities.recent_campaigns.map(c => ({
                        name: c.name.substring(0, 20) + '...',
                        progress: ((parseFloat(c.current_amount) / parseFloat(c.target)) * 100).toFixed(1),
                        current: parseFloat(c.current_amount)
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                        <YAxis tick={{ fontSize: 11 }} label={{ value: '%', angle: -90, position: 'insideLeft' }} />
                        <Tooltip formatter={(value) => `${value}%`} />
                        <Bar dataKey="progress" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Quick Stats Row */}
              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{t('organization.dashboard.totalDonations')}</p>
                  <p className="text-2xl font-bold text-gray-900">{recentActivities.recent_donations.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{t('organization.dashboard.totalRaised')}</p>
                  <p className="text-2xl font-bold text-green-600">
                    {recentActivities.recent_donations.reduce((sum, d) => sum + parseFloat(d.amount), 0).toLocaleString()}
                    <span className="text-sm ml-1">MRU</span>
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{t('organization.dashboard.activeCampaigns')}</p>
                  <p className="text-2xl font-bold text-blue-600">{recentActivities.recent_campaigns.length}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>








      {/* Setup Progress (if profile is incomplete) */}
      {(!profileData.org_name || !profileData.description) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className={`text-lg font-semibold text-blue-900 mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('organization.dashboard.completeSetup')}
          </h3>
          <div className="space-y-2">
            {!profileData.org_name && (
              <div className={`flex items-center text-blue-700 `}>
                <AlertCircle className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                <span className="text-sm">{t('organization.dashboard.addOrgName')}</span>
              </div>
            )}
            {!profileData.description && (
              <div className={`flex items-center text-blue-700 `}>
                <AlertCircle className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                <span className="text-sm">{t('organization.dashboard.addOrgDescription')}</span>
              </div>
            )}
          </div>
          <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            {t('organization.dashboard.completeProfile')}
          </button>
        </div>
      )}
    </div>
  );
}