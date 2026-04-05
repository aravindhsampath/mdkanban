import { getDb } from "./db";
import { parse } from "../../shared/parser";
import type { Project } from "../../shared/types";

export function getAllProjects(): Project[] {
  const db = getDb();
  return db
    .query(
      "SELECT id, name, file_path as filePath, repository_url as repositoryUrl, sort_order as sortOrder, created_at as createdAt, last_opened_at as lastOpenedAt FROM projects ORDER BY sort_order"
    )
    .all() as Project[];
}

export function addProject(filePath: string): Project {
  const db = getDb();
  const content = Bun.file(filePath).text();
  const board = parse(content as unknown as string);

  const name = board.projectName || filePath.split("/").pop() || "Untitled";
  const repo = board.metadata.repository || null;

  const maxOrder = db
    .query("SELECT COALESCE(MAX(sort_order), -1) as m FROM projects")
    .get() as { m: number };

  const result = db
    .query(
      "INSERT INTO projects (name, file_path, repository_url, sort_order) VALUES (?, ?, ?, ?) RETURNING id, name, file_path as filePath, repository_url as repositoryUrl, sort_order as sortOrder, created_at as createdAt, last_opened_at as lastOpenedAt"
    )
    .get(name, filePath, repo, maxOrder.m + 1) as Project;

  return result;
}

export async function addProjectAsync(filePath: string): Promise<Project> {
  const db = getDb();

  // Return existing if already registered
  const existing = db
    .query("SELECT id, name, file_path as filePath, repository_url as repositoryUrl, sort_order as sortOrder, created_at as createdAt, last_opened_at as lastOpenedAt FROM projects WHERE file_path = ?")
    .get(filePath) as Project | null;
  if (existing) return existing;

  const content = await Bun.file(filePath).text();
  const board = parse(content);

  const name = board.projectName || filePath.split("/").pop() || "Untitled";
  const repo = board.metadata.repository || null;

  const maxOrder = db
    .query("SELECT COALESCE(MAX(sort_order), -1) as m FROM projects")
    .get() as { m: number };

  const result = db
    .query(
      "INSERT INTO projects (name, file_path, repository_url, sort_order) VALUES (?, ?, ?, ?) RETURNING id, name, file_path as filePath, repository_url as repositoryUrl, sort_order as sortOrder, created_at as createdAt, last_opened_at as lastOpenedAt"
    )
    .get(name, filePath, repo, maxOrder.m + 1) as Project;

  return result;
}

export function removeProject(id: number): boolean {
  const db = getDb();
  const result = db.query("DELETE FROM projects WHERE id = ?").run(id);
  return result.changes > 0;
}

export function reorderProjects(ids: number[]): void {
  const db = getDb();
  const stmt = db.query("UPDATE projects SET sort_order = ? WHERE id = ?");
  for (let i = 0; i < ids.length; i++) {
    stmt.run(i, ids[i]);
  }
}

export function updateLastOpened(id: number): void {
  const db = getDb();
  db.query("UPDATE projects SET last_opened_at = datetime('now') WHERE id = ?").run(id);
}

export function getProjectById(id: number): Project | null {
  const db = getDb();
  return (
    (db
      .query(
        "SELECT id, name, file_path as filePath, repository_url as repositoryUrl, sort_order as sortOrder, created_at as createdAt, last_opened_at as lastOpenedAt FROM projects WHERE id = ?"
      )
      .get(id) as Project) || null
  );
}
