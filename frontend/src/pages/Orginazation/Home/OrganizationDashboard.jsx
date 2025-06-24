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
  Activity
} from 'lucide-react';
import Loading from '../../../components/common/Loading';
import orgDashboardApi from '../../../api/endpoints/OrgAPI';

export default function OrganizationDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await orgDashboardApi.fetchFullDashboardData('30d');
        setDashboardData(data);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Welcome back, {dashboardData?.profile?.org_name || 'Organization'}
            </h1>
            <p className="text-gray-600 mt-1">
              Here's an overview of your fundraising performance
            </p>
          </div>
          
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <button
              onClick={handleRefresh}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Refresh Data
            </button>
            
            {dashboardData?.profile?.is_verified ? (
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
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 text-xl"
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
                {dashboardData?.statistics?.total_campaigns || 0}
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
                ${orgDashboardApi.formatNumber(dashboardData?.statistics?.total_raised || 0)}
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
                {orgDashboardApi.formatNumber(dashboardData?.statistics?.total_donors || 0)}
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
                {dashboardData?.statistics?.success_rate || 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Create New Campaign
            </button>
            <button className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium">
              View All Campaigns
            </button>
            <button className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium">
              Download Reports
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-green-600" />
              </div>
              <div className="ml-3 flex-1">
                <p className="font-medium text-gray-900">New donation received</p>
                <p className="text-sm text-gray-500">2 hours ago</p>
              </div>
              <span className="text-lg font-semibold text-gray-900">$150</span>
            </div>
            
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <div className="ml-3 flex-1">
                <p className="font-medium text-gray-900">Campaign "Help Local School" updated</p>
                <p className="text-sm text-gray-500">1 day ago</p>
              </div>
            </div>
            
            <div className="text-center py-6 text-gray-500">
              <Activity className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">More activity will appear here as your campaigns grow</p>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Status Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Status Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-semibold text-gray-900 mb-1">
              {dashboardData?.statistics?.active_campaigns || 0}
            </div>
            <p className="text-sm text-gray-600">Active Campaigns</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-semibold text-gray-900 mb-1">
              {dashboardData?.statistics?.pending_campaigns || 0}
            </div>
            <p className="text-sm text-gray-600">Pending Review</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-semibold text-gray-900 mb-1">
              {dashboardData?.statistics?.completed_campaigns || 0}
            </div>
            <p className="text-sm text-gray-600">Completed</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-semibold text-gray-900 mb-1">
              {dashboardData?.statistics?.avg_goal_achievement || 0}%
            </div>
            <p className="text-sm text-gray-600">Avg. Goal Achievement</p>
          </div>
        </div>
      </div>
    </div>
  );
}