import React from 'react';
import { Zap } from 'lucide-react';

// Barre horizontale de catégories défilantes en haut du chat
const QuickSuggestions = ({ selectedCategory, onSelectCategory, isDarkMode }) => {
  const categories = [
    { id: 'general', label: 'Général', icon: '🌐', color: 'bg-blue-500' },
    { id: 'agriculture', label: 'Agriculture', icon: '🌾', color: 'bg-green-500' },
    { id: 'sante', label: 'Santé', icon: '🏥', color: 'bg-red-500' },
    { id: 'education', label: 'Éducation', icon: '🎓', color: 'bg-purple-500' },
    { id: 'culture', label: 'Culture', icon: '🎭', color: 'bg-yellow-500' },
    { id: 'technologie', label: 'Technologie', icon: '💻', color: 'bg-indigo-500' },
    { id: 'economie', label: 'Économie', icon: '💰', color: 'bg-emerald-500' },
    { id: 'droit', label: 'Droit', icon: '⚖️', color: 'bg-gray-500' }
  ];

  return (
    <div
      className={`px-4 py-3 border-y overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-gray-500/60 scrollbar-track-transparent ${
        isDarkMode
          ? 'border-gray-800 bg-gradient-to-r from-blue-900/20 via-gray-900/40 to-green-900/20'
          : 'border-gray-200 bg-gradient-to-r from-blue-50 via-white to-green-50'
      }`}
    >
      <div className="max-w-6xl mx-auto flex items-center space-x-3 min-w-max">
        <div className="flex items-center mr-2">
          <Zap
            size={18}
            className={isDarkMode ? 'text-yellow-400 mr-2' : 'text-yellow-500 mr-2'}
          />
          <span
            className={`text-sm font-semibold mr-1 ${
              isDarkMode ? 'text-gray-200' : 'text-gray-700'
            }`}
          >
            Catégories :
          </span>
        </div>

        {categories.map((cat) => {
          const isActive = cat.id === selectedCategory;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`group inline-flex items-center px-4 py-2 rounded-full text-sm font-medium mr-2 transition-all duration-200 border cursor-pointer ${
                isActive
                  ? `${cat.color} text-white shadow-md scale-105`
                  : isDarkMode
                    ? 'bg-gray-900/70 border-gray-700 text-gray-200 hover:bg-gray-800 hover:border-gray-500'
                    : 'bg-white border-gray-300 text-gray-800 hover:bg-gray-100 hover:border-gray-400'
              }`}
              title={`Questions sur ${cat.label} au Burkina Faso`}
            >
              <span className="mr-2 text-base">{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickSuggestions;