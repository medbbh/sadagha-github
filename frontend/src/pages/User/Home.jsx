import { HeroSection } from './sections/HeroSection';
import { CategoriesSection } from './sections/CategoriesSection';
import { FeaturedCampaignsCarousel } from './sections/FeaturedCampaignsCarousel';
import { CallToActionSection } from './sections/CallToActionSection';
import { fetchCampaigns, featuredCampaigns } from '../../api/endpoints/CampaignAPI';
import { useEffect, useState } from 'react';
import Loading from '../../components/common/Loading';
import Footer from '../../components/Layout/Footer';
import { User } from 'lucide-react';
import UserRecommendationsSection from './sections/UserRecommendationsSection';

export default function HomePage() {
  const [campaigns, setCampaigns] = useState([]);
  const [featuredData, setFeaturedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  const [pagination, setPagination] = useState({ currentPage: 1 });

  // Function to load regular campaigns
  const loadCampaigns = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCampaigns({ page });
      setCampaigns(data.results); // API now returns data directly
      setLastFetched(Date.now());
      setPagination(prev => ({ ...prev, currentPage: page }));
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  // Function to load featured campaigns
  const loadFeaturedCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await featuredCampaigns();
      // console.log('Featured Data:', data);
      // console.log('Featured Data type:', typeof data);
      // console.log('Featured Data is array:', Array.isArray(data));
      
      // Ensure we're passing an array to the component
      if (Array.isArray(data)) {
        setFeaturedData(data);
      } else {
        console.warn('Featured data is not an array:', data);
        setFeaturedData([]);
      }
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch featured campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  // Simplified data fetching for regular campaigns
  useEffect(() => {
    const dataExpired = !campaigns?.length || 
      (Date.now() - (lastFetched || 0)) > (1 * 60 * 1000);
    
    if (dataExpired) {
      loadCampaigns(pagination?.currentPage || 1);
    } 
  }, [pagination?.currentPage, lastFetched, campaigns?.length]);

  // Fetch featured campaigns
  useEffect(() => {
    // Only fetch featured campaigns if they're not already loaded
    if (!featuredData?.length) {
      loadFeaturedCampaigns();
    }
  }, [featuredData?.length]);

  if (loading && !campaigns?.length) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white shadow-md rounded-lg p-8 max-w-sm w-full text-center">
        <div className="flex justify-center mb-4">
        <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100">
          <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>
        </div>
        <h2 className="text-lg font-semibold text-red-600 mb-2">Something went wrong</h2>
        <p className="text-gray-700 mb-4 break-words">Error: {error}</p>
        <button
        onClick={() => loadCampaigns()}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
        Retry
        </button>
      </div>
      </div>
    );
  }

  return (
    <div className="">      
      {/* Uncomment these sections when ready */}
      <HeroSection />
      <CategoriesSection />

      <UserRecommendationsSection userId={7} />

      <FeaturedCampaignsCarousel 
        Campaigns={featuredData || []} 
        loading={loading && !featuredData?.length} 
      />
      <CallToActionSection />

      {/* <Footer /> */}
    </div>
  );
}