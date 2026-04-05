import { useProjectsStore } from "../../stores/projects-store";

const PROJECT_COLORS = [
  "#5e6ad2",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#22c55e",
  "#06b6d4",
  "#f97316",
  "#6366f1",
];

export function Sidebar() {
  const {
    projects,
    activeProjectId,
    setActiveProject,
    addProject,
    removeProject,
  } = useProjectsStore();

  return (
    <div
      className="flex flex-col w-56 h-full border-r shrink-0"
      style={{
        background: "var(--bg-secondary)",
        borderColor: "var(--border-subtle)",
      }}
    >
      {/* Drag region for title bar */}
      <div className="drag-region h-12 shrink-0" />

      {/* Project list */}
      <div className="flex-1 overflow-y-auto px-2 py-1">
        {projects.map((project, idx) => {
          const isActive = project.id === activeProjectId;
          const color = PROJECT_COLORS[idx % PROJECT_COLORS.length];
          return (
            <button
              key={project.id}
              onClick={() => setActiveProject(project.id)}
              onContextMenu={(e) => {
                e.preventDefault();
                if (confirm(`Remove "${project.name}" from mdkanban?`)) {
                  removeProject(project.id);
                }
              }}
              className="no-drag flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md text-left text-sm transition-colors"
              style={{
                background: isActive ? "var(--bg-active)" : "transparent",
                color: isActive
                  ? "var(--text-primary)"
                  : "var(--text-secondary)",
              }}
              onMouseEnter={(e) => {
                if (!isActive)
                  e.currentTarget.style.background = "var(--bg-hover)";
              }}
              onMouseLeave={(e) => {
                if (!isActive)
                  e.currentTarget.style.background = "transparent";
              }}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: color }}
              />
              <span className="truncate">{project.name}</span>
            </button>
          );
        })}
      </div>

      {/* Add project button */}
      <div className="px-2 py-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
        <button
          onClick={addProject}
          className="no-drag flex items-center gap-2 w-full px-2.5 py-1.5 rounded-md text-sm transition-colors"
          style={{ color: "var(--text-tertiary)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--bg-hover)";
            e.currentTarget.style.color = "var(--text-secondary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--text-tertiary)";
          }}
        >
          <span className="text-base leading-none">+</span>
          <span>Add Project</span>
        </button>
      </div>
    </div>
  );
}
