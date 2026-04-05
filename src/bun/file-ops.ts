import { parse, serialize, nextId } from "../../shared/parser";
import type { Board, Task, SectionName, SECTION_NAMES } from "../../shared/types";

const VALID_SECTIONS = new Set(["TODO", "IN_PROGRESS", "DONE", "CANCELLED"]);

export async function readBoard(filePath: string): Promise<Board> {
  const content = await Bun.file(filePath).text();
  return parse(content);
}

export async function writeBoard(
  filePath: string,
  board: Board
): Promise<void> {
  const content = serialize(board);
  await Bun.write(filePath, content);
}

export async function moveTask(
  filePath: string,
  taskId: string,
  toSection: string,
  toIndex: number
): Promise<Board> {
  if (!VALID_SECTIONS.has(toSection)) {
    throw new Error(`Invalid section: ${toSection}`);
  }
  const board = await readBoard(filePath);
  const target = toSection as SectionName;

  // Find and remove task from current section
  let task: Task | null = null;
  for (const section of VALID_SECTIONS) {
    const s = section as SectionName;
    const idx = board.sections[s].findIndex((t) => t.id === taskId);
    if (idx !== -1) {
      task = board.sections[s].splice(idx, 1)[0];
      break;
    }
  }

  if (!task) throw new Error(`Task not found: ${taskId}`);

  // Insert at target position
  const clampedIndex = Math.min(toIndex, board.sections[target].length);
  board.sections[target].splice(clampedIndex, 0, task);

  await writeBoard(filePath, board);
  return board;
}

export async function reorderTask(
  filePath: string,
  taskId: string,
  section: string,
  toIndex: number
): Promise<Board> {
  if (!VALID_SECTIONS.has(section)) {
    throw new Error(`Invalid section: ${section}`);
  }
  const board = await readBoard(filePath);
  const s = section as SectionName;
  const tasks = board.sections[s];
  const fromIndex = tasks.findIndex((t) => t.id === taskId);
  if (fromIndex === -1) throw new Error(`Task not found in ${section}: ${taskId}`);

  const [task] = tasks.splice(fromIndex, 1);
  const clampedIndex = Math.min(toIndex, tasks.length);
  tasks.splice(clampedIndex, 0, task);

  await writeBoard(filePath, board);
  return board;
}

export async function createTask(
  filePath: string,
  section: string,
  title: string
): Promise<Board> {
  if (!VALID_SECTIONS.has(section)) {
    throw new Error(`Invalid section: ${section}`);
  }
  const board = await readBoard(filePath);
  const id = nextId(board);

  const task: Task = {
    id,
    title,
    description: "",
    priority: "medium",
    labels: [],
    subtasks: [],
  };

  board.sections[section as SectionName].push(task);
  await writeBoard(filePath, board);
  return board;
}

export async function updateTask(
  filePath: string,
  updatedTask: Task
): Promise<Board> {
  const board = await readBoard(filePath);

  for (const section of VALID_SECTIONS) {
    const s = section as SectionName;
    const idx = board.sections[s].findIndex((t) => t.id === updatedTask.id);
    if (idx !== -1) {
      board.sections[s][idx] = updatedTask;
      await writeBoard(filePath, board);
      return board;
    }
  }

  throw new Error(`Task not found: ${updatedTask.id}`);
}

export async function deleteTask(
  filePath: string,
  taskId: string
): Promise<Board> {
  const board = await readBoard(filePath);

  for (const section of VALID_SECTIONS) {
    const s = section as SectionName;
    const idx = board.sections[s].findIndex((t) => t.id === taskId);
    if (idx !== -1) {
      board.sections[s].splice(idx, 1);
      await writeBoard(filePath, board);
      return board;
    }
  }

  throw new Error(`Task not found: ${taskId}`);
}
