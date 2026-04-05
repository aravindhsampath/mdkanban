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
    try {
      console.log("[mdkanban] Calling getProjects...");
      const projects = await rpc.requestProxy.getProjects({});
      console.log("[mdkanban] Got projects:", projects);
      set({ projects, loading: false });
      if (!get().activeProjectId && projects.length > 0) {
        set({ activeProjectId: projects[0].id });
      }
    } catch (err) {
      console.error("[mdkanban] loadProjects failed:", err);
      set({ loading: false });
    }
  },

  setActiveProject: (id: number) => {
    set({ activeProjectId: id });
  },

  addProject: async () => {
    try {
      console.log("[mdkanban] Opening file picker via pickAndAddProject...");
      const project = await rpc.requestProxy.pickAndAddProject({});
      console.log("[mdkanban] pickAndAddProject result:", project);
      if (!project) return;
      set((state) => ({
        projects: [...state.projects, project],
        activeProjectId: project.id,
      }));
      // Explicitly load the board for the new project (lazy import to avoid circular dep)
      const { useBoardStore } = await import("./board-store");
      await useBoardStore.getState().loadBoard(project.id);
    } catch (err) {
      console.error("[mdkanban] Failed to add project:", err);
    }
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
