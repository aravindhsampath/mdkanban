import { create } from "zustand";
import type { Project } from "../../../shared/types";
import { rpc } from "../lib/electrobun";

interface ProjectsState {
  projects: Project[];
  activeProjectId: number | null;
  loading: boolean;

  loadProjects: () => Promise<void>;
  setActiveProject: (id: number) => void;
  addProject: () => Promise<void>;
  addProjectByPath: (filePath: string) => Promise<void>;
  removeProject: (id: number) => Promise<void>;
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  projects: [],
  activeProjectId: null,
  loading: false,

  loadProjects: async () => {
    set({ loading: true });
    const projects = await rpc.requestProxy.getProjects({});
    set({ projects, loading: false });
    // Auto-select first project if none active
    if (!get().activeProjectId && projects.length > 0) {
      set({ activeProjectId: projects[0].id });
    }
  },

  setActiveProject: (id: number) => {
    set({ activeProjectId: id });
  },

  addProject: async () => {
    const filePath = await rpc.requestProxy.pickFile({});
    if (!filePath) return;
    const project = await rpc.requestProxy.addProject({ filePath });
    set((state) => ({
      projects: [...state.projects, project],
      activeProjectId: project.id,
    }));
  },

  addProjectByPath: async (filePath: string) => {
    const project = await rpc.requestProxy.addProject({ filePath });
    set((state) => ({
      projects: [...state.projects, project],
      activeProjectId: project.id,
    }));
  },

  removeProject: async (id: number) => {
    await rpc.requestProxy.removeProject({ id });
    set((state) => {
      const projects = state.projects.filter((p) => p.id !== id);
      const activeProjectId =
        state.activeProjectId === id
          ? projects.length > 0
            ? projects[0].id
            : null
          : state.activeProjectId;
      return { projects, activeProjectId };
    });
  },
}));
