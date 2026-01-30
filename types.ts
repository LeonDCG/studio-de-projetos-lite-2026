export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: number;
}

export interface Meeting {
  id: string;
  projectId: string;
  title: string;
  transcription: string;
  createdAt: number;
  fileName?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export type ViewState = 'PROJECT_LIST' | 'PROJECT_DETAILS';

export interface ViewProps {
  onChangeView: (view: ViewState, projectId?: string) => void;
}