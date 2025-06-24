// import { useSelector, useDispatch } from 'react-redux';
// import { useEffect } from 'react';
// import { fetchCategories } from '../api/endpoints/CategoryAPI';

// export const useCategoryInit = () => {
//   const dispatch = useDispatch();
//   const categoriesLoaded = useSelector((state) => !!state.category.list?.length);

//   useEffect(() => {
//     if (!categoriesLoaded) {
//       dispatch(fetchCategories());
//     }
//   }, [categoriesLoaded, dispatch]);
// };


// hooks/useCategoryInit.js
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { fetchCategories } from '../api/endpoints/CategoryAPI';

// Cache duration - 5 minutes
const CACHE_DURATION = 5 * 60 * 1000; 

export const useCategoryInit = () => {
  const dispatch = useDispatch();
  const { data, loading, lastFetched } = useSelector((state) => state.category);

  useEffect(() => {
    // Only fetch if:
    // 1. No data loaded OR
    // 2. Cache expired
    const shouldFetch = !loading && 
      (!data.length || !lastFetched || Date.now() - lastFetched > CACHE_DURATION);
    
    if (shouldFetch) {
      dispatch(fetchCategories());
    }
  }, [data.length, dispatch, lastFetched, loading]);
};