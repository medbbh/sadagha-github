import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchCampaigns } from '../../api/endpoints/CampaignAPI';
import { fetchCategories } from '../../api/endpoints/CategoryAPI';
import CampaignCard from '../../components/ui/CampaignCard';
import SearchBar from '../../components/ui/SearchBar';
import CategoryFilter from '../../components/ui/CategoryFilter';
import Pagination from '../../components/ui/Pagination';
import ViewToggle from '../../components/ui/ViewToggle';
import SortDropdown from '../../components/ui/SortDropdown';
import Loading from '../../components/common/Loading';
import { Search, SlidersHorizontal } from 'lucide-react';

export default function ExploreCampaigns() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // State management
  const [campaigns, setCampaigns] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allCampaignsCount, setAllCampaignsCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [error, setError] = useState(null);

  // URL parameters
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  // Initialize state from URL parameters
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const searchParam = searchParams.get('search');
    const sortParam = searchParams.get('sort');
    const pageParam = searchParams.get('page');

    console.log('URL params:', { categoryParam, searchParam, sortParam, pageParam });

    // Set state from URL parameters with proper type conversion
    if (categoryParam && categoryParam !== selectedCategory) {
      console.log('Setting category from URL:', categoryParam);
      setSelectedCategory(categoryParam);
    }
    if (searchParam && searchParam !== searchQuery) {
      setSearchQuery(searchParam);
    }
    if (sortParam && sortParam !== sortBy) {
      setSortBy(sortParam);
    }
    if (pageParam && parseInt(pageParam) !== currentPage) {
      setCurrentPage(parseInt(pageParam));
    }
  }, [searchParams]);

  // Load campaigns whenever URL changes or state changes
  useEffect(() => {
    console.log('Loading campaigns due to state change:', { 
      currentPage, 
      selectedCategory, 
      sortBy, 
      searchQuery 
    });
    loadCampaigns();
  }, [currentPage, selectedCategory, sortBy, searchQuery]);

  // Load data on mount
  useEffect(() => {
    loadCategories();
    loadAllCampaignsCount();
  }, []);

  // Update URL parameters when state changes
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (searchQuery) params.set('search', searchQuery);
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (sortBy !== 'newest') params.set('sort', sortBy);
    if (currentPage > 1) params.set('page', currentPage.toString());
    
    setSearchParams(params);
  }, [searchQuery, selectedCategory, sortBy, currentPage, setSearchParams]);

  const loadCategories = async () => {
    try {
      const data = await fetchCategories();
      
      console.log('Categories API response in Explore:', data);
      
      // Handle different response structures
      let categoriesData = [];
      if (data && data.results) {
        categoriesData = data.results;
      } else if (Array.isArray(data)) {
        categoriesData = data;
      } else {
        categoriesData = [];
      }
      
      setCategories(categoriesData);
      console.log('Categories loaded:', categoriesData);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const loadAllCampaignsCount = async () => {
    try {
      // Fetch all campaigns without filters to get total count
      const data = await fetchCampaigns({ page: 1 });
      setAllCampaignsCount(data.count || (data.results ? data.results.length : 0));
    } catch (err) {
      console.error('Failed to fetch total campaigns count:', err);
    }
  };

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: currentPage,
        search: searchQuery || undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        ordering: getSortParam(sortBy)
      };

      // Remove undefined params
      Object.keys(params).forEach(key => {
        if (params[key] === undefined) {
          delete params[key];
        }
      });

      console.log('Loading campaigns with params:', params);

      const data = await fetchCampaigns(params);
      console.log('Campaigns API response:', data);
      setCampaigns(data.results || data);
      
      // Calculate total pages if pagination data is available
      if (data.count && data.results) {
        const pageSize = data.results.length || 12;
        setTotalPages(Math.ceil(data.count / pageSize));
      } else {
        setTotalPages(1);
      }
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSortParam = (sortOption) => {
    const sortMap = {
      'newest': '-created_at',
      'oldest': 'created_at',
      'most-funded': '-current_amount',
      'most-donors': '-number_of_donors'
    };
    return sortMap[sortOption] || '-created_at';
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleCategoryChange = (categoryId) => {
    console.log('Category changed to:', categoryId);
    setSelectedCategory(categoryId.toString());
    setCurrentPage(1);
    setShowMobileFilters(false);
  };

  const handleSortChange = (sortOption) => {
    setSortBy(sortOption);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setCurrentPage(1);
    setShowMobileFilters(false);
  };

  const hasActiveFilters = searchQuery || selectedCategory !== 'all';

  // Prepare categories with proper counts
  const categoriesWithCount = [
    { 
      id: 'all', 
      name: t('explore.allCategories'), 
      campaign_count: allCampaignsCount 
    },
    ...categories.map(cat => ({
      ...cat,
      id: cat.id.toString(), // Ensure ID is string for consistency
      campaign_count: cat.campaign_count || 0
    }))
  ];

  // Get translated sort options
  const getSortOptions = () => [
    { value: 'newest', label: t('explore.sortOptions.newest') },
    { value: 'oldest', label: t('explore.sortOptions.oldest') },
    { value: 'most-funded', label: t('explore.sortOptions.mostFunded') },
    { value: 'most-donors', label: t('explore.sortOptions.mostDonors') }
  ];

  // Empty state component
  const EmptyState = () => (
    <div className="text-center py-12">
      <div className="text-gray-400 mb-4">
        <Search className="h-16 w-16 mx-auto" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{t('explore.noCampaignsFound')}</h3>
      <p className="text-gray-600 mb-4">
        {t('explore.noCampaignsSubtext')}
      </p>
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          {t('explore.clearAllFilters')}
        </button>
      )}
    </div>
  );

  // Error state component
  const ErrorState = () => (
    <div className="text-center py-12">
      <div className="text-red-400 mb-4">
        <div className="h-16 w-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
          <span className="text-2xl">⚠️</span>
        </div>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{t('explore.errorLoadingCampaigns')}</h3>
      <p className="text-gray-600 mb-4">{error}</p>
      <button
        onClick={loadCampaigns}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        {t('explore.tryAgain')}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className={`text-center mb-8 `}>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('explore.title')}</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('explore.subtitle')}
            </p>
          </div>

          {/* Search and Controls */}
          <div className={`flex flex-col lg:flex-row gap-4 items-center justify-between ${isRTL ? 'lg:flex-row-reverse' : ''}`}>
            {/* Search Bar */}
            <div className="flex-1 max-w-md">
              <SearchBar
                value={searchQuery}
                onChange={handleSearch}
                placeholder={t('explore.searchPlaceholder')}
              />
            </div>

            {/* Filter Controls */}
            <div className={`flex items-center space-x-4 ${isRTL ? 'flex-row-reverse space-x-reverse' : ''}`}>
              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className={`lg:hidden flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <SlidersHorizontal className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('explore.filters')}
              </button>

              {/* Sort Dropdown */}
              <SortDropdown
                value={sortBy}
                onChange={handleSortChange}
                options={getSortOptions()}
              />

              {/* View Mode Toggle */}
              <ViewToggle
                value={viewMode}
                onChange={setViewMode}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`flex flex-col lg:flex-row gap-8 ${isRTL ? 'lg:flex-row-reverse' : ''}`}>
          {/* Sidebar - Category Filter */}
          <CategoryFilter
            categories={categoriesWithCount}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            showMobile={showMobileFilters}
            onCloseMobile={() => setShowMobileFilters(false)}
          />

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Results Header */}
            <div className={`flex items-center justify-between mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <p className={`text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                {loading ? t('explore.loading') : 
                  `${t('explore.showing')} ${campaigns.length} ${campaigns.length === 1 ? t('explore.campaign') : t('explore.campaigns')}`
                }
                {selectedCategory !== 'all' && !loading && (
                  <span> {t('explore.in')} <span className="font-medium text-blue-600">
                    {categoriesWithCount.find(c => c.id === selectedCategory)?.name || 'Selected Category'}
                  </span></span>
                )}
              </p>
              
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                >
                  {t('explore.clearFilters')}
                </button>
              )}
            </div>

            {/* Content */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loading />
              </div>
            ) : error ? (
              <ErrorState />
            ) : campaigns.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                {/* Campaigns Display */}
                <div className={
                  viewMode === 'grid' 
                    ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                    : "space-y-6"
                }>
                  {campaigns.map(campaign => (
                    <CampaignCard
                      key={campaign.id}
                      data={campaign}
                      viewMode={viewMode}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}