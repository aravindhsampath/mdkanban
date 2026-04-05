import { useState, useEffect, useRef } from "react";
import type { Task, Subtask, SectionName } from "../../../../shared/types";
import { PRIORITY_CONFIG, SECTION_CONFIG } from "../../lib/constants";
import { useBoardStore } from "../../stores/board-store";

interface KanbanCardDetailProps {
  projectId: number;
}

export function KanbanCardDetail({ projectId }: KanbanCardDetailProps) {
  const { editingTask, editingSection, closeTaskEditor, updateTask, deleteTask } =
    useBoardStore();

  const [task, setTask] = useState<Task | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [newSubtask, setNewSubtask] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editingTask) {
      setTask({ ...editingTask, subtasks: [...editingTask.subtasks] });
      setTimeout(() => titleRef.current?.focus(), 100);
    }
  }, [editingTask]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeTaskEditor();
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleSave();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [task]);

  if (!task || !editingSection) return null;

  const handleSave = () => {
    if (task) updateTask(projectId, task);
  };

  const handleDelete = () => {
    if (task && confirm(`Delete "${task.title}"?`)) {
      deleteTask(projectId, task.id);
    }
  };

  const updateField = <K extends keyof Task>(key: K, value: Task[K]) => {
    setTask((prev) => (prev ? { ...prev, [key]: value } : null));
  };

  const addSubtask = () => {
    const title = newSubtask.trim();
    if (!title || !task) return;
    updateField("subtasks", [...task.subtasks, { title, done: false }]);
    setNewSubtask("");
  };

  const toggleSubtask = (index: number) => {
    if (!task) return;
    const subtasks = [...task.subtasks];
    subtasks[index] = { ...subtasks[index], done: !subtasks[index].done };
    updateField("subtasks", subtasks);
  };

  const removeSubtask = (index: number) => {
    if (!task) return;
    updateField(
      "subtasks",
      task.subtasks.filter((_, i) => i !== index)
    );
  };

  const sectionConfig = SECTION_CONFIG[editingSection];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.3)" }}
        onClick={closeTaskEditor}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed right-0 top-0 bottom-0 z-50 flex flex-col w-[480px] overflow-hidden"
        style={{
          background: "var(--bg-primary)",
          borderLeft: "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-panel)",
          animation: "slideIn 200ms ease forwards",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3 border-b shrink-0"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <div className="flex items-center gap-2">
            <span style={{ color: sectionConfig.color, fontSize: 12 }}>
              {sectionConfig.icon}
            </span>
            <span
              className="text-xs font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              {sectionConfig.label}
            </span>
            <span
              className="text-xs"
              style={{ color: "var(--text-tertiary)" }}
            >
              #{task.id}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleDelete}
              className="p-1.5 rounded transition-colors text-xs"
              style={{ color: "var(--text-tertiary)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(239,68,68,0.1)";
                e.currentTarget.style.color = "var(--accent-red)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--text-tertiary)";
              }}
            >
              Delete
            </button>
            <button
              onClick={closeTaskEditor}
              className="p-1.5 rounded transition-colors"
              style={{ color: "var(--text-tertiary)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--bg-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              &#x2715;
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Title */}
          <input
            ref={titleRef}
            value={task.title}
            onChange={(e) => updateField("title", e.target.value)}
            className="w-full bg-transparent outline-none text-lg font-semibold"
            style={{ color: "var(--text-primary)" }}
            placeholder="Task title"
          />

          {/* Priority & Labels */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span
                className="text-xs"
                style={{ color: "var(--text-tertiary)" }}
              >
                Priority
              </span>
              <select
                value={task.priority}
                onChange={(e) =>
                  updateField(
                    "priority",
                    e.target.value as "high" | "medium" | "low"
                  )
                }
                className="text-xs px-2 py-1 rounded outline-none cursor-pointer"
                style={{
                  background: "var(--bg-tertiary)",
                  color: PRIORITY_CONFIG[task.priority].color,
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="flex items-center gap-2 flex-1">
              <span
                className="text-xs shrink-0"
                style={{ color: "var(--text-tertiary)" }}
              >
                Labels
              </span>
              <div className="flex items-center gap-1 flex-wrap">
                {task.labels.map((label, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-1.5 py-0.5 rounded font-medium flex items-center gap-1 cursor-pointer"
                    style={{
                      background: "rgba(94, 106, 210, 0.15)",
                      color: "var(--accent-blue)",
                    }}
                    onClick={() =>
                      updateField(
                        "labels",
                        task.labels.filter((_, j) => j !== i)
                      )
                    }
                    title="Click to remove"
                  >
                    {label} &#x2715;
                  </span>
                ))}
                <input
                  placeholder="+ label"
                  className="text-[10px] bg-transparent outline-none w-12"
                  style={{ color: "var(--text-tertiary)" }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const val = e.currentTarget.value.trim();
                      if (val && !task.labels.includes(val)) {
                        updateField("labels", [...task.labels, val]);
                      }
                      e.currentTarget.value = "";
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-xs font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                Description
              </span>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="text-[10px] px-1.5 py-0.5 rounded transition-colors"
                style={{
                  color: "var(--text-tertiary)",
                  background: showPreview
                    ? "var(--bg-active)"
                    : "transparent",
                }}
              >
                {showPreview ? "Edit" : "Preview"}
              </button>
            </div>
            {showPreview ? (
              <div
                className="text-sm leading-relaxed whitespace-pre-wrap p-3 rounded-md min-h-[120px]"
                style={{
                  background: "var(--bg-tertiary)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                {task.description || (
                  <span style={{ color: "var(--text-tertiary)" }}>
                    No description
                  </span>
                )}
              </div>
            ) : (
              <textarea
                value={task.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Add a description... (supports markdown)"
                rows={6}
                className="w-full text-sm leading-relaxed p-3 rounded-md outline-none resize-y"
                style={{
                  background: "var(--bg-tertiary)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-subtle)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-focus)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-subtle)";
                }}
              />
            )}
          </div>

          {/* Subtasks */}
          <div>
            <span
              className="text-xs font-medium block mb-2"
              style={{ color: "var(--text-secondary)" }}
            >
              Subtasks
              {task.subtasks.length > 0 &&
                ` (${task.subtasks.filter((s) => s.done).length}/${task.subtasks.length})`}
            </span>

            <div className="space-y-1">
              {task.subtasks.map((subtask, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 group px-2 py-1 rounded"
                  style={{ background: "var(--bg-tertiary)" }}
                >
                  <input
                    type="checkbox"
                    checked={subtask.done}
                    onChange={() => toggleSubtask(i)}
                    className="cursor-pointer"
                  />
                  <span
                    className="text-sm flex-1"
                    style={{
                      color: subtask.done
                        ? "var(--text-tertiary)"
                        : "var(--text-primary)",
                      textDecoration: subtask.done ? "line-through" : "none",
                    }}
                  >
                    {subtask.title}
                  </span>
                  <button
                    onClick={() => removeSubtask(i)}
                    className="subtask-remove text-xs transition-opacity"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    &#x2715;
                  </button>
                </div>
              ))}

              {/* Add subtask input */}
              <div className="flex items-center gap-2 px-2 py-1">
                <span style={{ color: "var(--text-tertiary)" }}>+</span>
                <input
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addSubtask();
                    if (e.key === "Escape") setNewSubtask("");
                  }}
                  placeholder="Add subtask..."
                  className="text-sm bg-transparent outline-none flex-1"
                  style={{ color: "var(--text-primary)" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-2 px-5 py-3 border-t shrink-0"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <button
            onClick={closeTaskEditor}
            className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
            style={{
              color: "var(--text-secondary)",
              background: "var(--bg-tertiary)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--bg-tertiary)";
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
            style={{
              background: "var(--accent-blue)",
              color: "white",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--accent-blue-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--accent-blue)";
            }}
          >
            Save
          </button>
        </div>
      </div>

    </>
  );
}
