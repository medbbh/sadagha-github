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
  AlertTriangle
} from 'lucide-react';
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
      <div className="mb-4 rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-yellow-800 flex items-center">
        <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
        <p className="text-sm">
          {t('organization.dashboard.verificationNotice')}
        </p>
      </div>
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
          <h3 className={`text-lg font-semibold text-gray-900 mb-4 flex items-center `}>
            <Activity className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('organization.dashboard.recentActivity')}
          </h3>

          <div className="text-center py-8 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium mb-2">{t('organization.dashboard.noRecentActivity')}</p>
            <p className="text-sm">{t('organization.dashboard.activityDescription')}</p>
            {campaignError && (
              <p className="text-xs text-amber-600 mt-2">{t('organization.dashboard.campaignSystemRequired')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Campaign Status Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className={`text-lg font-semibold text-gray-900 mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
          {t('organization.dashboard.campaignStatusOverview')}
        </h3>

        {campaignError ? (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium mb-2">{t('organization.dashboard.campaignDataUnavailable')}</p>
            <p className="text-sm">{t('organization.dashboard.campaignSystemConfigRequired')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-semibold text-gray-900 mb-1">
                {statisticsData.active_campaigns || 0}
              </div>
              <p className="text-sm text-gray-600">{t('organization.dashboard.activeCampaigns')}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-semibold text-gray-900 mb-1">
                {statisticsData.pending_campaigns || 0}
              </div>
              <p className="text-sm text-gray-600">{t('organization.dashboard.pendingReview')}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-semibold text-gray-900 mb-1">
                {statisticsData.completed_campaigns || 0}
              </div>
              <p className="text-sm text-gray-600">{t('organization.dashboard.completed')}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-semibold text-gray-900 mb-1">
                {statisticsData.avg_goal_achievement || 0}%
              </div>
              <p className="text-sm text-gray-600">{t('organization.dashboard.avgGoalAchievement')}</p>
            </div>
          </div>
        )}
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