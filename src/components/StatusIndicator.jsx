import React, { useState, useEffect } from 'react';
import { checkBackendStatus } from '../services/api';

const StatusIndicator = ({ isOnline: propIsOnline }) => {
  const [isOnline, setIsOnline] = useState(propIsOnline);
  const [isChecking, setIsChecking] = useState(false);
  
  useEffect(() => {
    setIsOnline(propIsOnline);
  }, [propIsOnline]);
  
  const handleCheck = async () => {
    setIsChecking(true);
    const status = await checkBackendStatus();
    setIsOnline(status);
    setIsChecking(false);
  };
  
  return (
    <div className="flex items-center space-x-2">
      <div className="relative">
        <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}>
          {isOnline && (
            <div className="absolute inset-0 bg-green-500 rounded-full animate-ping"></div>
          )}
        </div>
      </div>
      <span className="text-sm">
        {isOnline ? 'Backend en ligne' : 'Backend hors ligne'}
      </span>
      <button
        onClick={handleCheck}
        disabled={isChecking}
        className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors disabled:opacity-50"
      >
        {isChecking ? 'Vérification...' : 'Vérifier'}
      </button>
    </div>
  );
};

export default StatusIndicator;