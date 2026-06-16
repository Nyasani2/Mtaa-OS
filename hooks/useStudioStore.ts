import { create } from 'zustand';

export interface StudioProject {
  id: string;
  title: string;
  type: 'video' | 'audio' | 'thumbnail' | 'script';
  status: 'draft' | 'editing' | 'published' | 'scheduled';
  createdAt: string;
  updatedAt: string;
  thumbnailUrl?: string;
  duration?: number;
  monetizationEnabled: boolean;
}

export interface StudioDraft {
  id: string;
  projectId: string;
  content: string;
  savedAt: string;
}

interface StudioState {
  projects: StudioProject[];
  drafts: StudioDraft[];
  currentProject: StudioProject | null;
  isRecording: boolean;
  recordingDuration: number;
  revenue: { today: number; month: number; total: number };

  setProjects: (projects: StudioProject[]) => void;
  addProject: (project: StudioProject) => void;
  updateProject: (id: string, updates: Partial<StudioProject>) => void;
  deleteProject: (id: string) => void;
  setCurrentProject: (project: StudioProject | null) => void;
  setRecording: (recording: boolean) => void;
  setRecordingDuration: (duration: number) => void;
  addDraft: (draft: StudioDraft) => void;
  deleteDraft: (id: string) => void;
  setRevenue: (revenue: { today: number; month: number; total: number }) => void;
}

export const useStudioStore = create<StudioState>((set) => ({
  projects: [],
  drafts: [],
  currentProject: null,
  isRecording: false,
  recordingDuration: 0,
  revenue: { today: 0, month: 0, total: 0 },

  setProjects: (projects) => set({ projects }),
  addProject: (project) => set((state) => ({ projects: [project, ...state.projects] })),
  updateProject: (id, updates) => set((state) => ({
    projects: state.projects.map(p => p.id === id ? { ...p, ...updates } : p),
  })),
  deleteProject: (id) => set((state) => ({
    projects: state.projects.filter(p => p.id !== id),
  })),
  setCurrentProject: (project) => set({ currentProject: project }),
  setRecording: (recording) => set({ isRecording: recording }),
  setRecordingDuration: (duration) => set({ recordingDuration: duration }),
  addDraft: (draft) => set((state) => ({ drafts: [draft, ...state.drafts] })),
  deleteDraft: (id) => set((state) => ({ drafts: state.drafts.filter(d => d.id !== id) })),
  setRevenue: (revenue) => set({ revenue }),
}));
