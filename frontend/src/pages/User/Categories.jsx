import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Grid, Heart } from 'lucide-react';
import { fetchCategories } from '../../api/endpoints/CategoryAPI';
import Loading from '../../components/common/Loading';

export default function Categories() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // Format numbers - always use Latin numerals even for Arabic
  const formatNumber = (num) => {
    const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';
    return new Intl.NumberFormat(locale).format(num || 0);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCategories();
      
      console.log('Categories API response:', data);
      
      // Handle different response structures
      let categoriesData = [];
      if (data && data.results) {
        categoriesData = data.results;
        console.log('Using data.results:', categoriesData);
      } else if (Array.isArray(data)) {
        categoriesData = data;
        console.log('Using data directly:', categoriesData);
      } else {
        console.log('Unexpected data structure:', data);
        categoriesData = [];
      }
      
      setCategories(categoriesData);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch categories:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter categories based on search
  const filteredCategories = categories.filter(category =>
    category.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper function to get category icon (simplified)
  const getCategoryIcon = (categoryName) => {
    const icons = {
      'health': '🏥',
      'education': '📚',
      'environment': '🌱',
      'technology': '💻',
      'arts': '🎨',
      'sports': '⚽',
      'community': '🏘️',
      'animals': '🐾',
      'emergency': '🚨',
      'food': '🍽️',
      'disaster': '🌪️',
      'medical': '🩺',
      'children': '👶',
      'elderly': '👴',
      'women': '👩',
      'youth': '🧑',
      'music': '🎵',
      'film': '🎬',
      'culture': '🎭',
      'religion': '⛪',
      'charity': '❤️'
    };
    
    const name = categoryName?.toLowerCase() || '';
    const matchedIcon = Object.keys(icons).find(key => name.includes(key));
    return icons[matchedIcon] || '📁';
  };

  const handleCategoryClick = (categoryId) => {
    console.log('Navigating to category:', categoryId);
    navigate(`/explore?category=${categoryId}`);
  };

  // Calculate total campaigns across all categories
  const totalCampaigns = categories.reduce((sum, category) => {
    const count = category.campaign_count || category.campaigns_count || 0;
    return sum + count;
  }, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('categories.errorTitle')}</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={loadCategories}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('categories.tryAgain')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header Section - Warmer with subtle gradient */}
      <div className="bg-gradient-to-b from-blue-50 to-white border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
              <Grid className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('categories.title')}
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('categories.subtitle')}
            </p>
          </div>
          
          {/* Warmer Stats Cards */}
          <div className="flex justify-center">
            <div className={`flex items-center gap-6 `}>
              <div className="bg-white rounded-xl border border-blue-100 px-6 py-4 shadow-sm">
                <div className="text-center">
                  <span className="block text-2xl font-bold text-blue-600">{formatNumber(categories.length)}</span>
                  <span className="text-sm text-gray-600">{t('categories.stats.categories')}</span>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-green-100 px-6 py-4 shadow-sm">
                <div className="text-center">
                  <span className="block text-2xl font-bold text-green-600">{formatNumber(totalCampaigns)}</span>
                  <span className="text-sm text-gray-600">{t('categories.stats.activeCampaigns')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Section - Warmer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-md mx-auto">
          <div className="relative">
            <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-blue-400" />
            </div>
            <input
              type="text"
              placeholder={t('categories.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full ps-10 pe-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Categories Grid - Clean Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-50 rounded-full mx-auto mb-6">
              <Search className="w-10 h-10 text-blue-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-3">{t('categories.noCategoriesFound')}</h3>
            <p className="text-gray-600 text-lg">
              {searchQuery ? t('categories.adjustSearch') : t('categories.noCategoriesAvailable')}
            </p>
          </div>
        ) : (
          <>
            {/* Results Header */}
            <div className={`flex items-center justify-between mb-8 `}>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {searchQuery ? t('categories.searchResults', { count: filteredCategories.length }) : t('categories.allCategories')}
                </h2>
                <p className="text-gray-600 mt-1">
                  {t('categories.chooseCategory')}
                </p>
              </div>
              
              {/* fix arrow */}
              <Link 
                to="/explore"
                className={`hidden md:flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors `}
              >
                {t('categories.viewAllCampaigns')}
              <ArrowRight className={`w-4 h-4 ${isRTL ? 'me-1 rotate-180' : 'ms-1'}`} />
              </Link>
            </div>

            {/* Warmer Categories Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCategories.map((category, index) => {
                const categoryIcon = getCategoryIcon(category.name);
                const campaignCount = category.campaign_count || 0;
                
                // Subtle background variations for warmth
                const backgroundVariations = [
                  'bg-gradient-to-br from-blue-50 to-white',
                  'bg-gradient-to-br from-green-50 to-white', 
                  'bg-gradient-to-br from-purple-50 to-white',
                  'bg-gradient-to-br from-orange-50 to-white',
                  'bg-gradient-to-br from-pink-50 to-white',
                  'bg-gradient-to-br from-indigo-50 to-white'
                ];
                const bgVariation = backgroundVariations[index % backgroundVariations.length];
                
                return (
                  <Link
                    key={category.id}
                    to={`/explore?category=${category.id}`}
                    className={`group ${bgVariation} rounded-xl border border-gray-100 p-6 hover:shadow-lg hover:border-blue-200 hover:-translate-y-1 transition-all duration-200 block`}
                  >
                    {/* Icon and Count with subtle background */}
                    <div className={`flex items-center justify-between mb-4 `}>
                      <div className="flex items-center justify-center w-12 h-12 bg-white rounded-lg shadow-sm">
                        <span className="text-2xl">{categoryIcon}</span>
                      </div>
                      <div className="bg-white/70 px-2 py-1 rounded-full text-xs font-medium text-gray-600">
                        {formatNumber(campaignCount)}
                      </div>
                    </div>

                    {/* Category Name */}
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                      {category.name}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {category.description || t('categories.defaultDescription', { category: category.name.toLowerCase() })}
                    </p>

                    {/* Action with enhanced styling */}
                    <div className={`flex items-center justify-between `}>
                      <span className="text-sm font-medium text-blue-600 group-hover:text-blue-700 bg-blue-50 group-hover:bg-blue-100 px-3 py-1 rounded-full transition-colors">
                        {t('categories.explore')}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:shadow-md group-hover:bg-blue-50 transition-all">
                        <ArrowRight className={`w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors ${isRTL ? 'rotate-180' : ''}`} />

                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Call to Action - Warmer and more inviting */}
            <div className="mt-16">
              <div className="bg-gradient-to-r from-blue-50 via-white to-green-50 rounded-2xl border border-blue-100 p-8 text-center relative overflow-hidden">
                {/* Subtle background decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-green-100 rounded-full translate-y-12 -translate-x-12 opacity-50"></div>
                
                <div className="relative">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
                    <Heart className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {t('categories.cta.title')}
                  </h3>
                  <p className="text-gray-600 mb-8 max-w-2xl mx-auto text-lg">
                    {t('categories.cta.description')}
                  </p>
                  <div className={`flex flex-col sm:flex-row gap-4 justify-center `}>
                    <Link
                      to="/explore"
                      className={`inline-flex items-center px-8 py-4 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ${isRTL ? 'flex-row-reverse' : ''}`}
                    >
                      <Grid className={`w-5 h-5 ${isRTL ? 'ms-2' : 'me-2'}`} />
                      {t('categories.cta.browseAll')}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}