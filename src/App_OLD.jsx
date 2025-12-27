import React, { useState, useEffect, useRef } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import './styles/App.css';

// Composants
import ChatMessage from './components/ChatMessage';
import CategorySelector from './components/CategorySelector';
import ThinkingIndicator from './components/ThinkingIndicator';
import FeedbackModal from './components/modals/FeedbackModal';
import ApiKeyModal from './components/modals/ApiKeyModal';
import DocumentUploader from './components/DocumentUploader';
import StatusIndicator from './components/StatusIndicator';

// Services
import { sendMessage, getCategories, checkBackendStatus } from './services/api';

function App() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [isThinking, setIsThinking] = useState(false);
  const [categories, setCategories] = useState([]);
  const [backendOnline, setBackendOnline] = useState(true);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  const messagesEndRef = useRef(null);

  const API_KEY = localStorage.getItem('ia_sb_api_key') || '';

  // Vérifier le backend
  useEffect(() => {
    const checkStatus = async () => {
      const online = await checkBackendStatus();
      setBackendOnline(online);
      if (!online) toast.error('Le backend est hors ligne ⚠️');
    };
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Charger catégories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await getCategories();
        setCategories(cats);
      } catch (err) {
        console.error(err);
        setCategories([{ id: 'general', name: 'Général', description: 'Questions générales' }]);
      }
    };
    loadCategories();
  }, []);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(scrollToBottom, [messages]);
  
  // Au début du composant App
const [sessionId, setSessionId] = useState(localStorage.getItem('guest_session_id') || null);

// Générer un ID de session invité si nécessaire
useEffect(() => {
  if (!sessionId) {
    const newId = Date.now().toString();
    localStorage.setItem('guest_session_id', newId);
    setSessionId(newId);
  }
}, []);

  // Envoyer message
  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !backendOnline) return;

    // On n'exige plus la clé API pour les invités
    /*
    if (!API_KEY) {
      setShowApiKeyModal(true);
      return;
    }
    */

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: inputText,
      category: selectedCategory,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsThinking(true);

    try {
      const response = API_KEY
        ? await sendMessage(inputText, selectedCategory, API_KEY)
        : await sendGuestMessage(inputText, selectedCategory, sessionId);

      // Mettre à jour sessionId si c’est un nouvel invité
      if (!API_KEY && response.session_id && response.session_id !== sessionId) {
        localStorage.setItem('guest_session_id', response.session_id);
        setSessionId(response.session_id);
      }

      const aiMessage = {
        id: response.conversation_id,
        role: 'ai',
        content: response.response,
        category: selectedCategory,
        confidence: response.confidence,
        sources: response.sources || [],
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiMessage]);
      toast.success('Réponse reçue 🤖', { duration: 2000 });
    } catch (err) {
      console.error(err);
      let errorMsg = 'Erreur de connexion au serveur';
      if (err.response?.status === 401) {
        errorMsg = 'Clé API invalide';
        // setShowApiKeyModal(true); // Optionnel : proposer la clé API si erreur 401
      }
      toast.error(errorMsg, { duration: 4000 });
      setMessages(prev => [...prev, { id: Date.now(), role: 'system', content: errorMsg, isError: true }]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleFeedback = (messageId, isPositive) => {
    setSelectedMessageId(messageId);
    setShowFeedbackModal(true);
    toast.success('Merci pour votre feedback 👍', { duration: 2000 });
  };

  const handleApiKeySubmit = (apiKey) => {
    localStorage.setItem('ia_sb_api_key', apiKey);
    setShowApiKeyModal(false);
    toast.success('Clé API configurée 🔑', { duration: 2000 });
  };

  const clearChat = () => {
    if (messages.length > 0 && window.confirm('Voulez-vous effacer la conversation ?')) {
      setMessages([]);
      toast('Conversation effacée 🗑️');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100">
      <Toaster position="top-right" />
      {/* Header */}
      <header className="sticky top-0 z-10 bg-gray-900/90 backdrop-blur-sm border-b border-gray-700 p-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded flex items-center justify-center font-bold">BF</div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">IA Souveraine Burkina</h1>
            <p className="text-sm text-gray-400">Intelligence Artificielle Locale</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <StatusIndicator isOnline={backendOnline} />
          <CategorySelector categories={categories} selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
          <button onClick={clearChat} disabled={messages.length === 0} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded">Effacer</button>
        </div>
      </header>

      {/* Main Chat */}
      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
          <div className="h-[60vh] overflow-y-auto p-4 space-y-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <h3 className="text-xl font-semibold mb-2">Commencez la conversation</h3>
                <p className="text-center max-w-md">Posez vos questions à l'IA souveraine du Burkina Faso.</p>
              </div>
            ) : (
              messages.map(msg => (
                <ChatMessage key={msg.id} message={msg} onFeedback={handleFeedback} />
              ))
            )}
            {isThinking && <ThinkingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Input + Upload */}
          <form onSubmit={handleSend} className="mt-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder={backendOnline ? "Posez votre question..." : "Backend hors ligne..."}
                disabled={!backendOnline || isThinking}
                className="flex-grow p-4 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                autoFocus
              />
              <button type="submit" disabled={!inputText.trim() || !backendOnline || isThinking} className="px-8 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold rounded-lg disabled:opacity-50">
                Envoyer
              </button>
            </div>
            <DocumentUploader category={selectedCategory} onUploadSuccess={res => console.log('Upload:', res)} />
            <div className="mt-2 flex justify-between text-sm text-gray-400">
              <button type="button" onClick={() => setShowApiKeyModal(true)} className="hover:text-green-400 transition-colors">
                {API_KEY ? '🔑 Clé API configurée' : '⚙️ Configurer clé API'}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Modales */}
      {showFeedbackModal && <FeedbackModal messageId={selectedMessageId} onClose={() => setShowFeedbackModal(false)} />}
      {showApiKeyModal && <ApiKeyModal onClose={() => setShowApiKeyModal(false)} onSubmit={handleApiKeySubmit} currentKey={API_KEY} />}
    </div>
  );
}

export default App;
