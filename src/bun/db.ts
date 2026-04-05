import { Database } from "bun:sqlite";
import { mkdirSync } from "fs";
import { Utils } from "electrobun/bun";

let db: Database;

export function getDb(): Database {
  if (!db) {
    const userDataDir = Utils.paths.userData;
    mkdirSync(userDataDir, { recursive: true });
    const dbPath = `${userDataDir}/mdkanban.db`;
    db = new Database(dbPath, { create: true });
    db.exec("PRAGMA journal_mode=WAL");
    migrate(db);
  }
  return db;
}

function migrate(db: Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      file_path TEXT NOT NULL UNIQUE,
      repository_url TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_opened_at TEXT
    );

    CREATE TABLE IF NOT EXISTS preferences (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}
