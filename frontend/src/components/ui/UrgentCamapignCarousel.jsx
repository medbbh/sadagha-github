import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ArrowRight, Clock, Users, AlertCircle } from "lucide-react";


export default function UrgentCampaignCarousel({ urgentCampaigns }) {
  const { t, i18n } = useTranslation();
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const isRTL = i18n.language === "ar";

  useEffect(() => {
    if (isPaused || !urgentCampaigns?.length) return;

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % urgentCampaigns.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [urgentCampaigns?.length, isPaused]);


  const calculateProgress = (current, target) => {
    const currentAmount = parseFloat(current);
    const targetAmount = parseFloat(target);
    return Math.min((currentAmount / targetAmount) * 100, 100);
  };


  if (!urgentCampaigns?.length) {
    return (
      <div className="w-full max-w-sm">
      </div>
    );
  }

  const currentCampaign = urgentCampaigns[index];
  const progressPercentage = calculateProgress(currentCampaign.current_amount, currentCampaign.target);

  // return (
  //   <div className="w-full max-w-sm">
  //     <AnimatePresence mode="wait">
  //       <motion.div
  //         key={currentCampaign.id}
  //         initial={{ opacity: 0, x: 50 }}
  //         animate={{ opacity: 1, x: 0 }}
  //         exit={{ opacity: 0, x: -50 }}
  //         transition={{ duration: 0.5, ease: "easeOut" }}
  //         className={`relative bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden border border-white/20 ${isRTL ? 'text-right' : 'text-left'}`}
  //         onMouseEnter={() => setIsPaused(true)}
  //         onMouseLeave={() => setIsPaused(false)}
  //       >
  //         {/* Image */}
  //         <div className="relative h-80 overflow-hidden">
  //           <img
  //             src={currentCampaign.files?.[0]?.url}
  //             alt={currentCampaign.name}
  //             className="w-full h-full object-cover"
  //           />
  //           <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

  //           {/* Campaign Name on Image */}
  //           <div className="absolute bottom-0 left-0 right-0 p-4">
  //             <h3 className="font-bold text-white line-clamp-2 text-base leading-tight mb-3 drop-shadow-lg">
  //               {currentCampaign.name}
  //             </h3>

  //             {/* Progress Bar on Image */}
  //             <div className="w-full bg-white/30 backdrop-blur-sm rounded-full h-2">
  //               <motion.div
  //                 className="h-full bg-[#FF9800] rounded-full shadow-lg"
  //                 initial={{ width: 0 }}
  //                 animate={{ width: `${progressPercentage}%` }}
  //                 transition={{ duration: 1, delay: 0.2 }}
  //               />
  //             </div>
  //           </div>
  //         </div>

  //         {/* Hover-revealed content */}
  //         <motion.div
  //           initial={{ opacity: 0, height: 0 }}
  //           animate={{ opacity: isPaused ? 1 : 0, height: isPaused ? 'auto' : 0 }}
  //           transition={{ duration: 0.3 }}
  //           className="overflow-hidden"
  //         >
  //           <div className="p-4 space-y-3">

  //           {/* Hover-revealed content */}
  //           <motion.div
  //             initial={{ opacity: 0, height: 0 }}
  //             animate={{ opacity: isPaused ? 1 : 0, height: isPaused ? 'auto' : 0 }}
  //             transition={{ duration: 0.3 }}
  //             className="overflow-hidden space-y-3"
  //           >
  //             {/* Urgent Header */}
  //             <div className="bg-gradient-to-r from-[#FF9800] to-[#FF9800]/80 text-white p-2 rounded-lg -mx-1">
  //               <div className={`flex items-center gap-2 ${isRTL ? '' : ''}`}>
  //                 <motion.div
  //                   animate={{ scale: [1, 1.1, 1] }}
  //                   transition={{ duration: 2, repeat: Infinity }}
  //                 >
  //                   <AlertCircle className="w-4 h-4" />
  //                 </motion.div>
  //                 <span className="text-xs font-bold">{t("hero.urgentNeed")}</span>
  //               </div>
  //             </div>

  //             <div className={`flex justify-between text-xs text-gray-600 ${isRTL ? '' : ''}`}>
  //               <span className="font-medium">
  //                 {currentCampaign.current_amount} {t("hero.raised")}
  //               </span>
  //               <span>{progressPercentage.toFixed(0)}%</span>
  //             </div>

  //             {/* Quick Stats */}
  //             <div className={`flex items-center justify-between text-xs text-gray-500 ${isRTL ? '' : ''}`}>
  //               <div className={`flex items-center gap-1 ${isRTL ? '' : ''}`}>
  //                 <Users className="w-3 h-3 text-[#3366CC]" />
  //                 {currentCampaign.number_of_donors} {t("hero.donors")}
  //               </div>
  //               <div className={isRTL ? 'text-left' : 'text-right'}>
  //                 {t("hero.goal")}: {currentCampaign.target}
  //               </div>
  //             </div>

  //             {/* Action Button */}
  //             <motion.a
  //               href={`/campaign/${currentCampaign.id}`}
  //               className="block w-full bg-[#FF9800] hover:bg-[#FF9800]/90 text-white py-2 px-4 rounded-lg font-medium text-center text-sm transition-colors duration-300"
  //               whileHover={{ scale: 1.02 }}
  //               whileTap={{ scale: 0.98 }}
  //             >
  //               <span className={`inline-flex items-center gap-2 ${isRTL ? '' : ''}`}>
  //                 {t("hero.helpNow")}
  //                 <ArrowRight className={`w-3 h-3 ${isRTL ? 'rotate-180' : ''}`} />
  //               </span>
  //             </motion.a>
  //             </motion.div>
  //           </div>
  //         </motion.div>
  //       </motion.div>
  //     </AnimatePresence>

  //     {/* Dots */}
  //     {urgentCampaigns.length > 1 && (
  //       <div className="flex justify-center mt-3 space-x-1">
  //         {urgentCampaigns.map((_, i) => (
  //           <button
  //             key={i}
  //             onClick={() => setIndex(i)}
  //             className={`w-2 h-2 rounded-full transition-all duration-300 ${
  //               i === index ? "bg-[#FF9800]" : "bg-gray-300"
  //             }`}
  //           />
  //         ))}
  //       </div>
  //     )}
  //   </div>
  // );




 return (
  <div className="w-full max-w-2xl">
    <AnimatePresence mode="wait">
      <motion.div
        key={currentCampaign.id}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`relative bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden border border-white/20 ${isRTL ? 'text-right' : 'text-left'}`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Image */}
        <div className="relative h-96 overflow-hidden">
          <img
            src={currentCampaign.files?.[0]?.url}
            alt={currentCampaign.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

          {/* Urgent Tag - Top Right */}
          <div className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'}`}>
            <div className="bg-[#FF9800] text-white px-3 py-1.5 rounded-lg shadow-lg">
              <div className="flex items-center gap-1.5">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <AlertCircle className="w-4 h-4" />
                </motion.div>
                <span className="text-xs font-bold">{t("hero.urgentNeed")}</span>
              </div>
            </div>
          </div>

          {/* Campaign Name on Image */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="font-bold text-white line-clamp-2 text-base leading-tight mb-3 drop-shadow-lg">
              {currentCampaign.name}
            </h3>

            {/* Progress Bar on Image */}
            <div className="w-full bg-white/30 backdrop-blur-sm rounded-full h-2">
              <motion.div
                className="h-full bg-[#FF9800] rounded-full shadow-lg"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1, delay: 0.2 }}
              />
            </div>

            {/* Content inside image */}
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: isPaused ? 1 : 0, height: isPaused ? 'auto' : 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mt-3 space-y-3"
            >
              <div className={`flex justify-between text-xs text-white ${isRTL ? '' : ''}`}>
                <span className="font-medium">
                  {currentCampaign.current_amount} {t("hero.raised")}
                </span>
                <span>{progressPercentage.toFixed(0)}%</span>
              </div>

              {/* Quick Stats */}
              <div className={`flex items-center justify-between text-xs text-white ${isRTL ? '' : ''}`}>
                <div className={`flex items-center gap-1 ${isRTL ? '' : ''}`}>
                  <Users className="w-3 h-3 text-white" />
                  {currentCampaign.number_of_donors} {t("hero.donors")}
                </div>
                <div className={isRTL ? 'text-left' : 'text-right'}>
                  {t("hero.goal")}: {currentCampaign.target}
                </div>
              </div>

              {/* Action Button */}
              <motion.a
                href={`/campaign/${currentCampaign.id}`}
                className="block w-full bg-[#FF9800] hover:bg-[#FF9800]/90 text-white py-2 px-4 rounded-lg font-medium text-center text-sm transition-colors duration-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className={`inline-flex items-center gap-2 ${isRTL ? '' : ''}`}>
                  {t("hero.helpNow")}
                  <ArrowRight className={`w-3 h-3 ${isRTL ? 'rotate-180' : ''}`} />
                </span>
              </motion.a>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>

    {/* Dots */}
    {urgentCampaigns.length > 1 && (
      <div className="flex justify-center mt-3 space-x-1">
        {urgentCampaigns.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${i === index ? "bg-[#FF9800]" : "bg-gray-300"}`}
          />
        ))}
      </div>
    )}
  </div>
);
}