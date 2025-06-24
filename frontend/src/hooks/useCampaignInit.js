import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { fetchCampaigns } from '../api/endpoints/CampaignAPI';

const CACHE_DURATION = 1 * 60 * 1000; // 5 minutes cache

export const useCampaignInit = (options = {}) => {
  const dispatch = useDispatch();
  const { 
    data, 
    loading, 
    lastFetched,
    pagination 
  } = useSelector((state) => state.campaign);

  const { 
    forceRefresh = false,
    page = 1,
    limit = 10,
    categoryId = null
  } = options;

  useEffect(() => {
    const shouldFetch = forceRefresh || 
      !loading && (
        !data.length || 
        !lastFetched || 
        Date.now() - lastFetched > CACHE_DURATION
      );

    if (shouldFetch) {
      dispatch(fetchCampaigns({ page, limit, categoryId }));
    }
  }, [data.length, dispatch, forceRefresh, lastFetched, loading, page, limit, categoryId]);

  return { 
    campaigns: data, 
    loading, 
    pagination,
    refresh: () => dispatch(fetchCampaigns({ page, limit, categoryId, forceRefresh: true }))
  };
};