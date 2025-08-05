import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Search, 
  Calendar, 
  Clock, 
  Building, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Star,
  MessageSquare,
  Check,
  X,
  Eye,
  Users,
  ExternalLink,
  Bell
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Loading from '../../components/common/Loading';
import volunteerRequestApi from '../../api/endpoints/VolunteerRequestAPI';
import InvitationCard from '../../components/ui/InvitationCard';

const VolunteerInvitations = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [responding, setResponding] = useState(null);
  const [selectedInvitation, setSelectedInvitation] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [responseModal, setResponseModal] = useState({ show: false, type: null });
  const [responseMessage, setResponseMessage] = useState('');

  // Format numbers - always use Latin numerals even for Arabic
  const formatNumber = (num) => {
    const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';
    return new Intl.NumberFormat(locale).format(num || 0);
  };

  useEffect(() => {
    const fetchInvitations = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await volunteerRequestApi.fetchMyInvitations();
        setInvitations(response.invitations || []);
      } catch (err) {
        console.error('Failed to fetch invitations:', err);
        setError(err.message || t('volunteerInvitations.errors.failedToLoad'));
      } finally {
        setLoading(false);
      }
    };

    fetchInvitations();
  }, [t]);

  const handleResponse = async (invitationId, status) => {
    setResponding(invitationId);
    setError(null);

    try {
      await volunteerRequestApi.respondToInvitation(invitationId, { 
        status,
        response_message: responseMessage 
      });
      
      setInvitations(prev => 
        prev.map(inv => 
          inv.id === invitationId 
            ? { ...inv, status, response_message: responseMessage, responded_at: new Date().toISOString() }
            : inv
        )
      );

      setResponseModal({ show: false, type: null });
      setResponseMessage('');
      setSelectedInvitation(null);
    } catch (err) {
      console.error('Failed to respond to invitation:', err);
      setError(err.message || t('volunteerInvitations.errors.failedToRespond'));
    } finally {
      setResponding(null);
    }
  };

  // Filter invitations
  const filteredInvitations = invitations.filter(invitation => {
    const matchesSearch = invitation.request_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invitation.organization_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invitation.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'declined': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'expired': return <AlertCircle className="w-5 h-5 text-gray-600" />;
      default: return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-indigo-50 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-indigo-50 py-8 px-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header with stats */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className={`text-2xl font-bold text-gray-900 flex items-center gap-2 ${isRTL ? '' : ''}`}>
                <Bell className="w-7 h-7 text-blue-600" />
                {t('volunteerInvitations.title')}
              </h1>
              <p className="text-gray-600 mt-1">{t('volunteerInvitations.subtitle')}</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{formatNumber(invitations.length)}</div>
              <div className="text-sm text-gray-600">{t('volunteerInvitations.stats.total')}</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {formatNumber(invitations.filter(inv => inv.status === 'pending').length)}
              </div>
              <div className="text-sm text-gray-600">{t('volunteerInvitations.stats.pending')}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatNumber(invitations.filter(inv => inv.status === 'accepted').length)}
              </div>
              <div className="text-sm text-gray-600">{t('volunteerInvitations.stats.accepted')}</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {formatNumber(invitations.filter(inv => inv.status === 'declined').length)}
              </div>
              <div className="text-sm text-gray-600">{t('volunteerInvitations.stats.declined')}</div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <div className={`flex justify-between items-center ${isRTL ? '' : ''}`}>
              <span className="text-sm">{error}</span>
              <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">×</button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className={`flex flex-col sm:flex-row gap-4 ${isRTL ? '' : ''}`}>
            <div className="flex-1 relative">
              <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={t('volunteerInvitations.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full ps-10 pe-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">{t('volunteerInvitations.filters.allStatus')}</option>
              <option value="pending">{t('volunteerInvitations.filters.pending')}</option>
              <option value="accepted">{t('volunteerInvitations.filters.accepted')}</option>
              <option value="declined">{t('volunteerInvitations.filters.declined')}</option>
              <option value="expired">{t('volunteerInvitations.filters.expired')}</option>
            </select>
          </div>
        </div>

        {/* Invitations List */}
        <div className="space-y-4 grid grid-cols-1 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-2 gap-2">
          {filteredInvitations.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {invitations.length === 0 ? t('volunteerInvitations.empty.noInvitationsTitle') : t('volunteerInvitations.empty.noMatchTitle')}
              </h3>
              <p className="text-gray-600">
                {invitations.length === 0 
                  ? t('volunteerInvitations.empty.noInvitationsText')
                  : t('volunteerInvitations.empty.noMatchText')
                }
              </p>
            </div>
          ) : (
          filteredInvitations.map((invitation) => (
            <InvitationCard 
              key={invitation.id} 
              invitation={invitation} 
              onRespond={handleResponse} 
              responding={responding} 
            />
          ))  
          )}
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedInvitation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" dir={isRTL ? 'rtl' : 'ltr'}>
              <div className="p-6">
                <div className={`flex items-start justify-between mb-4 ${isRTL ? '' : ''}`}>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      {selectedInvitation.request_title}
                    </h2>
                    <div className={`flex items-center text-gray-600 mb-2 ${isRTL ? '' : ''}`}>
                      <Building className="w-4 h-4 me-2" />
                      <span>{selectedInvitation.organization_name}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-gray-400 hover:text-gray-600 text-xl"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">{t('volunteerInvitations.modal.description')}</h3>
                    <p className="text-gray-600">{selectedInvitation.request_description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">{t('volunteerInvitations.modal.eventDate')}</h3>
                      <p className="text-gray-600">{formatDateTime(selectedInvitation.event_date)}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">{t('volunteerInvitations.modal.duration')}</h3>
                      <p className="text-gray-600">{t('volunteerInvitations.modal.durationHours', { hours: formatNumber(selectedInvitation.duration_hours) })}</p>
                    </div>
                  </div>

                  {selectedInvitation.message && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">{t('volunteerInvitations.modal.personalMessage')}</h3>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-blue-800">{selectedInvitation.message}</p>
                      </div>
                    </div>
                  )}

                  {selectedInvitation.status === 'pending' && (
                    <div className={`flex space-x-3 pt-4 ${isRTL ? '' : ''}`}>
                      <button
                        onClick={() => {
                          setShowDetailModal(false);
                          setResponseModal({ show: true, type: 'declined' });
                        }}
                        className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        {t('volunteerInvitations.actions.decline')}
                      </button>
                      <button
                        onClick={() => {
                          setShowDetailModal(false);
                          setResponseModal({ show: true, type: 'accepted' });
                        }}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        {t('volunteerInvitations.actions.accept')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Response Modal */}
        {responseModal.show && selectedInvitation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full shadow-2xl" dir={isRTL ? 'rtl' : 'ltr'}>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {responseModal.type === 'accepted' 
                    ? t('volunteerInvitations.responseModal.acceptTitle') 
                    : t('volunteerInvitations.responseModal.declineTitle')
                  }
                </h3>

                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="font-medium text-gray-900">{selectedInvitation.request_title}</p>
                  <p className="text-sm text-gray-600">{selectedInvitation.organization_name}</p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {responseModal.type === 'accepted' 
                      ? t('volunteerInvitations.responseModal.messageLabel') 
                      : t('volunteerInvitations.responseModal.reasonLabel')
                    }
                  </label>
                  <textarea
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    placeholder={responseModal.type === 'accepted' 
                      ? t('volunteerInvitations.responseModal.messagePlaceholder')
                      : t('volunteerInvitations.responseModal.reasonPlaceholder')
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    maxLength={500}
                  />
                </div>

                <div className={`flex space-x-3 ${isRTL ? 'space-x-reverse flex-row-reverse' : ''}`}>
                  <button
                    onClick={() => {
                      setResponseModal({ show: false, type: null });
                      setResponseMessage('');
                      setSelectedInvitation(null);
                    }}
                    disabled={responding}
                    className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {t('volunteerInvitations.actions.cancel')}
                  </button>
                  <button
                    onClick={() => handleResponse(selectedInvitation.id, responseModal.type)}
                    disabled={responding}
                    className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${
                      responseModal.type === 'accepted' 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {responding 
                      ? t('volunteerInvitations.actions.processing') 
                      : (responseModal.type === 'accepted' 
                          ? t('volunteerInvitations.actions.accept') 
                          : t('volunteerInvitations.actions.decline')
                        )
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VolunteerInvitations;