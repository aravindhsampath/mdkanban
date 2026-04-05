import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";
import type { Board, Task, SectionName } from "../../../../shared/types";
import { SECTION_NAMES } from "../../../../shared/types";
import { useBoardStore } from "../../stores/board-store";

interface KanbanBoardProps {
  board: Board;
  projectId: number;
}

export function KanbanBoard({ board, projectId }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<{
    task: Task;
    section: SectionName;
  } | null>(null);
  const { moveTask, reorderTask } = useBoardStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const findTaskSection = useCallback(
    (taskId: string): SectionName | null => {
      for (const section of SECTION_NAMES) {
        if (board.sections[section].some((t) => t.id === taskId)) {
          return section;
        }
      }
      return null;
    },
    [board]
  );

  const findTask = useCallback(
    (taskId: string): Task | null => {
      for (const section of SECTION_NAMES) {
        const task = board.sections[section].find((t) => t.id === taskId);
        if (task) return task;
      }
      return null;
    },
    [board]
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const taskId = event.active.id as string;
      const section = findTaskSection(taskId);
      const task = findTask(taskId);
      if (task && section) {
        setActiveTask({ task, section });
      }
    },
    [findTaskSection, findTask]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTask(null);

      if (!over) return;

      const taskId = active.id as string;
      const fromSection = findTaskSection(taskId);
      if (!fromSection) return;

      // Determine target section and index
      let toSection: SectionName;
      let toIndex: number;

      const overId = over.id as string;

      // Check if dropped on a column
      if (SECTION_NAMES.includes(overId as SectionName)) {
        toSection = overId as SectionName;
        toIndex = board.sections[toSection].length;
      } else {
        // Dropped on a task - find its section
        const overSection = findTaskSection(overId);
        if (!overSection) return;
        toSection = overSection;
        toIndex = board.sections[toSection].findIndex((t) => t.id === overId);
      }

      if (fromSection === toSection) {
        const fromIndex = board.sections[fromSection].findIndex(
          (t) => t.id === taskId
        );
        if (fromIndex !== toIndex) {
          reorderTask(projectId, taskId, fromSection, toIndex);
        }
      } else {
        moveTask(projectId, taskId, toSection, toIndex);
      }
    },
    [board, projectId, findTaskSection, moveTask, reorderTask]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 h-full p-4 overflow-x-auto">
        {SECTION_NAMES.map((section) => (
          <KanbanColumn
            key={section}
            section={section}
            tasks={board.sections[section]}
            projectId={projectId}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: "ease" }}>
        {activeTask ? (
          <KanbanCard
            task={activeTask.task}
            section={activeTask.section}
            isDragging
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
