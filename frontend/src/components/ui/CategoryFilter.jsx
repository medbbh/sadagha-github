import React from 'react';
import { X } from 'lucide-react';

export default function CategoryFilter({ 
  categories = [], 
  selectedCategory = 'all', 
  onCategoryChange,
  showMobile = false,
  onCloseMobile,
  className = ''
}) {

  return (
    <div className={`lg:w-64 ${showMobile ? 'block' : 'hidden lg:block'} ${className}`}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Categories</h3>
          {showMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        <div className="space-y-2">
          {categories.map(category => {
            // Convert both to strings for proper comparison
            const categoryId = category.id.toString();
            const selectedId = selectedCategory.toString();
            const isSelected = selectedId === categoryId;
                        
            return (
              <button
                key={category.id}
                onClick={() => onCategoryChange && onCategoryChange(category.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                  isSelected
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <span className="font-medium">{category.name}</span>
                <span className={`text-sm ${
                  isSelected ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {category.campaign_count || 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* Clear Filter (only show if not 'all') */}
        {selectedCategory !== 'all' && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => onCategoryChange && onCategoryChange('all')}
              className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Clear Category Filter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}