import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users, Search, Filter, MoreHorizontal, Eye, Edit, Trash2,
  UserCheck, UserX, Settings, Activity, TrendingUp, AlertTriangle, Loader2
} from 'lucide-react';
import { userApi } from '../../api/endpoints/UserAdminAPI';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [stats, setStats] = useState({});

  // Loading states for individual actions
  const [actionLoading, setActionLoading] = useState({});
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    is_active: '',
    has_organization_profile: '',
    date_joined_after: '',
    date_joined_before: ''
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
      fetchUsers();
    }, filters.search ? 500 : 0); // 500ms debounce for search, immediate for other filters

    setSearchDebounceTimer(timer);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [currentPage, filters]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.id));
    }
  }, [selectedUsers.length, users]);
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search users"]');
        if (searchInput) {
          searchInput.focus();
        }
      }

      // Ctrl/Cmd + A to select all visible users
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !e.target.matches('input, textarea, select')) {
        e.preventDefault();
        handleSelectAll();
      }

      // Escape to clear selection
      if (e.key === 'Escape' && selectedUsers.length > 0 && !e.target.matches('input, textarea, select')) {
        setSelectedUsers([]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleSelectAll, selectedUsers.length]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: currentPage,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      };
      const response = await userApi.getUsers(params);
      setUsers(response.results || response);
      console.log('Fetched users:', response);
      setTotalPages(Math.ceil(response.count / 20) || 1);
      setTotalCount(response.count || response.length);
    } catch (err) {
      setError(err.message);
      // Auto-dismiss error after 5 seconds
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  const fetchStats = async () => {
    try {
      const statsData = await userApi.getUserStats();
      console.log('Fetched user stats:', statsData);

      setStats(statsData);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  }, []);

  const handleUserSelect = useCallback((userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  }, []);



  const handleToggleActive = useCallback(async (userId) => {
    if (!window.confirm('Are you sure you want to change this user\'s status?')) {
      return;
    }

    try {
      setActionLoading(prev => ({ ...prev, [`toggle_${userId}`]: true }));

      // Optimistic update
      setUsers(prev => prev.map(user =>
        user.id === userId
          ? { ...user, is_active: !user.is_active }
          : user
      ));

      await userApi.toggleUserActive(userId);
    } catch (err) {
      setError(err.message);
      // Revert optimistic update on error
      fetchUsers();
      setTimeout(() => setError(null), 5000);
    } finally {
      setActionLoading(prev => ({ ...prev, [`toggle_${userId}`]: false }));
    }
  }, [fetchUsers]);

  const handleRoleChange = useCallback(async (userId, newRole, currentRole) => {
    if (newRole === currentRole) return;

    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return;
    }

    try {
      setActionLoading(prev => ({ ...prev, [`role_${userId}`]: true }));

      // Optimistic update
      setUsers(prev => prev.map(user =>
        user.id === userId
          ? { ...user, role: newRole }
          : user
      ));

      await userApi.changeUserRole(userId, newRole);
    } catch (err) {
      setError(err.message);
      // Revert optimistic update on error
      fetchUsers();
      setTimeout(() => setError(null), 5000);
    } finally {
      setActionLoading(prev => ({ ...prev, [`role_${userId}`]: false }));
    }
  }, [fetchUsers]);

  const handleBulkAction = useCallback(async (action) => {
    const actionText = action === 'activate' ? 'activate' : 'deactivate';
    if (!window.confirm(`Are you sure you want to ${actionText} ${selectedUsers.length} user(s)?`)) {
      return;
    }

    try {
      setBulkActionLoading(true);
      await userApi.bulkActions(action, selectedUsers);
      setSelectedUsers([]);
      fetchUsers();
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(null), 5000);
    } finally {
      setBulkActionLoading(false);
    }
  }, [selectedUsers, fetchUsers]);

  const openUserDetails = useCallback(async (user) => {
    try {
      setActionLoading(prev => ({ ...prev, [`details_${user.id}`]: true }));
      const userDetails = await userApi.getUserProfile(user.id);
      setSelectedUser({ ...user, details: userDetails });
      setShowUserModal(true);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(null), 5000);
    } finally {
      setActionLoading(prev => ({ ...prev, [`details_${user.id}`]: false }));
    }
  }, []);

  // Memoized color functions
  const getRoleColor = useMemo(() => (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'organization': return 'bg-blue-100 text-blue-800';
      case 'user': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const getStatusColor = useMemo(() => (isActive) => {
    return isActive
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  }, []);

  if (loading && users.length === 0) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">User Management</h1>
          <p className="text-gray-600">Manage and monitor all platform users</p>
        </div>
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow border">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-500">Loading users...</p>
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">User Management</h1>
            <p className="text-gray-600">Manage and monitor all platform users</p>
          </div>
          <div className="text-xs text-gray-500 text-right">
            <p>Shortcuts: Ctrl+K (search), Ctrl+A (select all), Esc (clear)</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_users || totalCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <UserCheck className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active_users || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Organizations</p>
              <p className="text-2xl font-bold text-gray-900">{stats.organizations?.total || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-orange-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">New This Week</p>
              <p className="text-2xl font-bold text-gray-900">{stats.new_users_this_week || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search users... (Ctrl+K to focus)"
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
            value={filters.role}
            onChange={(e) => handleFilterChange('role', e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="organization">Organization</option>
            <option value="admin">Admin</option>
          </select>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.is_active}
            onChange={(e) => handleFilterChange('is_active', e.target.value)}
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.has_organization_profile}
            onChange={(e) => handleFilterChange('has_organization_profile', e.target.value)}
          >
            <option value="">All Users</option>
            <option value="true">With Organization</option>
            <option value="false">Without Organization</option>
          </select>
          <input
            type="date"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.date_joined_after}
            onChange={(e) => handleFilterChange('date_joined_after', e.target.value)}
            placeholder="Joined after"
          />
          <input
            type="date"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.date_joined_before}
            onChange={(e) => handleFilterChange('date_joined_before', e.target.value)}
            placeholder="Joined before"
          />
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800">
              {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction('activate')}
                disabled={bulkActionLoading}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {bulkActionLoading && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                Activate
              </button>
              <button
                onClick={() => handleBulkAction('deactivate')}
                disabled={bulkActionLoading}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {bulkActionLoading && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow border overflow-hidden relative">
        {loading && users.length > 0 && (
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
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === users.length && users.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length === 0 && !loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <Users className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                      <p className="text-gray-500">
                        {Object.values(filters).some(v => v)
                          ? 'Try adjusting your filters to see more results.'
                          : 'No users have been registered yet.'
                        }
                      </p>
                      {Object.values(filters).some(v => v) && (
                        <button
                          onClick={() => {
                            setFilters({
                              search: '',
                              role: '',
                              is_active: '',
                              has_organization_profile: '',
                              date_joined_after: '',
                              date_joined_before: ''
                            });
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
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleUserSelect(user.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {user.full_name?.charAt(0) || user.username?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.full_name || user.username}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.is_active)}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>Donations: {user.donation_count || 0}</div>
                      {user.role === 'organization' && (
                        <div>Campaigns: {user.campaign_count || 0}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(user.date_joined).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openUserDetails(user)}
                          disabled={actionLoading[`details_${user.id}`]}
                          className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="View Details"
                        >
                          {actionLoading[`details_${user.id}`] ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleToggleActive(user.id)}
                          disabled={actionLoading[`toggle_${user.id}`]}
                          className={`${user.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'} disabled:opacity-50 disabled:cursor-not-allowed`}
                          title={user.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {actionLoading[`toggle_${user.id}`] ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : user.is_active ? (
                            <UserX className="h-4 w-4" />
                          ) : (
                            <UserCheck className="h-4 w-4" />
                          )}
                        </button>
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value, user.role)}
                          disabled={actionLoading[`role_${user.id}`]}
                          className="text-xs border border-gray-300 rounded px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Change Role"
                        >
                          <option value="user">User</option>
                          <option value="organization">Organization</option>
                          <option value="admin">Admin</option>
                        </select>
                        {actionLoading[`role_${user.id}`] && (
                          <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                        )}
                      </div>
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
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => setShowUserModal(false)}
          onUpdate={() => {
            fetchUsers();
            setShowUserModal(false);
          }}
        />
      )}
    </div>
  );
};

// User Details Modal Component
const UserDetailsModal = React.memo(({ user, onClose, onUpdate }) => {
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
      <div className="relative mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">User Details</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              aria-label="Close modal"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <p className="mt-1 text-sm text-gray-900">{user.full_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-sm text-gray-900">{user.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <p className="mt-1 text-sm text-gray-900">{user.role}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <p className="mt-1 text-sm text-gray-900">{user.is_active ? 'Active' : 'Inactive'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Joined Date</label>
                <p className="mt-1 text-sm text-gray-900">{new Date(user.date_joined).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Login</label>
                <p className="mt-1 text-sm text-gray-900">
                  {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                </p>
              </div>
            </div>

            {/* Activity Summary */}
            <div className="border-t pt-4">
              <h4 className="text-md font-medium text-gray-900 mb-2">Activity Summary</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{user.donation_count || 0}</p>
                  <p className="text-sm text-gray-500">Donations</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{user.total_donated || 0}</p>
                  <p className="text-sm text-gray-500">Total Donated</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{user.campaign_count || 0}</p>
                  <p className="text-sm text-gray-500">Campaigns</p>
                </div>
              </div>
            </div>

            {/* Organization Profile */}
            {user.has_organization_profile && user.details?.organization_profile && (
              <div className="border-t pt-4">
                <h4 className="text-md font-medium text-gray-900 mb-2">Organization Profile</h4>
                <div className="bg-gray-50 p-3 rounded">
                  <p><strong>Organization:</strong> {user.details.organization_profile.org_name}</p>
                  <p><strong>Verified:</strong> {user.details.organization_profile.is_verified ? 'Yes' : 'No'}</p>
                  <p><strong>Address:</strong> {user.details.organization_profile.address}</p>
                  {user.details.organization_profile.website && (
                    <p><strong>Website:</strong> {user.details.organization_profile.website}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end mt-6 space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              autoFocus
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default UserManagement;