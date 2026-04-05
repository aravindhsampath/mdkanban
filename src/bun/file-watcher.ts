import { watch, type FSWatcher } from "fs";
import { readBoard } from "./file-ops";
import type { Board } from "../../shared/types";

type ChangeCallback = (projectId: number, board: Board) => void;
type ErrorCallback = (projectId: number, error: string) => void;

interface WatchEntry {
  watcher: FSWatcher;
  projectId: number;
  filePath: string;
  debounceTimer: ReturnType<typeof setTimeout> | null;
}

const watchers = new Map<number, WatchEntry>();
let writeLocks = new Set<string>();

export function startWatching(
  projectId: number,
  filePath: string,
  onChange: ChangeCallback,
  onError: ErrorCallback
): void {
  stopWatching(projectId);

  try {
    const watcher = watch(filePath, (eventType) => {
      if (eventType !== "change") return;
      if (writeLocks.has(filePath)) return;

      const entry = watchers.get(projectId);
      if (!entry) return;

      // Debounce: wait 300ms for file to finish writing
      if (entry.debounceTimer) clearTimeout(entry.debounceTimer);
      entry.debounceTimer = setTimeout(async () => {
        try {
          const board = await readBoard(filePath);
          onChange(projectId, board);
        } catch (err) {
          onError(
            projectId,
            err instanceof Error ? err.message : "Unknown error reading file"
          );
        }
      }, 300);
    });

    watchers.set(projectId, {
      watcher,
      projectId,
      filePath,
      debounceTimer: null,
    });
  } catch (err) {
    onError(
      projectId,
      err instanceof Error ? err.message : "Failed to watch file"
    );
  }
}

export function stopWatching(projectId: number): void {
  const entry = watchers.get(projectId);
  if (entry) {
    if (entry.debounceTimer) clearTimeout(entry.debounceTimer);
    entry.watcher.close();
    watchers.delete(projectId);
  }
}

export function stopAll(): void {
  for (const [id] of watchers) {
    stopWatching(id);
  }
}

export function acquireWriteLock(filePath: string): void {
  writeLocks.add(filePath);
}

export function releaseWriteLock(filePath: string): void {
  // Release after a short delay to skip the self-triggered watch event
  setTimeout(() => {
    writeLocks.delete(filePath);
  }, 500);
}
