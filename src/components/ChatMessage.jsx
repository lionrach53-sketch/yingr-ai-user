import React from 'react';
import SourcesDisplay from './SourcesDisplay';

const ChatMessage = ({ message, onFeedback, onEdit }) => {
  const isUser = message.role === 'user';
  const isAI = message.role === 'ai' || message.role === 'assistant';

  // Fonction pour détecter si le message contient un fichier uploadé
  const hasFile = message.fileUrl || message.file_url;
  const fileUrl = message.fileUrl || message.file_url;
  const fileName = message.fileName || message.file_name || fileUrl?.split('/').pop();
  
  // Détecter si c'est une image
  const isImage = fileUrl && /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl);

  // Fonction pour formater le contenu avec des sauts de ligne
  const formatContent = (content) => {
    if (!content) return null;
    
    // Remplacer les \n par des <br />
    let formatted = content.replace(/\n/g, '<br />');
    
    // Détecter et formater les listes à puces (tirets)
    formatted = formatted.replace(/- ([^\n<]+)/g, '<div class="ml-4 my-1">• $1</div>');
    
    // Détecter et formater les listes numérotées
    formatted = formatted.replace(/(\d+)\) ([^\n<]+)/g, '<div class="ml-4 my-1"><strong>$1)</strong> $2</div>');
    
    // Ajouter un espace après les emojis en début de ligne
    formatted = formatted.replace(/(^|<br \/>)([\u{1F300}-\u{1F9FF}])/gu, '$1$2 ');
    
    // Détecter les titres avec ** ou émojis
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-yellow-300">$1</strong>');
    
    return <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] p-4 rounded-lg break-words
        ${isUser ? 'bg-green-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-100 rounded-bl-none'}`}>
        
        {/* Contenu texte formaté */}
        {message.content && <div className="mb-2 leading-relaxed">{formatContent(message.content)}</div>}
        
        {/* Affichage fichier/image */}
        {hasFile && (
          <div className="mt-2 mb-2">
            {isImage ? (
              // Preview image
              <div className="rounded-lg overflow-hidden max-w-xs">
                <img 
                  src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${fileUrl}`} 
                  alt={fileName}
                  className="w-full h-auto cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => window.open(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${fileUrl}`, '_blank')}
                />
                <div className="text-xs mt-1 opacity-70">
                  📷 {fileName}
                </div>
              </div>
            ) : (
              // Lien fichier
              <a 
                href={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${fileUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-sm hover:underline opacity-90 hover:opacity-100"
              >
                <span>📄</span>
                <span>{fileName}</span>
                <span className="text-xs">(cliquez pour ouvrir)</span>
              </a>
            )}
          </div>
        )}
        
        {/* Sources IA */}
        {isAI && message.sources && <SourcesDisplay sources={message.sources} />}
        
        {/* Audio Player (Mooré et Dioula) */}
        {isAI && message.audio_url && (
          <div className="mt-3 mb-2">
            <audio 
              controls 
              className="w-full max-w-md rounded-lg"
              style={{ height: '40px' }}
            >
              <source src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${message.audio_url}`} type="audio/mpeg" />
              <source src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${message.audio_url.replace('.mp3', '.wav')}`} type="audio/wav" />
              Votre navigateur ne supporte pas l'audio.
            </audio>
            <div className="text-xs mt-1 opacity-70 flex items-center space-x-2">
              <span>🔊</span>
              <span>
                {message.audio_mode === 'pre_recorded' && '✨ Audio natif'}
                {message.audio_mode === 'tts_generated' && '🤖 Audio généré'}
                {message.audio_mode === 'not_available' && '📝 Texte uniquement'}
              </span>
              {message.language === 'mo' && <span className="text-xs bg-purple-600/30 px-2 py-0.5 rounded">Mooré</span>}
              {message.language === 'di' && <span className="text-xs bg-blue-600/30 px-2 py-0.5 rounded">Dioula</span>}
            </div>
          </div>
        )}
        
        {/* Feedback buttons */}
        {isAI && onFeedback && (
          <div className="flex justify-end mt-1 space-x-2">
            <button onClick={() => onFeedback(message.id, true)} className="text-green-400 hover:text-green-200 text-sm">👍</button>
            <button onClick={() => onFeedback(message.id, false)} className="text-red-400 hover:text-red-200 text-sm">👎</button>
          </div>
        )}

        {/* Bouton pour réutiliser/éditer un ancien message utilisateur */}
        {isUser && onEdit && (
          <div className="flex justify-end mt-1">
            <button
              onClick={() => onEdit(message)}
              className="text-xs text-gray-300 hover:text-white underline underline-offset-2"
            >
              ✏️ Réutiliser ce message
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
