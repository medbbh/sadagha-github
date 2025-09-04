import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  ArrowRight,
  Edit3,
  DollarSign,
  Target,
  Users,
  Calendar,
  Eye,
  Clock,
  BarChart3,
  Settings,
  AlertCircle,
  Trash
} from 'lucide-react';

import { fetchCampaignById, deleteCampaign } from '../../api/endpoints/CampaignAPI';
import { fetchCategoryById } from '../../api/endpoints/CategoryAPI';
import orgDashboardApi from '../../api/endpoints/OrgAPI';
import CampaignCarousel from '../../components/ui/CampaignCarousel';
import ShareButton from '../../components/ui/ShareButton';
import CampaignDeleteConfirmationModal from '../../components/ui/CamapaignDeleteConfirmationModal';

export default function CampaignDetail() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { campaignId } = useParams();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState(null);
  const [campaignCategory, setCampaignCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (campaignId) {
      loadCampaign();
    } else {
      setError(t('organization.campaignDetail.campaignIdMissing'));
    }
  }, [campaignId, t]);

  const loadCampaign = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Loading campaign with ID:', campaignId);

      if (!campaignId) {
        throw new Error(t('organization.campaignDetail.campaignIdRequired'));
      }

      const data = await fetchCampaignById(campaignId);
      setCampaign(data);

      // Fetch category details if campaign has a category
      if (data.category) {
        try {
          const categoryId = typeof data.category === 'object' ? data.category.id : data.category;
          const categoryData = await fetchCategoryById(categoryId);
          setCampaignCategory(categoryData);
        } catch (categoryError) {
          console.warn('Failed to load category details:', categoryError);
          if (typeof data.category === 'object') {
            setCampaignCategory(data.category);
          }
        }
      }
    } catch (err) {
      console.error('Load campaign error:', err);
      setError(err.message || t('organization.campaignDetail.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteCampaign(campaignId);
      navigate("/organization/campaigns");
    } catch (err) {
      setDeleting(false);
      console.error("Delete campaign error:", err);
      setError(err.message || t("organization.campaignDetail.failedToDelete"));
    } finally {
      setDeleting(false);
    }
  };

  const formatCurrency = (amount) => {
    return `${orgDashboardApi.formatNumber(amount)} MRU`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString({
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getProgressPercentage = () => {
    if (!campaign) return 0;
    return Math.min((parseFloat(campaign.current_amount) / parseFloat(campaign.target)) * 100, 100);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-16 bg-gray-200 rounded-lg"></div>
          <div className="h-80 bg-gray-200 rounded-xl"></div>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error && !campaign) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-xl p-6 text-center ${isRTL ? 'rtl' : 'ltr'}`}>
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-red-800 mb-2">
          {t('organization.campaignDetail.errorLoadingCampaign')}
        </h2>
        <p className="text-red-600 mb-4">{error}</p>
        <div className={`flex justify-center space-x-3 ${isRTL ? 'space-x-reverse' : ''}`}>
          <button
            onClick={() => loadCampaign()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            {t('organization.campaignDetail.tryAgain')}
          </button>
          <button
            onClick={() => navigate('/organization/campaigns')}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {t('organization.campaignDetail.backToCampaigns')}
          </button>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-xl p-6 text-center ${isRTL ? 'rtl' : 'ltr'}`}>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          {t('organization.campaignDetail.campaignNotFound')}
        </h2>
        <p className="text-gray-500 mb-4">
          {t('organization.campaignDetail.campaignNotFoundDescription')}
        </p>
        <button
          onClick={() => navigate('/organization/campaigns')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {t('organization.campaignDetail.backToCampaigns')}
        </button>
      </div>
    );
  }

  const progress = getProgressPercentage();
  const daysActive = Math.floor((new Date() - new Date(campaign.created_at)) / (1000 * 60 * 60 * 24));

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className={`flex items-center space-x-4 ${isRTL ? 'space-x-reverse' : ''}`}>
            <button
              onClick={() => navigate('/organization/campaigns')}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {isRTL ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
            </button>
            <div className={isRTL ? 'text-right' : 'text-left'}>
              <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
                {t('organization.campaignDetail.title')}
              </h1>
              <p className="text-slate-600 mt-1 text-sm sm:text-base">
                {t('organization.campaignDetail.subtitle')}
              </p>
            </div>
          </div>

          <div className={`flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 ${isRTL ? 'sm:space-x-reverse' : ''}`}>
            <button
              onClick={() => window.open(`/campaign/${campaign.id}`, '_blank')}
              className={`px-3 sm:px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center text-sm sm:text-base`}
            >
              <Eye className={`w-4 h-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
              {t('organization.campaignDetail.preview')}
            </button>

            {(campaign.current_amount == 0 && campaign.number_of_donors == 0) && (
              <>
                <button
                  onClick={() => navigate(`/organization/campaigns/${campaignId}/edit`)}
                  className={`px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center text-sm sm:text-base`}
                >
                  <Edit3 className={`w-4 h-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                  {t('organization.campaignDetail.editCampaign')}
                </button>
                <button
                  onClick={() => setOpenDeleteModal(true)}
                  className='px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center text-sm sm:text-base'
                >
                  <Trash className={`w-4 h-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                  {t("organization.campaignDetail.deleteCampaign")}
                </button>
              </>
            )}


            {/* Confirmation Modal */}
            <CampaignDeleteConfirmationModal
              open={openDeleteModal}
              onClose={() => setOpenDeleteModal(false)}
              onConfirm={handleDelete}
              title={t("organization.campaignDetail.confirmDeleteTitle")}
              description={t("organization.campaignDetail.confirmDelete")}
              cancelText={t("organization.campaignDetail.cancel")}
              confirmText={deleting ? t("organization.campaignDetail.deleting") : t("organization.campaignDetail.delete")}
            />
          </div>
        </div>

        {(campaign.current_amount > 0 && campaign.number_of_donors > 0) && (
          <p className="text-sm text-gray-500 mt-2 text-end">
            {t("organization.campaignDetail.noEditDeleteBecauseDonations")}
          </p>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Campaign Visual and Details (2/3 width) */}
        <div className="lg:w-2/3">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Campaign Carousel */}
            <CampaignCarousel
              files={campaign.files}
              isEditing={false}
            />

            {/* Campaign Content */}
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h1 className={`text-2xl md:text-3xl font-bold text-slate-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {campaign.name}
                  </h1>
                  <div className={`flex items-center mt-2 space-x-2 `}>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full">
                      {campaignCategory?.name || campaign.category?.name || t('organization.campaignDetail.uncategorized')}
                    </span>
                    {campaign.featured && (
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2.5 py-0.5 rounded-full">
                        {t('organization.campaignDetail.featured')}
                      </span>
                    )}

                  </div>
                </div>
                <div className={`flex space-x-2 ${isRTL ? 'me-4' : 'ms-4'} ${isRTL ? 'space-x-reverse' : ''}`}>
                  <ShareButton
                    campaign={campaign}
                    variant="button-only"
                    showMetaTags={false}
                    className="p-2 text-slate-500 hover:text-blue-500 transition-colors"
                    isRTL={isRTL}
                  />
                </div>
              </div>

              {/* Progress Section */}
              <div className="mb-6 bg-slate-50 rounded-lg p-4">
                <div className="flex justify-between mb-3">
                  <span className="text-lg font-semibold text-slate-900">
                    {t('organization.campaignDetail.raised', { amount: formatCurrency(campaign.current_amount) })}
                  </span>
                  <span className="text-slate-600">
                    {t('organization.campaignDetail.percentOfTarget', {
                      percent: progress.toFixed(1),
                      target: formatCurrency(campaign.target)
                    })}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div
                    className={`bg-blue-600 h-3 rounded-full transition-all duration-300 ${isRTL ? 'origin-right' : 'origin-left'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-sm text-slate-600">
                  <span>
                    {t('organization.campaignDetail.percentFunded', { percent: progress.toFixed(1) })}
                  </span>
                  <span>
                    {t('organization.campaignDetail.donorsCount', { count: orgDashboardApi.formatNumber(campaign.number_of_donors) })}
                  </span>
                </div>
              </div>

              {/* Campaign Story */}
              <div className="mb-8">
                <h2 className={`text-xl font-semibold text-slate-900 mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('organization.campaignDetail.campaignStory')}
                </h2>
                <p className={`text-slate-700 whitespace-pre-line leading-relaxed ${isRTL ? 'text-right' : 'text-left'}`}>
                  {campaign.description || t('organization.campaignDetail.noDescription')}
                </p>
              </div>

              {/* Facebook Live Section */}
              {campaign.facebook_live_url && (
                <div className="mb-8">
                  <h2 className={`text-xl font-semibold text-slate-900 mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('organization.campaignDetail.facebookLive')}
                  </h2>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className={`flex items-center space-x-3 ${isRTL ? 'space-x-reverse' : ''}`}>
                      <div className="p-2 bg-blue-100 rounded-full">
                        <Eye className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className={isRTL ? 'text-right' : 'text-left'}>
                        <p className="font-medium text-blue-900">
                          {t('organization.campaignDetail.liveStreamAvailable')}
                        </p>
                        <p className="text-sm text-blue-700">
                          {campaign.live_status === 'live'
                            ? t('organization.campaignDetail.currentlyLive')
                            : t('organization.campaignDetail.streamAvailable')
                          }
                          {campaign.live_viewer_count > 0 &&
                            ` • ${t('organization.campaignDetail.viewersCount', { count: campaign.live_viewer_count })}`
                          }
                        </p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <a
                        href={campaign.facebook_live_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors `}
                      >
                        <Eye className={`w-4 h-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                        {t('organization.campaignDetail.watchLiveStream')}
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Campaign Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <div className={`flex items-center space-x-3 ${isRTL ? 'space-x-reverse' : ''}`}>
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className={isRTL ? 'text-right' : 'text-left'}>
                      <p className="text-xs text-slate-500">{t('organization.campaignDetail.created')}</p>
                      <p className="font-medium">{formatDate(campaign.created_at)}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <div className={`flex items-center space-x-3 ${isRTL ? 'space-x-reverse' : ''}`}>
                    <div className="p-2 bg-green-100 rounded-full">
                      <Target className="w-5 h-5 text-green-600" />
                    </div>
                    <div className={isRTL ? 'text-right' : 'text-left'}>
                      <p className="text-xs text-slate-500">{t('organization.campaignDetail.target')}</p>
                      <p className="font-medium">{formatCurrency(campaign.target)}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <div className={`flex items-center space-x-3 ${isRTL ? 'space-x-reverse' : ''}`}>
                    <div className="p-2 bg-purple-100 rounded-full">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className={isRTL ? 'text-right' : 'text-left'}>
                      <p className="text-xs text-slate-500">{t('organization.campaignDetail.donors')}</p>
                      <p className="font-medium">{orgDashboardApi.formatNumber(campaign.number_of_donors)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar (1/3 width) */}
        <div className="lg:w-1/3 space-y-6">
          {/* Campaign Performance */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className={`text-lg font-semibold text-slate-900 mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('organization.campaignDetail.performanceSummary')}
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className={`flex items-center space-x-3 ${isRTL ? 'space-x-reverse' : ''}`}>
                  <div className="p-2 bg-green-100 rounded-full">
                    <DollarSign className="w-4 h-4 text-green-600" />
                  </div>
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <p className="text-sm text-slate-600">{t('organization.campaignDetail.totalRaised')}</p>
                    <p className="font-semibold text-slate-900">{formatCurrency(campaign.current_amount)}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className={`flex items-center space-x-3 ${isRTL ? 'space-x-reverse' : ''}`}>
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <p className="text-sm text-slate-600">{t('organization.campaignDetail.donors')}</p>
                    <p className="font-semibold text-slate-900">{orgDashboardApi.formatNumber(campaign.number_of_donors)}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className={`flex items-center space-x-3 ${isRTL ? 'space-x-reverse' : ''}`}>
                  <div className="p-2 bg-purple-100 rounded-full">
                    <Target className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <p className="text-sm text-slate-600">{t('organization.campaignDetail.progress')}</p>
                    <p className="font-semibold text-slate-900">{progress.toFixed(1)}%</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className={`flex items-center space-x-3 ${isRTL ? 'space-x-reverse' : ''}`}>
                  <div className="p-2 bg-orange-100 rounded-full">
                    <Calendar className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <p className="text-sm text-slate-600">{t('organization.campaignDetail.daysActive')}</p>
                    <p className="font-semibold text-slate-900">{daysActive}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Share Campaign */}
          <ShareButton
            campaign={campaign}
            variant="compact"
            showPreview={false}
            showMetaTags={true}
          />

          {/* Campaign Information */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className={`text-lg font-semibold text-slate-900 mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('organization.campaignDetail.campaignInformation')}
            </h3>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium text-slate-700 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('organization.campaignDetail.category')}
                </label>
                <p className={`text-slate-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {campaignCategory?.name || campaign.category?.name || t('organization.campaignDetail.uncategorized')}
                </p>
              </div>

              <div>
                <label className={`block text-sm font-medium text-slate-700 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('organization.campaignDetail.lastUpdated')}
                </label>
                <p className={`text-slate-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {formatDate(campaign.updated_at)}
                </p>
              </div>

              <div>
                <label className={`block text-sm font-medium text-slate-700 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('organization.campaignDetail.status')}
                </label>
                <div className={`flex items-center space-x-2 `}>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {t('organization.campaignDetail.active')}
                  </span>
                  {campaign.featured && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      {t('organization.campaignDetail.featured')}
                    </span>
                  )}
                </div>
              </div>

              {/* Facebook Live Status */}
              {campaign.has_facebook_live && (
                <div>
                  <label className={`block text-sm font-medium text-slate-700 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('organization.campaignDetail.liveStream')}
                  </label>
                  <div className={`flex items-center space-x-2 ${isRTL ? 'space-x-reverse justify-end' : ''}`}>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${campaign.is_live
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                      }`}>
                      {campaign.is_live ? t('organization.campaignDetail.liveNow') : t('organization.campaignDetail.available')}
                    </span>
                    {campaign.live_viewer_count > 0 && (
                      <span className="text-xs text-slate-600">
                        {t('organization.campaignDetail.viewersCount', { count: campaign.live_viewer_count })}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}