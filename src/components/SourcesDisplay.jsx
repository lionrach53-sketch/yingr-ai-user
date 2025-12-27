import React from 'react';

const SourcesDisplay = ({ sources }) => {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-2 text-xs text-gray-300">
      Sources: {sources.map((src, i) => (
        <span key={i}>
          {src}{i < sources.length - 1 ? ', ' : ''}
        </span>
      ))}
    </div>
  );
};

export default SourcesDisplay;
