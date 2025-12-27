import React, { useState } from 'react';

const ApiKeyModal = ({ onClose, onSubmit, currentKey }) => {
  const [apiKey, setApiKey] = useState(currentKey || '');

  const handleSubmit = () => {
    if (!apiKey.trim()) return;
    onSubmit(apiKey);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 text-gray-100 p-6 rounded-xl w-96">
        <h2 className="text-lg font-bold mb-4">Configurer la clé API</h2>
        <input
          type="text"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Entrez votre clé API"
          className="w-full p-2 rounded bg-gray-700 text-white mb-4"
        />
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-green-600 rounded hover:bg-green-700"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
