import React, { useState, useRef, useEffect } from 'react';

/**
 * Composant d'enregistrement vocal pour mooré et dioula
 * Permet d'enregistrer sa voix au lieu de taper des caractères spéciaux
 */
const VoiceRecorder = ({ onRecordingComplete, disabled = false }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioRef = useRef(null);

  // Nettoyer le timer au démontage
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Démarrer l'enregistrement
  const startRecording = async () => {
    try {
      // Demander permission microphone
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,  // Mono
          sampleRate: 16000,  // 16kHz optimal pour Whisper
          echoCancellation: true,
          noiseSuppression: true
        } 
      });

      // Créer MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : 'audio/ogg';
      
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        console.log('🎤 Enregistrement terminé:', {
          chunks: audioChunksRef.current.length,
          size: audioBlob.size,
          type: audioBlob.type,
          duration: recordingTime
        });
        setAudioBlob(audioBlob);
        
        // Arrêter le microphone
        stream.getTracks().forEach(track => track.stop());
      };

      // Démarrer enregistrement
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Erreur accès microphone:', error);
      alert('❌ Impossible d\'accéder au microphone. Veuillez autoriser l\'accès.');
    }
  };

  // Arrêter l'enregistrement
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // Écouter l'enregistrement
  const playRecording = () => {
    if (audioBlob && audioRef.current) {
      const audioUrl = URL.createObjectURL(audioBlob);
      audioRef.current.src = audioUrl;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Annuler l'enregistrement
  const cancelRecording = () => {
    setAudioBlob(null);
    setRecordingTime(0);
  };

  // Envoyer l'enregistrement
  const sendRecording = () => {
    if (audioBlob && onRecordingComplete) {
      onRecordingComplete(audioBlob);
      setAudioBlob(null);
      setRecordingTime(0);
    }
  };

  // Format du temps
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Audio element caché */}
      <audio 
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />

      {/* État: Pas d'enregistrement */}
      {!isRecording && !audioBlob && (
        <button
          onClick={startRecording}
          disabled={disabled}
          className="p-2 rounded-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          title="Enregistrer votre voix (mooré ou dioula)"
        >
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
          </svg>
        </button>
      )}

      {/* État: Enregistrement en cours */}
      {isRecording && (
        <div className="flex items-center space-x-2 bg-red-600/20 px-3 py-2 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
            <span className="text-red-400 font-mono text-sm">{formatTime(recordingTime)}</span>
          </div>
          <button
            onClick={stopRecording}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors"
          >
            ⏹️ Arrêter
          </button>
        </div>
      )}

      {/* État: Enregistrement terminé */}
      {!isRecording && audioBlob && (
        <div className="flex items-center space-x-2 bg-green-600/20 px-3 py-2 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-green-400 text-sm">🎤 {formatTime(recordingTime)}</span>
            
            <button
              onClick={playRecording}
              disabled={isPlaying}
              className="p-1 hover:bg-green-600/30 rounded transition-colors"
              title="Écouter"
            >
              {isPlaying ? '⏸️' : '▶️'}
            </button>
            
            <button
              onClick={cancelRecording}
              className="p-1 hover:bg-red-600/30 rounded transition-colors"
              title="Annuler"
            >
              ❌
            </button>
            
            <button
              onClick={sendRecording}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors"
            >
              ✓ Envoyer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
