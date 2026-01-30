import React, { useState, useRef } from 'react';
import { UploadCloud, FileAudio, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../components/Button';
import { transcribeMedia } from '../services/geminiService';
import { Meeting } from '../types';
import { saveMeeting } from '../store/localStore';

interface TranscriptionViewProps {
  projectId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const TranscriptionView: React.FC<TranscriptionViewProps> = ({ projectId, onSuccess, onCancel }) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      // Auto-fill title if empty
      if (!title) {
        const name = e.target.files[0].name.replace(/\.[^/.]+$/, "");
        setTitle(name.charAt(0).toUpperCase() + name.slice(1));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return;

    setIsProcessing(true);
    setError(null);

    try {
      const transcriptionText = await transcribeMedia(file);
      
      const newMeeting: Meeting = {
        id: crypto.randomUUID(),
        projectId,
        title,
        transcription: transcriptionText,
        createdAt: Date.now(),
        fileName: file.name
      };

      saveMeeting(newMeeting);
      onSuccess();
    } catch (err) {
      setError("Falha ao processar o arquivo. Verifique se o formato é suportado e tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] p-6 md:p-8">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <UploadCloud className="text-primary" />
        Nova Transcrição
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title Input */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Título da Reunião</label>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-[#121212] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            placeholder="Ex: Daily Scrum - 14/10"
            disabled={isProcessing}
          />
        </div>

        {/* File Upload Area */}
        <div 
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer
            ${file 
              ? 'border-green-500/50 bg-green-500/5' 
              : 'border-[#333] hover:border-primary hover:bg-[#1E1E1E]'
            }
          `}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="audio/*,video/*"
            className="hidden"
            disabled={isProcessing}
          />
          
          {file ? (
            <div className="flex flex-col items-center">
              <FileAudio className="w-12 h-12 text-green-500 mb-3" />
              <p className="text-white font-medium text-lg">{file.name}</p>
              <p className="text-gray-500 text-sm mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              <span className="mt-4 text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 size={12} /> Pronto para enviar
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center py-4">
              <UploadCloud className="w-12 h-12 text-gray-500 mb-3" />
              <p className="text-gray-300 font-medium">Clique para selecionar áudio ou vídeo</p>
              <p className="text-gray-600 text-sm mt-2">Suporta MP3, WAV, M4A, MP4 (até 20MB recomendado)</p>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 text-sm">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#2A2A2A]">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isProcessing} disabled={!file || !title}>
            Iniciar Transcrição via IA
          </Button>
        </div>
      </form>
    </div>
  );
};