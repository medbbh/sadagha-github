import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Calendar, Clock, Star, Building, Users, ExternalLink } from 'lucide-react';

const InvitationCard = ({ invitation, onRespond, responding }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [isExpanded, setIsExpanded] = useState(false);

  // Format numbers - always use Latin numerals even for Arabic
  const formatNumber = (num) => {
    const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';
    return new Intl.NumberFormat(locale).format(num || 0);
  };


  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      'accepted': 'bg-green-100 text-green-700',
      'pending': 'bg-yellow-100 text-yellow-700',
      'declined': 'bg-red-100 text-red-700',
      'expired': 'bg-gray-100 text-gray-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'accepted': '✓',
      'pending': '⏳',
      'declined': '✕',
      'expired': '⏰'
    };
    return icons[status] || '•';
  };

  const formatStatus = (status) => {
    return t(`invitationCard.status.${status}`);
  };

  return (
    <div className="max-w-2xl mx-auto mb-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="p-6">
          <div className={`flex items-start justify-between ${isRTL ? '' : ''}`}>
            <div className={`flex-1 ${isRTL ? 'pl-6' : 'pr-6'}`}>
              <div className={`flex items-center gap-3 mb-3 ${isRTL ? '' : ''}`}>
                <h3 className="text-xl font-semibold text-gray-900">
                  {invitation.request_title}
                </h3>
                <div className={`flex items-center gap-2 text-sm text-gray-500 ${isRTL ? '' : ''}`}>
                  <Clock className="w-4 h-4" />
                  <span>{t('invitationCard.duration', { hours: formatNumber(invitation.duration_hours) })}</span>
                </div>
              </div>
              
              <p className="text-gray-600 mb-4 leading-relaxed line-clamp-2">
                {invitation.request_description}
              </p>
              
              <div className={`flex items-center gap-6 text-sm text-gray-500 ${isRTL ? '' : ''}`}>
                <div className={`flex items-center gap-1 ${isRTL ? '' : ''}`}>
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(invitation.event_date)}</span>
                </div>
                <div className={`flex items-center gap-1 ${isRTL ? '' : ''}`}>
                  <span className="text-gray-400">{t('invitationCard.invited')}:</span>
                  <span>{formatDate(invitation.invited_at)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-3">
              <div className="flex flex-col items-end gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(invitation.status)}`}>
                  {getStatusIcon(invitation.status)} {formatStatus(invitation.status)}
                </span>
                <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-medium">
                  <Star className="w-3 h-3 inline mr-1" />
                  {t('invitationCard.matchScore', { score: formatNumber(invitation.match_score) })}
                </span>
              </div>
              
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors ${isRTL ? '' : ''}`}
              >
                {t('invitationCard.viewDetails')}
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="border-t border-gray-100 p-6 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className={`font-semibold text-gray-900 mb-2 flex items-center gap-2 ${isRTL ? '' : ''}`}>
                    <Calendar className="w-4 h-4 text-blue-600" />
                    {t('invitationCard.eventDetails')}
                  </h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className={`flex justify-between ${isRTL ? '' : ''}`}>
                      <span>{t('invitationCard.startDate')}:</span>
                      <span className="font-medium">{formatDate(invitation.event_date)}</span>
                    </div>
                    {invitation.event_end_date && (
                      <div className={`flex justify-between ${isRTL ? '' : ''}`}>
                        <span>{t('invitationCard.endDate')}:</span>
                        <span className="font-medium">{formatDate(invitation.event_end_date)}</span>
                      </div>
                    )}
                    <div className={`flex justify-between ${isRTL ? '' : ''}`}>
                      <span>{t('invitationCard.durationLabel')}:</span>
                      <span className="font-medium">{t('invitationCard.duration', { hours: formatNumber(invitation.duration_hours) })}</span>
                    </div>
                    <div className={`flex justify-between ${isRTL ? '' : ''}`}>
                      <span>{t('invitationCard.expires')}:</span>
                      <span className="font-medium text-orange-600">{formatDate(invitation.expires_at)}</span>
                    </div>
                  </div>
                </div>

                {invitation.organization_name && (
                  <div>
                    <h4 className={`font-semibold text-gray-900 mb-2 flex items-center gap-2 ${isRTL ? '' : ''}`}>
                      <Building className="w-4 h-4 text-blue-600" />
                      {t('invitationCard.organization')}
                    </h4>
                    <p className="text-sm text-gray-600">{invitation.organization_name}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className={`font-semibold text-gray-900 mb-2 flex items-center gap-2 ${isRTL ? '' : ''}`}>
                    <Users className="w-4 h-4 text-blue-600" />
                    {t('invitationCard.invitationStatus')}
                  </h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className={`flex justify-between ${isRTL ? '' : ''}`}>
                      <span>{t('invitationCard.statusLabel')}:</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(invitation.status)}`}>
                        {formatStatus(invitation.status)}
                      </span>
                    </div>
                    <div className={`flex justify-between ${isRTL ? '' : ''}`}>
                      <span>{t('invitationCard.matchScoreLabel')}:</span>
                      <span className="font-medium text-blue-600">{formatNumber(invitation.match_score)}%</span>
                    </div>
                    {invitation.responded_at && (
                      <div className={`flex justify-between ${isRTL ? '' : ''}`}>
                        <span>{t('invitationCard.responded')}:</span>
                        <span className="font-medium">{formatDate(invitation.responded_at)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {(invitation.message || invitation.response_message) && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">{t('invitationCard.messages')}</h4>
                    <div className="space-y-2">
                      {invitation.message && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-xs text-blue-600 font-medium mb-1">{t('invitationCard.organizationMessage')}:</p>
                          <p className="text-sm text-gray-700">{invitation.message}</p>
                        </div>
                      )}
                      {invitation.response_message && (
                        <div className="bg-green-50 p-3 rounded-lg">
                          <p className="text-xs text-green-600 font-medium mb-1">{t('invitationCard.yourResponse')}:</p>
                          <p className="text-sm text-gray-700">{invitation.response_message}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {invitation.campaign_id && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <a href={`/campaign/${invitation.campaign_id}`}
                  className={`inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors ${isRTL ? '' : ''}`}
                >
                  <ExternalLink className="w-4 h-4" />
                  {t('invitationCard.viewRelatedCampaign')}
                </a>
              </div>
            )}

            {invitation.status === 'pending' && (
              <div className={`mt-6 pt-4 border-t border-gray-200 flex gap-3 ${isRTL ? '' : ''}`}>
                <button
                  onClick={() => onRespond(invitation.id, 'accepted')}
                  disabled={responding === invitation.id}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                >
                  {t('invitationCard.acceptInvitation')}
                </button>
                <button
                  onClick={() => onRespond(invitation.id, 'declined')}
                  disabled={responding === invitation.id}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                >
                  {t('invitationCard.declineInvitation')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvitationCard;