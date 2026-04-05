import { useState, useRef, useEffect } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableCard } from "./SortableCard";
import type { Task, SectionName } from "../../../../shared/types";
import { SECTION_CONFIG } from "../../lib/constants";
import { useBoardStore } from "../../stores/board-store";

interface KanbanColumnProps {
  section: SectionName;
  tasks: Task[];
  projectId: number;
}

export function KanbanColumn({
  section,
  tasks,
  projectId,
}: KanbanColumnProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { createTask } = useBoardStore();
  const config = SECTION_CONFIG[section];

  const { setNodeRef, isOver } = useDroppable({ id: section });

  useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreating]);

  const handleCreate = async () => {
    const title = newTitle.trim();
    if (!title) {
      setIsCreating(false);
      setNewTitle("");
      return;
    }
    await createTask(projectId, section, title);
    setNewTitle("");
    setIsCreating(false);
  };

  return (
    <div
      className="flex flex-col w-72 min-w-[288px] shrink-0 rounded-lg"
      style={{
        background: isOver ? "var(--bg-drag)" : "var(--bg-secondary)",
        transition: "background var(--transition-fast)",
      }}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span style={{ color: config.color, fontSize: 14 }}>
            {config.icon}
          </span>
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-secondary)" }}
          >
            {config.label}
          </span>
          <span
            className="text-xs px-1.5 py-0.5 rounded"
            style={{
              color: "var(--text-tertiary)",
              background: "var(--bg-tertiary)",
            }}
          >
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center justify-center w-5 h-5 rounded transition-colors"
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
          +
        </button>
      </div>

      {/* Task list */}
      <div
        ref={setNodeRef}
        className="flex-1 overflow-y-auto px-1.5 pb-1.5 space-y-1"
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <SortableCard key={task.id} task={task} section={section} />
          ))}
        </SortableContext>

        {/* Inline task creation */}
        {isCreating && (
          <div
            className="rounded-md p-2.5 mx-0.5"
            style={{
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border-focus)",
            }}
          >
            <input
              ref={inputRef}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") {
                  setIsCreating(false);
                  setNewTitle("");
                }
              }}
              onBlur={handleCreate}
              placeholder="Task title..."
              className="w-full bg-transparent outline-none text-sm"
              style={{
                color: "var(--text-primary)",
              }}
            />
          </div>
        )}

        {/* Empty state */}
        {tasks.length === 0 && !isCreating && (
          <div
            className="flex items-center justify-center py-8 text-xs"
            style={{ color: "var(--text-tertiary)" }}
          >
            No tasks
          </div>
        )}
      </div>
    </div>
  );
}
