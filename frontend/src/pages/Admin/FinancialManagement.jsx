
import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Search, Filter, Eye, Flag, AlertTriangle, TrendingUp, 
  CreditCard, Users, Activity, Clock, CheckCircle, XCircle, 
  BarChart3, PieChart, Calendar, Shield, Zap, Globe
} from 'lucide-react';
import { financialApi } from '../../api/endpoints/FinancialAdminAPI';

const FinancialManagement = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({});
  const [activeTab, setActiveTab] = useState('transactions'); // transactions, analytics, monitoring, fraud

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    min_amount: '',
    max_amount: '',
    payment_method: '',
    is_anonymous: '',
    created_after: '',
    created_before: '',
    hours: '24' // for monitoring
  });

  // Analytics data
  const [paymentAnalytics, setPaymentAnalytics] = useState(null);
  const [revenueAnalytics, setRevenueAnalytics] = useState(null);
  const [fraudData, setFraudData] = useState(null);
  const [donationTrends, setDonationTrends] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (activeTab === 'transactions') {
      fetchDonations();
    } else if (activeTab === 'analytics') {
      fetchAnalyticsData();
    } else if (activeTab === 'monitoring') {
      fetchMonitoringData();
    } else if (activeTab === 'fraud') {
      fetchFraudData();
      
    }
    fetchDashboardStats();
  }, [currentPage, filters, activeTab]);

  const fetchDonations = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      };
      
      const response = await financialApi.getDonations(params);
      setDonations(response.results || response);
      setTotalPages(Math.ceil(response.count / 20) || 1);
      setTotalCount(response.count || response.length);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const stats = await financialApi.getDashboardStats();
      setDashboardStats(stats);
      console.log('Dashboard Stats:', stats);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const [payment, revenue, trends] = await Promise.all([
        financialApi.getPaymentAnalytics(),
        financialApi.getRevenueAnalytics(30),
        financialApi.getDonationTrends(30)
      ]);
      setPaymentAnalytics(payment);
      setRevenueAnalytics(revenue);
      setDonationTrends(trends);

      console.log('Revenue Analytics:', revenue);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonitoringData = async () => {
    try {
      setLoading(true);
      const params = {
        hours: filters.hours,
        status: filters.status,
        min_amount: filters.min_amount
      };
      const response = await financialApi.getTransactionMonitoring(params);
      setDonations(response.recent_transactions || []);
      setDashboardStats(prev => ({ ...prev, monitoring: response.summary }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchFraudData = async () => {
    try {
      setLoading(true);
      const fraudResponse = await financialApi.getFraudDetection();
      console.log('Fraud Data:', fraudResponse);
      setFraudData(fraudResponse);
      setDonations(fraudResponse.suspicious_transactions || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const openTransactionDetails = async (transaction) => {
    try {
      const details = await financialApi.getTransactionDetails(transaction.id);
      setSelectedTransaction({ ...transaction, details });
      setShowTransactionModal(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleFlagTransaction = async (transactionId, reason) => {
    try {
      await financialApi.flagTransaction(transactionId, reason);
      if (activeTab === 'transactions') {
        fetchDonations();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && !donations.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Financial Management</h1>
        <p className="text-gray-600">Monitor transactions, analytics, and financial performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Donations</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardStats.overview?.total_amount || '0'} MRU
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Transactions Today</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardStats.today?.donations || '0'}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardStats.overview?.success_rate || '0'}%
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'transactions', name: 'Transactions', icon: DollarSign },
              // { id: 'analytics', name: 'Analytics', icon: BarChart3 },
              { id: 'monitoring', name: 'Real-time Monitoring', icon: Activity },
              { id: 'fraud', name: 'Fraud Detection', icon: Shield }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'transactions' && (
        <div>
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow border mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
              <input
                type="number"
                placeholder="Min amount"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.min_amount}
                onChange={(e) => handleFilterChange('min_amount', e.target.value)}
              />
              <input
                type="number"
                placeholder="Max amount"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.max_amount}
                onChange={(e) => handleFilterChange('max_amount', e.target.value)}
              />
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.is_anonymous}
                onChange={(e) => handleFilterChange('is_anonymous', e.target.value)}
              >
                <option value="">All Donors</option>
                <option value="true">Anonymous</option>
                <option value="false">Named</option>
              </select>
            </div>
          </div>

          {/* Transactions Table */}
          <TransactionsTable 
            donations={donations}
            onViewDetails={openTransactionDetails}
            onFlag={handleFlagTransaction}
            loading={loading}
          />
        </div>
      )}

      {/* {activeTab === 'analytics' && (
        <AnalyticsTab 
          paymentAnalytics={paymentAnalytics}
          revenueAnalytics={revenueAnalytics}
          donationTrends={donationTrends}
          loading={loading}
        />
      )} */}

      {activeTab === 'monitoring' && (
        <MonitoringTab 
          donations={donations}
          filters={filters}
          onFilterChange={handleFilterChange}
          onViewDetails={openTransactionDetails}
          stats={dashboardStats.monitoring}
          loading={loading}
        />
      )}

      {activeTab === 'fraud' && (
        <FraudTab 
          fraudData={fraudData}
          donations={donations}
          onViewDetails={openTransactionDetails}
          onFlag={handleFlagTransaction}
          loading={loading}
        />
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Pagination */}
      {activeTab === 'transactions' && totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 mt-4">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{((currentPage - 1) * 20) + 1}</span> to{' '}
                <span className="font-medium">{Math.min(currentPage * 20, totalCount)}</span> of{' '}
                <span className="font-medium">{totalCount}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                  {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Details Modal */}
      {showTransactionModal && selectedTransaction && (
        <TransactionDetailsModal
          transaction={selectedTransaction}
          onClose={() => setShowTransactionModal(false)}
          onFlag={handleFlagTransaction}
        />
      )}
    </div>
  );
};
export default FinancialManagement;

// Fraud Tab Component
const FraudTab = ({ fraudData, donations, onViewDetails, onFlag, loading }) => {
  if (loading) {
    return <div className="text-center py-8">Loading fraud detection data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Fraud Summary */}
      {fraudData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Suspicious Transactions</p>
                <p className="text-2xl font-bold text-gray-900">{fraudData.total_suspicious || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-orange-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">High Risk</p>
                <p className="text-2xl font-bold text-gray-900">
                  {fraudData.fraud_patterns?.high_risk_count || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <Zap className="h-8 w-8 text-yellow-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Fast Transactions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {fraudData.fraud_patterns?.fast_transactions || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fraud Patterns */}
      {fraudData?.fraud_patterns && (
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Fraud Patterns Detected</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="font-medium text-red-800">Large Anonymous Donations</h4>
              <p className="text-sm text-red-600 mt-1">
                {fraudData.fraud_patterns.large_anonymous || 0} transactions detected
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-800">Rapid Fire Donations</h4>
              <p className="text-sm text-yellow-600 mt-1">
                {fraudData.fraud_patterns.rapid_fire || 0} patterns detected
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <h4 className="font-medium text-orange-800">Unusual Payment Methods</h4>
              <p className="text-sm text-orange-600 mt-1">
                {fraudData.fraud_patterns.unusual_methods || 0} transactions flagged
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-purple-800">Geographic Anomalies</h4>
              <p className="text-sm text-purple-600 mt-1">
                {fraudData.fraud_patterns.geo_anomalies || 0} locations flagged
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Suspicious Transactions */}
      <div className="bg-white rounded-lg shadow border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Suspicious Transactions</h3>
        </div>
        {donations.length > 0 ? (
          <TransactionsTable 
            donations={donations}
            onViewDetails={onViewDetails}
            onFlag={onFlag}
            loading={false}
          />
        ) : (
          <div className="text-center py-8">
            <Shield className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No suspicious transactions</h3>
            <p className="mt-1 text-sm text-gray-500">All transactions appear normal.</p>
          </div>
        )}
      </div>
    </div>
  );
};


// Transaction Details Modal Component
const TransactionDetailsModal = ({ transaction, onClose, onFlag }) => {
  const [flagReason, setFlagReason] = useState('');
  const [showFlagModal, setShowFlagModal] = useState(false);

  const handleFlag = async () => {
    if (flagReason.trim()) {
      await onFlag(transaction.id, flagReason);
      setShowFlagModal(false);
      setFlagReason('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Transaction Details</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
          </div>
          
          {/* Transaction Info */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Transaction ID</label>
                <p className="mt-1 text-sm text-gray-900">#{transaction.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount</label>
                <p className="mt-1 text-sm text-gray-900">{transaction.amount} MRU</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                  transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {transaction.status}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Risk Level</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  transaction.risk_level === 'high' ? 'bg-red-100 text-red-800' :
                  transaction.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {transaction.risk_level}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                <p className="mt-1 text-sm text-gray-900">{transaction.payment_method}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Created Date</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(transaction.created_at).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Donor Information */}
            <div className="border-t pt-4">
              <h4 className="text-md font-medium text-gray-900 mb-2">Donor Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Donor</label>
                  <p className="mt-1 text-sm text-gray-900">{transaction.donor_display}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Anonymous</label>
                  <p className="mt-1 text-sm text-gray-900">{transaction.is_anonymous ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>

            {/* Campaign Information */}
            <div className="border-t pt-4">
              <h4 className="text-md font-medium text-gray-900 mb-2">Campaign Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Campaign</label>
                  <p className="mt-1 text-sm text-gray-900">{transaction.campaign_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Campaign Owner</label>
                  <p className="mt-1 text-sm text-gray-900">{transaction.campaign_owner}</p>
                </div>
              </div>
            </div>

            {/* Additional Details */}
            {transaction.details && (
              <div className="border-t pt-4">
                <h4 className="text-md font-medium text-gray-900 mb-2">Additional Details</h4>
                {transaction.details.payment_metadata_info && (
                  <div className="bg-gray-50 p-3 rounded">
                    <pre className="text-xs text-gray-600">
                      {JSON.stringify(transaction.details.payment_metadata_info, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between mt-6">
            <div>
              <button
                onClick={() => setShowFlagModal(true)}
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
              >
                Flag Transaction
              </button>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Flag Modal */}
      {showFlagModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Flag Transaction</h4>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for flagging
              </label>
              <textarea
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Please provide a reason for flagging this transaction..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowFlagModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleFlag}
                disabled={!flagReason.trim()}
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
              >
                Flag Transaction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Transactions Table Component
const TransactionsTable = ({ donations, onViewDetails, onFlag, loading }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Transaction
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Donor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Campaign
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Risk Level
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {donations.map((donation) => (
              <tr key={donation.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">#{donation.id}</div>
                  <div className="text-sm text-gray-500">{donation.payment_method}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{donation.donor_display}</div>
                  {donation.is_anonymous && (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                      Anonymous
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{donation.campaign_name}</div>
                  <div className="text-sm text-gray-500">{donation.campaign_owner}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {donation.amount} MRU
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(donation.status)}`}>
                    {donation.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(donation.risk_level)}`}>
                    {donation.risk_level}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(donation.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onViewDetails(donation)}
                      className="text-blue-600 hover:text-blue-900"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onFlag(donation.id, 'Manual review requested')}
                      className="text-orange-600 hover:text-orange-900"
                      title="Flag Transaction"
                    >
                      <Flag className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};


// Monitoring Tab Component
const MonitoringTab = ({ donations, filters, onFilterChange, onViewDetails, stats, loading }) => {
  return (
    <div className="space-y-6">
      {/* Real-time Filters */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.hours}
            onChange={(e) => onFilterChange('hours', e.target.value)}
          >
            <option value="1">Last 1 Hour</option>
            <option value="6">Last 6 Hours</option>
            <option value="24">Last 24 Hours</option>
            <option value="72">Last 3 Days</option>
          </select>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.status}
            onChange={(e) => onFilterChange('status', e.target.value)}
          >
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <input
            type="number"
            placeholder="Min amount for alerts"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.min_amount}
            onChange={(e) => onFilterChange('min_amount', e.target.value)}
          />
          <div className="flex items-center justify-center">
            <div className="flex items-center">
              <div className="h-3 w-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              <span className="text-sm text-gray-600">Live Monitoring</span>
            </div>
          </div>
        </div>
      </div>

      {/* Monitoring Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <Activity className="h-6 w-6 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Transactions</p>
                <p className="text-xl font-bold text-gray-900">{stats.total_transactions}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <DollarSign className="h-6 w-6 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Amount</p>
                <p className="text-xl font-bold text-gray-900">{stats.total_amount} MRU</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <CheckCircle className="h-6 w-6 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-xl font-bold text-gray-900">{stats.completed_transactions}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <Clock className="h-6 w-6 text-yellow-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-xl font-bold text-gray-900">{stats.pending_transactions}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <XCircle className="h-6 w-6 text-red-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Failed</p>
                <p className="text-xl font-bold text-gray-900">{stats.failed_transactions}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaign</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Processing Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {donations.map((donation) => (
                <tr key={donation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {new Date(donation.created_at).toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {donation.amount} MRU
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      donation.status === 'completed' ? 'bg-green-100 text-green-800' :
                      donation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {donation.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {donation.campaign_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {donation.processing_time_seconds ? `${donation.processing_time_seconds}s` : 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => onViewDetails(donation)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Analytics Tab Component
const AnalyticsTab = ({ paymentAnalytics, revenueAnalytics, donationTrends, loading }) => {
  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Payment Methods Analytics */}
      {paymentAnalytics?.payment_methods && (
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Methods Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paymentAnalytics.payment_methods.map((method, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900">{method.method}</h4>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-600">Transactions: {method.transaction_count}</p>
                  <p className="text-sm text-gray-600">Total: {method.total_amount} MRU</p>
                  <p className="text-sm text-gray-600">Average: {method.average_amount} MRU</p>
                  <p className="text-sm text-gray-600">Success Rate: {method.success_rate}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Wallet Providers Analytics */}
      {paymentAnalytics?.wallet_providers && (
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Wallet Providers Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paymentAnalytics.wallet_providers.map((provider, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{provider.name}</h4>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    provider.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {provider.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Manual Accounts: {provider.manual_accounts}</p>
                  <p className="text-sm text-gray-600">NextPay Accounts: {provider.nextpay_accounts}</p>
                  <p className="text-sm text-gray-600">Total Accounts: {provider.total_accounts}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processing Performance */}
      {paymentAnalytics?.processing_performance && (
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Processing Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-blue-800">
                {paymentAnalytics.processing_performance.average_processing_time_seconds}s
              </h4>
              <p className="text-sm text-blue-600">Average Processing Time</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-purple-800">
                {paymentAnalytics.processing_performance.sample_size}
              </h4>
              <p className="text-sm text-purple-600">Sample Size</p>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Analytics */}
      {revenueAnalytics && (
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Trends (Last 30 Days)</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-blue-800">
                {revenueAnalytics.total_revenue || 0} MRU
              </h4>
              <p className="text-sm text-blue-600">Total Revenue</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-green-800">
                {revenueAnalytics.platform_fees || 0} MRU
              </h4>
              <p className="text-sm text-green-600">Platform Fees</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-purple-800">
                {revenueAnalytics.total_transactions || 0}
              </h4>
              <p className="text-sm text-purple-600">Transactions</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-orange-800">
                {revenueAnalytics.average_transaction || 0} MRU
              </h4>
              <p className="text-sm text-orange-600">Average Transaction</p>
            </div>
          </div>

          {/* Revenue Chart Placeholder */}
          {revenueAnalytics.daily_revenue && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Daily Revenue Trend</h4>
              <div className="grid grid-cols-7 gap-2">
                {revenueAnalytics.daily_revenue.slice(-7).map((day, index) => (
                  <div key={index} className="text-center">
                    <div className="text-xs text-gray-500 mb-1">
                      {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                    </div>
                    <div className="bg-blue-200 rounded-t" style={{ 
                      height: `${Math.max((day.amount / Math.max(...revenueAnalytics.daily_revenue.map(d => d.amount))) * 60, 10)}px` 
                    }}></div>
                    <div className="text-xs text-gray-700 mt-1">{day.amount}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Donation Trends */}
      {donationTrends && (
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Donation Trends & Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-green-800">
                {donationTrends.growth_rate || 0}%
              </h4>
              <p className="text-sm text-green-600">Monthly Growth Rate</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-blue-800">
                {donationTrends.repeat_donors || 0}
              </h4>
              <p className="text-sm text-blue-600">Repeat Donors</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-purple-800">
                {donationTrends.peak_hour || 'N/A'}
              </h4>
              <p className="text-sm text-purple-600">Peak Hour</p>
            </div>
          </div>

          {/* Additional Trend Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Donor Behavior</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Average Donation Size:</span>
                  <span className="text-sm font-medium">{donationTrends.avg_donation_size || 0} MRU</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">New Donors This Month:</span>
                  <span className="text-sm font-medium">{donationTrends.new_donors || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Donor Retention Rate:</span>
                  <span className="text-sm font-medium">{donationTrends.retention_rate || 0}%</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Transaction Patterns</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Most Active Day:</span>
                  <span className="text-sm font-medium">{donationTrends.most_active_day || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Success Rate:</span>
                  <span className="text-sm font-medium">{donationTrends.success_rate || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Mobile vs Desktop:</span>
                  <span className="text-sm font-medium">{donationTrends.mobile_ratio || 0}% Mobile</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performing Categories</h3>
          {donationTrends?.top_categories ? (
            <div className="space-y-3">
              {donationTrends.top_categories.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded-full mr-3 ${
                      index === 0 ? 'bg-green-500' : 
                      index === 1 ? 'bg-blue-500' : 
                      index === 2 ? 'bg-purple-500' : 'bg-gray-400'
                    }`}></div>
                    <span className="text-sm font-medium">{category.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{category.amount} MRU</div>
                    <div className="text-xs text-gray-500">{category.campaigns} campaigns</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <BarChart3 className="mx-auto h-8 w-8 text-gray-400" />
              <p className="text-sm text-gray-500 mt-2">No category data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};