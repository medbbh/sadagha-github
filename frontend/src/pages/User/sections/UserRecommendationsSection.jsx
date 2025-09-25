import { useEffect, useState } from "react";
import { TrendingUp, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getUserRecommendations } from "../../../api/endpoints/ai_recommendations";
import { Link } from "react-router-dom";

export default function UserRecommendationsSection({ userId }) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRecommendations();
  }, [userId]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const recData = await getUserRecommendations(userId);
      const campaigns = recData.recommendations;

      const merged = campaigns.map((camp) => {
        const rec = recData.recommendations.find(
          (r) => r.campaign_id === camp.id
        );
        return {
          ...camp,
          score: rec?.score || 0,
          reason: rec?.reason || "",
        };
      });

      merged.sort((a, b) => b.score - a.score);
      setCampaigns(merged);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch user recommendations:", err);
      setLoading(false);
    }
  };

  const formatMoney = (amount) => {
    if (!amount) return "MRU 0";
    const numValue = parseFloat(amount);
    if (isNaN(numValue)) return "MRU 0";
    return (
      new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(numValue) + " MRU"
    );
  };

  const calculateProgress = (current, target) => {
    const currentNum = parseFloat(current) || 0;
    const targetNum = parseFloat(target) || 1;
    return Math.min((currentNum / targetNum) * 100, 100);
  };

  const calculateDaysFromStart = (startDate) => {
    if (!startDate) return 0;
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = Math.abs(now - start);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <section className="py-8 sm:py-12 lg:py-16 bg-gradient-to-br from-[#3366CC]/5 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div
            className={`flex items-center gap-3 mb-6 sm:mb-8 ${
              isRTL ? " text-right" : "text-left"
            }`}
          >
            <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-[#FF9800]" />
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#3366CC]">
              {t("recommendations.title")}
            </h2>
          </div>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-t-2 border-b-2 border-[#3366CC]"></div>
          </div>
        </div>
      </section>
    );
  }

  if (campaigns.length === 0) return <></>;

  return (
    <section className="py-8 sm:py-12 lg:py-16 bg-gradient-to-br from-[#3366CC]/5 to-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-[#FF9800]" />
          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#3366CC] mb-1">
              {t("recommendations.title")}
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              {t("recommendations.subtitle")}
            </p>
          </div>
        </div>

        {/* Campaigns */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 auto-rows-fr">
          {campaigns.map((campaign, idx) => {
            const progress = calculateProgress(
              campaign.current_amount,
              campaign.target
            );
            const daysFromStart = calculateDaysFromStart(
              campaign.created_at || campaign.start_date
            );

            // FEATURED campaign (first one) stays big on large screens
            if (idx === 0) {
              return (
                <Link
                  to={`/campaign/${campaign.id}`}
                  key={campaign.id}
                  className="group relative bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden flex h-28 sm:flex-col sm:h-auto sm:col-span-2 lg:col-span-3 lg:row-span-2"
                >
                  {/* Image */}
                  <div className="relative w-28 h-28 sm:w-full sm:h-3/4 flex-shrink-0">
                    <img
                      src={
                        campaign.files?.[0]?.url ||
                        "/api/placeholder/400/300"
                      }
                      alt={campaign.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = "/api/placeholder/400/300";
                      }}
                    />
                    <div className="absolute top-1 left-1 sm:top-3 sm:left-3 bg-white/90 rounded-full px-1.5 py-0.5 text-[10px] sm:text-xs font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {daysFromStart}d
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-2 sm:p-4 flex flex-col justify-between">
                    <h3 className="font-semibold text-xs sm:text-lg md:text-xl line-clamp-2 text-gray-900 mb-1 sm:mb-2">
                      {campaign.name}
                    </h3>

                    <div className="mt-auto">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] sm:text-base font-semibold text-gray-700">
                          {formatMoney(campaign.current_amount)}
                        </span>
                        <span className="text-[10px] sm:text-sm text-gray-500">
                          {Math.round(progress)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1 sm:h-2">
                        <div
                          className="bg-gradient-to-r from-[#4CAF50] to-[#45a049] h-1 sm:h-2 rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            }

            // REGULAR campaigns
            return (
              <Link
                to={`/campaign/${campaign.id}`}
                key={campaign.id}
                className="group relative bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden flex h-28 sm:flex-col sm:h-auto"
              >
                {/* Image */}
                <div className="relative w-28 h-28 sm:w-full sm:h-40 flex-shrink-0">
                  <img
                    src={campaign.files?.[0]?.url || "/api/placeholder/300/300"}
                    alt={campaign.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = "/api/placeholder/300/300";
                    }}
                  />
                  <div className="absolute top-1 left-1 sm:top-2 sm:left-2 bg-white/90 rounded-full px-1.5 py-0.5 text-[10px] sm:text-xs font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {daysFromStart}d
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-2 sm:p-4 flex flex-col justify-between">
                  <h3 className="font-semibold text-xs sm:text-base line-clamp-2 text-gray-900 mb-1">
                    {campaign.name}
                  </h3>

                  <div className="mt-auto">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] sm:text-sm font-semibold text-gray-700">
                        {formatMoney(campaign.current_amount)}
                      </span>
                      <span className="text-[10px] sm:text-xs text-gray-500">
                        {Math.round(progress)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1 sm:h-1.5">
                      <div
                        className="bg-gradient-to-r from-[#4CAF50] to-[#45a049] h-1 sm:h-1.5 rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
