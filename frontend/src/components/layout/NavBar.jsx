import { useState, useEffect } from 'react';
import { Search, Menu, X, User, Heart, ChevronRight, Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import { getFavoriteCampaigns, getCampaignsByIds } from '../../api/endpoints/CampaignAPI';

export default function NavBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [error, setError] = useState('');
  const [showFavorites, setShowFavorites] = useState(false);
  const [favoriteCampaigns, setFavoriteCampaigns] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [displayedCount, setDisplayedCount] = useState(1); // Show 5 initially
  const [totalFavorites, setTotalFavorites] = useState(0);
  const { user, logout: authLogout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    setError('');
    try {
        const { error } = await supabase.auth.signOut();

        localStorage.removeItem('supabase.auth.token');
        localStorage.clear();

        if (error) {
        setError(error.message);
        console.error('Logout error:', error);
        } else {
        authLogout();
        navigate('/login');
        }
    } catch (err) {
        setError('An unexpected error occurred during logout');
        console.error('Logout error:', err);
    }
  };

  const loadFavoriteCampaigns = async (loadMore = false) => {
    if (!user) return;
    
    if (!loadMore) {
      setLoadingFavorites(true);
      setDisplayedCount(1); // Reset to initial count
    } else {
      setLoadingMore(true);
    }

    try {
      // Get all favorite campaign IDs
      const favoriteIds = await getFavoriteCampaigns();
      setTotalFavorites(favoriteIds.length);
      
      if (favoriteIds && favoriteIds.length > 0) {
        // Determine how many to fetch
        const countToShow = loadMore ? displayedCount + 5 : 5;
        const idsToFetch = favoriteIds.slice(0, Math.min(countToShow, favoriteIds.length));
        
        // Get campaigns by IDs
        const response = await getCampaignsByIds(idsToFetch);
        const campaigns = response.campaigns || response;
        
        setFavoriteCampaigns(campaigns);
        setDisplayedCount(idsToFetch.length);
      } else {
        setFavoriteCampaigns([]);
        setTotalFavorites(0);
        setDisplayedCount(0);
      }
    } catch (error) {
      console.error('Failed to load favorite campaigns:', error);
      setFavoriteCampaigns([]);
    } finally {
      setLoadingFavorites(false);
      setLoadingMore(false);
    }
  };

  const handleFavoritesClick = async () => {
    if (!showFavorites) {
      await loadFavoriteCampaigns();
    }
    setShowFavorites(!showFavorites);
  };

  const handleLoadMore = () => {
    loadFavoriteCampaigns(true);
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || amount === '') {
      return 'MRU 0';
    }
    const numValue = parseFloat(amount);
    if (isNaN(numValue)) {
      return 'MRU 0';
    }
    return new Intl.NumberFormat('en-US', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numValue) + ' MRU';
  };

  const calculateProgress = (current, target) => {
    const currentNum = parseFloat(current) || 0;
    const targetNum = parseFloat(target) || 1;
    return Math.min((currentNum / targetNum) * 100, 100);
  };

  const hasMoreToLoad = displayedCount < totalFavorites;

  return (
    <>
      <nav className={`fixed w-full z-50 ${scrolled ? 'bg-white shadow-sm py-3' : 'bg-white/90 py-4'} backdrop-blur-sm transition-all duration-300`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            {/* Logo - Left aligned */}
            <a 
              href="/" 
              className="text-lg font-medium text-[#3366CC] hover:opacity-80 transition-opacity duration-200"
            >
              SADA9A
            </a>

            {/* Centered Navigation Links - Desktop */}
            <div className="hidden md:flex items-center space-x-8 mx-8 flex-1 justify-center">
              <a 
                href="/explore" 
                className="text-[#3366CC] text-sm font-medium hover:opacity-70 transition-opacity duration-200"
              >
                Explore
              </a>
              <a 
                href="/volunteer" 
                className="text-[#3366CC] text-sm font-medium hover:opacity-70 transition-opacity duration-200"
              >
                Volunteer
              </a>
              <a 
                href="/start-campaign" 
                className="text-[#3366CC] text-sm font-medium hover:opacity-70 transition-opacity duration-200"
              >
                Start Campaign
              </a>
              <a 
                href="/how-it-works" 
                className="text-[#3366CC] text-sm font-medium hover:opacity-70 transition-opacity duration-200"
              >
                How It Works
              </a>
            </div>

            {/* Right Section - Conditional rendering based on auth state */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="relative hover:opacity-90 transition-opacity duration-200">
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-8 pr-4 py-1.5 rounded-full border border-[#3366CC]/30 focus:outline-none focus:ring-1 focus:ring-[#3366CC] focus:border-transparent text-sm w-40"
                />
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-[#3366CC]/60" />
              </div>

              {user && (
                <button
                  onClick={handleFavoritesClick}
                  className="relative p-2 rounded-md text-[#3366CC] hover:bg-[#3366CC]/5 transition-colors duration-200"
                  title="My Favorites"
                >
                  <Heart className="h-4 w-4" />
                  {totalFavorites > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {totalFavorites > 9 ? '9+' : totalFavorites}
                    </span>
                  )}
                </button>
              )}

              {user ? (
                <>
                <a 
                  href="/profile" 
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm text-[#3366CC] font-medium hover:bg-[#3366CC]/5 transition-colors duration-200"
                >
                  <div className="h-6 w-6 rounded-full bg-[#3366CC]/10 flex items-center justify-center">
                    {user.avatar ? (
                      <img src={user.avatar} alt="Profile" className="h-full w-full rounded-full object-cover" />
                    ) : (
                      <User className="h-3.5 w-3.5 text-[#3366CC]" />
                    )}
                  </div>
                  <span>{user.name || user.username}</span>
                </a>

                <button
                  onClick={handleLogout}
                  className="px-4 py-1.5 rounded-md text-sm bg-[#FF9800] text-white border border-[#FF9800] font-medium hover:bg-[#FB8C00] transition-colors duration-200"
                >
                  Logout
                </button>
                </>
              ) : (
                <a 
                  href="/login" 
                  className="px-4 py-1.5 rounded-md text-sm text-white bg-[#4CAF50] border border-[#4CAF50] font-medium hover:bg-[#43A047] transition-colors duration-200"
                >
                  Login
                </a>
              )}
            </div>

            {/* Mobile menu button - Right aligned */}
            <div className="md:hidden">
              <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="p-2 rounded-md text-[#3366CC] focus:outline-none hover:bg-[#3366CC]/5 transition-colors duration-200"
              >
                {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          <div className={`md:hidden transition-all duration-200 ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
            <div className="px-2 pt-2 pb-4 space-y-2 bg-white mt-3 rounded-md shadow-lg">
              <div className="relative mb-2">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-8 pr-4 py-2 rounded-full border border-[#3366CC]/30 focus:outline-none focus:ring-1 focus:ring-[#3366CC] text-sm"
                />
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#3366CC]/60" />
              </div>
              
              {user && (
                <button
                  onClick={handleFavoritesClick}
                  className="flex items-center justify-between w-full px-3 py-2 rounded text-sm font-medium text-[#3366CC] hover:bg-[#3366CC]/5 transition-colors duration-200"
                >
                  <div className="flex items-center space-x-2">
                    <Heart className="h-4 w-4" />
                    <span>My Favorites</span>
                  </div>
                  {totalFavorites > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {totalFavorites > 9 ? '9+' : totalFavorites}
                    </span>
                  )}
                </button>
              )}
              
              <a 
                href="/explore" 
                className="block px-3 py-2 rounded text-sm font-medium text-[#3366CC] hover:bg-[#3366CC]/5 transition-colors duration-200"
              >
                Explore
              </a>
              <a 
                href="/start-campaign" 
                className="block px-3 py-2 rounded text-sm font-medium text-[#3366CC] hover:bg-[#3366CC]/5 transition-colors duration-200"
              >
                Start Campaign
              </a>
              <a 
                href="/how-it-works" 
                className="block px-3 py-2 rounded text-sm font-medium text-[#3366CC] hover:bg-[#3366CC]/5 transition-colors duration-200"
              >
                How It Works
              </a>
              {user ? (
                <a 
                  href="/profile" 
                  className="flex items-center space-x-2 px-3 py-2 rounded text-sm font-medium text-[#3366CC] mt-2 hover:bg-[#3366CC]/5 transition-colors duration-200"
                >
                  <div className="h-5 w-5 rounded-full bg-[#3366CC]/10 flex items-center justify-center">
                    {user.avatar ? (
                      <img src={user.avatar} alt="Profile" className="h-full w-full rounded-full object-cover" />
                    ) : (
                      <User className="h-3 w-3 text-[#3366CC]" />
                    )}
                  </div>
                  <span>My Profile</span>
                </a>
              ) : (
                <a 
                  href="/login" 
                  className="block px-3 py-2 rounded text-sm font-medium text-white bg-[#4CAF50] border border-[#4CAF50] mt-2 text-center hover:bg-[#43A047] transition-colors duration-200"
                >
                  Login
                </a>
              )}
            </div>
          </div>
        </div>
        
        {/* Error display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">
            {error}
          </div>
        )}
      </nav>

      {/* Favorites Drawer */}
      <div className={`fixed inset-0 z-50 ${showFavorites ? 'visible' : 'invisible'}`}>
        {/* Backdrop */}
        <div 
          className={`absolute inset-0 bg-black transition-opacity duration-300 ${showFavorites ? 'opacity-50' : 'opacity-0'}`}
          onClick={() => setShowFavorites(false)}
        />
        
        {/* Drawer */}
        <div className={`absolute right-0 top-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ${showFavorites ? 'translate-x-0' : 'translate-x-full'}`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Heart className="h-5 w-5 text-red-600" />
              <h2 className="text-lg font-semibold text-gray-900">My Favorites</h2>
              {totalFavorites > 0 && (
                <span className="bg-gray-100 text-gray-600 text-sm px-2 py-1 rounded-full">
                  {displayedCount} of {totalFavorites}
                </span>
              )}
            </div>
            <button
              onClick={() => setShowFavorites(false)}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {loadingFavorites ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3366CC]"></div>
              </div>
            ) : favoriteCampaigns.length === 0 ? (
              <div className="text-center py-8 px-4">
                <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No favorite campaigns yet</p>
                <p className="text-sm text-gray-400">Start exploring and add campaigns to your favorites!</p>
                <Link
                  to="/explore"
                  className="inline-block mt-4 px-4 py-2 bg-[#3366CC] text-white rounded-lg hover:bg-[#2952A3] transition-colors"
                  onClick={() => setShowFavorites(false)}
                >
                  Explore Campaigns
                </Link>
              </div>
            ) : (
              <>
                <div className="p-4 space-y-4">
                  {favoriteCampaigns.map((campaign) => {
                    const progress = calculateProgress(campaign.current_amount, campaign.target);
                    return (
                      <Link
                        key={campaign.id}
                        to={`/campaign/${campaign.id}`}
                        onClick={() => setShowFavorites(false)}
                        className="block bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex space-x-3">
                          <img
                            src={campaign.files?.[0]?.url || '/api/placeholder/80/60'}
                            alt={campaign.name}
                            className="w-16 h-12 object-cover rounded-md flex-shrink-0"
                            onError={(e) => {
                              e.target.src = '/api/placeholder/80/60';
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                              {campaign.name}
                            </h3>
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                              <span>{formatCurrency(campaign.current_amount)}</span>
                              <span>{progress.toFixed(0)}% funded</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1">
                              <div 
                                className="bg-[#3366CC] h-1 rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Load More Button */}
                {hasMoreToLoad && (
                  <div className="p-4 border-t border-gray-200">
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 rounded-lg transition-colors text-sm font-medium text-gray-700 disabled:text-gray-400"
                    >
                      {loadingMore ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                          <span>Loading...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          <span>Load More ({totalFavorites - displayedCount} remaining)</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}