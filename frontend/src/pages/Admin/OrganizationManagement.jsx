import React, { useState, useEffect } from 'react';
import { 
  Building2, Search, Filter, Eye, CheckCircle, XCircle, AlertTriangle,
  CreditCard, TrendingUp, Users, DollarSign, FileText, Clock,
  Shield, ShieldCheck, ShieldX, MoreHorizontal
} from 'lucide-react';
import { organizationApi } from '../../api/endpoints/OrganizationAdminAPI';

const OrganizationManagement = () => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrgs, setSelectedOrgs] = useState([]);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [stats, setStats] = useState({});
  const [activeTab, setActiveTab] = useState('all'); // all, verification, verified

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    is_verified: '',
    has_documents: '',
    verification_status: '',
    created_after: '',
    created_before: ''
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchOrganizations();
    fetchStats();
  }, [currentPage, filters, activeTab]);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      let params = {
        page: currentPage,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      };

      // Handle different tabs
      if (activeTab === 'verification') {
        params.is_verified = 'false';
        params.has_documents = 'true';
      } else if (activeTab === 'verified') {
        params.is_verified = 'true';
      }

      const response = await organizationApi.getOrganizations(params);
      setOrganizations(response.results || response);
      setTotalPages(Math.ceil(response.count / 20) || 1);
      setTotalCount(response.count || response.length);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await organizationApi.getOrganizationStats();
      console.log('Fetched stats:', statsData);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleOrgSelect = (orgId) => {
    setSelectedOrgs(prev => 
      prev.includes(orgId) 
        ? prev.filter(id => id !== orgId)
        : [...prev, orgId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrgs.length === organizations.length) {
      setSelectedOrgs([]);
    } else {
      setSelectedOrgs(organizations.map(org => org.id));
    }
  };

  const handleVerifyOrganization = async (orgId, notes = '') => {
    try {
      await organizationApi.verifyOrganization(orgId, notes);
      fetchOrganizations();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRejectVerification = async (orgId, reason) => {
    try {
      await organizationApi.rejectVerification(orgId, reason);
      fetchOrganizations();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRevokeVerification = async (orgId, reason) => {
    try {
      await organizationApi.revokeVerification(orgId, reason);
      fetchOrganizations();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleBulkVerify = async () => {
    try {
      await organizationApi.bulkVerify(selectedOrgs);
      setSelectedOrgs([]);
      fetchOrganizations();
    } catch (err) {
      setError(err.message);
    }
  };

  const openOrgDetails = async (org) => {
    try {
      const [orgDetails, campaigns, analytics] = await Promise.all([
        organizationApi.getOrganization(org.id),
        organizationApi.getOrganizationCampaigns(org.id),
        organizationApi.getFinancialAnalytics(org.id)
      ]);
      
      setSelectedOrg({ 
        ...org, 
        details: orgDetails,
        campaigns: campaigns.campaigns || [],
        analytics
      });
      setShowOrgModal(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const getVerificationStatusColor = (status) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'pending_review': return 'bg-yellow-100 text-yellow-800';
      case 'incomplete': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getHealthColor = (health) => {
    switch (health) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Organization Management</h1>
        <p className="text-gray-600">Manage and verify platform organizations</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Organizations</p>
              <p className="text-2xl font-bold text-gray-900">{stats.overview?.total_organizations || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <ShieldCheck className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Verified</p>
              <p className="text-2xl font-bold text-gray-900">{stats.overview?.verified_organizations || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Pending Review</p>
              <p className="text-2xl font-bold text-gray-900">{stats.overview?.pending_verification || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Raised</p>
              <p className="text-2xl font-bold text-gray-900">{stats.fundraising?.total_raised || '0'} MRU</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'all', name: 'All Organizations', icon: Building2 },
              { id: 'verification', name: 'Pending Verification', icon: Clock },
              { id: 'verified', name: 'Verified', icon: ShieldCheck },
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

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search organizations..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.is_verified}
            onChange={(e) => handleFilterChange('is_verified', e.target.value)}
          >
            <option value="">All Status</option>
            <option value="true">Verified</option>
            <option value="false">Unverified</option>
          </select>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.has_documents}
            onChange={(e) => handleFilterChange('has_documents', e.target.value)}
          >
            <option value="">All Documents</option>
            <option value="true">With Documents</option>
            <option value="false">Without Documents</option>
          </select>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.verification_status}
            onChange={(e) => handleFilterChange('verification_status', e.target.value)}
          >
            <option value="">All Verification</option>
            <option value="verified">Verified</option>
            <option value="pending_review">Pending Review</option>
            <option value="incomplete">Incomplete</option>
          </select>
          <input
            type="date"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.created_after}
            onChange={(e) => handleFilterChange('created_after', e.target.value)}
            placeholder="Created after"
          />
          <input
            type="date"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.created_before}
            onChange={(e) => handleFilterChange('created_before', e.target.value)}
            placeholder="Created before"
          />
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedOrgs.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800">
              {selectedOrgs.length} organization{selectedOrgs.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={handleBulkVerify}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                Bulk Verify
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

      {/* Organizations Table */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedOrgs.length === organizations.length && organizations.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Health
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Financial
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {organizations.map((org) => (
                <tr key={org.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedOrgs.includes(org.id)}
                      onChange={() => handleOrgSelect(org.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{org.org_name}</div>
                        <div className="text-sm text-gray-500">{org.owner_email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getVerificationStatusColor(org.verification_status)}`}>
                      {org.is_verified ? 'Verified' : 'Unverified'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getHealthColor(org.account_health)}`}>
                      {org.account_health}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>Campaigns: {org.campaign_count || 0}</div>
                    <div>Donors: {org.total_donors || 0}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>Raised: {org.total_raised || 0} MRU</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(org.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openOrgDetails(org)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {!org.is_verified && org.verification_status === 'pending_review' && (
                        <>
                          <button
                            onClick={() => handleVerifyOrganization(org.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Verify"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleRejectVerification(org.id, 'Incomplete documentation')}
                            className="text-red-600 hover:text-red-900"
                            title="Reject"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      {org.is_verified && (
                        <button
                          onClick={() => handleRevokeVerification(org.id, 'Manual review required')}
                          className="text-orange-600 hover:text-orange-900"
                          title="Revoke Verification"
                        >
                          <ShieldX className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
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

      {/* Organization Details Modal */}
      {showOrgModal && selectedOrg && (
        <OrganizationDetailsModal
          organization={selectedOrg}
          onClose={() => setShowOrgModal(false)}
          onUpdate={() => {
            fetchOrganizations();
            setShowOrgModal(false);
          }}
          onVerify={handleVerifyOrganization}
          onReject={handleRejectVerification}
          onRevoke={handleRevokeVerification}
        />
      )}
    </div>
  );
};

// Organization Details Modal Component
const OrganizationDetailsModal = ({ organization, onClose, onUpdate, onVerify, onReject, onRevoke }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [actionReason, setActionReason] = useState('');
  const [showActionModal, setShowActionModal] = useState(null);


    const getVerificationStatusColor = (status) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'pending_review': return 'bg-yellow-100 text-yellow-800';
      case 'incomplete': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

    const getHealthColor = (health) => {
    switch (health) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAction = async (action) => {
    try {
      switch (action) {
        case 'verify':
          await onVerify(organization.id, actionReason);
          break;
        case 'reject':
          await onReject(organization.id, actionReason);
          break;
        case 'revoke':
          await onRevoke(organization.id, actionReason);
          break;
      }
      setShowActionModal(null);
      setActionReason('');
      onUpdate();
    } catch (err) {
      console.error('Action failed:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Organization Details</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
          </div>
          
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-4">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'profile', name: 'Profile', icon: Building2 },
                { id: 'financial', name: 'Financial', icon: DollarSign },
                { id: 'campaigns', name: 'Campaigns', icon: Users },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mb-6">
            {activeTab === 'profile' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Organization Name</label>
                    <p className="mt-1 text-sm text-gray-900">{organization.org_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Owner</label>
                    <p className="mt-1 text-sm text-gray-900">{organization.owner_full_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{organization.owner_email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Verification Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getVerificationStatusColor(organization.verification_status)}`}>
                      {organization.is_verified ? 'Verified' : 'Unverified'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <p className="mt-1 text-sm text-gray-900">{organization.address || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="mt-1 text-sm text-gray-900">{organization.phone_number || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Website</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {organization.website ? (
                        <a href={organization.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {organization.website}
                        </a>
                      ) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Account Health</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getHealthColor(organization.account_health)}`}>
                      {organization.account_health}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="mt-1 text-sm text-gray-900">{organization.description || 'No description provided'}</p>
                </div>
              </div>
            )}

            {activeTab === 'financial' && organization.analytics && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-blue-800">{organization.campaign_count || 0}</h4>
                    <p className="text-sm text-blue-600">Total Campaigns</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-green-800">{organization.total_raised || 0} MRU</h4>
                    <p className="text-sm text-green-600">Total Raised</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-purple-800">{organization.total_donors || 0}</h4>
                    <p className="text-sm text-purple-600">Total Donors</p>
                  </div>
                </div>
                {organization.analytics.financial_summary && (
                  <div className="border-t pt-4">
                    <h4 className="text-md font-medium text-gray-900 mb-2">Financial Summary</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Active Campaigns:</p>
                        <p className="font-medium">{organization.analytics.financial_summary.active_campaigns}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Donations Last 30 Days:</p>
                        <p className="font-medium">{organization.analytics.financial_summary.donations_last_30_days}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Amount Raised Last 30 Days:</p>
                        <p className="font-medium">{organization.analytics.financial_summary.amount_raised_last_30_days} MRU</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Average Donation:</p>
                        <p className="font-medium">{organization.analytics.financial_summary.average_donation} MRU</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'campaigns' && (
              <div className="space-y-4">
                {organization.campaigns && organization.campaigns.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Campaign</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Target</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Raised</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Success Rate</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {organization.campaigns.map((campaign) => (
                          <tr key={campaign.id}>
                            <td className="px-4 py-2 text-sm text-gray-900">{campaign.name}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{campaign.target} MRU</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{campaign.current_amount} MRU</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{campaign.success_rate}%</td>
                            <td className="px-4 py-2">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                campaign.featured ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {campaign.featured ? 'Featured' : 'Regular'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500">No campaigns found</p>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between mt-6">
            <div className="flex space-x-3">
              {!organization.is_verified && organization.verification_status === 'pending_review' && (
                <>
                  <button
                    onClick={() => setShowActionModal('verify')}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Verify Organization
                  </button>
                  <button
                    onClick={() => setShowActionModal('reject')}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Reject Verification
                  </button>
                </>
              )}
              {organization.is_verified && (
                <button
                  onClick={() => setShowActionModal('revoke')}
                  className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                >
                  Revoke Verification
                </button>
              )}
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

      {/* Action Confirmation Modal */}
      {showActionModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h4 className="text-lg font-medium text-gray-900 mb-4">
              {showActionModal === 'verify' && 'Verify Organization'}
              {showActionModal === 'reject' && 'Reject Verification'}
              {showActionModal === 'revoke' && 'Revoke Verification'}
            </h4>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {showActionModal === 'verify' ? 'Notes (optional)' : 'Reason (required)'}
              </label>
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder={
                  showActionModal === 'verify' 
                    ? 'Add verification notes...' 
                    : 'Please provide a reason...'
                }
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowActionModal(null);
                  setActionReason('');
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction(showActionModal)}
                disabled={showActionModal !== 'verify' && !actionReason.trim()}
                className={`px-4 py-2 text-white rounded disabled:opacity-50 ${
                  showActionModal === 'verify' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : showActionModal === 'reject'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationManagement;