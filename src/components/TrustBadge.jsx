// src/components/TrustBadge.jsx
import React from 'react';

const TrustBadge = ({ level = "high" }) => {
  const getLevelInfo = () => {
    switch(level) {
      case 'high':
        return { text: 'Haute confiance', color: 'text-green-400', bg: 'bg-green-500/10', icon: '🛡️' };
      case 'medium':
        return { text: 'Confiance moyenne', color: 'text-yellow-400', bg: 'bg-yellow-500/10', icon: '⚠️' };
      case 'low':
        return { text: 'Faible confiance', color: 'text-red-400', bg: 'bg-red-500/10', icon: '🔍' };
      default:
        return { text: 'Non évalué', color: 'text-gray-400', bg: 'bg-gray-500/10', icon: '❓' };
    }
  };

  const { text, color, bg, icon } = getLevelInfo();

  return (
    <div className={`flex items-center space-x-2 px-3 py-1 rounded-lg ${bg} border border-gray-700`}>
      <span>{icon}</span>
      <span className={`text-sm font-medium ${color}`}>{text}</span>
    </div>
  );
};

export default TrustBadge;