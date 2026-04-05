import { useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { TitleBar } from "./TitleBar";
import { KanbanBoard } from "../board/KanbanBoard";
import { KanbanCardDetail } from "../board/KanbanCardDetail";
import { useProjectsStore } from "../../stores/projects-store";
import { useBoardStore } from "../../stores/board-store";

export function App() {
  const { projects, activeProjectId, loadProjects } = useProjectsStore();
  const { board, loading, loadBoard, editingTask } = useBoardStore();

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (activeProjectId) {
      loadBoard(activeProjectId);
    }
  }, [activeProjectId]);

  const activeProject = projects.find((p) => p.id === activeProjectId);

  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <TitleBar projectName={activeProject?.name || "mdkanban"} />
        <main className="flex-1 overflow-hidden">
          {!activeProjectId ? (
            <EmptyState />
          ) : loading ? (
            <LoadingState />
          ) : board ? (
            <KanbanBoard board={board} projectId={activeProjectId} />
          ) : null}
        </main>
      </div>
      {editingTask && activeProjectId && (
        <KanbanCardDetail projectId={activeProjectId} />
      )}
    </div>
  );
}

function EmptyState() {
  const { addProject } = useProjectsStore();
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4 opacity-20">&#9776;</div>
        <h2
          className="text-lg font-medium mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          No project selected
        </h2>
        <p className="mb-6" style={{ color: "var(--text-secondary)" }}>
          Add a project by opening an mdkanban.md file from your filesystem.
        </p>
        <button
          onClick={addProject}
          className="px-4 py-2 rounded-lg font-medium text-sm transition-colors"
          style={{
            background: "var(--accent-blue)",
            color: "white",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--accent-blue-hover)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "var(--accent-blue)")
          }
        >
          Add Project
        </button>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-full">
      <div
        className="text-sm animate-pulse"
        style={{ color: "var(--text-tertiary)" }}
      >
        Loading board...
      </div>
    </div>
  );
}
