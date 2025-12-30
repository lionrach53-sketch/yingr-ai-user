import React from 'react';
import SourcesDisplay from './SourcesDisplay';

const ChatMessage = ({ message, onFeedback, onEdit, onSuggestionClick }) => {
  const isUser = message.role === 'user';
  const isAI = message.role === 'ai' || message.role === 'assistant';

  // ✅ CORRECTION CLÉ : Priorité d'affichage améliorée
  // Pour les messages AI, regarder d'abord le contexte RAG
  const getDisplayedContent = () => {
    if (isAI) {
      // 1. Priorité au champ "context" s'il contient des données
      if (
        message.context &&
        message.context.length > 0 &&
        typeof message.context[0] === 'string' &&
        message.context[0].trim()
      ) {
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

  // ✅ Nouvelles fonctionnalités : Suggestions de dialogue
  const hasSuggestions = message.suggestions && Array.isArray(message.suggestions) && message.suggestions.length > 0;

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

    // Mise en forme des sections structurées
    if (content.includes('Idée principale:') || content.includes('Explication:') || 
        content.includes('Conseil pratique:') || content.includes('Avertissement:')) {
      
      // Mettre en évidence les titres de sections
      formatted = formatted.replace(
        /(Idée principale:|Explication:|Conseil pratique:|Avertissement:|Question:)/g,
        '<strong class="text-yellow-300 font-bold">$1</strong>'
      );
      
      // Ajouter des sauts de ligne avant les sections
      formatted = formatted.replace(
        /<br \/><strong class="text-yellow-300 font-bold">/g,
        '<br /><br /><strong class="text-yellow-300 font-bold">'
      );
    }

    return (
      <div
        className="whitespace-pre-wrap"
        dangerouslySetInnerHTML={{ __html: formatted }}
      />
    );
  };

  // Vérifier si la réponse est contextuelle
  const isContextualResponse =
    isAI &&
    message.context &&
    message.context.length > 0 &&
    typeof message.context[0] === 'string' &&
    message.context[0].trim();

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[85%] p-4 rounded-lg break-words shadow-md
        ${
          isUser
            ? 'bg-green-600 text-white rounded-br-none'
            : 'bg-gray-800 text-gray-100 rounded-bl-none border-l-4 border-blue-500'
        }`}
      >
        {/* ✅ TEXTE IA / UTILISATEUR avec le contenu correct */}
        {displayedContent && typeof displayedContent === 'string' && displayedContent.trim() && (
          <div className="mb-3 leading-relaxed">
            {formatContent(displayedContent)}
          </div>
        )}

        {/* 📚 Indicateur de réponse contextuelle */}
        {isContextualResponse && (
          <div className="text-xs mt-1 text-green-400 flex items-center space-x-1 mb-2">
            <span className="bg-green-900/30 p-1 rounded">✅</span>
            <span>Réponse basée sur des sources fiables</span>
          </div>
        )}

        {/* ✅ SUGGESTIONS DE DIALOGUE */}
        {isAI && hasSuggestions && (
          <div className="mt-4 pt-3 border-t border-gray-600">
            <div className="text-sm text-gray-300 mb-2 flex items-center space-x-1">
              <span>💡</span>
              <span>Pour continuer :</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {message.suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => onSuggestionClick && onSuggestionClick(suggestion)}
                  className="text-xs bg-blue-900/40 hover:bg-blue-800/60 text-blue-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer border border-blue-700/50 hover:border-blue-600"
                  title={`Poser: "${suggestion}"`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
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

        {/* 📊 Métadonnées (optionnel) */}
        {isAI && message.mode && (
          <div className="text-xs mt-1 opacity-70 flex items-center space-x-2">
            {message.mode === 'conversational' && (
              <span className="text-green-400 flex items-center space-x-1">
                <span>💬</span>
                <span>Conversationnel</span>
              </span>
            )}
            {message.mode === 'structured_rag' && (
              <span className="text-blue-400 flex items-center space-x-1">
                <span>📚</span>
                <span>Réponse structurée</span>
              </span>
            )}
            {message.mode === 'intelligent' && (
              <span className="text-purple-400 flex items-center space-x-1">
                <span>🤖</span>
                <span>IA intelligente</span>
              </span>
            )}
            {message.sources_utilisees > 0 && (
              <span className="text-gray-400">
                {message.sources_utilisees} source{message.sources_utilisees > 1 ? 's' : ''}
              </span>
            )}
            {message.cache_hit && (
              <span className="text-yellow-400" title="Réponse depuis le cache">
                ⚡
              </span>
            )}
          </div>
        )}

        {/* 👍 👎 Feedback */}
        {isAI && onFeedback && (
          <div className="flex justify-end mt-1 space-x-2 pt-2 border-t border-gray-700/50">
            <button
              onClick={() => onFeedback(message.id, true)}
              className="text-green-400 hover:text-green-200 text-sm p-1 hover:bg-green-900/30 rounded transition-colors"
              title="Cette réponse est utile"
            >
              👍
            </button>
            <button
              onClick={() => onFeedback(message.id, false)}
              className="text-red-400 hover:text-red-200 text-sm p-1 hover:bg-red-900/30 rounded transition-colors"
              title="Cette réponse n'est pas utile"
            >
              👎
            </button>
          </div>
        )}

        {/* ✏️ Réutiliser message utilisateur */}
        {isUser && onEdit && (
          <div className="flex justify-end mt-1 pt-2 border-t border-gray-700/50">
            <button
              onClick={() => onEdit(message)}
              className="text-xs text-gray-300 hover:text-white underline underline-offset-2 hover:bg-gray-700/30 px-2 py-1 rounded"
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