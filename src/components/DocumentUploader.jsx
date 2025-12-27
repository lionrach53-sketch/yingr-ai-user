import React, { useState } from 'react';
import { uploadDocument } from '../services/api';
import { toast } from 'react-hot-toast';

const DocumentUploader = ({ category, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      const response = await uploadDocument(file, category);
      toast.success('Fichier téléchargé avec succès ✅');
      onUploadSuccess && onUploadSuccess(response);
      setFile(null);
    } catch (error) {
      toast.error('Erreur lors de l\'upload ❌');
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex items-center space-x-2 mt-3">
      <input 
        type="file" 
        onChange={(e) => setFile(e.target.files[0])} 
        className="text-sm text-gray-200"
      />
      <button
        onClick={handleUpload}
        disabled={!file || isUploading}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white disabled:opacity-50"
      >
        {isUploading ? 'Uploading...' : 'Upload'}
      </button>
    </div>
  );
};

export default DocumentUploader;
