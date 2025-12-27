// src/components/modals/FeedbackModal.jsx
import React, { useState } from 'react';

const FeedbackModal = ({ messageId, onClose }) => {
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(5);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Feedback submitted:', { messageId, feedback, rating });
    // Ici, vous enverriez le feedback à votre backend
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl max-w-md w-full">
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-2">Votre feedback</h2>
          <p className="text-gray-400 mb-6">
            Aidez-nous à améliorer l'IA en partageant votre avis
          </p>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-gray-300 mb-2">Note (1-5)</label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${rating >= star ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-400'}`}
                  >
                    {star}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-300 mb-2">Commentaire</label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                rows="4"
                placeholder="Que pouvons-nous améliorer ?"
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 rounded-lg font-medium"
              >
                Envoyer le feedback
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;