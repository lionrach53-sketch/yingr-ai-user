import axios from 'axios';

// Configuration
// Utilise une variable d'environnement Vite si disponible, sinon localhost pour le dev local
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_TIMEOUT = 15000;

// Instance axios avec configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter les tokens (pas nécessaire pour le chat public)
api.interceptors.request.use(
  (config) => {
    // Le chat user est public, pas besoin de clé API
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Gestion des erreurs réseau
    if (!error.response) {
      throw new Error('Erreur réseau. Vérifiez votre connexion.');
    }
    
    // Gestion des erreurs HTTP
    const { status, data } = error.response;
    
    switch (status) {
      case 401:
        throw new Error('Authentification requise');
      case 403:
        throw new Error('Permissions insuffisantes');
      case 404:
        throw new Error('Ressource non trouvée');
      case 429:
        throw new Error('Trop de requêtes. Veuillez patienter.');
      case 500:
        throw new Error('Erreur serveur interne');
      default:
        throw new Error(data?.detail || `Erreur ${status}`);
    }
  }
);

// Fonctions de service
export const checkBackendStatus = async () => {
  try {
    await axios.get(`${API_BASE_URL}/api/health`, { timeout: 5000 });
    return true;
  } catch (error) {
    console.error('Backend hors ligne:', error);
    return false;
  }
};

// --- FRONTEND USER ---
export const sendMessage = async (message, category) => {
  return api.post('/api/chat', {
    message,
    category,
    conversation_id: Date.now().toString()
  });
};

export const sendMessageWithSession = async (message, category, sessionId = null) => {
  const formData = new FormData();
  formData.append('message', message);
  formData.append('category', category);
  if (sessionId) formData.append('session_id', sessionId);

  return axios.post(`${API_BASE_URL}/user/chat`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const sendFileMessage = async (file, category, sessionId = null) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);
  if (sessionId) formData.append('session_id', sessionId);

  return axios.post(`${API_BASE_URL}/user/chat/file`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};


export const getCategories = async () => {
  // Pour l'instant, retourne des catégories statiques
  return Promise.resolve([
    { id: 'general', name: 'Général', description: 'Questions générales' },
    { id: 'Plantes Medicinales', name: 'Plantes Médicinales', description: 'Médecine traditionnelle' },
    { id: 'Transformation PFNL', name: 'Transformation PFNL', description: 'Produits forestiers non ligneux' },
    { id: 'Science Pratique - Saponification', name: 'Saponification', description: 'Fabrication de savon' },
    { id: 'Metiers Informels', name: 'Métiers Informels', description: 'Secteur informel' },
    { id: 'Civisme', name: 'Civisme', description: 'Citoyenneté et devoirs civiques' },
    { id: 'Spiritualite et Traditions', name: 'Spiritualité', description: 'Traditions et spiritualité' },
    { id: 'Developpement Personnel', name: 'Développement Personnel', description: 'Croissance personnelle' },
    { id: 'Mathematiques Pratiques', name: 'Mathématiques', description: 'Maths pratiques' }
  ]);
};

// --- FRONTEND ADMIN ---
export const getSystemStats = async () => {
  return api.get('/api/stats');
};

export const getAllApiKeys = async () => {
  return api.get('/api/admin/api-keys');
};

export const createApiKey = async (name, permissions, expiresInDays = 365) => {
  return api.post('/api/admin/api-keys', {
    name,
    permissions,
    expires_in_days: expiresInDays
  });
};

export const revokeApiKey = async (keyId) => {
  return api.delete(`/api/admin/api-keys/${keyId}`);
};

// --- FRONTEND EXPERT ---
export const submitKnowledge = async (knowledge) => {
  return api.post('/api/learn', knowledge);
};

export const uploadDocument = async (file, category, description = '') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);
  if (description) formData.append('description', description);
  
  // Endpoint public sans authentication
  const response = await axios.post(`${API_BASE_URL}/api/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });

  // On ne retourne que les données utiles (message, filename, file_url, ...)
  return response.data;
};

export const getChatHistory = async (sessionId) => {
  return axios.get(`${API_BASE_URL}/user/chat/history/${sessionId}`);
};

//utilisateur invite - DIALOGUE INTELLIGENT AVEC MISTRAL
export const sendGuestMessage = async (message, category = 'general', sessionId = null, language = 'fr') => {
  const payload = { message, category, language };
  if (sessionId) payload.session_id = sessionId;

  const response = await axios.post(`${API_BASE_URL}/ai/chat/intelligent`, payload, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 60000  // 60s pour Mistral (10-20s de réponse réelle)
  });

  return response.data; // { response, mode, sources, timestamp, session_id }
};

// Endpoint RAG pur (rapide, sans LLM) - fallback si besoin
export const sendGuestMessageFast = async (message, category = 'general', sessionId = null) => {
  const payload = { message, category };
  if (sessionId) payload.session_id = sessionId;

  const response = await axios.post(`${API_BASE_URL}/api/chat/guest`, payload, {
    headers: { 'Content-Type': 'application/json' }
  });

  return response.data; // { conversation_id, response, timestamp, session_id }
};


export const getContributions = async () => {
  // Simulé pour l'exemple
  return Promise.resolve([
    {
      id: 1,
      question: 'Quelles sont les principales cultures au Burkina Faso?',
      answer: 'Le Burkina Faso cultive principalement le mil, le sorgho, le maïs, le riz, le coton et les légumes.',
      category: 'agriculture',
      status: 'validated',
      validated_at: '2024-01-15',
      validator: 'Expert 2'
    }
  ]);
};

export default api;