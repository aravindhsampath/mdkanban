import {
  BrowserWindow,
  BrowserView,
  ApplicationMenu,
  Utils,
} from "electrobun/bun";
import type { MdKanbanRPC } from "../../shared/rpc";
import type { Board, SectionName } from "../../shared/types";
import { getDb } from "./db";
import {
  getAllProjects,
  addProjectAsync,
  removeProject,
  reorderProjects,
  getProjectById,
  updateLastOpened,
} from "./projects";
import {
  readBoard,
  moveTask,
  reorderTask,
  createTask,
  updateTask,
  deleteTask,
} from "./file-ops";
import {
  startWatching,
  stopWatching,
  acquireWriteLock,
  releaseWriteLock,
} from "./file-watcher";

// Initialize database on startup
getDb();

function sendToWebview(method: "boardChanged" | "fileError", data: any) {
  mainWindow.webview?.rpc?.send?.[method]?.(data);
}

const rpc = BrowserView.defineRPC<MdKanbanRPC>({
  maxRequestTime: 10000,
  handlers: {
    requests: {
      getProjects: () => {
        console.log("[mdkanban:bun] getProjects called");
        const projects = getAllProjects();
        console.log("[mdkanban:bun] getProjects returning:", projects.length, "projects");
        return projects;
      },

      addProject: async ({ filePath }) => {
        console.log("[mdkanban:bun] addProject called with:", filePath);
        const project = await addProjectAsync(filePath);
        console.log("[mdkanban:bun] addProject result:", project);
        startWatching(
          project.id,
          project.filePath,
          (projectId, board) => {
            sendToWebview("boardChanged", { projectId, board });
          },
          (projectId, error) => {
            sendToWebview("fileError", { projectId, error });
          }
        );
        return project;
      },

      removeProject: ({ id }) => {
        stopWatching(id);
        return { success: removeProject(id) };
      },

      reorderProjects: ({ ids }) => {
        reorderProjects(ids);
        return { success: true };
      },

      getBoard: async ({ projectId }) => {
        console.log("[mdkanban:bun] getBoard called for projectId:", projectId);
        const project = getProjectById(projectId);
        if (!project) throw new Error(`Project not found: ${projectId}`);
        updateLastOpened(projectId);
        return await readBoard(project.filePath);
      },

      moveTask: async ({ projectId, taskId, toSection, toIndex }) => {
        const project = getProjectById(projectId);
        if (!project) throw new Error(`Project not found: ${projectId}`);
        acquireWriteLock(project.filePath);
        try {
          const board = await moveTask(
            project.filePath,
            taskId,
            toSection,
            toIndex
          );
          releaseWriteLock(project.filePath);
          return board;
        } catch (err) {
          releaseWriteLock(project.filePath);
          throw err;
        }
      },

      reorderTask: async ({ projectId, taskId, section, toIndex }) => {
        const project = getProjectById(projectId);
        if (!project) throw new Error(`Project not found: ${projectId}`);
        acquireWriteLock(project.filePath);
        try {
          const board = await reorderTask(
            project.filePath,
            taskId,
            section,
            toIndex
          );
          releaseWriteLock(project.filePath);
          return board;
        } catch (err) {
          releaseWriteLock(project.filePath);
          throw err;
        }
      },

      createTask: async ({ projectId, section, title }) => {
        const project = getProjectById(projectId);
        if (!project) throw new Error(`Project not found: ${projectId}`);
        acquireWriteLock(project.filePath);
        try {
          const board = await createTask(project.filePath, section, title);
          releaseWriteLock(project.filePath);
          return board;
        } catch (err) {
          releaseWriteLock(project.filePath);
          throw err;
        }
      },

      updateTask: async ({ projectId, task }) => {
        const project = getProjectById(projectId);
        if (!project) throw new Error(`Project not found: ${projectId}`);
        acquireWriteLock(project.filePath);
        try {
          const board = await updateTask(project.filePath, task);
          releaseWriteLock(project.filePath);
          return board;
        } catch (err) {
          releaseWriteLock(project.filePath);
          throw err;
        }
      },

      deleteTask: async ({ projectId, taskId }) => {
        const project = getProjectById(projectId);
        if (!project) throw new Error(`Project not found: ${projectId}`);
        acquireWriteLock(project.filePath);
        try {
          const board = await deleteTask(project.filePath, taskId);
          releaseWriteLock(project.filePath);
          return board;
        } catch (err) {
          releaseWriteLock(project.filePath);
          throw err;
        }
      },

      getPreference: ({ key }) => {
        const db = getDb();
        const row = db
          .query("SELECT value FROM preferences WHERE key = ?")
          .get(key) as { value: string } | null;
        return row ? row.value : null;
      },

      setPreference: ({ key, value }) => {
        const db = getDb();
        db.query(
          "INSERT OR REPLACE INTO preferences (key, value) VALUES (?, ?)"
        ).run(key, value);
        return { success: true };
      },

      pickFile: async () => {
        console.log("[mdkanban:bun] pickFile called");
        try {
          const result = await Utils.openFileDialog({
            allowedFileTypes: "md",
            canChooseFiles: true,
            canChooseDirectory: false,
            allowsMultipleSelection: false,
          });
          console.log("[mdkanban:bun] pickFile result:", result);
          return result && result.length > 0 ? result[0] : null;
        } catch (err) {
          console.error("[mdkanban:bun] pickFile error:", err);
          return null;
        }
      },

      pickAndAddProject: async () => {
        console.log("[mdkanban:bun] pickAndAddProject called");
        try {
          const result = await Utils.openFileDialog({
            allowedFileTypes: "md",
            canChooseFiles: true,
            canChooseDirectory: false,
            allowsMultipleSelection: false,
          });
          console.log("[mdkanban:bun] file dialog result:", result);
          if (!result || result.length === 0) return null;

          const filePath = result[0];
          const project = await addProjectAsync(filePath);
          console.log("[mdkanban:bun] project added:", project);

          startWatching(
            project.id,
            project.filePath,
            (projectId, board) => {
              sendToWebview("boardChanged", { projectId, board });
            },
            (projectId, error) => {
              sendToWebview("fileError", { projectId, error });
            }
          );

          return project;
        } catch (err) {
          console.error("[mdkanban:bun] pickAndAddProject error:", err);
          return null;
        }
      },
    },
    messages: {},
  },
});

// Create main window
const mainWindow = new BrowserWindow({
  title: "mdkanban",
  url: "views://mainview/index.html",
  frame: { width: 1200, height: 800, x: 100, y: 100 },
  titleBarStyle: "hiddenInset",
  rpc: rpc,
});

// Set up application menu
ApplicationMenu.setApplicationMenu([
  {
    label: "mdkanban",
    submenu: [
      { label: "About mdkanban", role: "about" },
      { type: "separator" },
      { label: "Quit", role: "quit", accelerator: "CmdOrCtrl+Q" },
    ],
  },
  {
    label: "File",
    submenu: [
      {
        label: "Add Project...",
        accelerator: "CmdOrCtrl+O",
      },
      { type: "separator" },
      { label: "Close Window", role: "close", accelerator: "CmdOrCtrl+W" },
    ],
  },
  {
    label: "Edit",
    submenu: [
      { label: "Undo", role: "undo", accelerator: "CmdOrCtrl+Z" },
      { label: "Redo", role: "redo", accelerator: "CmdOrCtrl+Shift+Z" },
      { type: "separator" },
      { label: "Cut", role: "cut", accelerator: "CmdOrCtrl+X" },
      { label: "Copy", role: "copy", accelerator: "CmdOrCtrl+C" },
      { label: "Paste", role: "paste", accelerator: "CmdOrCtrl+V" },
      { label: "Select All", role: "selectAll", accelerator: "CmdOrCtrl+A" },
    ],
  },
  {
    label: "View",
    submenu: [
      {
        label: "Toggle Developer Tools",
        role: "toggleDevTools",
        accelerator: "CmdOrCtrl+Alt+I",
      },
      { label: "Reload", role: "reload", accelerator: "CmdOrCtrl+R" },
    ],
  },
]);

// Start file watchers for all existing projects
const projects = getAllProjects();
for (const project of projects) {
  startWatching(
    project.id,
    project.filePath,
    (projectId, board) => {
      sendToWebview("boardChanged", { projectId, board });
    },
    (projectId, error) => {
      sendToWebview("fileError", { projectId, error });
    }
  );
}
