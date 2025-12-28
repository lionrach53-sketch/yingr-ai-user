import React from 'react';
import SourcesDisplay from './SourcesDisplay';

const ChatMessage = ({ message, onFeedback, onEdit }) => {
  const isUser = message.role === 'user';
  const isAI = message.role === 'ai' || message.role === 'assistant';

  // ✅ CORRECTION CLÉ : Priorité d'affichage améliorée
  // Pour les messages AI, regarder d'abord le contexte RAG
  const getDisplayedContent = () => {
    if (isAI) {
      // 1. Priorité au champ "context" s'il contient des données
      if (message.context && message.context.length > 0 && message.context[0].trim()) {
        return message.context[0];
      }
      
      // 2. Sinon, chercher dans les autres champs
      return (
        message.content ||
        message.response ||
        message.reponse ||
        message.answer ||
        ''
      );
    }
    
    // Pour les messages utilisateur
    return (
      message.content ||
      message.message ||
      ''
    );
  };

  const displayedContent = getDisplayedContent();

  // Fichier uploadé
  const hasFile = message.fileUrl || message.file_url;
  const fileUrl = message.fileUrl || message.file_url;
  const fileName =
    message.fileName ||
    message.file_name ||
    fileUrl?.split('/').pop();

  // Image ?
  const isImage =
    fileUrl && /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl);

  // Formatage du texte
  const formatContent = (content) => {
    if (!content || typeof content !== 'string') return null;

    let formatted = content.replace(/\n/g, '<br />');

    // Listes à puces
    formatted = formatted.replace(
      /- ([^\n<]+)/g,
      '<div class="ml-4 my-1">• $1</div>'
    );

    // Listes numérotées
    formatted = formatted.replace(
      /(\d+)\) ([^\n<]+)/g,
      '<div class="ml-4 my-1"><strong>$1)</strong> $2</div>'
    );

    // Emojis en début de ligne
    formatted = formatted.replace(
      /(^|<br \/>)([\u{1F300}-\u{1F9FF}])/gu,
      '$1$2 '
    );

    // Titres en **gras**
    formatted = formatted.replace(
      /\*\*([^*]+)\*\*/g,
      '<strong class="text-yellow-300">$1</strong>'
    );

    // Liens
    formatted = formatted.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">$1</a>'
    );

    return (
      <div
        className="whitespace-pre-wrap"
        dangerouslySetInnerHTML={{ __html: formatted }}
      />
    );
  };

  // Vérifier si la réponse est contextuelle
  const isContextualResponse = isAI && message.context && message.context.length > 0 && message.context[0].trim();

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[80%] p-4 rounded-lg break-words shadow-md
        ${
          isUser
            ? 'bg-green-600 text-white rounded-br-none'
            : 'bg-gray-800 text-gray-100 rounded-bl-none border-l-4 border-blue-500'
        }`}
      >
        {/* ✅ TEXTE IA / UTILISATEUR avec le contenu correct */}
        {displayedContent && displayedContent.trim() && (
          <div className="mb-2 leading-relaxed">
            {formatContent(displayedContent)}
          </div>
        )}

        {/* 📚 Indicateur de réponse contextuelle */}
        {isContextualResponse && (
          <div className="text-xs mt-1 text-green-400 flex items-center space-x-1">
            <span>✅</span>
            <span>Réponse basée sur des sources fiables</span>
          </div>
        )}

        {/* 📎 Fichier ou image */}
        {hasFile && (
          <div className="mt-2 mb-2">
            {isImage ? (
              <div className="rounded-lg overflow-hidden max-w-xs">
                <img
                  src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${fileUrl}`}
                  alt={fileName}
                  className="w-full h-auto cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() =>
                    window.open(
                      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${fileUrl}`,
                      '_blank'
                    )
                  }
                />
                <div className="text-xs mt-1 opacity-70">
                  📷 {fileName}
                </div>
              </div>
            ) : (
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

        {/* 📚 Sources IA */}
        {isAI && message.sources && (
          <SourcesDisplay sources={message.sources} />
        )}

        {/* 🔊 Audio */}
        {isAI && message.audio_url && (
          <div className="mt-3 mb-2">
            <audio
              controls
              className="w-full max-w-md rounded-lg"
              style={{ height: '40px' }}
            >
              <source
                src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${message.audio_url}`}
                type="audio/mpeg"
              />
              <source
                src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${message.audio_url.replace(
                  '.mp3',
                  '.wav'
                )}`}
                type="audio/wav"
              />
              Votre navigateur ne supporte pas l'audio.
            </audio>

            <div className="text-xs mt-1 opacity-70 flex items-center space-x-2">
              <span>🔊</span>
              <span>
                {message.audio_mode === 'pre_recorded' && '✨ Audio natif'}
                {message.audio_mode === 'tts_generated' && '🤖 Audio généré'}
                {message.audio_mode === 'not_available' && '📝 Texte uniquement'}
              </span>
              {message.language === 'mo' && (
                <span className="text-xs bg-purple-600/30 px-2 py-0.5 rounded">
                  Mooré
                </span>
              )}
              {message.language === 'di' && (
                <span className="text-xs bg-blue-600/30 px-2 py-0.5 rounded">
                  Dioula
                </span>
              )}
            </div>
          </div>
        )}

        {/* 👍 👎 Feedback */}
        {isAI && onFeedback && (
          <div className="flex justify-end mt-1 space-x-2">
            <button
              onClick={() => onFeedback(message.id, true)}
              className="text-green-400 hover:text-green-200 text-sm p-1 hover:bg-green-900/30 rounded"
              title="Cette réponse est utile"
            >
              👍
            </button>
            <button
              onClick={() => onFeedback(message.id, false)}
              className="text-red-400 hover:text-red-200 text-sm p-1 hover:bg-red-900/30 rounded"
              title="Cette réponse n'est pas utile"
            >
              👎
            </button>
          </div>
        )}

        {/* ✏️ Réutiliser message utilisateur */}
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