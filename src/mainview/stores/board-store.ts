import { create } from "zustand";
import type { Board, Task, SectionName } from "../../../shared/types";
import { SECTION_NAMES } from "../../../shared/types";
import { rpc } from "../lib/electrobun";

interface BoardState {
  board: Board | null;
  loading: boolean;
  editingTask: Task | null;
  editingSection: SectionName | null;

  loadBoard: (projectId: number) => Promise<void>;
  setBoard: (board: Board) => void;
  moveTask: (
    projectId: number,
    taskId: string,
    toSection: SectionName,
    toIndex: number
  ) => Promise<void>;
  reorderTask: (
    projectId: number,
    taskId: string,
    section: SectionName,
    toIndex: number
  ) => Promise<void>;
  createTask: (
    projectId: number,
    section: SectionName,
    title: string
  ) => Promise<void>;
  updateTask: (projectId: number, task: Task) => Promise<void>;
  deleteTask: (projectId: number, taskId: string) => Promise<void>;
  openTaskEditor: (task: Task, section: SectionName) => void;
  closeTaskEditor: () => void;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  board: null,
  loading: false,
  editingTask: null,
  editingSection: null,

  loadBoard: async (projectId: number) => {
    set({ loading: true, board: null });
    const board = await rpc.requestProxy.getBoard({ projectId });
    set({ board, loading: false });
  },

  setBoard: (board: Board) => {
    set({ board });
  },

  moveTask: async (projectId, taskId, toSection, toIndex) => {
    // Optimistic update
    const { board } = get();
    if (!board) return;

    let task: Task | null = null;
    const newSections = { ...board.sections };
    for (const section of SECTION_NAMES) {
      const tasks = [...newSections[section]];
      const idx = tasks.findIndex((t) => t.id === taskId);
      if (idx !== -1) {
        task = tasks.splice(idx, 1)[0];
        newSections[section] = tasks;
        break;
      }
    }
    if (!task) return;

    const targetTasks = [...newSections[toSection]];
    targetTasks.splice(Math.min(toIndex, targetTasks.length), 0, task);
    newSections[toSection] = targetTasks;

    set({ board: { ...board, sections: newSections } });

    // Persist
    const updatedBoard = await rpc.requestProxy.moveTask({
      projectId,
      taskId,
      toSection,
      toIndex,
    });
    set({ board: updatedBoard });
  },

  reorderTask: async (projectId, taskId, section, toIndex) => {
    const { board } = get();
    if (!board) return;

    // Optimistic update
    const tasks = [...board.sections[section]];
    const fromIndex = tasks.findIndex((t) => t.id === taskId);
    if (fromIndex === -1) return;
    const [task] = tasks.splice(fromIndex, 1);
    tasks.splice(Math.min(toIndex, tasks.length), 0, task);

    set({
      board: {
        ...board,
        sections: { ...board.sections, [section]: tasks },
      },
    });

    const updatedBoard = await rpc.requestProxy.reorderTask({
      projectId,
      taskId,
      section,
      toIndex,
    });
    set({ board: updatedBoard });
  },

  createTask: async (projectId, section, title) => {
    const updatedBoard = await rpc.requestProxy.createTask({
      projectId,
      section,
      title,
    });
    set({ board: updatedBoard });
  },

  updateTask: async (projectId, task) => {
    const updatedBoard = await rpc.requestProxy.updateTask({
      projectId,
      task,
    });
    set({ board: updatedBoard, editingTask: null, editingSection: null });
  },

  deleteTask: async (projectId, taskId) => {
    const updatedBoard = await rpc.requestProxy.deleteTask({
      projectId,
      taskId,
    });
    set({ board: updatedBoard, editingTask: null, editingSection: null });
  },

  openTaskEditor: (task, section) => {
    set({ editingTask: { ...task }, editingSection: section });
  },

  closeTaskEditor: () => {
    set({ editingTask: null, editingSection: null });
  },
}));
