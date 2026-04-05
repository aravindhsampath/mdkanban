import type { RPCSchema } from "electrobun/bun";
import type { Task, Board, Project } from "./types";

export type MdKanbanRPC = {
  bun: RPCSchema<{
    requests: {
      getProjects: { params: {}; response: Project[] };
      addProject: { params: { filePath: string }; response: Project };
      removeProject: { params: { id: number }; response: { success: boolean } };
      reorderProjects: {
        params: { ids: number[] };
        response: { success: boolean };
      };

      getBoard: { params: { projectId: number }; response: Board };
      moveTask: {
        params: {
          projectId: number;
          taskId: string;
          toSection: string;
          toIndex: number;
        };
        response: Board;
      };
      reorderTask: {
        params: {
          projectId: number;
          taskId: string;
          section: string;
          toIndex: number;
        };
        response: Board;
      };
      createTask: {
        params: { projectId: number; section: string; title: string };
        response: Board;
      };
      updateTask: {
        params: { projectId: number; task: Task };
        response: Board;
      };
      deleteTask: {
        params: { projectId: number; taskId: string };
        response: Board;
      };

      getPreference: { params: { key: string }; response: string | null };
      setPreference: {
        params: { key: string; value: string };
        response: { success: boolean };
      };

      pickFile: { params: {}; response: string | null };
    };
    messages: {};
  }>;
  webview: RPCSchema<{
    requests: {};
    messages: {
      boardChanged: { projectId: number; board: Board };
      fileError: { projectId: number; error: string };
    };
  }>;
};
