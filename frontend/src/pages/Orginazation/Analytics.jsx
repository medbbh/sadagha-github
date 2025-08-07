import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  Calendar, Download, TrendingUp, Users, DollarSign, 
  Target, Filter, FileText, FileSpreadsheet, Eye,
  Activity, Award, Clock, ArrowUp, ArrowDown, BarChart3,
  TrendingDown, RefreshCw, AlertCircle
} from 'lucide-react';
import Loading from '../../components/common/Loading';

// Import the analytics API
import AnalyticsAPI from '../../api/endpoints/AnalyticsAPI';

const Analytics = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('30d');
  const [customDateRange, setCustomDateRange] = useState({
    start: '',
    end: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [exporting, setExporting] = useState({ excel: false, pdf: false });

  const periods = [
    { value: '7d', label: t('organization.analytics.periods.last7Days') },
    { value: '30d', label: t('organization.analytics.periods.last30Days') },
    { value: '90d', label: t('organization.analytics.periods.last90Days') },
    { value: '1y', label: t('organization.analytics.periods.lastYear') },
    { value: 'custom', label: t('organization.analytics.periods.customRange') }
  ];

  useEffect(() => {
    // Initial load
    if (!analyticsData) {
      fetchAnalytics(false);
    } else {
      // Refresh when period changes
      fetchAnalytics(true);
    }
  }, [period, customDateRange]);

  const fetchAnalytics = async (isRefresh = false) => {
    try {
      // Use different loading states based on whether it's initial load or refresh
      if (isRefresh) {
        setRefreshing(true);
        setError(null);
      } else {
        setLoading(true);
        setError(null);
      }

      // Prepare parameters
      const params = { period };
      
      if (period === 'custom' && customDateRange.start && customDateRange.end) {
        // Validate custom date range
        const validation = AnalyticsAPI.validateDateRange(customDateRange.start, customDateRange.end);
        if (!validation.valid) {
          throw new Error(validation.error);
        }
        
        params.start_date = customDateRange.start;
        params.end_date = customDateRange.end;
      }

      console.log('Fetching analytics with params:', params);
      
      const data = await AnalyticsAPI.fetchAnalyticsOverview(params);
      setAnalyticsData(data);
      
      console.log('Analytics data loaded successfully:', data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching analytics:', err);
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const formatCurrency = (amount) => {
    return AnalyticsAPI.formatCurrency(amount);
  };

  const formatDate = (dateString) => {
    return AnalyticsAPI.formatDate(dateString, isRTL ? 'ar-EG' : 'en-US');
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`bg-white p-3 border border-gray-200 rounded-lg shadow-lg ${isRTL ? 'text-right' : 'text-left'}`}>
          <p className="text-sm text-gray-600">{formatDate(label)}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
              {entry.dataKey === 'amount' 
                ? formatCurrency(entry.value) 
                : t('organization.analytics.donationsCount', { count: entry.value })
              }
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className={isRTL ? 'text-right' : 'text-left'}>
              <h1 className={`text-2xl font-semibold text-gray-900 flex items-center `}>
                <BarChart3 className={`h-6 w-6 text-red-600 ${isRTL ? 'ml-3' : 'mr-3'}`} />
                {t('organization.analytics.title')}
              </h1>
              <p className="mt-1 text-gray-600">
                {t('organization.analytics.errorLoading')}
              </p>
            </div>
          </div>
        </div>

        {/* Error Display */}
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className={`flex items-center justify-between `}>
            <div className={`flex items-center `}>
              <AlertCircle className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchAnalytics}
              className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors"
            >
              {t('organization.analytics.tryAgain')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) return null;

  const { overview, campaign_performance, donation_trends, top_donors, campaign_health } = analyticsData;

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h1 className={`text-2xl font-semibold text-gray-900 flex items-center `}>
              <BarChart3 className={`h-6 w-6 text-blue-600 ${isRTL ? 'ml-3' : 'mr-3'}`} />
              {t('organization.analytics.title')}
            </h1>
            <p className="mt-1 text-gray-600">
              {t('organization.analytics.subtitle')}
            </p>
          </div>
          
          <div className={`flex items-center space-x-3 mt-4 sm:mt-0 ${isRTL ? 'space-x-reverse' : ''}`}>
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors `}
            >
              <Filter className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('organization.analytics.filters')}
            </button>
            
            {/* Manual Refresh Button */}
            <button
              onClick={() => fetchAnalytics(true)}
              disabled={refreshing}
              className={`flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 `}
            >
              <RefreshCw className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} ${refreshing ? 'animate-spin' : ''}`} />
              {t('organization.analytics.refresh')}
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('organization.analytics.timePeriod')}
                </label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isRTL ? 'text-right' : 'text-left'}`}
                >
                  {periods.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              {period === 'custom' && (
                <>
                  <div>
                    <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('organization.analytics.startDate')}
                    </label>
                    <input
                      type="date"
                      value={customDateRange.start}
                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isRTL ? 'text-right' : 'text-left'}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('organization.analytics.endDate')}
                    </label>
                    <input
                      type="date"
                      value={customDateRange.end}
                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isRTL ? 'text-right' : 'text-left'}`}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Content with Overlay Loading */}
      <div className="relative">
        {/* Loading Overlay for Refresh */}
        {refreshing && (
          <div className="absolute inset-0 bg-white bg-opacity-75 z-10 rounded-lg flex items-center justify-center">
            <div className={`bg-white p-4 rounded-lg shadow-lg border border-gray-200 flex items-center space-x-3 ${isRTL ? 'space-x-reverse' : ''}`}>
              <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
              <span className="text-gray-700 font-medium">{t('organization.analytics.updatingAnalytics')}</span>
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className={`flex items-center `}>
              <div className="p-2 rounded-lg bg-blue-100">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div className={`${isRTL ? 'mr-3 text-right' : 'ml-3 text-left'}`}>
                <p className="text-sm text-gray-600">{t('organization.analytics.totalRaised')}</p>
                <p className="text-xl font-semibold text-gray-900">{formatCurrency(overview.period_raised)}</p>
                <div className={`flex items-center mt-1 ${isRTL ? ' justify-end' : ''}`}>
                  {overview.growth_rate >= 0 ? (
                    <ArrowUp className={`h-3 w-3 text-green-500 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                  ) : (
                    <ArrowDown className={`h-3 w-3 text-red-500 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                  )}
                  <span className={`text-xs ${overview.growth_rate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {t('organization.analytics.vsPrevious', { percent: Math.abs(overview.growth_rate) })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className={`flex items-center `}>
              <div className="p-2 rounded-lg bg-green-100">
                <Activity className="w-5 h-5 text-green-600" />
              </div>
              <div className={`${isRTL ? 'mr-3 text-right' : 'ml-3 text-left'}`}>
                <p className="text-sm text-gray-600">{t('organization.analytics.donations')}</p>
                <p className="text-xl font-semibold text-gray-900">{overview.period_donations}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {t('organization.analytics.avgDonation', { amount: formatCurrency(overview.avg_donation) })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className={`flex items-center `}>
              <div className="p-2 rounded-lg bg-purple-100">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div className={`${isRTL ? 'mr-3 text-right' : 'ml-3 text-left'}`}>
                <p className="text-sm text-gray-600">{t('organization.analytics.uniqueDonors')}</p>
                <p className="text-xl font-semibold text-gray-900">{overview.unique_donors}</p>
                <p className="text-xs text-gray-500 mt-1">{t('organization.analytics.thisPeriod')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className={`flex items-center `}>
              <div className="p-2 rounded-lg bg-orange-100">
                <Target className="w-5 h-5 text-orange-600" />
              </div>
              <div className={`${isRTL ? 'mr-3 text-right' : 'ml-3 text-left'}`}>
                <p className="text-sm text-gray-600">{t('organization.analytics.activeCampaigns')}</p>
                <p className="text-xl font-semibold text-gray-900">{overview.total_campaigns}</p>
                <p className="text-xs text-gray-500 mt-1">{t('organization.analytics.totalCampaigns')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 gap-8 mb-8">
          {/* Donation Trends */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className={`text-lg font-semibold text-gray-900 mb-4 flex items-center `}>
              <TrendingUp className={`h-5 w-5 text-blue-600 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('organization.analytics.donationTrends', { period: donation_trends.label })}
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={donation_trends.data}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    className="text-xs"
                    reversed={isRTL}
                  />
                  <YAxis 
                    tickFormatter={(value) => formatCurrency(value)}
                    className="text-xs"
                    orientation={isRTL ? 'right' : 'left'}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#3B82F6" 
                    fillOpacity={1} 
                    fill="url(#colorAmount)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Campaign Performance */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className={`text-lg font-semibold text-gray-900 mb-4 flex items-center `}>
              <Award className={`h-5 w-5 text-blue-600 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('organization.analytics.topCampaignPerformance')}
            </h3>
            {campaign_performance && campaign_performance.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={campaign_performance}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 60,
                    }}
                    layout={isRTL ? 'horizontal' : 'vertical'}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={12}
                      tickFormatter={(value) => value.length > 15 ? value.substring(0, 15) + '...' : value}
                      reversed={isRTL}
                    />
                    <YAxis 
                      tickFormatter={(value) => formatCurrency(value)}
                      fontSize={12}
                      orientation={isRTL ? 'right' : 'left'}
                    />
                    <Tooltip 
                      formatter={(value, name) => [
                        formatCurrency(value), 
                        name === 'total_raised' 
                          ? t('organization.analytics.amountRaised') 
                          : t('organization.analytics.targetAmount')
                      ]}
                      labelFormatter={(label) => t('organization.analytics.campaignLabel', { name: label })}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb', 
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        textAlign: isRTL ? 'right' : 'left'
                      }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="total_raised" 
                      stackId="a" 
                      fill="#8884d8" 
                      name={t('organization.analytics.amountRaised')}
                    />
                    <Bar 
                      dataKey="target" 
                      stackId="a" 
                      fill="#82ca9d" 
                      name={t('organization.analytics.targetAmount')}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">{t('organization.analytics.noCampaignData')}</p>
                  <p className="text-sm">{t('organization.analytics.createCampaignsToSeeMetrics')}</p>
                </div>
              </div>
            )}
          </div>

          {/* Top Donors */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className={`text-lg font-semibold text-gray-900 mb-4 flex items-center `}>
              <Users className={`h-5 w-5 text-blue-600 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('organization.analytics.topDonors')}
            </h3>
            <div className="space-y-4">
              {top_donors.map((donor, index) => (
                <div key={index} className={`flex items-center justify-between p-3 bg-gray-50 rounded-lg `}>
                  <div className={`flex items-center `}>
                    <div className={`w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center ${isRTL ? 'ml-3' : 'mr-3'}`}>
                      <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                    </div>
                    <div className={isRTL ? 'text-right' : 'text-left'}>
                      <p className="font-medium text-gray-900">{donor.name}</p>
                      <p className="text-sm text-gray-500">
                        {t('organization.analytics.donationCount', { count: donor.donation_count })}
                      </p>
                    </div>
                  </div>
                  <div className={isRTL ? 'text-left' : 'text-right'}>
                    <p className="font-semibold text-gray-900">{formatCurrency(donor.total_donated)}</p>
                  </div>
                </div>
              ))}
              {top_donors.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t('organization.analytics.noDonorsInPeriod')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;