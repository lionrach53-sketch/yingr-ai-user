import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import ChatMessage from './ChatMessage';
import ThinkingIndicator from './ThinkingIndicator';
import ConversationSidebar from './ConversationSidebar';
import QuickSuggestions from './QuickSuggestions';
import VoiceRecorder from './VoiceRecorder';
import { sendGuestMessage, uploadDocument } from '../services/api';
// Attention à la casse du fichier CSS (Linux sensible à la casse)
import './chat.css';

// Flag pour activer/désactiver l'upload de fichiers côté UI
const ENABLE_FILE_UPLOAD = false;

const Chat = ({ backendOnline, initialCategory }) => {
  // États principaux
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [category, setCategory] = useState(initialCategory || 'general');
  const [language, setLanguage] = useState('fr'); // Langue sélectionnée par l'utilisateur
  const [sessionId, setSessionId] = useState(null);
  const [isThinking, setIsThinking] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  
  // États pour l'upload de fichiers
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  // États pour l'historique
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  
  // Références
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  // 1. CHARGER L'HISTORIQUE AU DÉMARRAGE
  useEffect(() => {
    const loadHistory = () => {
      try {
        const savedConversations = localStorage.getItem('ia_chat_conversations');
        if (savedConversations) {
          const parsed = JSON.parse(savedConversations);
          setConversations(parsed);
          
          // Charger la dernière conversation active
          const lastConversationId = localStorage.getItem('ia_chat_current_conversation');
          if (lastConversationId && parsed.some(c => c.id === lastConversationId)) {
            loadConversation(lastConversationId);
          } else if (parsed.length > 0) {
            loadConversation(parsed[0].id);
          }
        }
        
        // Charger le thème
        const savedTheme = localStorage.getItem('ia_chat_theme');
        if (savedTheme) {
          setIsDarkMode(savedTheme === 'dark');
        }
      } catch (error) {
        console.error('Erreur chargement historique:', error);
      }
    };
    
    loadHistory();
  }, []);
  
  // 2. APPLIQUER LE THÈME
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('ia_chat_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);
  
  // 3. SAUVEGARDER L'HISTORIQUE
  const saveConversations = useCallback((convs) => {
    try {
      localStorage.setItem('ia_chat_conversations', JSON.stringify(convs));
    } catch (error) {
      console.error('Erreur sauvegarde historique:', error);
    }
  }, []);
  
  // 4. SCROLL AUTO VERS LE BAS
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // 5. CHARGER UNE CONVERSATION
  const loadConversation = (convId) => {
    const conv = conversations.find(c => c.id === convId);
    if (conv) {
      setCurrentConversationId(convId);
      setMessages(conv.messages || []);
      setCategory(conv.category || 'general');
      localStorage.setItem('ia_chat_current_conversation', convId);
    }
  };
  
  // 6. NOUVELLE CONVERSATION
  const startNewConversation = () => {
    const newId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newConversation = {
      id: newId,
      title: 'Nouvelle conversation',
      date: new Date().toISOString(),
      category: 'general',
      messages: [],
      messageCount: 0,
      lastPreview: ''
    };
    
    const updatedConversations = [...conversations, newConversation];
    setConversations(updatedConversations);
    saveConversations(updatedConversations);
    
    setCurrentConversationId(newId);
    setMessages([]);
    setInputMessage('');
    setCategory('general');
    
    toast.success('Nouvelle conversation démarrée');
  };
  
  // 7. SUPPRIMER UNE CONVERSATION
  const deleteConversation = (convId) => {
    const updatedConversations = conversations.filter(c => c.id !== convId);
    setConversations(updatedConversations);
    saveConversations(updatedConversations);
    
    if (currentConversationId === convId) {
      setCurrentConversationId(null);
      setMessages([]);
      
      // Charger une autre conversation si disponible
      if (updatedConversations.length > 0) {
        loadConversation(updatedConversations[0].id);
      }
    }
    
    toast.success('Conversation supprimée');
  };
  
  // 8. METTRE À JOUR UNE CONVERSATION
  const updateConversation = (convId, updates) => {
    const updatedConversations = conversations.map(conv => 
      conv.id === convId 
        ? { ...conv, ...updates, updatedAt: new Date().toISOString() }
        : conv
    );
    
    setConversations(updatedConversations);
    saveConversations(updatedConversations);
  };

  // 8.6. RÉUTILISER / ÉDITER UN ANCIEN MESSAGE
  const handleEditMessage = (message) => {
    if (!message || !message.content) return;
    setInputMessage(message.content);
    // Donner le focus à la zone de saisie
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
  };
  
  // 8.5. GESTION UPLOAD FICHIER
  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      // Vérifier la taille (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Fichier trop volumineux (max 10MB)');
        return;
      }
      setSelectedFile(file);
      toast.success(`Fichier sélectionné: ${file.name}`);
    }
  };
  
  const handleFileUpload = async () => {
    if (!selectedFile) return null;
    
    setIsUploading(true);
    try {
      const response = await uploadDocument(selectedFile, category);
      toast.success('✅ Fichier uploadé avec succès');
      
      // Ajouter message avec le fichier
      const fileMessage = {
        id: `msg_${Date.now()}_file`,
        role: 'user',
        content: `📎 ${selectedFile.name}`,
        fileUrl: response.file_url,
        fileName: response.filename,
        timestamp: new Date(),
        category
      };
      
      setMessages(prev => [...prev, fileMessage]);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      return fileMessage;
    } catch (error) {
      console.error('Erreur upload:', error);
      toast.error('❌ Erreur lors de l\'upload');
      return null;
    } finally {
      setIsUploading(false);
    }
  };
  
  // 9. ENVOYER UN MESSAGE
  const handleSend = async () => {
    if ((!inputMessage.trim() && !selectedFile) || isThinking) return;
    
    const messageText = inputMessage.trim();
    
    // Upload fichier d'abord si présent
    if (selectedFile) {
      await handleFileUpload();
      
      // Si pas de texte, arrêter ici
      if (!messageText) {
        return;
      }
    }
    
    // Créer une conversation si nécessaire
    let convId = currentConversationId;
    if (!convId) {
      convId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newConv = {
        id: convId,
        title: messageText.substring(0, 30) + (messageText.length > 30 ? '...' : ''),
        date: new Date().toISOString(),
        category,
        messages: [],
        messageCount: 0,
        lastPreview: ''
      };
      
      const updatedConversations = [...conversations, newConv];
      setConversations(updatedConversations);
      saveConversations(updatedConversations);
      setCurrentConversationId(convId);
    }
    
    // Message utilisateur
    const userMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date(),
      category
    };
    
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsThinking(true);
    
    // Mettre à jour la conversation
    updateConversation(convId, {
      title: messageText.substring(0, 30) + (messageText.length > 30 ? '...' : ''),
      messages: updatedMessages,
      messageCount: updatedMessages.length,
      lastPreview: messageText.substring(0, 50),
      category
    });
    
    try {
      // Appel à l'API dialogue intelligent (RAG + Mistral LLM) avec la langue choisie
      const response = await sendGuestMessage(messageText, category, sessionId, language);
      
      // Sauvegarder le session_id pour les prochaines requêtes
      if (response.session_id && !sessionId) {
        setSessionId(response.session_id);
      }
      
      // Message IA avec informations enrichies
      const aiMessage = {
        id: `msg_${Date.now()}_ai`,
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
        confidence: response.confidence || 0.9,
        sources: response.sources || [],
        mode: response.mode || 'intelligent', // 'intelligent', 'greeting', 'thanks', 'rag_only'
        sourcesCount: response.sources_count || 0,
        conversationId: convId,
        // 🔊 Nouveaux champs audio (Mooré et Dioula)
        audio_url: response.audio_url || null,
        audio_mode: response.audio_mode || 'not_available',
        language: response.language || 'fr'
      };
      
      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);
      
      // Afficher un toast informatif selon le mode
      if (response.mode === 'intelligent') {
        const audioInfo = response.audio_url ? ' 🔊' : '';
        toast.success(`🧠 Réponse intelligente (${response.sources_count || 0} sources RAG + LLM Mistral)${audioInfo}`, {
          duration: 3000,
          icon: '🇧🇫'
        });
      } else if (response.mode === 'greeting') {
        toast.success('👋 Bienvenue ! IA locale du Burkina Faso', { duration: 2000 });
      }
      
      // Mettre à jour la conversation
      updateConversation(convId, {
        messages: finalMessages,
        messageCount: finalMessages.length,
        lastPreview: `IA: ${response.response.substring(0, 50)}...`
      });
      
    } catch (error) {
      console.error('Erreur API:', error);
      
      const errorMessage = {
        id: `msg_${Date.now()}_error`,
        role: 'system',
        content: '⚠️ Erreur de connexion avec le serveur. Veuillez réessayer.',
        isError: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      updateConversation(convId, {
        messages: [...updatedMessages, errorMessage]
      });
      
    } finally {
      setIsThinking(false);
    }
  };
  
  // 10. FEEDBACK SUR UN MESSAGE
  const handleFeedback = (messageId, isPositive) => {
    console.log(`Feedback: ${messageId} - ${isPositive ? '👍' : '👎'}`);
    toast.success(isPositive ? 'Merci pour votre retour positif !' : 'Merci, nous prenons en compte votre retour.');
  };
  
  // 11. 🎤 ENVOYER UN MESSAGE VOCAL (Speech-to-Text)
  const handleVoiceRecording = async (audioBlob) => {
    if (!audioBlob || isThinking) return;
    
    // Vérifier la taille de l'audio
    console.log('📊 Audio Blob:', {
      size: audioBlob.size,
      type: audioBlob.type,
      sizeKB: (audioBlob.size / 1024).toFixed(2) + ' KB'
    });
    
    // Vérifier que l'audio n'est pas vide
    if (audioBlob.size < 1000) {
      toast.error('⚠️ Audio trop court. Veuillez enregistrer au moins 2-3 secondes.');
      return;
    }
    
    setIsThinking(true);
    
    try {
      // Créer FormData pour envoyer l'audio
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('session_id', sessionId || '');
      formData.append('category', category);
      formData.append('language', language); // Ajouter la langue choisie
      
      // Afficher toast de progression
      const loadingToast = toast.loading('🎤 Transcription en cours...');
      
      // Envoyer à l'API
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/ai/chat/voice`, {
        method: 'POST',
        body: formData
      });
      
      toast.dismiss(loadingToast);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erreur lors du traitement vocal');
      }
      
      const data = await response.json();
      
      // Sauvegarder session_id
      if (data.session_id && !sessionId) {
        setSessionId(data.session_id);
      }
      
      // Créer conversation si nécessaire
      let convId = currentConversationId;
      if (!convId) {
        convId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newConv = {
          id: convId,
          title: data.transcription.substring(0, 30) + '...',
          date: new Date().toISOString(),
          category,
          messages: [],
          messageCount: 0,
          lastPreview: ''
        };
        
        const updatedConversations = [...conversations, newConv];
        setConversations(updatedConversations);
        saveConversations(updatedConversations);
        setCurrentConversationId(convId);
      }
      
      // Message utilisateur (avec transcription)
      const userMessage = {
        id: `msg_${Date.now()}_voice`,
        role: 'user',
        content: `🎤 ${data.transcription}`,
        isVoice: true,
        timestamp: new Date(),
        category
      };
      
      // Message IA
      const aiMessage = {
        id: `msg_${Date.now()}_ai`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        confidence: data.transcription_confidence || 0.9,
        sources: data.sources || [],
        mode: data.mode || 'voice_intelligent',
        sourcesCount: data.sources_count || 0,
        conversationId: convId,
        audio_url: data.audio_url || null,
        audio_mode: data.audio_mode || 'not_available',
        language: data.language || 'fr'
      };
      
      const finalMessages = [...messages, userMessage, aiMessage];
      setMessages(finalMessages);
      
      // Toast de succès
      toast.success(`✅ Voix → Texte → IA 🔊 (${data.transcription_confidence ? (data.transcription_confidence * 100).toFixed(0) : 90}% confiance)`, {
        duration: 4000,
        icon: '🎤'
      });
      
      // Mettre à jour conversation
      updateConversation(convId, {
        title: data.transcription.substring(0, 30) + '...',
        messages: finalMessages,
        messageCount: finalMessages.length,
        lastPreview: `IA: ${data.response.substring(0, 50)}...`
      });
      
    } catch (error) {
      console.error('Erreur message vocal:', error);
      toast.error(`❌ ${error.message || 'Erreur lors du traitement vocal'}`);
    } finally {
      setIsThinking(false);
    }
  };
  
  // 11. GESTION DU CLAVIER
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };
  
  // Suggestions rapides (barre de catégories en haut)
  // La sélection se fait maintenant via QuickSuggestions qui met à jour directement la catégorie
  
  return (
    <div className={`h-screen flex transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white' 
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-800'
    }`}>
      <Toaster position="top-right" />
      
      {/* Barre latérale des conversations */}
      {showSidebar && (
        <ConversationSidebar
          conversations={conversations}
          currentConversationId={currentConversationId}
          onSelectConversation={loadConversation}
          onNewConversation={startNewConversation}
          onDeleteConversation={deleteConversation}
          isDarkMode={isDarkMode}
        />
      )}
      
      {/* Zone principale du chat */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* En-tête */}
        <header className={`p-4 border-b ${
          isDarkMode 
            ? 'border-gray-800 bg-gray-900/50' 
            : 'border-gray-200 bg-white/80'
        } backdrop-blur-sm`}>
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className={`p-2 rounded-lg ${
                  isDarkMode 
                    ? 'bg-gray-800 hover:bg-gray-700' 
                    : 'bg-gray-100 hover:bg-gray-200'
                } transition-colors`}
                title={showSidebar ? "Masquer l'historique" : "Afficher l'historique"}
              >
                {showSidebar ? '←' : '☰'}
              </button>
              
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
                  💬 IA Souveraine Burkina
                </h1>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {currentConversationId 
                    ? conversations.find(c => c.id === currentConversationId)?.title || 'Conversation'
                    : 'Prêt à discuter'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              
              {/* Sélecteur de langue */}
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className={`px-3 py-2 rounded-lg border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-800'
                }`}
                title="Choisissez votre langue"
              >
                <option value="fr">🇫🇷 Français</option>
                <option value="mo">🗣️ Mooré</option>
                <option value="di">🗣️ Dioula</option>
              </select>
              
              {/* Sélecteur de catégorie */}
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`px-3 py-2 rounded-lg border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-800'
                }`}
              >
                <option value="general">🌐 Général</option>
                <option value="agriculture">🌾 Agriculture</option>
                <option value="sante">🏥 Santé</option>
                <option value="education">🎓 Éducation</option>
                <option value="culture">🎭 Culture</option>
                <option value="technologie">💻 Technologie</option>
                <option value="economie">💰 Économie</option>
                <option value="droit">⚖️ Droit</option>
              </select>
              
              {/* Bouton thème */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode
                    ? 'bg-gray-800 hover:bg-gray-700 text-yellow-300'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                title={isDarkMode ? "Passer en mode clair" : "Passer en mode sombre"}
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>
              
            </div>
          </div>
        </header>
        
        {/* Barre de catégories défilante en haut */}
        <QuickSuggestions 
          selectedCategory={category}
          onSelectCategory={setCategory}
          isDarkMode={isDarkMode}
        />
        
        {/* Zone des messages */}
        <main className={`flex-1 overflow-y-auto p-4 md:p-6 ${
          isDarkMode ? 'bg-gray-900/30' : 'bg-gray-50/50'
        }`}>
          <div className="max-w-4xl mx-auto">
            
            {messages.length === 0 ? (
              // État vide - Premier message
              <div className="h-full flex flex-col items-center justify-center py-12">
                <div className={`text-7xl mb-6 ${
                  isDarkMode ? 'text-gray-600' : 'text-gray-300'
                }`}>
                  🤖
                </div>
                <h2 className={`text-2xl font-bold mb-3 ${
                  isDarkMode ? 'text-white' : 'text-gray-800'
                }`}>
                  Bienvenue sur l'IA Souveraine Burkina
                </h2>
                <p className={`text-center max-w-md mb-8 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Je suis spécialisé dans les questions sur le Burkina Faso.
                  Choisissez une catégorie, posez votre question ou utilisez les suggestions ci-dessus.
                </p>
                <div className="grid grid-cols-2 gap-3 max-w-sm">
                  {[
                    { text: "Agriculture", icon: "🌾", cat: "agriculture" },
                    { text: "Santé publique", icon: "🏥", cat: "sante" },
                    { text: "Culture", icon: "🎭", cat: "culture" },
                    { text: "Éducation", icon: "🎓", cat: "education" }
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setCategory(item.cat);
                        setInputMessage(`Parle-moi de ${item.text.toLowerCase()} au Burkina`);
                      }}
                      className={`p-3 rounded-xl flex flex-col items-center justify-center transition-all ${
                        isDarkMode
                          ? 'bg-gray-800/50 hover:bg-gray-800 border border-gray-700'
                          : 'bg-white hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <span className="text-2xl mb-2">{item.icon}</span>
                      <span className="text-sm font-medium">{item.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              // Liste des messages
              <div className="space-y-6">
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    onFeedback={handleFeedback}
                    onEdit={handleEditMessage}
                  />
                ))}
                
                {/* Indicateur "IA tape..." */}
                {isThinking && <ThinkingIndicator isDarkMode={isDarkMode} />}
                
                <div ref={messagesEndRef} />
              </div>
            )}
            
          </div>
        </main>
        
        {/* Zone de saisie */}
        <footer className={`p-4 border-t ${
          isDarkMode
            ? 'border-gray-800 bg-gray-900/50'
            : 'border-gray-200 bg-white/80'
        } backdrop-blur-sm`}>
          <div className="max-w-4xl mx-auto">
            
            {/* Prévisualisation du fichier sélectionné (désactivée pour cette version) */}
            {ENABLE_FILE_UPLOAD && selectedFile && (
              <div className={`mb-3 p-3 rounded-lg flex items-center justify-between ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
              }`}>
                <div className="flex items-center space-x-2">
                  <span>📎</span>
                  <span className="text-sm">{selectedFile.name}</span>
                  <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-red-500 hover:text-red-400"
                >
                  ✕
                </button>
              </div>
            )}
            
            {/* Zone de saisie */}
            <div className="flex items-end space-x-3">
              
              {/* 🎤 Enregistreur vocal */}
              <VoiceRecorder 
                onRecordingComplete={handleVoiceRecording}
                disabled={isThinking || isUploading}
              />
              
              {/* Bouton upload fichier (caché pour cette version publique) */}
              {ENABLE_FILE_UPLOAD && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.md,.jpg,.jpeg,.png"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || isThinking}
                    className={`p-3 rounded-xl transition-all ${
                      isDarkMode
                        ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    title="Attacher un fichier (PDF, DOC, TXT, MD, JPG, PNG)"
                  >
                    📎
                  </button>
                </>
              )}
              
              {/* Zone texte */}
              <div className={`flex-1 rounded-xl border ${
                isDarkMode
                  ? 'bg-gray-800/50 border-gray-700 focus-within:border-blue-500'
                  : 'bg-white border-gray-300 focus-within:border-blue-500'
              } transition-colors`}>
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Tapez votre message ici... (Appuyez sur Entrée pour envoyer, Maj+Entrée pour nouvelle ligne)`}
                  className={`w-full px-4 py-3 rounded-xl resize-none focus:outline-none ${
                    isDarkMode
                      ? 'bg-transparent text-white placeholder-gray-500'
                      : 'bg-transparent text-gray-800 placeholder-gray-400'
                  }`}
                  rows={Math.min(Math.max(inputMessage.split('\n').length, 1), 4)}
                  disabled={isThinking || isUploading}
                />
              </div>
              
              {/* Bouton envoyer */}
              <button
                onClick={handleSend}
                disabled={isThinking || isUploading || (!inputMessage.trim() && !selectedFile)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  isThinking || isUploading
                    ? 'bg-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                } disabled:opacity-50 disabled:cursor-not-allowed text-white`}
              >
                {isUploading ? 'Upload...' : isThinking ? 'Envoi...' : 'Envoyer'}
              </button>
              
            </div>
            
            {/* Indicateurs en bas */}
            <div className={`flex justify-between items-center mt-3 text-xs ${
              isDarkMode ? 'text-gray-500' : 'text-gray-600'
            }`}>
              <div className="flex items-center space-x-4">
                <span className="flex items-center">
                  <kbd className={`px-2 py-1 rounded mr-1 ${
                    isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
                  }`}>
                    Entrée
                  </kbd>
                  <span>pour envoyer</span>
                </span>
                <span className="flex items-center">
                  <kbd className={`px-2 py-1 rounded mr-1 ${
                    isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
                  }`}>
                    Shift + Entrée
                  </kbd>
                  <span>pour nouvelle ligne</span>
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span>Catégorie: </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  category === 'agriculture' ? 'bg-green-500' :
                  category === 'sante' ? 'bg-red-500' :
                  category === 'education' ? 'bg-purple-500' :
                  category === 'culture' ? 'bg-yellow-500' :
                  category === 'technologie' ? 'bg-indigo-500' :
                  category === 'economie' ? 'bg-emerald-500' :
                  category === 'droit' ? 'bg-gray-500' :
                  'bg-blue-500'
                } text-white`}>
                  {category === 'agriculture' ? '🌾 Agriculture' :
                   category === 'sante' ? '🏥 Santé' :
                   category === 'education' ? '🎓 Éducation' :
                   category === 'culture' ? '🎭 Culture' :
                   category === 'technologie' ? '💻 Technologie' :
                   category === 'economie' ? '💰 Économie' :
                   category === 'droit' ? '⚖️ Droit' :
                   '🌐 Général'}
                </span>
                <span>•</span>
                <span>{messages.length} messages</span>
              </div>
            </div>
            
          </div>
        </footer>
        
      </div>
    </div>
  );
};

export default Chat;