import { create } from 'zustand';
import type { Workspace } from '@upi-stream/shared';

interface WorkspaceState {
  currentWorkspace: (Workspace & { myRole?: string }) | null;
  workspaces: (Workspace & { myRole?: string })[];

  setCurrentWorkspace: (workspace: (Workspace & { myRole?: string }) | null) => void;
  setWorkspaces: (workspaces: (Workspace & { myRole?: string })[]) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()((set) => ({
  currentWorkspace: null,
  workspaces: [],

  setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
  setWorkspaces: (workspaces) => set({ workspaces }),
}));
