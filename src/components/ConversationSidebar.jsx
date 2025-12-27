import React from 'react';
import { 
  MessageSquare, 
  Plus, 
  Trash2, 
  Calendar,
  Clock,
  Search,
  X
} from 'lucide-react';

const ConversationSidebar = ({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  isDarkMode
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    });
  };
  
  const filteredConversations = conversations.filter(conv =>
    conv.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.lastPreview?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const getCategoryIcon = (category) => {
    const icons = {
      general: '🌐',
      agriculture: '🌾',
      sante: '🏥',
      education: '🎓',
      culture: '🎭',
      technologie: '💻',
      economie: '💰',
      droit: '⚖️'
    };
    return icons[category] || '💬';
  };
  
  return (
    <div className={`w-64 md:w-72 h-full flex flex-col border-r ${
      isDarkMode 
        ? 'bg-gray-900/90 border-gray-800' 
        : 'bg-white/90 border-gray-200'
    } backdrop-blur-sm`}>
      
      {/* En-tête de la sidebar */}
      <div className={`p-4 border-b ${
        isDarkMode ? 'border-gray-800' : 'border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-lg font-bold ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            <MessageSquare className="inline mr-2" size={20} />
            Conversations
          </h2>
          <span className={`text-xs px-2 py-1 rounded-full ${
            isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-200 text-gray-700'
          }`}>
            {conversations.length}
          </span>
        </div>
        
        {/* Barre de recherche */}
        <div className="relative mb-3">
          <Search
            size={16}
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`}
          />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-8 py-2 rounded-lg text-sm focus:outline-none ${
              isDarkMode
                ? 'bg-gray-800 border border-gray-700 text-white placeholder-gray-500'
                : 'bg-gray-100 border border-gray-300 text-gray-800 placeholder-gray-400'
            }`}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <X size={16} />
            </button>
          )}
        </div>
        
        {/* Bouton nouvelle conversation */}
        <button
          onClick={onNewConversation}
          className={`w-full py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center ${
            isDarkMode
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          <Plus size={18} className="mr-2" />
          Nouvelle conversation
        </button>
      </div>
      
      {/* Liste des conversations */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredConversations.length === 0 ? (
          <div className={`text-center p-6 ${
            isDarkMode ? 'text-gray-500' : 'text-gray-400'
          }`}>
            <MessageSquare size={40} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">
              {searchTerm ? 'Aucune conversation trouvée' : 'Aucune conversation'}
            </p>
            {!searchTerm && (
              <button
                onClick={onNewConversation}
                className={`mt-4 text-sm px-4 py-2 rounded-lg ${
                  isDarkMode
                    ? 'bg-gray-800 hover:bg-gray-700'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Commencer
              </button>
            )}
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => onSelectConversation(conv.id)}
              className={`p-3 rounded-lg mb-2 cursor-pointer transition-all ${
                currentConversationId === conv.id
                  ? isDarkMode
                    ? 'bg-blue-900/30 border border-blue-800/50'
                    : 'bg-blue-50 border border-blue-200'
                  : isDarkMode
                    ? 'hover:bg-gray-800/50 border border-transparent hover:border-gray-700'
                    : 'hover:bg-gray-100 border border-transparent hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center mb-1">
                    <span className="text-lg mr-2">
                      {getCategoryIcon(conv.category)}
                    </span>
                    <span className={`font-medium truncate ${
                      isDarkMode ? 'text-white' : 'text-gray-800'
                    }`}>
                      {conv.title || 'Sans titre'}
                    </span>
                  </div>
                  
                  {conv.lastPreview && (
                    <p className={`text-sm truncate mb-2 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {conv.lastPreview}
                    </p>
                  )}
                  
                  <div className="flex items-center text-xs">
                    <Calendar size={12} className={`mr-1 ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-400'
                    }`} />
                    <span className={isDarkMode ? 'text-gray-500' : 'text-gray-500'}>
                      {formatDate(conv.date)}
                    </span>
                    
                    <Clock size={12} className={`ml-3 mr-1 ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-400'
                    }`} />
                    <span className={isDarkMode ? 'text-gray-500' : 'text-gray-500'}>
                      {conv.messageCount || 0} messages
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteConversation(conv.id);
                  }}
                  className={`ml-2 p-1.5 rounded ${
                    isDarkMode
                      ? 'hover:bg-gray-800 text-gray-500 hover:text-red-400'
                      : 'hover:bg-gray-200 text-gray-400 hover:text-red-600'
                  }`}
                  title="Supprimer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Pied de page */}
      <div className={`p-3 border-t ${
        isDarkMode ? 'border-gray-800' : 'border-gray-200'
      }`}>
        <div className={`flex justify-between text-xs ${
          isDarkMode ? 'text-gray-500' : 'text-gray-400'
        }`}>
          <span>Version 1.0</span>
          <span>🇧🇫 Burkina Faso</span>
        </div>
      </div>
    </div>
  );
};

export default ConversationSidebar;