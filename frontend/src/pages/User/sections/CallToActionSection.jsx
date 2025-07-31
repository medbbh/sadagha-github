import { useTranslation } from 'react-i18next';

export function CallToActionSection() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <section className="py-20 bg-[#3366CC]">
      <div className={`max-w-4xl mx-auto px-6 text-center`}>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          {t('cta.title')}
        </h2>
        <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
          {t('cta.subtitle')}
        </p>
        <div className={`flex flex-col md:flex-row gap-4 justify-center `}>
          <a 
            href="/explore" 
            className="px-8 py-3 bg-[#FF9800] hover:bg-[#FB8C00] text-white border border-white/30 rounded-lg font-medium transition-colors duration-300"
          >
            {t('cta.exploreCampaigns')}
          </a>
        </div>
      </div>
    </section>
  );
}