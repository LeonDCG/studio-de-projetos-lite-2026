import React, { useState, useEffect } from 'react';
import { Plus, FolderOpen, ChevronRight, LayoutGrid, Trash2 } from 'lucide-react';
import { Project, ViewProps } from '../types';
import { getProjects, saveProject, deleteProject } from '../store/localStore';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

export const ProjectListView: React.FC<ViewProps> = ({ onChangeView }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  useEffect(() => {
    setProjects(getProjects());
  }, []);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    const newProject: Project = {
      id: crypto.randomUUID(),
      name: newProjectName,
      description: newProjectDesc,
      createdAt: Date.now(),
    };

    saveProject(newProject);
    setProjects(getProjects());
    setShowCreate(false);
    setNewProjectName('');
    setNewProjectDesc('');
  };

  const handleDelete = (e: React.MouseEvent, projectId: string) => {
    // Parar propagação imediata e padrão para evitar abrir o card
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm('Tem certeza que deseja excluir este projeto? Todas as transcrições vinculadas serão perdidas.')) {
        deleteProject(projectId);
        // Atualizar lista imediatamente
        setProjects(getProjects());
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <LayoutGrid className="w-8 h-8 text-primary" />
            Studio de Projetos
            <span className="text-xs font-normal text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">LITE</span>
          </h1>
          <p className="text-gray-400">Gerencie suas transcrições de forma simples e eficiente.</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} variant={showCreate ? 'secondary' : 'primary'}>
          {showCreate ? 'Cancelar' : (
            <>
              <Plus size={18} />
              Novo Projeto
            </>
          )}
        </Button>
      </header>

      {showCreate && (
        <div className="mb-8 animate-fade-in">
          <Card className="max-w-lg mx-auto bg-[#1A1A1A]">
            <h2 className="text-lg font-semibold text-white mb-4">Criar Novo Projeto</h2>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nome do Projeto</label>
                <input 
                  type="text" 
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full bg-[#121212] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="Ex: Reuniões de Marketing Q3"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Descrição (Opcional)</label>
                <textarea 
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full bg-[#121212] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all h-24 resize-none"
                  placeholder="Breve descrição do objetivo..."
                />
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={!newProjectName.trim()}>
                  Criar Projeto
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-[#2A2A2A] rounded-3xl bg-[#1A1A1A]/30">
          <FolderOpen size={48} className="mx-auto text-gray-600 mb-4" />
          <h3 className="text-xl font-semibold text-gray-300">Nenhum projeto encontrado</h3>
          <p className="text-gray-500 mt-2 max-w-sm mx-auto">Comece criando um novo projeto para organizar suas transcrições.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card 
              key={project.id} 
              onClick={() => onChangeView('PROJECT_DETAILS', project.id)}
              className="group relative h-48 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="bg-indigo-500/10 p-2 rounded-lg group-hover:bg-indigo-500/20 transition-colors">
                    <FolderOpen className="text-primary w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-2 relative z-10">
                      <span className="text-xs text-gray-500 font-mono">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                      <button 
                        onClick={(e) => handleDelete(e, project.id)}
                        className="text-gray-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                        title="Excluir Projeto"
                      >
                        <Trash2 size={16} />
                      </button>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{project.name}</h3>
                <p className="text-sm text-gray-400 line-clamp-2">{project.description || "Sem descrição definida."}</p>
              </div>
              
              <div className="flex items-center text-sm text-primary font-medium mt-4 group-hover:translate-x-1 transition-transform">
                Acessar Projeto
                <ChevronRight size={16} className="ml-1" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};