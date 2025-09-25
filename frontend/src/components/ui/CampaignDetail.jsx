import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Heart, Share2, Calendar, Users, Target, DollarSign, Clock, Phone, MapPin, Globe, Building, Copy, CheckCircle, Link2Off, ExternalLink } from 'lucide-react';
import { campaignDonations, fetchCampaignById } from '../../api/endpoints/CampaignAPI';
import DonationForm from './DonationForm';
import FacebookLiveEmbed from './FacebookLiveEmbed';
import FacebookLiveEmbedSimple from './FacebookLiveEmbedSimple';
import ShareButton from './ShareButton';
import Loading from '../common/Loading';
import SimilarCampaigns from './SimilarCampaigns';




export default function CampaignDetail() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { campaignId } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedPaymentNumber, setCopiedPaymentNumber] = useState(null);

  // Function to load campaign
  const loadCampaign = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCampaignById(id);
      console.log('Fetched campaign data:', data);
      setCampaign(data);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch campaign:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDonationSuccess = async (donationData) => {
    // If it's a successful donation that needs refresh
    if (donationData.shouldRefreshCampaign) {
      try {
        // Fetch fresh campaign data
        const response = await fetchCampaignById(campaignId);

        // Update your campaign state with fresh data
        setCampaign(response); // or however you manage campaign state

        // Optionally show success message
        console.log('Campaign data refreshed after donation');
      } catch (error) {
        console.error('Error refreshing campaign data:', error);
        // Fallback: optimistically update the values
        setCampaign(prev => ({
          ...prev,
          current_amount: prev.current_amount + donationData.donationAmount,
          number_of_donors: prev.number_of_donors + 1
        }));
      }
    }

  };

  const refreshCampaignData = async () => {
    try {
      const response = await fetchCampaignById(campaignId);
      setCampaign(response);
    } catch (error) {
      console.error('Error refreshing campaign:', error);
    }
  };

  useEffect(() => {
    if (campaignId) {
      loadCampaign(campaignId);
      // console.log('donation camapaigns',campaignDonations(campaignId))
    }
  }, [campaignId]);

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPaymentNumber(id);
      setTimeout(() => setCopiedPaymentNumber(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatPaymentNumber = (number) => {
    if (!number) return '';
    return number.toString().replace(/(\d{4})(\d{4})/g, '$1 $2');
  };

  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <h2 className="text-xl font-medium text-red-800">{t('campaignDetail.errorLoadingCampaign')}</h2>
          <p className="text-red-600 mt-2">{error}</p>
          <button
            onClick={() => loadCampaign(campaignId)}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            {t('campaignDetail.tryAgain')}
          </button>
        </div>
      </div>
    );
  }

  if (!campaign) return <NotFoundMessage />;

  const progress = Math.min((parseFloat(campaign.current_amount) / parseFloat(campaign.target)) * 100, 100);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className={`flex flex-col lg:flex-row gap-8 `}>
        {/* Campaign Details (2/3 width) */}
        <div className="lg:w-2/3 space-y-6">
          {/* Main Campaign Card */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Carousel */}
            <CampaignCarousel files={campaign.files} isRTL={isRTL} />

            {/* Campaign Content */}
            <div className="p-6">
              <div className={`flex justify-between items-start mb-4 `}>
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{campaign.name}</h1>
                  <div className={`flex items-center mt-2 space-x-2 `}>
                    <span className="text-gray-500 text-sm">
                      {t('campaignDetail.created')} {new Date(campaign.created_at).toLocaleDateString(i18n.language)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              {/* <div className="mb-6">
                <div className={`flex justify-between mb-1 ${isRTL ? '' : ''}`}>
                  <span className="text-sm font-medium text-gray-700">
                    {t('campaignDetail.raised')} {campaign.current_amount} MRU
                  </span>
                  <span className="text-sm text-gray-500">
                    {t('campaignDetail.goal')} {campaign.target} MRU
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full"
                    style={{
                      width: `${progress}%`,
                      transformOrigin: isRTL ? 'right' : 'left'
                    }}
                  />
                </div>
                <div className={`flex justify-between mt-2 text-sm text-gray-500 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span>{progress.toFixed(1)}% {t('campaignDetail.funded')}</span>
                  <span>{campaign.number_of_donors} {t('campaignDetail.donors')}</span>
                </div>
              </div> */}

              {/* Campaign Story */}
              <div className="mb-8">
                <h2 className={`text-xl font-semibold text-gray-900 mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('campaignDetail.ourStory')}
                </h2>
                <p className={`text-gray-700 whitespace-pre-line ${isRTL ? 'text-right' : 'text-left'}`}>
                  {campaign.description || t('campaignDetail.noDescription')}
                </p>
              </div>

              {/* Campaign Details Grid */}

            </div>

            {/* Facebook Live Embeds */}
            <FacebookLiveEmbed campaign={campaign} showDonationOverlay={true} />

            {campaign.facebook_live_url && (
              <div className="mb-6">
                <FacebookLiveEmbedSimple
                  campaign={campaign}
                  showDonationOverlay={true}
                  className="shadow-lg"
                />
              </div>
            )}
          </div>

          {/* Social Share Button */}
          <ShareButton
            campaign={campaign}
            variant="full"
            showPreview={true}
            showMetaTags={true}
            className="shadow-sm"
            platforms={['facebook', 'twitter', 'whatsapp']}
          />

          {/* Organization Information Card */}
          {campaign.organization && (
            <OrganizationInfoCard
              organization={campaign.organization}
              paymentNumbers={campaign.organization.payment_numbers}
              onCopyPaymentNumber={copyToClipboard}
              copiedPaymentNumber={copiedPaymentNumber}
              formatPaymentNumber={formatPaymentNumber}
              isRTL={isRTL}
            />
          )}
        </div>

        {/* Donation Card (1/3 width) */}
        {/* Donation Card (1/3 width) */}
        <div className="lg:w-1/3">
          <div className="sticky top-28 space-y-6">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <DonationForm
                campaignId={campaign.id}
                currentAmount={campaign.current_amount}
                targetAmount={campaign.target}
                donorsCount={campaign.number_of_donors}
                progress={progress}
                paymentNumbers={campaign.organization?.payment_numbers}
                formatPaymentNumber={formatPaymentNumber}
                onDonationSuccess={handleDonationSuccess}
                refreshCampaign={refreshCampaignData}
              />
            </div>


            {/* Compact Share Button in Sidebar */}
            <div>
              <ShareButton
                campaign={campaign}
                variant="compact"
                showPreview={false}
                showMetaTags={false}
                className="shadow-sm"
                platforms={['facebook', 'twitter', 'whatsapp']}
              />
            </div>
          </div>


        </div>

      </div>

      {/* similar campaigns section */}
      <div>
        <SimilarCampaigns campaignId={campaign.id} />
      </div>

    </div>
  );
}

// Organization Information Component
function OrganizationInfoCard({ organization, paymentNumbers, onCopyPaymentNumber, copiedPaymentNumber, formatPaymentNumber, isRTL }) {
  const { t, i18n } = useTranslation();
  const activePaymentNumbers = paymentNumbers?.filter(pn => pn.is_active) || [];

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-6">
        <div className={`flex items-center space-x-3 mb-6 ${isRTL ? 'flex-row-reverse space-x-reverse' : ''}`}>
          {/* <div className="p-2 bg-blue-100 rounded-full">
            <Building className="w-5 h-5 text-blue-600" />
          </div> */}
          <h2 className={`text-xl font-semibold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('campaignDetail.organisation')}
          </h2>
        </div>

        {/* Organization Name and Description */}

        <div className="mb-6 flex items-center ">
            <img src={organization.profile_image_url} alt={organization.org_name} className="w-20 h-20 object-cover rounded-full mr-4" />
            <div className="flex-1">
            <div className={`text-lg flex gap-1 font-semibold text-gray-900 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              <h3>{organization.org_name}</h3>
              <Link to={`/organizations/${organization.id}`} className="text-blue-600 hover:underline flex items-center">
                <ExternalLink className="w-4 h-4 ml-1" />
              </Link>
            </div>
            {/* description under the org name  */}
            <span className={`text-gray-600 text-sm ${isRTL ? 'text-right' : 'text-left'}`}>{organization.description}</span>
            </div>
        </div>

      </div>
    </div>
  );
}

function CampaignCarousel({ files, isRTL }) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!files || files.length === 0) {
    return (
      <div className="h-80 bg-gray-100 flex items-center justify-center">
        <span className="text-gray-400">{t('campaignDetail.noImagesAvailable')}</span>
      </div>
    );
  }

  return (
    <div className="relative h-80 bg-gray-100">
      <img
        src={files[currentIndex].url}
        alt="Campaign visual"
        className="w-full h-full object-cover"
      />

      {files.length > 1 && (
        <>
          <button
            onClick={() => setCurrentIndex((prev) => (prev - 1 + files.length) % files.length)}
            className={`absolute top-1/2 -translate-y-1/2 bg-white/80 text-gray-800 p-2 rounded-full shadow-md hover:bg-white transition-all ${isRTL ? 'right-4' : 'left-4'}`}
          >
            <ChevronLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
          </button>
          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % files.length)}
            className={`absolute top-1/2 -translate-y-1/2 bg-white/80 text-gray-800 p-2 rounded-full shadow-md hover:bg-white transition-all ${isRTL ? 'left-4' : 'right-4'}`}
          >
            <ChevronRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
          </button>
          <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
            {files.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${index === currentIndex ? 'bg-white w-4' : 'bg-white/50'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}


function NotFoundMessage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="bg-gray-50 shadow-sm rounded-xl p-6 text-center">
        <h2 className="text-xl font-medium text-gray-700">{t('campaignDetail.campaignNotFound')}</h2>
        <p className="text-gray-500 mt-2">{t('campaignDetail.campaignNotFoundDescription')}</p>
      </div>
    </div>
  );
}