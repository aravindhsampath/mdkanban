export interface Subtask {
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  labels: string[];
  subtasks: Subtask[];
}

export type SectionName = "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED";

export const SECTION_NAMES: SectionName[] = [
  "TODO",
  "IN_PROGRESS",
  "DONE",
  "CANCELLED",
];

export const CHECKBOX_FOR_SECTION: Record<SectionName, string> = {
  TODO: "[ ]",
  IN_PROGRESS: "[-]",
  DONE: "[x]",
  CANCELLED: "[~]",
};

export const SECTION_FOR_CHECKBOX: Record<string, SectionName> = {
  "[ ]": "TODO",
  "[-]": "IN_PROGRESS",
  "[x]": "DONE",
  "[~]": "CANCELLED",
};

export interface BoardMetadata {
  repository?: string;
  created?: string;
  updated?: string;
  [key: string]: string | undefined;
}

export interface Board {
  projectName: string;
  metadata: BoardMetadata;
  sections: Record<SectionName, Task[]>;
  trailingContent: string;
}

export interface Project {
  id: number;
  name: string;
  filePath: string;
  repositoryUrl: string | null;
  sortOrder: number;
  createdAt: string;
  lastOpenedAt: string | null;
}
