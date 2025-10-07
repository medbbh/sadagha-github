import { useEffect, useState, useRef } from "react";
import { MapPin, ChevronRight, ChevronLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getCampaignRecommendations } from "../../api/endpoints/ai_recommendations";
import { Link } from "react-router-dom";

export default function SimilarCampaigns({ campaignId }) {
    const { t } = useTranslation();
    const [campaigns, setCampaigns] = useState([]);
    const scrollRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getCampaignRecommendations(campaignId);
                setCampaigns(data?.similar_campaigns || []);
                console.log("Fetched similar campaigns:", data);
            } catch (err) {
                console.error("Failed to fetch similar campaigns:", err);
            }
        };
        fetchData();
    }, [campaignId]);

    if (!campaigns.length) return null;

    const scroll = (direction) => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({
                left: direction === "left" ? -300 : 300,
                behavior: "smooth",
            });
        }
    };

    return (
        <section className="mt-12 bg-[#FF9800] py-10 sm:py-14 px-4 sm:px-6 rounded-2xl relative">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-6 max-w-7xl mx-auto">

                <div className="max-w-7xl">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">
                        {t("similarCampaigns.title")}
                    </h2>
                    <p className="text-sm sm:text-base text-gray-50 mt-1">
                        {t(
                            "similarCampaigns.subtitle",
                            "Discover more campaigns that inspire generosity."
                        )}
                    </p>
                </div>

                {/* Scroll Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={() => scroll(document.dir === "rtl" ? "right" : "left")}
                        className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                    >
                        {
                            /* Adjust icon direction based on text direction */
                            document.dir === "rtl" ? (
                                <ChevronRight className="w-5 h-5 text-gray-800" />
                            ) : (
                                <ChevronLeft className="w-5 h-5 text-gray-800" />
                            )
                        }
                    </button>
                    <button
                        onClick={() => scroll(document.dir === "rtl" ? "left" : "right")}
                        className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                    >
                        {
                            /* Adjust icon direction based on text direction */
                            document.dir === "rtl" ? (
                                <ChevronLeft className="w-5 h-5 text-gray-800" />
                            ) : (
                                <ChevronRight className="w-5 h-5 text-gray-800" />
                            )
                        }
                    </button>
                </div>
            </div>
            <div
                ref={scrollRef}
                className="flex gap-4 scrollbar-hide scroll-smooth overflow-x-hidden py-2 px-1 max-w-7xl mx-auto"
            >
                {campaigns.map((campaign) => (
                    <Link
                        to={`/campaign/${campaign.campaign_id}`}
                        key={campaign.campaign_id}
                        className="flex-shrink-0 w-60 bg-white rounded-xl shadow-md hover:shadow-lg transition overflow-hidden border border-gray-100"
                    >
                        {/* Campaign Image */}
                        <div className="relative w-full h-32 sm:h-36 md:h-40">
                            <img
                                src={campaign.files?.[0]?.url || "/api/placeholder/400/300"}
                                loading="lazy"
                                alt={campaign.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                    e.target.src = "/api/placeholder/400/300";
                                }}
                            />
                            <div className="absolute top-2 left-2 bg-[#FF9800] text-white text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-full">
                                {t("similarCampaigns.suggestion")}
                            </div>
                        </div>

                        {/* Campaign Content */}
                        <div className="p-4 flex flex-col justify-between h-36">
                            <div className="space-y-1">
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <MapPin className="w-3 h-3" />
                                    <span>{campaign.location || t("similarCampaigns.nearby")}</span>
                                </div>
                                <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">
                                    {campaign.name}
                                </h3>
                            </div>

                            {/* Progress & Raised */}
                            <div className="mt-2">
                                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-[#4CAF50] to-[#45a049] rounded-full"
                                        style={{
                                            width: `${Math.min(campaign.progress || 0, 100)}%`,
                                        }}
                                    />
                                </div>
                                <p className="text-xs sm:text-sm font-medium text-gray-700 mt-1">
                                    {campaign.raised?.toLocaleString() || "0"} MRU {" "}
                                    {t("similarCampaigns.raised")}
                                </p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
