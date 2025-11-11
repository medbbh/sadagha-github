import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Shield, Search, Filter, Eye, Download, Clock, User,
  AlertTriangle, CheckCircle, XCircle, FileText, Activity,
  Calendar, Loader2, RefreshCw, Database, TrendingUp
} from 'lucide-react';
import { adminActionApi } from '../../api/endpoints/AdminActionApi';

const AdminActionManagement = () => {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedActions, setSelectedActions] = useState([]);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [stats, setStats] = useState({});
  const [filterOptions, setFilterOptions] = useState({});
  const [activeTab, setActiveTab] = useState('all'); // all, today, flagged

  // Loading states for individual actions
  const [actionLoading, setActionLoading] = useState({});
  const [exportLoading, setExportLoading] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    action_type: '',
    target_model: '',
    admin_user: '',
    timestamp__gte: '',
    timestamp__lte: '',
    ordering: '-timestamp'
  });

  // Debounced search
  const [searchDebounceTimer, setSearchDebounceTimer] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Debounced effect for search
  useEffect(() => {
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }
    
    const timer = setTimeout(() => {
      fetchActions();
    }, filters.search ? 500 : 0); // 500ms debounce for search, immediate for other filters
    
    setSearchDebounceTimer(timer);
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [currentPage, filters, activeTab]);

  useEffect(() => {
    fetchStats();
    fetchFilterOptions();
  }, []);

  const fetchActions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let params = {
        page: currentPage,
        page_size: 50,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      };

      // Handle different tabs
      if (activeTab === 'today') {
        const today = new Date().toISOString().split('T')[0];
        params.timestamp__date = today;
      } else if (activeTab === 'flagged') {
        params.action_type = 'flag_transaction';
      }

      const response = await adminActionApi.getActions(params);
      console.log('Actions response:', response);
      
      // Handle different response structures
      const data = response.data || response;
      const results = data.results || data;
      const count = data.count || (Array.isArray(results) ? results.length : 0);
      
      setActions(Array.isArray(results) ? results : []);
      setTotalPages(Math.ceil(count / 50) || 1);
      setTotalCount(count);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch actions');
      // Auto-dismiss error after 5 seconds
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, activeTab]);

  const fetchStats = async () => {
    try {
      const response = await adminActionApi.getStatistics();
      console.log('Fetched stats:', response);
      // Handle response.data structure
      const statsData = response.data || response;
      setStats(statsData);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const response = await adminActionApi.getFilterOptions();
      console.log('Fetched filter options:', response);
      // Handle response.data structure
      const optionsData = response.data || response;
      setFilterOptions(optionsData);
    } catch (err) {
      console.error('Failed to fetch filter options:', err);
    }
  };

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  }, []);

  const handleActionSelect = useCallback((actionId) => {
    setSelectedActions(prev => 
      prev.includes(actionId) 
        ? prev.filter(id => id !== actionId)
        : [...prev, actionId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedActions.length === actions.length) {
      setSelectedActions([]);
    } else {
      setSelectedActions(actions.map(action => action.id));
    }
  }, [selectedActions.length, actions]);

  const openActionDetails = useCallback(async (action) => {
    try {
      setActionLoading(prev => ({ ...prev, [`details_${action.id}`]: true }));
      const response = await adminActionApi.getAction(action.id);
      
      // Handle response.data structure
      const actionData = response.data || response;
      setSelectedAction(actionData);
      setShowActionModal(true);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch action details');
      setTimeout(() => setError(null), 5000);
    } finally {
      setActionLoading(prev => ({ ...prev, [`details_${action.id}`]: false }));
    }
  }, []);

  const handleExport = useCallback(async () => {
    try {
      setExportLoading(true);
      
      // Build filename based on active filters
      let filename = 'admin_actions';
      if (activeTab === 'today') {
        filename += '_today';
      } else if (activeTab === 'flagged') {
        filename += '_flagged';
      }
      if (filters.action_type) {
        filename += `_${filters.action_type}`;
      }
      filename += '.csv';

      // Get current filters for export
      let exportParams = {
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      };

      // Apply tab filters
      if (activeTab === 'today') {
        const today = new Date().toISOString().split('T')[0];
        exportParams.timestamp__date = today;
      } else if (activeTab === 'flagged') {
        exportParams.action_type = 'flag_transaction';
      }

      await adminActionApi.downloadCSV(exportParams, filename);
    } catch (err) {
      setError('Failed to export actions');
      setTimeout(() => setError(null), 5000);
    } finally {
      setExportLoading(false);
    }
  }, [filters, activeTab]);

  const handleRefresh = useCallback(() => {
    fetchActions();
    fetchStats();
  }, [fetchActions]);

  // Memoized color functions
  const getActionTypeColor = useMemo(() => (actionType) => {
    if (actionType.includes('flag')) return 'bg-red-100 text-red-800';
    if (actionType.includes('change')) return 'bg-yellow-100 text-yellow-800';
    if (actionType.includes('set')) return 'bg-green-100 text-green-800';
    if (actionType.includes('verify')) return 'bg-blue-100 text-blue-800';
    if (actionType.includes('reject') || actionType.includes('revoke')) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  }, []);

  const getActionTypeIcon = useMemo(() => (actionType) => {
    if (actionType.includes('flag')) return <AlertTriangle className="h-4 w-4" />;
    if (actionType.includes('change')) return <RefreshCw className="h-4 w-4" />;
    if (actionType.includes('set')) return <CheckCircle className="h-4 w-4" />;
    if (actionType.includes('verify')) return <Shield className="h-4 w-4" />;
    if (actionType.includes('reject') || actionType.includes('revoke')) return <XCircle className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search actions"]');
        if (searchInput) {
          searchInput.focus();
        }
      }
      
      // Ctrl/Cmd + E to export
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        handleExport();
      }
      
      // Ctrl/Cmd + R to refresh
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        handleRefresh();
      }
      
      // Escape to clear selection or close modal
      if (e.key === 'Escape') {
        if (showActionModal) {
          setShowActionModal(false);
        } else if (selectedActions.length > 0 && !e.target.matches('input, textarea, select')) {
          setSelectedActions([]);
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleExport, handleRefresh, showActionModal, selectedActions.length]);

  if (loading && actions.length === 0) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Action Log</h1>
          <p className="text-gray-600">View and track all administrative actions</p>
        </div>
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow border">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-500">Loading actions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Action Log</h1>
            <p className="text-gray-600">View and track all administrative actions</p>
          </div>
          <div className="text-xs text-gray-500 text-right">
            <p>Shortcuts: Ctrl+K (search), Ctrl+R (refresh), Esc (clear)</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <Database className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Actions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.statistics?.total || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Today</p>
              <p className="text-2xl font-bold text-gray-900">{stats.statistics?.today || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">This Week</p>
              <p className="text-2xl font-bold text-gray-900">{stats.statistics?.week || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">This Month</p>
              <p className="text-2xl font-bold text-gray-900">{stats.statistics?.month || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'all', name: 'All Actions', icon: Database },
              { id: 'today', name: "Today's Actions", icon: Calendar },
              { id: 'flagged', name: 'Flagged Transactions', icon: AlertTriangle },
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

      {/* Filters and Export */}
      <div className="bg-white p-4 rounded-lg shadow border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="relative col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search actions... (Ctrl+K)"
              className="pl-10 pr-10 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.target.blur();
                }
              }}
            />
            {filters.search && (
              <button
                onClick={() => handleFilterChange('search', '')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.action_type}
            onChange={(e) => handleFilterChange('action_type', e.target.value)}
          >
            <option value="">All Action Types</option>
            {filterOptions.action_types && Array.isArray(filterOptions.action_types) && 
              filterOptions.action_types.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))
            }
          </select>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.target_model}
            onChange={(e) => handleFilterChange('target_model', e.target.value)}
          >
            <option value="">All Target Models</option>
            {filterOptions.target_models && Array.isArray(filterOptions.target_models) &&
              filterOptions.target_models.map((model) => (
                <option key={model} value={model}>{model}</option>
              ))
            }
          </select>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.admin_user}
            onChange={(e) => handleFilterChange('admin_user', e.target.value)}
          >
            <option value="">All Admin Users</option>
            {filterOptions.admin_users && Array.isArray(filterOptions.admin_users) &&
              filterOptions.admin_users.map((user) => (
                <option key={user.admin_user__id} value={user.admin_user__id}>
                  {user.admin_user__username}
                </option>
              ))
            }
          </select>
          <input
            type="datetime-local"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.timestamp__gte}
            onChange={(e) => handleFilterChange('timestamp__gte', e.target.value)}
            placeholder="From date"
          />
          <input
            type="datetime-local"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.timestamp__lte}
            onChange={(e) => handleFilterChange('timestamp__lte', e.target.value)}
            placeholder="To date"
          />
        </div>
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1" />
              )}
              Refresh
            </button>
            {/* <button
              onClick={handleExport}
              disabled={exportLoading || actions.length === 0}
              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm"
            >
              {exportLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Download className="h-4 w-4 mr-1" />
              )}
              Export CSV (Ctrl+E)
            </button> */}
          </div>
          {Object.values(filters).some(v => v && v !== '-timestamp') && (
            <button
              onClick={() => {
                setFilters({
                  search: '',
                  action_type: '',
                  target_model: '',
                  admin_user: '',
                  timestamp__gte: '',
                  timestamp__lte: '',
                  ordering: '-timestamp'
                });
                setCurrentPage(1);
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Actions Table */}
      <div className="bg-white rounded-lg shadow border overflow-hidden relative">
        {loading && actions.length > 0 && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <span className="text-sm text-gray-600">Updating...</span>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admin User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {actions.length === 0 && !loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <Shield className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No actions found</h3>
                      <p className="text-gray-500">
                        {Object.values(filters).some(v => v && v !== '-timestamp') || activeTab !== 'all'
                          ? 'Try adjusting your filters or changing tabs to see more results.'
                          : 'No admin actions have been recorded yet.'
                        }
                      </p>
                      {(Object.values(filters).some(v => v && v !== '-timestamp') || activeTab !== 'all') && (
                        <button
                          onClick={() => {
                            setFilters({
                              search: '',
                              action_type: '',
                              target_model: '',
                              admin_user: '',
                              timestamp__gte: '',
                              timestamp__lte: '',
                              ordering: '-timestamp'
                            });
                            setActiveTab('all');
                            setCurrentPage(1);
                          }}
                          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                actions.map((action) => (
                  <tr key={action.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      #{action.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{action.admin_user_username}</div>
                          <div className="text-xs text-gray-500">{action.admin_user_email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getActionTypeColor(action.action_type)}`}>
                        {getActionTypeIcon(action.action_type)}
                        <span className="ml-1">{action.action_type}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{action.target_model}</div>
                      {action.target_id && (
                        <div className="text-xs text-gray-500">ID: {action.target_id}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
                      <div className="truncate" title={action.description}>
                        {action.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div>{new Date(action.timestamp).toLocaleDateString()}</div>
                      <div className="text-xs">{new Date(action.timestamp).toLocaleTimeString()}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <button
                        onClick={() => openActionDetails(action)}
                        disabled={actionLoading[`details_${action.id}`]}
                        className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="View Details"
                      >
                        {actionLoading[`details_${action.id}`] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
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
                Showing <span className="font-medium">{((currentPage - 1) * 50) + 1}</span> to{' '}
                <span className="font-medium">{Math.min(currentPage * 50, totalCount)}</span> of{' '}
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
      </div>

      {/* Action Details Modal */}
      {showActionModal && selectedAction && (
        <ActionDetailsModal
          action={selectedAction}
          onClose={() => setShowActionModal(false)}
        />
      )}
    </div>
  );
};

// Action Details Modal Component
const ActionDetailsModal = React.memo(({ action, onClose }) => {
  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const getActionTypeColor = (actionType) => {
    if (actionType.includes('flag')) return 'bg-red-100 text-red-800';
    if (actionType.includes('change')) return 'bg-yellow-100 text-yellow-800';
    if (actionType.includes('set')) return 'bg-green-100 text-green-800';
    if (actionType.includes('verify')) return 'bg-blue-100 text-blue-800';
    if (actionType.includes('reject') || actionType.includes('revoke')) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Action Details #{action.id}</h3>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              aria-label="Close modal"
            >
              ×
            </button>
          </div>
          
          {/* Action Information */}
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-md font-medium text-gray-900 mb-3">Basic Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Action ID</label>
                  <p className="mt-1 text-sm text-gray-900">#{action.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Timestamp</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(action.timestamp).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Admin User</label>
                  <p className="mt-1 text-sm text-gray-900">
                    <strong>{action.admin_user_username}</strong>
                  </p>
                  <p className="text-xs text-gray-500">{action.admin_user_email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Action Type</label>
                  <span className={`inline-flex mt-1 px-2 py-1 text-xs font-semibold rounded-full ${getActionTypeColor(action.action_type)}`}>
                    {action.action_type}
                  </span>
                </div>
              </div>
            </div>

            {/* Target Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-md font-medium text-gray-900 mb-3">Target Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Target Model</label>
                  <p className="mt-1 text-sm text-gray-900">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {action.target_model}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Target ID</label>
                  <p className="mt-1 text-sm text-gray-900">{action.target_id || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-md font-medium text-gray-900 mb-3">Description</h4>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{action.description}</p>
            </div>

            {/* Metadata */}
            {action.metadata && Object.keys(action.metadata).length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-md font-medium text-gray-900 mb-3">Metadata</h4>
                <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">
                  {JSON.stringify(action.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Close Button */}
          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              autoFocus
            >
              Close (Esc)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default AdminActionManagement;