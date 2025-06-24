import React from 'react';
import { Grid, List } from 'lucide-react';

export default function ViewToggle({ 
  value = 'grid', 
  onChange,
  options = [
    { value: 'grid', icon: Grid, label: 'Grid View' },
    { value: 'list', icon: List, label: 'List View' }
  ],
  className = ''
}) {
  return (
    <div className={`flex border border-gray-300 rounded-lg overflow-hidden ${className}`}>
      {options.map(({ value: optionValue, icon: Icon, label }) => (
        <button
          key={optionValue}
          onClick={() => onChange && onChange(optionValue)}
          className={`p-2 transition-colors ${
            value === optionValue
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
          title={label}
          aria-label={label}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}