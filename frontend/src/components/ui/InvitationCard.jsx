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
    <div className="w-full max-w-4xl mx-auto mb-4 px-4 sm:px-0" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
        
        {/* Mobile Layout */}
        <div className="block md:hidden">
          <div className="p-4">
            {/* Mobile Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0 pr-3">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2">
                  {invitation.request_title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span>{t('invitationCard.duration', { hours: formatNumber(invitation.duration_hours) })}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invitation.status)}`}>
                  {getStatusIcon(invitation.status)} {formatStatus(invitation.status)}
                </span>
                <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium">
                  <Star className="w-3 h-3 inline mr-1" />
                  {formatNumber(invitation.match_score)}%
                </span>
              </div>
            </div>

            {/* Mobile Description */}
            <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-3">
              {invitation.request_description}
            </p>

            {/* Mobile Date Info */}
            <div className="space-y-1 text-xs text-gray-500 mb-3">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 flex-shrink-0" />
                <span>{formatDate(invitation.event_date)}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-400">{t('invitationCard.invited')}:</span>
                <span>{formatDate(invitation.invited_at)}</span>
              </div>
            </div>

            {/* Mobile View Details Button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center justify-center gap-2 py-2 text-blue-600 hover:text-blue-700 text-sm font-medium border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
            >
              {t('invitationCard.viewDetails')}
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:block">
          <div className="p-6 h-48 flex flex-col">
            <div className="flex items-start justify-between h-full">
              <div className={`flex-1 ${isRTL ? 'pl-6' : 'pr-6'} flex flex-col h-full`}>
                {/* Desktop Header Section */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-1 mb-1">
                      {invitation.request_title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      <span>{t('invitationCard.duration', { hours: formatNumber(invitation.duration_hours) })}</span>
                    </div>
                  </div>
                </div>
                
                {/* Desktop Description */}
                <div className="flex-1 mb-4 overflow-hidden">
                  <p className="text-gray-600 leading-relaxed line-clamp-3 text-sm">
                    {invitation.request_description}
                  </p>
                </div>
                
                {/* Desktop Date Info */}
                <div className="flex items-center gap-4 text-xs text-gray-500 mt-auto">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{formatDate(invitation.event_date)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">{t('invitationCard.invited')}:</span>
                    <span className="truncate">{formatDate(invitation.invited_at)}</span>
                  </div>
                </div>
              </div>
              
              {/* Desktop Right Side */}
              <div className="flex flex-col items-end justify-between h-full min-w-0">
                <div className="flex flex-col items-end gap-2 mb-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(invitation.status)}`}>
                    {getStatusIcon(invitation.status)} {formatStatus(invitation.status)}
                  </span>
                  <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap">
                    <Star className="w-3 h-3 inline mr-1" />
                    {t('invitationCard.matchScore', { score: formatNumber(invitation.match_score) })}
                  </span>
                </div>
                
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors whitespace-nowrap"
                >
                  {t('invitationCard.viewDetails')}
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Expanded Details - Responsive */}
        <div className={`transition-all duration-300 ${isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          <div className="border-t border-gray-100 p-4 md:p-6 bg-gray-50">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    {t('invitationCard.eventDetails')}
                  </h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className="font-medium">{t('invitationCard.startDate')}:</span>
                      <span>{formatDate(invitation.event_date)}</span>
                    </div>
                    {invitation.event_end_date && (
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span className="font-medium">{t('invitationCard.endDate')}:</span>
                        <span>{formatDate(invitation.event_end_date)}</span>
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className="font-medium">{t('invitationCard.durationLabel')}:</span>
                      <span>{t('invitationCard.duration', { hours: formatNumber(invitation.duration_hours) })}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className="font-medium">{t('invitationCard.expires')}:</span>
                      <span className="text-orange-600">{formatDate(invitation.expires_at)}</span>
                    </div>
                  </div>
                </div>

                {invitation.organization_name && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Building className="w-4 h-4 text-blue-600" />
                      {t('invitationCard.organization')}
                    </h4>
                    <p className="text-sm text-gray-600 break-words">{invitation.organization_name}</p>
                  </div>
                )}

                {/* Full Description */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {t('invitationCard.fullDescription')}
                  </h4>
                  <p className="text-sm text-gray-600 leading-relaxed break-words">
                    {invitation.request_description}
                  </p>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    {t('invitationCard.invitationStatus')}
                  </h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className="font-medium">{t('invitationCard.statusLabel')}:</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium self-start ${getStatusColor(invitation.status)}`}>
                        {formatStatus(invitation.status)}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className="font-medium">{t('invitationCard.matchScoreLabel')}:</span>
                      <span className="text-blue-600 font-semibold">{formatNumber(invitation.match_score)}%</span>
                    </div>
                    {invitation.responded_at && (
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span className="font-medium">{t('invitationCard.responded')}:</span>
                        <span>{formatDate(invitation.responded_at)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {(invitation.message || invitation.response_message) && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">{t('invitationCard.messages')}</h4>
                    <div className="space-y-3">
                      {invitation.message && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-xs text-blue-600 font-medium mb-1">{t('invitationCard.organizationMessage')}:</p>
                          <p className="text-sm text-gray-700 leading-relaxed break-words">{invitation.message}</p>
                        </div>
                      )}
                      {invitation.response_message && (
                        <div className="bg-green-50 p-3 rounded-lg">
                          <p className="text-xs text-green-600 font-medium mb-1">{t('invitationCard.yourResponse')}:</p>
                          <p className="text-sm text-gray-700 leading-relaxed break-words">{invitation.response_message}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Campaign Link */}
            {invitation.campaign_id && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <a href={`/campaign/${invitation.campaign_id}`}
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  {t('invitationCard.viewRelatedCampaign')}
                </a>
              </div>
            )}

            {/* Action Buttons - Mobile Friendly */}
            {invitation.status === 'pending' && (
              <div className=" pt-4 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => onRespond(invitation.id, 'accepted')}
                    disabled={responding === invitation.id}
                    className="flex-1 sm:flex-none px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-center"
                  >
                    {responding === invitation.id ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>{t('invitationCard.responding')}</span>
                      </div>
                    ) : (
                      t('invitationCard.acceptInvitation')
                    )}
                  </button>
                  <button
                    onClick={() => onRespond(invitation.id, 'declined')}
                    disabled={responding === invitation.id}
                    className="flex-1 sm:flex-none px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-center"
                  >
                    {responding === invitation.id ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>{t('invitationCard.responding')}</span>
                      </div>
                    ) : (
                      t('invitationCard.declineInvitation')
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvitationCard;