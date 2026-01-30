import React, { useState } from 'react';
import { ViewState } from './types';
import { ProjectListView } from './views/ProjectListView';
import { MeetingsView } from './views/MeetingsView';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('PROJECT_LIST');
  const [activeProjectId, setActiveProjectId] = useState<string | undefined>(undefined);

  const handleChangeView = (view: ViewState, projectId?: string) => {
    setActiveProjectId(projectId);
    setCurrentView(view);
  };

  return (
    <div className="min-h-screen bg-background text-gray-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background Decor */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-indigo-600/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-purple-600/5 rounded-full blur-[128px]" />
      </div>

      <div className="relative z-10">
        {currentView === 'PROJECT_LIST' && (
          <ProjectListView onChangeView={handleChangeView} />
        )}
        
        {currentView === 'PROJECT_DETAILS' && activeProjectId && (
          <MeetingsView 
            onChangeView={handleChangeView} 
            projectId={activeProjectId} 
          />
        )}
      </div>
    </div>
  );
};

export default App;