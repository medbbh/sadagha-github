import { ArrowRight, Clock, Heart, Users, Target, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { getUrgentCampaigns } from "../../../api/endpoints/CampaignAPI";
import UrgentCampaignCarousel from "../../../components/ui/UrgentCamapignCarousel";



export function HeroSection() {
  const { t, i18n } = useTranslation();
  const [urgentCampaigns, setUrgentCampaigns] = useState([]);
  const isRTL = i18n.language === "ar";

  useEffect(() => {
    fetchUrgentCampaigns();
  }, []);

  const fetchUrgentCampaigns = async () => {
    try {
      const data = await getUrgentCampaigns();
      // console.log("Urgent Campaigns:", data);
      setUrgentCampaigns(data.urgent_campaigns || []);
    } catch (err) {
      console.error("Failed to fetch urgent campaigns:", err);
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#3366CC]/10 to-white py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Side - Enhanced with Urgency Messaging */}
          <div className={`space-y-6 ${isRTL ? "md:pl-8 text-right" : "md:pr-8 text-left"}`}>
            {/* Urgency Alert */}
            {urgentCampaigns.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 bg-[#FF9800]/10 rounded-xl border border-[#FF9800]/20"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="flex-shrink-0"
                >
                  <AlertCircle className="w-6 h-6 text-[#FF9800]" />
                </motion.div>
                <div>
                  <div className="font-bold text-[#FF9800] text-sm">
                    {urgentCampaigns.length} {t("hero.urgentNeeds")}
                  </div>
                  <div className="text-sm text-gray-600">
                    {t("hero.criticalCampaigns")}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Main Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-[#3366CC] leading-tight">
              <span className="block">
                {t("hero.title.fund")}{" "}
                <span className="text-[#4CAF50]">{t("hero.title.dreams")}</span>
                {isRTL ? "" : ","}
              </span>
              <span className="block">
                {t("hero.title.support")}{" "}
                <span className="text-[#FF9800]">
                  {t("hero.title.innovation")}
                </span>
                {isRTL ? "،" : ""}
              </span>
            </h1>

            <p className="text-lg text-gray-700">{t("hero.subtitle")}</p>

            {/* Action Buttons */}
            <div className={`flex flex-col sm:flex-row gap-4 pt-4 ${isRTL ? "sm:" : ""}`}>
              <a
                href="/explore"
                className="px-6 py-3 bg-[#3366CC] hover:bg-[#2855AA] text-white rounded-lg font-medium transition-colors duration-300 flex items-center justify-center"
              >
                {t("hero.exploreCampaigns")}
                <ArrowRight className={`h-4 w-4 ${isRTL ? "mr-2 rotate-180" : "ml-2"}`} />
              </a>
              
            </div>

          </div>

          {/* Right Side - Integrated Urgent Campaign */}
          <div className="flex justify-center">
            <UrgentCampaignCarousel urgentCampaigns={urgentCampaigns} />
          </div>
        </div>
      </div>

      {/* Enhanced Background Elements */}
      <div className={`absolute top-20 w-32 h-32 bg-[#4CAF50]/10 rounded-full blur-2xl ${isRTL ? "left-10" : "right-10"}`}></div>
      <div className={`absolute bottom-10 w-40 h-40 bg-[#3366CC]/10 rounded-full blur-3xl ${isRTL ? "right-10" : "left-10"}`}></div>
      
      {/* Urgency Glow */}
      {urgentCampaigns.length > 0 && (
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-[#FF9800]/5 rounded-full blur-3xl"></div>
      )}
    </section>
  );
}