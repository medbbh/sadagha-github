import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function HeroSection() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#3366CC]/10 to-white py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className={`space-y-6 ${isRTL ? 'md:pl-8' : 'md:pr-8'}`}>
            <h1 className={`text-4xl md:text-5xl font-bold text-[#3366CC] leading-tight ${isRTL ? 'text-right' : 'text-left'}`}>
              <span className="block">
                {t('hero.title.fund')} <span className="text-[#4CAF50]">{t('hero.title.dreams')}</span>
                {isRTL ? '' : ','}
              </span>
              <span className="block">
                {t('hero.title.support')} <span className="text-[#FF9800]">{t('hero.title.innovation')}</span>
                {isRTL ? '،' : ''}
              </span>
            </h1>
            <p className={`text-lg text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('hero.subtitle')}
            </p>
            <div className={`flex space-x-4 pt-4 ${isRTL ? 'flex-row-reverse space-x-reverse float-right' : ''}`}>
              <a 
                href="/explore" 
                className={`px-6 py-3 bg-[#3366CC] hover:bg-[#2855AA] text-white rounded-lg font-medium transition-colors duration-300 flex items-center ${isRTL ? 'flex-row' : ''}`}
              >
                {t('hero.exploreCampaigns')}
                <ArrowRight className={`h-4 w-4 ${isRTL ? 'ml-2 rotate-180' : 'ml-2'}`} />
              </a>
            </div>

          </div>
          <div className="rounded-xl shadow-xl overflow-hidden h-96 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#3366CC]/80 to-transparent z-10"></div>
            <img 
              src="src/assets/hero-section.jpg" 
              alt={t('hero.imageAlt')}
              className="w-full h-full object-cover transform scale-105 hover:scale-100 transition-transform duration-700"
            />
            <div className={`absolute bottom-0 p-6 z-20 text-white ${isRTL ? 'right-0 text-right' : 'left-0 text-left'}`}>
              <p className="text-sm font-semibold bg-[#FF9800] inline-block px-2 py-1 rounded mb-2">
                {t('hero.featured')}
              </p>
              <h3 className="text-2xl font-bold">
                {t('hero.featuredTitle')}
              </h3>
              <p className="mt-2">
                {t('hero.featuredSubtitle')}
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Decorative elements */}
      <div className={`absolute top-20 w-32 h-32 bg-[#4CAF50]/10 rounded-full blur-2xl ${isRTL ? 'left-10' : 'right-10'}`}></div>
      <div className={`absolute bottom-10 w-40 h-40 bg-[#3366CC]/10 rounded-full blur-3xl ${isRTL ? 'right-10' : 'left-10'}`}></div>
    </section>
  );
}