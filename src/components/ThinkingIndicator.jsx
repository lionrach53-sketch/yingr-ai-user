import React from 'react';

const ThinkingIndicator = () => {
  return (
    <div className="flex justify-start items-center space-x-2 animate-pulse text-gray-400">
      <div className="w-3 h-3 rounded-full bg-gray-400"></div>
      <div className="w-3 h-3 rounded-full bg-gray-400"></div>
      <div className="w-3 h-3 rounded-full bg-gray-400"></div>
      <span className="ml-2 text-sm">L'IA réfléchit...</span>
    </div>
  );
};

export default ThinkingIndicator;
