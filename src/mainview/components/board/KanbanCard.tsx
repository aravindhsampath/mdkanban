import type { Task, SectionName } from "../../../../shared/types";
import { PRIORITY_CONFIG } from "../../lib/constants";
import { useBoardStore } from "../../stores/board-store";

interface KanbanCardProps {
  task: Task;
  section: SectionName;
  isDragging?: boolean;
}

export function KanbanCard({ task, section, isDragging }: KanbanCardProps) {
  const { openTaskEditor } = useBoardStore();
  const priorityConfig = PRIORITY_CONFIG[task.priority];
  const completedSubtasks = task.subtasks.filter((s) => s.done).length;
  const totalSubtasks = task.subtasks.length;
  const descriptionPreview = task.description.split("\n")[0]?.slice(0, 100);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        if (!isDragging) openTaskEditor(task, section);
      }}
      className="rounded-md p-3 mx-0.5 cursor-pointer transition-all"
      style={{
        background: "var(--bg-tertiary)",
        border: `1px solid ${isDragging ? "var(--border-focus)" : "var(--border-subtle)"}`,
        boxShadow: isDragging ? "var(--shadow-drag)" : "var(--shadow-card)",
      }}
      onMouseEnter={(e) => {
        if (!isDragging) {
          e.currentTarget.style.borderColor = "var(--border-hover)";
          e.currentTarget.style.background = "var(--bg-hover)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging) {
          e.currentTarget.style.borderColor = "var(--border-subtle)";
          e.currentTarget.style.background = "var(--bg-tertiary)";
        }
      }}
    >
      {/* Title row */}
      <div className="flex items-start gap-2">
        <span
          className="mt-1 shrink-0 text-[10px] leading-none"
          style={{ color: priorityConfig.color }}
          title={`Priority: ${priorityConfig.label}`}
        >
          {priorityConfig.icon}
        </span>
        <span
          className="text-sm font-medium leading-snug line-clamp-2"
          style={{ color: "var(--text-primary)" }}
        >
          {task.title}
        </span>
      </div>

      {/* Description preview */}
      {descriptionPreview && (
        <p
          className="mt-1.5 text-xs leading-relaxed line-clamp-2 ml-5"
          style={{ color: "var(--text-secondary)" }}
        >
          {descriptionPreview}
        </p>
      )}

      {/* Bottom row: labels + subtasks + ID */}
      <div className="flex items-center gap-1.5 mt-2 ml-5 flex-wrap">
        {/* Labels */}
        {task.labels.slice(0, 3).map((label) => (
          <span
            key={label}
            className="text-[10px] px-1.5 py-0.5 rounded font-medium"
            style={{
              background: "rgba(94, 106, 210, 0.15)",
              color: "var(--accent-blue)",
            }}
          >
            {label}
          </span>
        ))}
        {task.labels.length > 3 && (
          <span
            className="text-[10px]"
            style={{ color: "var(--text-tertiary)" }}
          >
            +{task.labels.length - 3}
          </span>
        )}

        {/* Subtask progress */}
        {totalSubtasks > 0 && (
          <span
            className="text-[10px] flex items-center gap-1 ml-auto"
            style={{ color: "var(--text-tertiary)" }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10">
              <circle
                cx="5"
                cy="5"
                r="4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                opacity="0.3"
              />
              <circle
                cx="5"
                cy="5"
                r="4"
                fill="none"
                stroke={
                  completedSubtasks === totalSubtasks
                    ? "var(--accent-green)"
                    : "currentColor"
                }
                strokeWidth="1.5"
                strokeDasharray={`${(completedSubtasks / totalSubtasks) * 25.13} 25.13`}
                strokeLinecap="round"
                transform="rotate(-90 5 5)"
              />
            </svg>
            {completedSubtasks}/{totalSubtasks}
          </span>
        )}

        {/* Task ID */}
        {!totalSubtasks && (
          <span
            className="text-[10px] ml-auto"
            style={{ color: "var(--text-tertiary)" }}
          >
            #{task.id}
          </span>
        )}
      </div>
    </div>
  );
}
