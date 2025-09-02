import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Menu, X, User, Heart, ChevronRight, Plus, HandHeart } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { getFavoriteCampaigns, getCampaignsByIds } from '../../api/endpoints/CampaignAPI';
import NotificationBadge from '../../pages/User/NotificationBadge';
import { fetchMyVolunteerProfile } from '../../api/endpoints/VolunteerAPI';
import LanguageSelector from '../LanguageSelector';

export default function NavBar() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [error, setError] = useState('');
  const [showFavorites, setShowFavorites] = useState(false);
  const [favoriteCampaigns, setFavoriteCampaigns] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [displayedCount, setDisplayedCount] = useState(0);
  const [totalFavorites, setTotalFavorites] = useState(0);
  const [isToggling, setIsToggling] = useState(false);
  const { user, logout: authLogout } = useAuth();
  const [hasVolunteerProfile, setHasVolunteerProfile] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const abortControllerRef = useRef(null);
  const lastFetchRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check if user has volunteer profile
  useEffect(() => {
    const checkVolunteerProfile = async () => {
      try {
        const response = await fetchMyVolunteerProfile();
        if (response) {
          setHasVolunteerProfile(true);
        }
      } catch (err) {
        setHasVolunteerProfile(false);
      }
    };
    if (user) checkVolunteerProfile();
  }, []);

  // Listen for favorites changes across the app
  useEffect(() => {
    const handleFavoritesChange = () => {
      // Refresh favorites count when location changes (e.g., after favoriting)
      if (user && showFavorites) {
        loadFavoriteCampaigns();
      } else if (user) {
        // Just refresh the count without loading full data
        refreshFavoritesCount();
      }
    };

    // Listen for custom events from other components
    window.addEventListener('favoritesChanged', handleFavoritesChange);

    // Also refresh on location change (when navigating between pages)
    handleFavoritesChange();

    return () => {
      window.removeEventListener('favoritesChanged', handleFavoritesChange);
    };
  }, [location, user, showFavorites]);

  // Refresh just the favorites count (lightweight)
  const refreshFavoritesCount = useCallback(async () => {
    if (!user) return;

    try {
      const favoriteIds = await getFavoriteCampaigns();
      setTotalFavorites(favoriteIds?.length || 0);
    } catch (error) {
      console.error('Failed to refresh favorites count:', error);
    }
  }, [user]);

  // Initial load of favorites count when user logs in
  useEffect(() => {
    if (user) {
      refreshFavoritesCount();
    } else {
      setTotalFavorites(0);
      setFavoriteCampaigns([]);
      setDisplayedCount(0);
    }
  }, [user, refreshFavoritesCount]);

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

  const loadFavoriteCampaigns = useCallback(async (loadMore = false) => {
    if (!user) return;

    // Prevent multiple simultaneous requests
    const currentTime = Date.now();
    if (currentTime - lastFetchRef.current < 500) return;
    lastFetchRef.current = currentTime;

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    if (!loadMore) {
      setLoadingFavorites(true);
      setDisplayedCount(0);
    } else {
      setLoadingMore(true);
    }

    try {
      const favoriteIds = await getFavoriteCampaigns();

      // Check if request was aborted
      if (abortControllerRef.current.signal.aborted) return;

      setTotalFavorites(favoriteIds?.length || 0);

      if (favoriteIds && favoriteIds.length > 0) {
        const countToShow = loadMore ? displayedCount + 5 : 5;
        const idsToFetch = favoriteIds.slice(0, Math.min(countToShow, favoriteIds.length));

        const response = await getCampaignsByIds(idsToFetch);

        // Check if request was aborted
        if (abortControllerRef.current.signal.aborted) return;

        const campaigns = response.campaigns || response;

        setFavoriteCampaigns(campaigns || []);
        setDisplayedCount(idsToFetch.length);
      } else {
        setFavoriteCampaigns([]);
        setTotalFavorites(0);
        setDisplayedCount(0);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Failed to load favorite campaigns:', error);
        setFavoriteCampaigns([]);
      }
    } finally {
      setLoadingFavorites(false);
      setLoadingMore(false);
      abortControllerRef.current = null;
    }
  }, [user, displayedCount]);

  const handleFavoritesClick = useCallback(async () => {
    if (isToggling) return; // Prevent double-clicks

    setIsToggling(true);

    try {
      if (!showFavorites) {
        // Opening drawer - load favorites
        setShowFavorites(true);
        await loadFavoriteCampaigns();
      } else {
        // Closing drawer
        setShowFavorites(false);
      }
    } finally {
      // Add small delay to prevent rapid clicking
      setTimeout(() => setIsToggling(false), 300);
    }
  }, [showFavorites, loadFavoriteCampaigns, isToggling]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore) {
      loadFavoriteCampaigns(true);
    }
  }, [loadFavoriteCampaigns, loadingMore]);

  // Close drawer when clicking outside or pressing escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showFavorites) {
        setShowFavorites(false);
      }
    };

    if (showFavorites) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showFavorites]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

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
      {/* <nav className={`fixed w-full z-50 ${scrolled ? 'bg-white shadow-sm py-3' : 'bg-white/90 py-4'} backdrop-blur-sm transition-all duration-300`}> */}
      <nav className={`fixed w-full z-50 ${scrolled
        ? 'bg-gradient-to-br from-white/80 via-gray-50/70 to-white/80 shadow-xl py-2'
        : 'bg-gradient-to-br from-white/60 via-gray-50/50 to-white/60 py-1'
        } backdrop-blur-xl border-b border-white/30 transition-all duration-300`}>

        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            {/* Left Side */}
            <div className="hidden md:flex items-center space-x-6">
              {/* Browse Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setBrowseOpen(!browseOpen)}
                  className="flex items-center space-x-1 text-[#3366CC] text-md font-medium hover:opacity-70 transition-opacity duration-200"
                >
                  <span>{t('navbar.browse')}</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${browseOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {browseOpen && (
                  <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <Link
                      to="/explore"
                      className="block px-4 py-2 text-sm text-[#3366CC] hover:bg-[#3366CC]/5"
                      onClick={() => setBrowseOpen(false)}
                    >
                      {t('navbar.explore')}
                    </Link>
                    <Link
                      to="/categories"
                      className="block px-4 py-2 text-sm text-[#3366CC] hover:bg-[#3366CC]/5"
                      onClick={() => setBrowseOpen(false)}
                    >
                      {t('navbar.categories')}
                    </Link>
                    <Link
                      to="/organizations"
                      className="block px-4 py-2 text-sm text-[#3366CC] hover:bg-[#3366CC]/5"
                      onClick={() => setBrowseOpen(false)}
                    >
                      {t('navbar.organizations')}
                    </Link>
                  </div>
                )}
              </div>

              {/* Volunteer Link */}
              {
                user && (
                  <Link
                    to={hasVolunteerProfile ? "/volunteer/invitations" : "/profile?tab=volunteer"}
                    className="text-[#3366CC] text-md font-medium hover:opacity-70 transition-opacity duration-200 relative flex items-center space-x-1"
                  >
                    <HandHeart className="w-4 h-4" />
                    <span>{t('navbar.volunteer')}</span>
                    <NotificationBadge />
                  </Link>
                )
              }


              <Link
                to="/how-it-works"
                className="text-[#3366CC] text-md font-medium hover:opacity-70 transition-opacity duration-200"
              >
                {t('navbar.howItWorks')}
              </Link>

            </div>

            {/* Center - Logo */}
            <div className="flex-1 flex justify-center">
              {/* <a 
                href="/" 
                className="text-lg font-medium text-[#3366CC] hover:opacity-80 transition-opacity duration-200"
              >
                {t('navbar.logo')}
              </a> */}
              <Link to="/feed">
                <img src="/logo.png" alt="Logo" className="h-20 w-20" />

              </Link>
            </div>

            {/* Right Side */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="relative hover:opacity-90 transition-opacity duration-200">
                <input
                  type="text"
                  placeholder={t('navbar.search')}
                  className="ps-8 pe-4 py-1.5 rounded-full border border-[#3366CC]/30 focus:outline-none focus:ring-1 focus:ring-[#3366CC] focus:border-transparent text-sm w-40"
                />
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-[#3366CC]/60" />
              </div>

              <LanguageSelector />

              {user ? (
                <>
                  <a
                    href="/profile"
                    className="flex items-center space-x-2 px-3 py-1.5 rounded-md text-md text-[#3366CC] font-medium hover:bg-[#3366CC]/5 transition-colors duration-200"
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
                    {t('navbar.logout')}
                  </button>
                </>
              ) : (
                <a
                  href="/login"
                  className="px-4 py-1.5 rounded-md text-sm text-white bg-[#4CAF50] border border-[#4CAF50] font-medium hover:bg-[#43A047] transition-colors duration-200"
                >
                  {t('navbar.login')}
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
                  placeholder={t('navbar.search')}
                  className="w-full ps-8 pe-4 py-2 rounded-full border border-[#3366CC]/30 focus:outline-none focus:ring-1 focus:ring-[#3366CC] text-sm"
                />
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#3366CC]/60" />
              </div>

              <div className="border-t border-gray-200 pt-2">
                <button
                  onClick={() => setBrowseOpen(!browseOpen)}
                  className="flex items-center justify-between w-full px-3 py-2 rounded text-sm font-medium text-[#3366CC] hover:bg-[#3366CC]/5"
                >
                  <span>{t('navbar.browse')}</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${browseOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {browseOpen && (
                  <div className="ps-4 space-y-1">
                    <Link
                      to="/explore"
                      className="block px-3 py-2 rounded text-sm font-medium text-[#3366CC] hover:bg-[#3366CC]/5"
                      onClick={() => {
                        setBrowseOpen(false);
                        setIsOpen(false);
                      }}
                    >
                      {t('navbar.explore')}
                    </Link>
                    <Link
                      to="/categories"
                      className="block px-3 py-2 rounded text-sm font-medium text-[#3366CC] hover:bg-[#3366CC]/5"
                      onClick={() => {
                        setBrowseOpen(false);
                        setIsOpen(false);
                      }}
                    >
                      {t('navbar.categories')}
                    </Link>
                    <Link
                      to="/organizations"
                      className="block px-3 py-2 rounded text-sm font-medium text-[#3366CC] hover:bg-[#3366CC]/5"
                      onClick={() => {
                        setBrowseOpen(false);
                        setIsOpen(false);
                      }}
                    >
                      {t('navbar.organizations')}
                    </Link>
                  </div>
                )}
              </div>

              {/* Volunteer Link */}
              {
                user && (
                  <Link
                    to={hasVolunteerProfile ? "/volunteer/invitations" : "/profile?tab=volunteer"}
                    className="relative flex items-center space-x-2 px-3 py-2 rounded text-sm font-medium text-[#3366CC] hover:bg-[#3366CC]/5"
                    onClick={() => setIsOpen(false)}
                  >
                    <HandHeart className="h-4 w-4" />
                    <span>{t('navbar.volunteer')}</span>
                    <NotificationBadge />
                  </Link>
                )
              }


              <Link
                to="/how-it-works"
                className="block px-3 py-2 rounded text-sm font-medium text-[#3366CC] hover:bg-[#3366CC]/5"
                onClick={() => setIsOpen(false)}
              >
                {t('navbar.howItWorks')}
              </Link>

              {user && (
                <button
                  onClick={handleFavoritesClick}
                  disabled={isToggling}
                  className={`flex items-center justify-between w-full px-3 py-2 rounded text-sm font-medium text-[#3366CC] hover:bg-[#3366CC]/5 transition-colors duration-200 ${isToggling ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                  <div className="flex items-center space-x-2">
                    <Heart className="h-4 w-4" />
                    <span>{t('navbar.favorites')}</span>
                  </div>
                  {totalFavorites > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {totalFavorites > 9 ? '9+' : totalFavorites}
                    </span>
                  )}
                </button>
              )}

              <div className="px-3 py-2">
                <LanguageSelector />
              </div>

              {user ? (
                <div className="border-t border-gray-200 pt-2">
                  <Link
                    to="/profile"
                    className="flex items-center space-x-2 px-3 py-2 rounded text-sm font-medium text-[#3366CC] hover:bg-[#3366CC]/5"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="h-5 w-5 rounded-full bg-[#3366CC]/10 flex items-center justify-center">
                      {user.avatar ? (
                        <img src={user.avatar} alt="Profile" className="h-full w-full rounded-full object-cover" />
                      ) : (
                        <User className="h-3 w-3 text-[#3366CC]" />
                      )}
                    </div>
                    <span>{user.user_metadata.full_name}</span>
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="w-full mt-2 px-3 py-2 rounded text-sm font-medium text-white bg-[#FF9800] border border-[#FF9800] text-center hover:bg-[#FB8C00]"
                  >
                    {t('navbar.logout')}
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="block px-3 py-2 rounded text-sm font-medium text-white bg-[#4CAF50] border border-[#4CAF50] mt-2 text-center hover:bg-[#43A047]"
                  onClick={() => setIsOpen(false)}
                >
                  {t('navbar.login')}
                </Link>
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
        <div className={`absolute right-0 top-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ease-out ${showFavorites ? 'translate-x-0' : 'translate-x-full'}`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Heart className="h-5 w-5 text-red-600" />
              <h2 className="text-lg font-semibold text-gray-900">{t('navbar.favorites')}</h2>
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
                <p className="text-gray-500 mb-2">{t('navbar.noFavorites')}</p>
                <p className="text-sm text-gray-400">{t('navbar.noFavoritesSubtext')}</p>
                <Link
                  to="/explore"
                  className="inline-block mt-4 px-4 py-2 bg-[#3366CC] text-white rounded-lg hover:bg-[#2952A3] transition-colors"
                  onClick={() => setShowFavorites(false)}
                >
                  {t('navbar.exploreCampaigns')}
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
                              <span>{progress.toFixed(0)}% {t('navbar.funded')}</span>
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
                          <span>{t('navbar.loading')}</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          <span>{t('navbar.loadMore')} ({totalFavorites - displayedCount} {t('navbar.remaining')})</span>
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