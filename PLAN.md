# mdkanban - Implementation Plan

## Vision

A markdown-native kanban system consisting of:
1. **`mdkanban.md`** - A human-readable, LLM-manipulatable markdown file format that serves as the single source of truth for project task management
2. **mdkanban Desktop App** - An Electrobun-based desktop application providing a Linear.app-quality kanban UI that reads/writes `mdkanban.md` files directly

---

## Part 1: The `mdkanban.md` File Format Specification

### Design Principles
- Human-readable and editable in any text editor
- LLM-friendly: easy to parse and generate programmatically
- Git-friendly: clean diffs when tasks move between sections
- Self-contained: no external database, no YAML frontmatter complexity

### File Format

```markdown
# Project Name

> repository: https://github.com/user/repo
> created: 2026-04-05
> updated: 2026-04-05

## TODO

- [ ] **Task title here** `#id-001` `priority:high`
  Description of the task goes here. Can be multiple lines.
  Supports **markdown** formatting within the description.

- [ ] **Another task** `#id-002` `priority:medium` `label:frontend`
  A simpler task with a label.

## IN_PROGRESS

- [-] **Task being worked on** `#id-003` `priority:high` `label:backend`
  This task is currently in progress.
  - [x] Subtask completed
  - [ ] Subtask remaining

## DONE

- [x] **Completed task** `#id-004` `priority:low`
  This was finished on 2026-04-01.

## CANCELLED

- [~] **Cancelled task** `#id-005` `priority:low`
  Cancelled because requirements changed.
```

### Format Rules

| Element | Syntax | Notes |
|---------|--------|-------|
| Project title | `# Project Name` | H1, exactly one per file |
| Metadata | `> key: value` | Blockquote lines after H1. `repository`, `created`, `updated` |
| Section headers | `## TODO`, `## IN_PROGRESS`, `## DONE`, `## CANCELLED` | H2, exactly these four, in this order |
| Task | `- [ ] **Title** \`#id-xxx\`` | List item with checkbox, bold title, backtick-wrapped ID |
| Task ID | `` `#id-xxx` `` | Unique across the file. Format: `#id-` + 3-digit zero-padded number. Auto-incremented |
| Priority | `` `priority:high\|medium\|low` `` | Optional. Defaults to `medium` |
| Labels | `` `label:name` `` | Optional. Multiple allowed |
| Description | Indented lines below task | Standard markdown, 2-space indent |
| Subtasks | `  - [x] Subtask` | Nested checkboxes under a task |
| Checkbox states | `[ ]` TODO, `[-]` IN_PROGRESS, `[x]` DONE, `[~]` CANCELLED | Matches section semantics |
| Updated timestamp | `> updated:` | Auto-updated by the app on every write |

### Parser Requirements
- Must handle missing sections gracefully (create them)
- Must preserve description formatting, including code blocks
- Must handle tasks with no description
- Must auto-generate IDs for tasks that lack them
- Must preserve any content outside the four sections (e.g., notes at the bottom)
- Round-trip fidelity: parse then serialize must produce identical output (modulo `updated` timestamp)

---

## Part 2: Desktop Application Architecture

### Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | **Electrobun** | ~12MB bundle, native webview, TypeScript end-to-end, Bun runtime |
| Frontend | **React 19 + Vite** | Fast HMR, ecosystem maturity, component model fits kanban cards |
| Styling | **Tailwind CSS v4 + shadcn/ui** | Utility-first, Linear-quality components, dark mode built-in |
| Drag & Drop | **@dnd-kit/core** | Accessible, performant, React-native DnD with sortable support |
| Markdown parsing | **Custom parser** (regex + line-by-line) | The format is simple enough; no need for a full AST markdown parser |
| State management | **Zustand** | Minimal, performant, works great with React 19 |
| File watching | **`fs.watch`** (Bun native) | Detect external changes to `mdkanban.md` files |
| Database | **bun:sqlite** | Store app-level config (project list, window positions, preferences) |
| IPC | **Electrobun typed RPC** | Type-safe communication between Bun main process and webview |

### Project Structure

```
mdkanban/
  electrobun.config.ts          # Electrobun app configuration
  vite.config.ts                # Vite build config for webview
  tailwind.config.ts            # Tailwind configuration
  components.json               # shadcn/ui config
  package.json
  tsconfig.json

  shared/
    rpc.ts                      # RPC type schema (main <-> webview contract)
    types.ts                    # Shared types: Task, Project, Section, etc.
    parser.ts                   # mdkanban.md parser & serializer
    parser.test.ts              # Parser unit tests

  src/
    bun/                        # Main process (Bun runtime)
      index.ts                  # App entry, window creation, menu, tray
      projects.ts               # Project CRUD (sqlite-backed project registry)
      file-watcher.ts           # fs.watch manager for mdkanban.md files
      file-ops.ts               # Read/write mdkanban.md files
      db.ts                     # SQLite setup for app preferences
      rpc-handlers.ts           # RPC request handler implementations

    mainview/                   # Webview UI (React + Vite)
      index.html
      index.tsx                 # React root + Electroview RPC setup
      index.css                 # Tailwind imports + CSS custom properties

      stores/
        board-store.ts          # Zustand store for active board state
        projects-store.ts       # Zustand store for project list
        ui-store.ts             # UI state (modals, sidebar, theme)

      components/
        layout/
          App.tsx               # Root layout: sidebar + main content
          Sidebar.tsx           # Project list sidebar
          TitleBar.tsx          # Custom title bar (hiddenInset style)
          CommandPalette.tsx    # Cmd+K command palette

        board/
          KanbanBoard.tsx       # 4-column board container with DnD context
          KanbanColumn.tsx      # Single column (TODO/IN_PROGRESS/DONE/CANCELLED)
          KanbanCard.tsx        # Individual task card
          KanbanCardDetail.tsx  # Expanded card editor (slide-over panel)
          EmptyColumn.tsx       # Empty state for columns
          ColumnHeader.tsx      # Column header with count badge

        tasks/
          TaskEditor.tsx        # Rich task editing (title, description, priority, labels)
          TaskDescription.tsx   # Markdown-rendered description
          SubtaskList.tsx       # Subtask checkboxes
          PriorityBadge.tsx     # Priority indicator (icon + color)
          LabelBadge.tsx        # Label pill

        projects/
          ProjectList.tsx       # Sidebar project list
          ProjectCard.tsx       # Project entry in sidebar
          AddProjectDialog.tsx  # File picker to add new project

        shared/
          Button.tsx            # shadcn/ui re-exports
          Dialog.tsx
          DropdownMenu.tsx
          Input.tsx
          ScrollArea.tsx
          Tooltip.tsx

      hooks/
        use-keyboard.ts         # Keyboard shortcuts
        use-file-drop.ts        # Drag file onto window to add project

      lib/
        electrobun.ts           # Electroview RPC client setup
        cn.ts                   # Tailwind class merge utility
        constants.ts            # Section names, colors, icons
```

---

## Part 3: Detailed Feature Specifications

### 3.1 Project Management

**Project Registry (SQLite)**
```sql
CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL UNIQUE,
  repository_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_opened_at TEXT
);

CREATE TABLE preferences (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

**Adding a Project:**
1. User clicks "+" in sidebar or drags an `mdkanban.md` file onto the window
2. Native file dialog opens (filtered to `*.md` files)
3. App reads the file, parses project name from `# heading`
4. Inserts into `projects` table
5. Sets up `fs.watch` on the file
6. Board view populates

**Removing a Project:**
- Right-click project in sidebar -> "Remove from mdkanban"
- Only removes from the registry; never deletes the file

### 3.2 Kanban Board UI (Linear-inspired)

**Layout:**
```
+-------+--------------------------------------------------+
| SIDE  |  TITLE BAR (custom, hiddenInset style)           |
| BAR   +--------------------------------------------------+
|       |  TODO        IN_PROGRESS    DONE      CANCELLED  |
| Proj1 | +----------+ +----------+ +--------+ +--------+ |
| Proj2 | | Card     | | Card     | | Card   | | Card   | |
|  ...  | | Card     | | Card     | |        | |        | |
| ----  | | Card     | |          | |        | |        | |
| + Add | | + New    | | + New    | |        | |        | |
|       | +----------+ +----------+ +--------+ +--------+ |
+-------+--------------------------------------------------+
```

**Design Tokens (Linear-inspired):**
```css
:root {
  /* Background hierarchy */
  --bg-primary: #0a0a0b;        /* Main background */
  --bg-secondary: #111113;      /* Sidebar, column background */
  --bg-tertiary: #1a1a1e;       /* Card background */
  --bg-hover: #222228;          /* Card hover */
  --bg-active: #2a2a32;         /* Card active/selected */

  /* Text hierarchy */
  --text-primary: #e8e8ed;      /* Card titles */
  --text-secondary: #8b8b96;    /* Descriptions, metadata */
  --text-tertiary: #5c5c66;     /* Placeholders */

  /* Accent colors */
  --accent-blue: #5e6ad2;       /* Primary actions */
  --accent-purple: #8b5cf6;     /* Labels */
  --accent-orange: #f59e0b;     /* High priority */
  --accent-green: #22c55e;      /* Done / success */
  --accent-red: #ef4444;        /* Cancelled / urgent */
  --accent-gray: #6b7280;       /* Low priority */

  /* Borders */
  --border-subtle: #1e1e24;     /* Card borders */
  --border-hover: #2e2e38;      /* Hover state borders */

  /* Spacing & Radius */
  --radius-card: 8px;
  --radius-badge: 4px;
  --column-gap: 8px;
  --card-gap: 4px;
  --card-padding: 12px 14px;

  /* Shadows */
  --shadow-card: 0 1px 2px rgba(0,0,0,0.3);
  --shadow-drag: 0 8px 24px rgba(0,0,0,0.5);

  /* Transitions */
  --transition-fast: 120ms ease;
  --transition-normal: 200ms ease;
}
```

**Card Design:**
Each `KanbanCard` displays:
- Task title (bold, single line, truncated with ellipsis)
- First line of description (secondary text, max 2 lines)
- Priority indicator (colored dot: orange=high, blue=medium, gray=low)
- Labels (small pills, max 3 visible + "+N" overflow)
- Subtask progress (e.g., "2/4" with mini progress bar) if subtasks exist
- Task ID (dimmed, e.g., `#id-003`)

**Card Interactions:**
| Action | Behavior |
|--------|----------|
| Click | Open detail panel (slide-over from right, 480px wide) |
| Drag | Pick up card, show drop zones in other columns |
| Right-click | Context menu: Edit, Move to..., Set priority, Delete |
| Hover | Subtle border highlight + bg change |
| Cmd+Click | Multi-select (batch move/delete) |

**Column Interactions:**
| Action | Behavior |
|--------|----------|
| Click "+" | Create new task inline at bottom of column |
| Collapse | Click column header to collapse/expand |
| Drop | Accept card drop, persist to mdkanban.md immediately |
| Count badge | Shows number of tasks (e.g., "TODO (5)") |

**Drag & Drop Implementation (@dnd-kit):**
- Vertical sorting within columns
- Horizontal movement between columns
- Drag overlay with card preview + shadow
- Drop animation (spring physics, ~200ms)
- On drop: update Zustand store -> RPC call to main process -> write mdkanban.md
- Optimistic UI: update state immediately, reconcile on file write confirmation

### 3.3 Task Editor (Detail Panel)

When a card is clicked, a slide-over panel opens from the right:

```
+------------------------------------------+
| <- Back              #id-003    [...] X  |
+------------------------------------------+
| Title (editable, large text)             |
|                                          |
| Priority: [High v]  Labels: [+ Add]     |
|           [tag1] [tag2]                  |
+------------------------------------------+
| Description                              |
| (markdown editor with preview toggle)    |
|                                          |
| Write | Preview                          |
| +--------------------------------------+ |
| | Markdown content here...             | |
| | - supports **bold**, *italic*        | |
| | - `code`, [links](url)              | |
| +--------------------------------------+ |
+------------------------------------------+
| Subtasks                                 |
| [x] Completed subtask                   |
| [ ] Pending subtask                     |
| + Add subtask                           |
+------------------------------------------+
|                          [Save] [Cancel] |
+------------------------------------------+
```

**Editor Behavior:**
- Title: contenteditable div, auto-focus on open
- Priority: dropdown select (high/medium/low)
- Labels: tag input with autocomplete from existing labels in the file
- Description: plain textarea with markdown, tab for preview (rendered HTML)
- Subtasks: checkbox list with inline add/edit/delete
- Save: writes to mdkanban.md via RPC. Debounced auto-save after 1s of inactivity
- Cancel: discard changes, close panel
- Keyboard: `Esc` to close, `Cmd+Enter` to save and close

### 3.4 File Watching & External Change Reconciliation

**Watch Strategy:**
```
Main Process (Bun)
  |
  +-- FileWatcher (per project)
  |     fs.watch(mdkanban.md)
  |     |
  |     +-- on change detected:
  |           1. Debounce 300ms (avoid partial writes)
  |           2. Read file
  |           3. Parse mdkanban.md
  |           4. Diff against in-memory state
  |           5. Send RPC message to webview: "fileChanged"
  |
  +-- Webview receives "fileChanged"
        1. Update Zustand store
        2. React re-renders affected cards
        3. If user has unsaved edits on a changed task:
           - Show toast: "Task #id-003 was modified externally"
           - Offer: "Keep yours" | "Accept external" | "View diff"
```

**Write Locking:**
- When the app writes to mdkanban.md, temporarily ignore the next fs.watch event (self-triggered change)
- Use a write lock flag with 500ms cooldown

### 3.5 Sidebar & Navigation

**Sidebar (220px wide, collapsible):**
- Project list with colored dots (auto-assigned from a palette)
- Active project highlighted
- Drag to reorder projects
- Right-click context menu: Open in editor, Reveal in Finder, Remove
- Bottom: "+ Add Project" button
- Collapse with `Cmd+\`

**Command Palette (Cmd+K):**
- Fuzzy search across all projects and tasks
- Actions: "Go to project", "Go to task", "Create task in [project]", "Move task"
- Keyboard navigable (arrow keys + enter)

### 3.6 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+K` | Command palette |
| `Cmd+N` | New task in active column |
| `Cmd+\` | Toggle sidebar |
| `Cmd+B` | Toggle board/list view (future) |
| `Cmd+,` | Preferences |
| `Cmd+1-4` | Focus column (TODO/IN_PROGRESS/DONE/CANCELLED) |
| `Esc` | Close panel/dialog |
| `Cmd+Enter` | Save and close editor |
| `J/K` | Navigate cards (vim-style) |
| `Enter` | Open selected card |
| `X` | Select card (for batch operations) |
| `D` | Delete selected card(s) |

### 3.7 System Tray

- Tray icon for quick access
- Menu: show/hide window, recent projects, quit
- Badge count of IN_PROGRESS tasks across all projects (optional)

### 3.8 Window Management

```typescript
// electrobun.config.ts
{
  app: {
    name: "mdkanban",
    identifier: "dev.mdkanban.app",
    version: "0.1.0",
  },
  build: {
    views: {
      mainview: { entrypoint: "src/mainview/index.tsx" },
    },
    copy: {
      "src/mainview/index.html": "views/mainview/index.html",
    },
    mac: { bundleCEF: false },  // Use native WebKit
  },
}
```

**BrowserWindow config:**
- `titleBarStyle: "hiddenInset"` - macOS-native translucent title bar
- Custom traffic light positioning
- Persisted window position/size in SQLite preferences
- Min size: 800x500
- Default size: 1200x800

---

## Part 4: Implementation Phases

### Phase 1: Foundation (Core Parser + Skeleton App)
**Goal:** Parse/serialize mdkanban.md + basic Electrobun app that shows content

| # | Task | Details |
|---|------|---------|
| 1.1 | Scaffold Electrobun project | `bunx electrobun init` with react-tailwind-vite template |
| 1.2 | Define shared types | `Task`, `Section`, `Project`, `Board` types in `shared/types.ts` |
| 1.3 | Build mdkanban.md parser | Line-by-line parser: extract metadata, sections, tasks, subtasks |
| 1.4 | Build mdkanban.md serializer | Serialize Board -> markdown string with round-trip fidelity |
| 1.5 | Write parser tests | Cover: empty file, missing sections, tasks with/without descriptions, subtasks, IDs, edge cases |
| 1.6 | RPC schema definition | Define typed RPC contract in `shared/rpc.ts` |
| 1.7 | Main process file I/O | Read/write mdkanban.md via Bun's native fs |
| 1.8 | Basic webview rendering | Render parsed tasks in a simple list (no DnD yet) |

**Deliverable:** App opens, reads an mdkanban.md file, displays tasks in 4 columns.

### Phase 2: Kanban Board UI
**Goal:** Full drag-and-drop kanban board with Linear-quality visuals

| # | Task | Details |
|---|------|---------|
| 2.1 | Install shadcn/ui components | Button, Dialog, DropdownMenu, Input, ScrollArea, Tooltip |
| 2.2 | Design system setup | CSS custom properties, dark theme, typography scale |
| 2.3 | KanbanColumn component | Column with header, card list, "+" button, collapse toggle |
| 2.4 | KanbanCard component | Card with title, description preview, priority dot, labels, subtask count |
| 2.5 | Integrate @dnd-kit | DndContext, SortableContext, drag overlay, column drop zones |
| 2.6 | Persist drag results | On drop -> update store -> RPC -> write mdkanban.md |
| 2.7 | Card animations | Enter/exit transitions, drag shadow, drop spring animation |
| 2.8 | Empty states | Beautiful empty column states with helpful prompts |

**Deliverable:** Fully functional kanban board with drag-and-drop that persists to markdown.

### Phase 3: Task Editor
**Goal:** Rich task editing with markdown support

| # | Task | Details |
|---|------|---------|
| 3.1 | Detail panel slide-over | Animated panel from right, 480px, click-outside to close |
| 3.2 | Title editor | Contenteditable, auto-focus, inline rename |
| 3.3 | Priority selector | Dropdown with colored indicators |
| 3.4 | Label manager | Tag input with autocomplete, add/remove labels |
| 3.5 | Description editor | Textarea with markdown preview toggle |
| 3.6 | Subtask editor | Checkbox list with add/edit/delete/reorder |
| 3.7 | New task creation | Inline creation at bottom of column + Cmd+N shortcut |
| 3.8 | Task deletion | Confirmation dialog, remove from mdkanban.md |
| 3.9 | Auto-save | Debounced 1s after last edit, visual save indicator |

**Deliverable:** Full task CRUD with rich editing.

### Phase 4: Multi-Project & File Watching
**Goal:** Manage multiple projects, react to external file changes

| # | Task | Details |
|---|------|---------|
| 4.1 | SQLite project registry | Create DB, migrations, CRUD for projects table |
| 4.2 | Sidebar component | Project list, active state, reorder, context menu |
| 4.3 | Add Project flow | File picker dialog, parse file, register project |
| 4.4 | Remove Project flow | Context menu action, confirm, remove from registry |
| 4.5 | File watcher setup | `fs.watch` per project, debounced change detection |
| 4.6 | External change handling | Diff detection, store update, conflict toast |
| 4.7 | Write lock mechanism | Ignore self-triggered watch events |
| 4.8 | File drop support | Drag mdkanban.md onto window to add project |

**Deliverable:** Multi-project kanban app that reacts to external file edits in real-time.

### Phase 5: Polish & Platform Features
**Goal:** Production-quality UX

| # | Task | Details |
|---|------|---------|
| 5.1 | Command palette | Cmd+K fuzzy search across projects and tasks |
| 5.2 | Keyboard shortcuts | Full shortcut system (see 3.6 table) |
| 5.3 | Custom title bar | hiddenInset with traffic lights, app title, breadcrumb |
| 5.4 | System tray | Tray icon with menu, show/hide, recent projects |
| 5.5 | Window state persistence | Save/restore position, size, active project |
| 5.6 | Application menu | Native macOS menu with standard items + app actions |
| 5.7 | Context menus | Right-click menus for cards, columns, sidebar items |
| 5.8 | Toast notifications | Non-blocking notifications for saves, conflicts, errors |
| 5.9 | Loading & error states | Skeleton loaders, error boundaries, file-not-found handling |
| 5.10 | Smooth animations | Page transitions, card enter/exit, panel slide |

**Deliverable:** Polished, production-ready desktop application.

### Phase 6: Advanced Features (Post-MVP)
**Goal:** Power user features

| # | Task | Details |
|---|------|---------|
| 6.1 | Search & filter | Filter by priority, label, keyword within a board |
| 6.2 | Bulk operations | Multi-select cards, batch move/delete/label |
| 6.3 | Light theme | Full light mode with theme toggle |
| 6.4 | List view | Alternative list layout (toggle with Cmd+B) |
| 6.5 | Task ordering within columns | Manual reorder via drag, persist order in file |
| 6.6 | Auto-updater | Electrobun's built-in bsdiff update mechanism |
| 6.7 | Cross-platform testing | Windows and Linux builds |

---

## Part 5: RPC Contract (Complete)

```typescript
// shared/rpc.ts
import type { RPCSchema } from "electrobun/bun";
import type { Task, Board, Project } from "./types";

export type MdKanbanRPC = {
  bun: RPCSchema<{
    requests: {
      // Project management
      getProjects: { params: {}; response: Project[] };
      addProject: { params: { filePath: string }; response: Project };
      removeProject: { params: { id: number }; response: { success: boolean } };
      reorderProjects: { params: { ids: number[] }; response: { success: boolean } };

      // Board operations
      getBoard: { params: { projectId: number }; response: Board };
      moveTask: { params: { projectId: number; taskId: string; toSection: string; toIndex: number }; response: Board };
      createTask: { params: { projectId: number; section: string; title: string }; response: Board };
      updateTask: { params: { projectId: number; task: Task }; response: Board };
      deleteTask: { params: { projectId: number; taskId: string }; response: Board };

      // Preferences
      getPreference: { params: { key: string }; response: string | null };
      setPreference: { params: { key: string; value: string }; response: { success: boolean } };

      // File operations
      pickFile: { params: {}; response: string | null };
    };
    messages: {};
  }>;
  webview: RPCSchema<{
    requests: {};
    messages: {
      boardChanged: { projectId: number; board: Board };
      fileError: { projectId: number; error: string };
    };
  }>;
};
```

---

## Part 6: Key Design Decisions

### Why custom parser instead of remark/unified?
The mdkanban format is deliberately constrained. A custom line-by-line parser is:
- ~200 lines of code vs pulling in a large dependency tree
- Faster (no AST construction for a known format)
- Guarantees round-trip fidelity (what we read is exactly what we write back)

### Why Zustand over React Context?
- Zustand works outside React (can be updated from RPC message handlers)
- No provider nesting
- Built-in selectors for performance (cards only re-render when their data changes)

### Why @dnd-kit over react-beautiful-dnd?
- react-beautiful-dnd is unmaintained (archived)
- @dnd-kit is actively maintained, accessible, and supports both sortable + droppable patterns
- Better animation control with CSS transforms

### Why SQLite for the project registry instead of a JSON file?
- Atomic writes (no corruption on crash)
- Easy to add future features (search history, analytics)
- Bun has `bun:sqlite` built-in (zero dependencies)
- But only for app-level config - tasks always live in mdkanban.md

### Why not YAML frontmatter in mdkanban.md?
- Adds parser complexity
- Less readable for humans
- Blockquote metadata (`> key: value`) is valid markdown everywhere
- LLMs handle it naturally

---

## Part 7: Testing Strategy

| Layer | Tool | What to test |
|-------|------|--------------|
| Parser | `bun:test` | Round-trip fidelity, edge cases, malformed input, ID generation |
| Serializer | `bun:test` | Output formatting, section ordering, metadata preservation |
| RPC handlers | `bun:test` | File I/O operations, project CRUD, error handling |
| React components | `vitest` + `@testing-library/react` | Card rendering, board layout, drag interactions |
| E2E | Manual + screenshot tests | Full flow: add project, create task, drag, edit, external change |

---

## Part 8: Dependencies

```json
{
  "dependencies": {
    "electrobun": "latest",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@dnd-kit/core": "^6.0.0",
    "@dnd-kit/sortable": "^8.0.0",
    "@dnd-kit/utilities": "^3.0.0",
    "zustand": "^5.0.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0"
  },
  "devDependencies": {
    "vite": "^6.0.0",
    "tailwindcss": "^4.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "typescript": "^5.7.0"
  }
}
```

Total frontend dependencies: **7** (lean by design).

---

## References & Inspiration

- [Linear Board Layout Docs](https://linear.app/docs/board-layout)
- [Electrobun GitHub](https://github.com/blackboardsh/electrobun)
- [Electrobun Starter (React + shadcn)](https://github.com/mattgi/electrobun-starter)
- [Building Desktop Apps with Electrobun (BetterStack)](https://betterstack.com/community/guides/scaling-nodejs/electrobun-desktop-apps-typescript/)
- [Linear UI Redesign Blog](https://linear.app/now/how-we-redesigned-the-linear-ui)
- [@dnd-kit Documentation](https://dndkit.com/)
