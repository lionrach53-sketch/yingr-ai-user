import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import Chat from './components/chat';
import { checkBackendStatus } from './services/api';
import './styles/App.css';

function App() {
  const [backendOnline, setBackendOnline] = useState(true);

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

  return (
    <>
      <Toaster position="top-right" />
      <Chat backendOnline={backendOnline} initialCategory="general" />
    </>
  );
}

export default App;
