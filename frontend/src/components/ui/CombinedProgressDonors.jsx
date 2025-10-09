import React, { useEffect, useState } from "react";
import { Loader2, User, X } from "lucide-react";
import { campaignDonations } from "../../api/endpoints/CampaignAPI";
import { useTranslation } from "react-i18next";

const CombinedProgressDonors = ({ 
  campaignId, 
  currentAmount, 
  targetAmount, 
  donorsCount,
  isRTL 
}) => {
  const { t } = useTranslation();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDonorIndex, setCurrentDonorIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);

  const amountToGo = Math.max(0, targetAmount - currentAmount); // Prevent negative values

  const progress = targetAmount ? (currentAmount / targetAmount) * 100 : 0;
  const visibleDonors = 3; // Number of donors to show at once

  
  useEffect(() => {
    const fetchDonations = async () => {
      try {
        const res = await campaignDonations(campaignId);
        setDonations(res.donations || []);
      } catch (error) {
        console.error("Error fetching donations:", error);
      } finally {
        setLoading(false);
      }
    };

    if (campaignId) {
      fetchDonations();
    }
  }, [campaignId]);

  // Rotate donors every 3 seconds
  useEffect(() => {
    if (donations.length <= visibleDonors) return;

    const interval = setInterval(() => {
      setCurrentDonorIndex((prev) => 
        prev + 1 >= donations.length ? 0 : prev + 1
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [donations.length]);

  const getVisibleDonors = () => {
    if (donations.length <= visibleDonors) return donations;
    
    const visible = [];
    for (let i = 0; i < visibleDonors; i++) {
      visible.push(donations[(currentDonorIndex + i) % donations.length]);
    }
    return visible;
  };

  return (
    <>
      <div className="mb-6 bg-gray-50 border border-gray-200 p-5 rounded-xl">
        {/* Progress Summary */}
        <div className="flex justify-between items-center mb-3">
          <div>
            <p className="text-lg font-bold text-gray-900">{currentAmount || 0} MRU</p>
            <p className="text-sm text-gray-600">
              {t('donationForm.raised')} {t('donationForm.of')} {targetAmount || 0} MRU {t('donationForm.goal')}
            </p>
          </div>
          <div className="text-end">
            <p className="text-lg font-bold text-blue-600">{(progress || 0).toFixed(1)}%</p>
            <p className="text-sm text-gray-600">{t('donationForm.funded')}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-4 mb-3 overflow-hidden">
          <div
            className="bg-blue-500 h-full rounded-full transition-all duration-500 ease-out shadow-sm"
            style={{ width: `${Math.min(progress || 0, 100)}%` }}
          />
        </div>

        {/* Stats */}
        <div className="flex justify-between text-sm text-gray-700 mb-4">
          <span className="flex items-center">
            <User className={`w-4 h-4 ${isRTL ? 'ms-1' : 'me-1'}`} />
            {donorsCount || 0} {t('donationForm.supporters')}
          </span>
          {/* <span>{(targetAmount || 0) - (currentAmount || 0)} MRU {t('donationForm.toGo')}</span> */}
          <span>{amountToGo} MRU {t('donationForm.toGo')}</span>

        </div>

        {/* Recent Donors */}
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="animate-spin w-5 h-5 text-gray-400" />
          </div>
        ) : donations.length > 0 ? (
          <>
            <div className="border-t border-gray-300 pt-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">
                <p className="text-sm font-semibold text-gray-700">
                  {t('campaignDonationsMessage.recentDonors')}
                </p>
                {donations.length > visibleDonors && (
                  <button
                    onClick={() => setShowModal(true)}
                    className="text-xs text-blue-600 hover:underline self-start sm:self-auto"
                  >
                    {t('campaignDonationsMessage.viewAll')} ({donations.length})
                  </button>
                )}
              </div>
              
              <div className="space-y-2">
                {getVisibleDonors().map((donation) => (
                  <div 
                    key={donation.id} 
                    className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 py-2 px-3 bg-white rounded-lg border border-gray-200 transition-all duration-500"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {donation.is_anonymous
                          ? t("campaignDonationsMessage.anonymous")
                          : donation.donor_display_name}
                      </p>
                      {donation.message && (
                        <p className="text-xs text-gray-500 line-clamp-2 sm:truncate mt-0.5">
                          "{donation.message}"
                        </p>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-green-600 sm:ml-3">
                      {Number(donation.amount).toLocaleString()} MRU
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 backdrop-blur-xs flex items-center justify-center z-50 p-4 mt-20">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">
                {t('campaignDonationsMessage.allDonors')} ({donations.length})
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(80vh-80px)] p-4">
              <ul className="divide-y divide-gray-200">
                {donations.map((donation) => (
                  <li key={donation.id} className="py-3 flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">
                        {donation.is_anonymous
                          ? t("campaignDonationsMessage.anonymous")
                          : donation.donor_display_name}
                      </p>
                      {donation.message && (
                        <p className="text-gray-600 text-sm mt-1">{donation.message}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(donation.created_at).toLocaleDateString()} - {new Date(donation.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-semibold text-green-600">
                        {Number(donation.amount).toLocaleString()} MRU
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CombinedProgressDonors;