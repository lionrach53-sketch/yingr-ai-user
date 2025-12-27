import React from 'react';
import { Moon, Sun } from 'lucide-react';

const ThemeToggle = ({ isDarkMode, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 focus:outline-none ${
        isDarkMode ? 'bg-blue-600' : 'bg-gray-300'
      }`}
      aria-label={`Passer en mode ${isDarkMode ? 'clair' : 'sombre'}`}
    >
      <span
        className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ${
          isDarkMode ? 'translate-x-6' : 'translate-x-1'
        }`}
      >
        {isDarkMode ? (
          <Moon size={10} className="mx-auto mt-0.5 text-blue-600" />
        ) : (
          <Sun size={10} className="mx-auto mt-0.5 text-yellow-500" />
        )}
      </span>
    </button>
  );
};

export default ThemeToggle;