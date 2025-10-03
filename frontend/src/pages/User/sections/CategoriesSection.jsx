import { useState, useRef, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fetchCategories } from '../../../api/endpoints/CategoryAPI';
import { iconMap } from '../../../utils/iconMap';

export function CategoriesSection() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const categoryRef = useRef(null);
  const [categoriesVisible, setCategoriesVisible] = useState(true);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        const data = await fetchCategories();
        setCategories(data.results || []);
      } catch (err) {
        console.error('Categories fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  // Force visibility after a short delay (in case of animation issues)
  useEffect(() => {
    const timer = setTimeout(() => {
      setCategoriesVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);


  // Helper function to get category color
  const getCategoryColor = (index) => {
    const colors = [
      '#3366CC', '#FF9800', '#4CAF50', '#E91E63', 
      '#9C27B0', '#FF5722', '#607D8B', '#795548'
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">{t('categories_section.loadingCategories')}</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center text-red-500">
            <p>{t('categories_section.errorLoading')} {error}</p>
          </div>
        </div>
      </section>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <section className="py-16 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center text-gray-500">
            <p>{t('categories_section.noCategories')}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={categoryRef} className="py-16 bg-gradient-to-b from-white to-blue-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className={`flex justify-between items-end mb-10 `}>
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h2 className="text-3xl font-bold text-blue-600">{t('categories_section.title')}</h2>
            <p className="text-gray-600 mt-2">{t('categories_section.subtitle')}</p>
          </div>
          <a 
            href="/categories" 
            className={`text-blue-600 font-medium flex items-center hover:underline `}
          >
            {t('categories_section.viewAll')} 
            <ChevronRight className={`h-4 w-4 ${isRTL ? 'mr-1 rotate-180' : 'ml-1'}`} />
          </a>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
          {categories.map((category, index) => {
            const categoryColor = getCategoryColor(index);
            const campaignCount = category.campaign_count || 0;
            
            return (
              <a 
                href={`/explore?category=${category.id}`} 
                key={category.id || index} 
                className="relative group rounded-xl overflow-hidden bg-white border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 opacity-100 translate-y-0"
                style={{ 
                  display: 'block',
                  visibility: 'visible'
                }}
              >
                <div 
                  className="p-6 flex flex-col items-center text-center transition-transform duration-300 group-hover:-translate-y-1"
                  style={{ 
                    backgroundColor: `${categoryColor}15`,
                    minHeight: '120px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  <div className="text-4xl mb-3" style={{ fontSize: '2.5rem' }}>
                      {(() => {
                        const IconComponent = iconMap[category.icon_class] || iconMap['folder'];
                        return <IconComponent size={24} strokeWidth={2} />;
                      })()}
                  </div>


                  <h3 className="font-semibold text-gray-800 text-sm mb-1" style={{ color: '#1f2937' }}>
                    {category.name || t('categories_section.unnamedCategory')}
                  </h3>
                  <p className="text-xs text-gray-500" style={{ color: '#6b7280' }}>
                    {campaignCount} {campaignCount === 1 ? t('categories_section.campaign') : t('categories_section.campaigns')}
                  </p>
                </div>
                <div 
                  className="h-1 w-full transition-transform duration-300 origin-left scale-x-0 group-hover:scale-x-100"
                  style={{ backgroundColor: categoryColor }}
                ></div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}