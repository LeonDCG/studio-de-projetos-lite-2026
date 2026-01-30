import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Plus, Calendar, FileText, Clock, Mic, FileCheck, ListChecks, MessageSquare, Send } from 'lucide-react';
import { Project, Meeting, ViewProps, ChatMessage } from '../types';
import { getMeetings, getProjects } from '../store/localStore';
import { generateMeetingMinutes, extractMeetingDecisions, queryMeetingContext } from '../services/geminiService';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { TranscriptionView } from './TranscriptionView';

interface Props extends ViewProps {
  projectId: string;
}

export const MeetingsView: React.FC<Props> = ({ onChangeView, projectId }) => {
  const [project, setProject] = useState<Project | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  // Volatile State (In-Memory only)
  const [ata, setAta] = useState<string | null>(null);
  const [decisions, setDecisions] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  
  // Processing States
  const [loadingAction, setLoadingAction] = useState<string | null>(null); // 'ATA' | 'DECISIONS' | 'CHAT'

  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadData = () => {
    const projs = getProjects();
    const current = projs.find(p => p.id === projectId);
    setProject(current || null);
    setMeetings(getMeetings(projectId));
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  // Reset volatile state when meeting changes
  useEffect(() => {
    setAta(null);
    setDecisions(null);
    setChatMessages([]);
    setChatInput('');
  }, [selectedMeeting]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleTranscriptionSuccess = () => {
    setIsCreating(false);
    loadData();
  };

  const handleGenerateATA = async () => {
    if (!selectedMeeting) return;
    setLoadingAction('ATA');
    try {
      const result = await generateMeetingMinutes(selectedMeeting.transcription);
      setAta(result);
    } catch (e) {
      alert("Erro ao gerar ATA. Tente novamente.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleExtractDecisions = async () => {
    if (!selectedMeeting) return;
    setLoadingAction('DECISIONS');
    try {
      const result = await extractMeetingDecisions(selectedMeeting.transcription);
      setDecisions(result);
    } catch (e) {
      alert("Erro ao extrair decisões. Tente novamente.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedMeeting) return;

    const userMsg: ChatMessage = { role: 'user', text: chatInput, timestamp: Date.now() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setLoadingAction('CHAT');

    try {
      const response = await queryMeetingContext(userMsg.text, {
        transcription: selectedMeeting.transcription,
        ata,
        decisions,
        chatHistory: chatMessages
      });

      const aiMsg: ChatMessage = { role: 'model', text: response, timestamp: Date.now() };
      setChatMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      const errorMsg: ChatMessage = { role: 'model', text: "Ocorreu um erro ao processar sua mensagem.", timestamp: Date.now() };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoadingAction(null);
    }
  };

  if (!project) return <div>Carregando...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 h-screen flex flex-col">
      {/* Header */}
      <header className="mb-6 flex-shrink-0">
        <button 
          onClick={() => onChangeView('PROJECT_LIST')}
          className="text-gray-500 hover:text-white flex items-center gap-2 mb-4 transition-colors text-sm"
        >
          <ArrowLeft size={16} /> Voltar para Projetos
        </button>
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{project.name}</h1>
            <p className="text-gray-400">{project.description}</p>
          </div>
          {!isCreating && !selectedMeeting && (
            <Button onClick={() => setIsCreating(true)}>
              <Plus size={18} /> Nova Transcrição
            </Button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {isCreating ? (
          <TranscriptionView 
            projectId={projectId} 
            onSuccess={handleTranscriptionSuccess} 
            onCancel={() => setIsCreating(false)} 
          />
        ) : selectedMeeting ? (
          // Meeting Detail View (Intelligent Workspace)
          <div className="h-full flex flex-col gap-6 lg:flex-row overflow-hidden animate-fade-in">
            
            {/* Left Column: Context & Results */}
            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
              <div className="bg-card border border-border rounded-2xl p-4 flex-shrink-0">
                 <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setSelectedMeeting(null)}
                        className="p-2 hover:bg-[#2A2A2A] rounded-lg transition-colors"
                        title="Voltar"
                      >
                        <ArrowLeft size={18} className="text-gray-400" />
                      </button>
                      <h2 className="text-xl font-bold text-white line-clamp-1">{selectedMeeting.title}</h2>
                    </div>
                    <div className="flex gap-2">
                       <Button 
                          variant="secondary" 
                          onClick={handleGenerateATA} 
                          isLoading={loadingAction === 'ATA'}
                          disabled={!!ata}
                          className="text-xs px-3"
                        >
                          <FileCheck size={14} /> {ata ? 'ATA Gerada' : 'Gerar ATA'}
                       </Button>
                       <Button 
                          variant="secondary" 
                          onClick={handleExtractDecisions} 
                          isLoading={loadingAction === 'DECISIONS'}
                          disabled={!!decisions}
                          className="text-xs px-3"
                        >
                          <ListChecks size={14} /> {decisions ? 'Decisões Extraídas' : 'Extrair Decisões'}
                       </Button>
                    </div>
                 </div>
                 
                 <div className="flex items-center gap-4 text-xs text-gray-500 border-t border-border pt-3">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(selectedMeeting.createdAt).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {new Date(selectedMeeting.createdAt).toLocaleTimeString()}</span>
                 </div>
              </div>

              {/* Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {/* Transcription Card */}
                <div className="bg-[#151515] border border-border rounded-2xl p-6">
                  <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                    <FileText size={16} /> Transcrição Original
                  </h3>
                  <p className="whitespace-pre-wrap leading-relaxed text-gray-300 font-light">
                    {selectedMeeting.transcription}
                  </p>
                </div>

                {/* ATA Result */}
                {ata && (
                  <div className="bg-indigo-900/10 border border-indigo-500/20 rounded-2xl p-6 animate-fade-in">
                    <h3 className="text-sm font-semibold text-indigo-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                      <FileCheck size={16} /> ATA da Reunião
                    </h3>
                    <div className="prose prose-invert prose-sm max-w-none prose-headings:text-indigo-200 prose-p:text-gray-300">
                      <div className="whitespace-pre-wrap">{ata}</div>
                    </div>
                  </div>
                )}

                {/* Decisions Result */}
                {decisions && (
                  <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-2xl p-6 animate-fade-in">
                    <h3 className="text-sm font-semibold text-emerald-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                      <ListChecks size={16} /> Decisões Tomadas
                    </h3>
                    <div className="whitespace-pre-wrap text-gray-300 leading-relaxed font-mono text-sm">
                      {decisions}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: AI Chat */}
            <div className="lg:w-96 flex flex-col bg-card border border-border rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-border bg-[#1A1A1A]">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <MessageSquare size={18} className="text-primary" />
                  Chat com a IA
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Pergunte sobre pendências, detalhes ou próximos passos.
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#121212]">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-10 text-gray-600 text-sm px-4">
                    <p>Faça perguntas sobre a reunião.</p>
                    <p className="mt-2 text-xs italic">"Quais foram os principais pontos?"</p>
                    <p className="text-xs italic">"O que ficou pendente?"</p>
                  </div>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`
                        max-w-[85%] rounded-2xl px-4 py-3 text-sm
                        ${msg.role === 'user' 
                          ? 'bg-primary text-white rounded-tr-none' 
                          : 'bg-[#2A2A2A] text-gray-200 rounded-tl-none border border-border'}
                      `}>
                        {msg.text}
                      </div>
                    </div>
                  ))
                )}
                {loadingAction === 'CHAT' && (
                  <div className="flex justify-start">
                    <div className="bg-[#2A2A2A] rounded-2xl rounded-tl-none px-4 py-3 border border-border flex gap-1 items-center">
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-75"></span>
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150"></span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-3 bg-[#1A1A1A] border-t border-border flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Digite sua pergunta..."
                  className="flex-1 bg-[#121212] border border-[#333] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-primary transition-all"
                  disabled={loadingAction === 'CHAT'}
                />
                <button 
                  type="submit"
                  disabled={!chatInput.trim() || loadingAction === 'CHAT'}
                  className="bg-primary hover:bg-indigo-500 text-white p-2.5 rounded-xl transition-colors disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>

          </div>
        ) : (
          // List View
          <div className="grid grid-cols-1 gap-4 overflow-y-auto pb-10">
            {meetings.length === 0 ? (
               <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border">
                 <Mic size={48} className="mx-auto text-gray-600 mb-4" />
                 <h3 className="text-xl font-semibold text-gray-300">Nenhuma transcrição ainda</h3>
                 <p className="text-gray-500 mt-2">Clique em "Nova Transcrição" para começar.</p>
               </div>
            ) : (
              meetings.map(meeting => (
                <Card 
                  key={meeting.id} 
                  onClick={() => setSelectedMeeting(meeting)}
                  className="flex items-center justify-between group hover:border-indigo-500/50 transition-all cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-[#252525] p-3 rounded-xl text-indigo-400 group-hover:text-white group-hover:bg-indigo-500 transition-colors">
                      <FileText size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-indigo-400 transition-colors">{meeting.title}</h3>
                      <div className="flex items-center gap-4 text-xs text-gray-500 font-mono">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(meeting.createdAt).toLocaleDateString()}
                        </span>
                        {meeting.fileName && (
                          <span className="bg-[#252525] px-2 py-0.5 rounded text-gray-400">
                            {meeting.fileName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-medium text-gray-600 bg-[#121212] px-3 py-1.5 rounded-lg border border-[#252525] group-hover:border-indigo-500/30 group-hover:text-indigo-300 transition-all">
                    ABRIR ESPAÇO
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};