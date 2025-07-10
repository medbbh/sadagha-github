import React, { useState, useEffect } from 'react';
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
        } catch (statErr) {
          console.warn('Statistics data unavailable:', statErr);
          if (statErr.status === 503) {
            setCampaignError('Campaign system not configured');
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
        console.error('Dashboard fetch error:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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
          setCampaignError('Campaign system not configured');
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
      setError(err.message || 'Failed to refresh dashboard data');
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
    return dashboardData?.profile?.data || dashboardData?.profile || {};
  };

  const getStatisticsData = () => {
    return dashboardData?.statistics?.data || dashboardData?.statistics || {};
  };

  const getPaymentSummaryData = () => {
    return dashboardData?.paymentSummary?.data || dashboardData?.paymentSummary || {};
  };

  const profileData = getProfileData();
  const statisticsData = getStatisticsData();
  const paymentSummaryData = getPaymentSummaryData();

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Welcome back, {profileData.org_name || user?.first_name || 'Organization'}
            </h1>
            <p className="text-gray-600 mt-1">
              Here's an overview of your fundraising performance
            </p>
          </div>
          
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
            
            {profileData.is_verified ? (
              <div className="flex items-center text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                <CheckCircle className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">Verified</span>
              </div>
            ) : (
              <div className="flex items-center text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                <AlertCircle className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">Pending Verification</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
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
          <div className="flex justify-between items-start">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 mr-2 mt-0.5" />
              <div>
                <p className="font-medium">Campaign Data Unavailable</p>
                <p className="text-sm mt-1">Campaign statistics are currently unavailable. Payment and profile data are still accessible.</p>
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
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-gray-100">
              <FileText className="w-5 h-5 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Total Campaigns</p>
              <p className="text-xl font-semibold text-gray-900">
                {campaignError ? 'N/A' : (statisticsData.total_campaigns || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-gray-100">
              <DollarSign className="w-5 h-5 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Total Raised</p>
              <p className="text-xl font-semibold text-gray-900">
                {campaignError ? 'N/A' : orgDashboardApi.formatCurrency(statisticsData.total_raised || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-gray-100">
              <Users className="w-5 h-5 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Total Donors</p>
              <p className="text-xl font-semibold text-gray-900">
                {campaignError ? 'N/A' : orgDashboardApi.formatNumber(statisticsData.total_donors || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-gray-100">
              <TrendingUp className="w-5 h-5 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Success Rate</p>
              <p className="text-xl font-semibold text-gray-900">
                {campaignError ? 'N/A' : `${statisticsData.success_rate || 0}%`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Activity - REMOVED MOCK DATA */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Recent Activity
          </h3>
          
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium mb-2">No Recent Activity</p>
            <p className="text-sm">Activity will appear here once you start receiving donations and managing campaigns.</p>
            {campaignError && (
              <p className="text-xs text-amber-600 mt-2">Campaign system needs to be configured to track activity.</p>
            )}
          </div>
        </div>
      </div>

      {/* Campaign Status Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Status Overview</h3>
        
        {campaignError ? (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium mb-2">Campaign Data Unavailable</p>
            <p className="text-sm">The campaign system needs to be properly configured to display statistics.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-semibold text-gray-900 mb-1">
                {statisticsData.active_campaigns || 0}
              </div>
              <p className="text-sm text-gray-600">Active Campaigns</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-semibold text-gray-900 mb-1">
                {statisticsData.pending_campaigns || 0}
              </div>
              <p className="text-sm text-gray-600">Pending Review</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-semibold text-gray-900 mb-1">
                {statisticsData.completed_campaigns || 0}
              </div>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-semibold text-gray-900 mb-1">
                {statisticsData.avg_goal_achievement || 0}%
              </div>
              <p className="text-sm text-gray-600">Avg. Goal Achievement</p>
            </div>
          </div>
        )}
      </div>

      {/* Payment Methods Status */}
      {dashboardData?.paymentSummary && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-semibold text-blue-900 mb-1">
                {paymentSummaryData.summary?.manual_count || 0}
              </div>
              <p className="text-sm text-blue-700">Manual Payments</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-semibold text-green-900 mb-1">
                {paymentSummaryData.summary?.nextpay_count || 0}
              </div>
              <p className="text-sm text-green-700">NextPay Payments</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-semibold text-purple-900 mb-1">
                {paymentSummaryData.summary?.total_count || 0}
              </div>
              <p className="text-sm text-purple-700">Total Methods</p>
            </div>
          </div>
        </div>
      )}

      {/* Setup Progress (if profile is incomplete) */}
      {(!profileData.org_name || !profileData.description) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Complete Your Setup</h3>
          <div className="space-y-2">
            {!profileData.org_name && (
              <div className="flex items-center text-blue-700">
                <AlertCircle className="w-4 h-4 mr-2" />
                <span className="text-sm">Add your organization name</span>
              </div>
            )}
            {!profileData.description && (
              <div className="flex items-center text-blue-700">
                <AlertCircle className="w-4 h-4 mr-2" />
                <span className="text-sm">Add your organization description</span>
              </div>
            )}
          </div>
          <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Complete Profile
          </button>
        </div>
      )}
    </div>
  );
}