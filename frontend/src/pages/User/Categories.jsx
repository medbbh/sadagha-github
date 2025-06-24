import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, TrendingUp, Users, Target, ArrowRight, Grid, Heart } from 'lucide-react';
import { fetchCategories } from '../../api/endpoints/CategoryAPI';
import Loading from '../../components/common/Loading';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

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

  // Helper function to get category icon
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

  // Helper function to get category color
  const getCategoryColor = (index) => {
    const colors = [
      { bg: 'from-blue-500 to-blue-600', light: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
      { bg: 'from-green-500 to-green-600', light: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
      { bg: 'from-purple-500 to-purple-600', light: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
      { bg: 'from-orange-500 to-orange-600', light: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
      { bg: 'from-pink-500 to-pink-600', light: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700' },
      { bg: 'from-indigo-500 to-indigo-600', light: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700' },
      { bg: 'from-red-500 to-red-600', light: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
      { bg: 'from-teal-500 to-teal-600', light: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700' }
    ];
    return colors[index % colors.length];
  };

  const handleCategoryClick = (categoryId) => {
    console.log('Navigating to category:', categoryId); // Debug log
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
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Categories</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={loadCategories}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Explore Categories
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Discover campaigns across different causes and make a difference in the areas you care about most
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {categories.length}
                </div>
                <div className="text-blue-200">Categories</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {totalCampaigns.toLocaleString()}
                </div>
                <div className="text-blue-200">Active Campaigns</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                  24/7
                </div>
                <div className="text-blue-200">Support Available</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="relative max-w-md mx-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
            />
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
            <p className="text-gray-600">
              {searchQuery ? 'Try adjusting your search terms' : 'No categories available at the moment'}
            </p>
          </div>
        ) : (
          <>
            {/* Results Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {searchQuery ? `Search Results (${filteredCategories.length})` : 'All Categories'}
                </h2>
                <p className="text-gray-600 mt-1">
                  Choose a category to explore campaigns and make an impact
                </p>
              </div>
              
              <Link 
                to="/explore"
                className="hidden md:flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                View All Campaigns
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCategories.map((category, index) => {
                const colorScheme = getCategoryColor(index);
                const categoryIcon = getCategoryIcon(category.name);
                const campaignCount = category.campaign_count || 0;
                
                return (
                  <Link
                    key={category.id}
                    to={`/explore?category=${category.id}`}
                    className="group relative bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 text-left block"
                  >
                    {/* Gradient Header */}
                    <div className={`h-20 bg-gradient-to-r ${colorScheme.bg} relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-black/10"></div>
                      <div className="absolute top-4 right-4 text-white/80 text-xs font-medium">
                        {campaignCount} campaigns
                      </div>
                      <div className="absolute bottom-4 left-4 text-4xl">
                        {categoryIcon}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {category.name}
                        </h3>
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {category.description || `Explore ${category.name.toLowerCase()} campaigns and help make a difference in this important cause.`}
                      </p>

                      {/* Stats */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-gray-500">
                          <Target className="w-4 h-4 mr-1" />
                          <span>{campaignCount} active</span>
                        </div>
                        <div className={`px-2 py-1 ${colorScheme.light} ${colorScheme.border} border rounded-full`}>
                          <span className={`text-xs font-medium ${colorScheme.text}`}>
                            Explore
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Hover Effect Overlay */}
                    <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </Link>
                );
              })}
            </div>

            {/* Call to Action */}
            <div className="mt-16 text-center">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
                <div className="max-w-2xl mx-auto">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Can't find what you're looking for?
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Browse all campaigns or start your own to create positive change in your community.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                      to="/explore"
                      className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Grid className="w-5 h-5 mr-2" />
                      Browse All Campaigns
                    </Link>
                    <Link
                      to="/start-campaign"
                      className="inline-flex items-center px-6 py-3 bg-white text-blue-600 font-medium rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors"
                    >
                      <Heart className="w-5 h-5 mr-2" />
                      Start a Campaign
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