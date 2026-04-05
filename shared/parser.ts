import {
  type Board,
  type Task,
  type Subtask,
  type SectionName,
  type BoardMetadata,
  SECTION_NAMES,
  CHECKBOX_FOR_SECTION,
  SECTION_FOR_CHECKBOX,
} from "./types";

const SECTION_HEADER_RE = /^## (TODO|IN_PROGRESS|DONE|CANCELLED)\s*$/;
const TASK_RE =
  /^- \[([ x~-])\] \*\*(.+?)\*\*(.*)$/;
const SUBTASK_RE = /^  - \[([ x])\] (.+)$/;
const METADATA_RE = /^> (\w+):\s*(.*)$/;
const ID_RE = /`#(id-\d+)`/;
const PRIORITY_RE = /`priority:(high|medium|low)`/;
const LABEL_RE = /`label:([^`]+)`/g;

function parseTaskInline(inline: string): {
  id: string;
  priority: "high" | "medium" | "low";
  labels: string[];
} {
  const idMatch = inline.match(ID_RE);
  const priorityMatch = inline.match(PRIORITY_RE);
  const labels: string[] = [];
  let m: RegExpExecArray | null;
  const labelRe = new RegExp(LABEL_RE.source, "g");
  while ((m = labelRe.exec(inline)) !== null) {
    labels.push(m[1]);
  }
  return {
    id: idMatch ? idMatch[1] : "",
    priority: (priorityMatch ? priorityMatch[1] : "medium") as
      | "high"
      | "medium"
      | "low",
    labels,
  };
}

export function parse(content: string): Board {
  const lines = content.split("\n");
  const board: Board = {
    projectName: "",
    metadata: {},
    sections: {
      TODO: [],
      IN_PROGRESS: [],
      DONE: [],
      CANCELLED: [],
    },
    trailingContent: "",
  };

  let currentSection: SectionName | null = null;
  let currentTask: Task | null = null;
  let descriptionLines: string[] = [];
  let trailingLines: string[] = [];
  let inTrailing = false;
  let headerFound = false;
  let maxId = 0;

  function flushTask() {
    if (currentTask && currentSection) {
      currentTask.description = descriptionLines.join("\n").trimEnd();
      board.sections[currentSection].push(currentTask);
      currentTask = null;
      descriptionLines = [];
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Project name (first H1)
    if (!headerFound && line.startsWith("# ") && !line.startsWith("## ")) {
      board.projectName = line.slice(2).trim();
      headerFound = true;
      continue;
    }

    // Metadata lines (blockquotes after H1, before first section)
    if (headerFound && currentSection === null) {
      const metaMatch = line.match(METADATA_RE);
      if (metaMatch) {
        board.metadata[metaMatch[1]] = metaMatch[2].trim();
        continue;
      }
    }

    // Section headers
    const sectionMatch = line.match(SECTION_HEADER_RE);
    if (sectionMatch) {
      flushTask();
      currentSection = sectionMatch[1] as SectionName;
      inTrailing = false;
      continue;
    }

    // After CANCELLED section, everything is trailing content
    if (
      currentSection === "CANCELLED" &&
      line.startsWith("## ") &&
      !sectionMatch
    ) {
      flushTask();
      inTrailing = true;
      trailingLines.push(line);
      continue;
    }

    if (inTrailing) {
      trailingLines.push(line);
      continue;
    }

    if (!currentSection) continue;

    // Task line
    const taskMatch = line.match(TASK_RE);
    if (taskMatch) {
      flushTask();
      const checkbox = taskMatch[1];
      const title = taskMatch[2];
      const rest = taskMatch[3];
      const { id, priority, labels } = parseTaskInline(rest);

      // Track max ID for auto-generation
      const idNum = id.match(/id-(\d+)/);
      if (idNum) {
        maxId = Math.max(maxId, parseInt(idNum[1], 10));
      }

      currentTask = {
        id,
        title,
        description: "",
        priority,
        labels,
        subtasks: [],
      };
      continue;
    }

    // Subtask line (under a task)
    if (currentTask) {
      const subtaskMatch = line.match(SUBTASK_RE);
      if (subtaskMatch) {
        currentTask.subtasks.push({
          done: subtaskMatch[1] === "x",
          title: subtaskMatch[2],
        });
        continue;
      }

      // Description line (indented content under task)
      if (line.startsWith("  ") && line.trim() !== "") {
        descriptionLines.push(line.slice(2));
        continue;
      }

      // Blank line within description
      if (line.trim() === "" && descriptionLines.length > 0) {
        descriptionLines.push("");
        continue;
      }
    }

    // Blank line between tasks or at section boundary
    if (line.trim() === "") {
      if (currentTask && descriptionLines.length === 0) {
        // Blank line after task with no description started yet, ignore
      }
      continue;
    }
  }

  flushTask();
  board.trailingContent = trailingLines.join("\n").trimEnd();

  // Auto-assign IDs to tasks that don't have one
  for (const section of SECTION_NAMES) {
    for (const task of board.sections[section]) {
      if (!task.id) {
        maxId++;
        task.id = `id-${String(maxId).padStart(3, "0")}`;
      }
    }
  }

  // Create missing sections (already initialized in board)
  return board;
}

export function serialize(board: Board): string {
  const lines: string[] = [];

  // Project name
  lines.push(`# ${board.projectName}`);
  lines.push("");

  // Metadata
  const metaKeys = Object.keys(board.metadata);
  if (metaKeys.length > 0) {
    for (const key of metaKeys) {
      const value =
        key === "updated"
          ? new Date().toISOString().slice(0, 10)
          : board.metadata[key];
      if (value !== undefined) {
        lines.push(`> ${key}: ${value}`);
      }
    }
    lines.push("");
  }

  // Sections
  for (const section of SECTION_NAMES) {
    lines.push(`## ${section}`);
    lines.push("");

    const tasks = board.sections[section];
    for (const task of tasks) {
      const checkbox = CHECKBOX_FOR_SECTION[section];
      let taskLine = `- ${checkbox} **${task.title}** \`#${task.id}\``;

      if (task.priority !== "medium") {
        taskLine += ` \`priority:${task.priority}\``;
      }

      for (const label of task.labels) {
        taskLine += ` \`label:${label}\``;
      }

      lines.push(taskLine);

      // Description
      if (task.description) {
        const descLines = task.description.split("\n");
        for (const dl of descLines) {
          lines.push(dl === "" ? "" : `  ${dl}`);
        }
      }

      // Subtasks
      for (const st of task.subtasks) {
        const cb = st.done ? "[x]" : "[ ]";
        lines.push(`  - ${cb} ${st.title}`);
      }

      lines.push("");
    }
  }

  // Trailing content
  if (board.trailingContent) {
    lines.push(board.trailingContent);
    lines.push("");
  }

  return lines.join("\n");
}

export function nextId(board: Board): string {
  let maxId = 0;
  for (const section of SECTION_NAMES) {
    for (const task of board.sections[section]) {
      const m = task.id.match(/id-(\d+)/);
      if (m) maxId = Math.max(maxId, parseInt(m[1], 10));
    }
  }
  return `id-${String(maxId + 1).padStart(3, "0")}`;
}
