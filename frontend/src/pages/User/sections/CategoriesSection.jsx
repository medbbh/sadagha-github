import { useState, useRef, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { fetchCategories } from '../../../api/endpoints/CategoryAPI';

export function CategoriesSection() {
  const categoryRef = useRef(null);
  const [categoriesVisible, setCategoriesVisible] = useState(true); // Force visibility
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
      'food': '🍽️'
    };
    
    const name = categoryName?.toLowerCase() || '';
    const matchedIcon = Object.keys(icons).find(key => name.includes(key));
    return icons[matchedIcon] || '📁';
  };

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
            <p className="text-gray-600">Loading categories...</p>
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
            <p>Error loading categories: {error}</p>
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
            <p>No categories available at the moment.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={categoryRef} className="py-16 bg-gradient-to-b from-white to-blue-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-bold text-blue-600">explore campaigns Categories</h2>
            <p className="text-gray-600 mt-2">Discover Campaigns by the cause they support</p>
          </div>
          <a href="/categories" className="text-blue-600 font-medium flex items-center hover:underline">
            View All <ChevronRight className="h-4 w-4 ml-1" />
          </a>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
          {categories.map((category, index) => {
            const categoryColor = getCategoryColor(index);
            const categoryIcon = getCategoryIcon(category.name);
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
                    {categoryIcon}
                  </div>
                  <h3 className="font-semibold text-gray-800 text-sm mb-1" style={{ color: '#1f2937' }}>
                    {category.name || 'Unnamed Category'}
                  </h3>
                  <p className="text-xs text-gray-500" style={{ color: '#6b7280' }}>
                    {campaignCount} Campaigns
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