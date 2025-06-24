import { HeroSection } from './sections/HeroSection';
import { StatisticsSection } from './sections/StatisticsSection';
import { CategoriesSection } from './sections/CategoriesSection';
import { FeaturedCampaignsCarousel } from './sections/FeaturedCampaignsCarousel';
import { TrendingCampaignsSection } from './sections/TrendingCampaignsSection';
import { CallToActionSection } from './sections/CallToActionSection';
import CampaignCard from '../../components/ui/CampaignCard';
import { fetchCampaigns, featuredCampaigns } from '../../api/endpoints/CampaignAPI';
import { useEffect, useState } from 'react';
import Loading from '../../components/common/Loading';

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
      console.log('Featured Data:', data);
      console.log('Featured Data type:', typeof data);
      console.log('Featured Data is array:', Array.isArray(data));
      
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
      <div className="pt-20 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button 
            onClick={() => loadCampaigns()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      {/* <CampaignCard data={campaigns} /> */}
      
      {/* Uncomment these sections when ready */}
      <HeroSection />
      {/* <StatisticsSection /> */}
      <CategoriesSection />
      <FeaturedCampaignsCarousel 
        Campaigns={featuredData || []} 
        loading={loading && !featuredData?.length} 
      />
      {/* <TrendingCampaignsSection Campaigns={trendingCampaigns} /> */}
      <CallToActionSection />
    </div>
  );
}