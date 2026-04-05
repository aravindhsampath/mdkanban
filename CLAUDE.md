# mdkanban

A markdown-native kanban system: a file format (`mdkanban.md`) + an Electrobun desktop app.

## Tech Stack
- **Runtime:** Bun (main process via Electrobun)
- **Framework:** Electrobun (NOT Electron - do not use Electron APIs)
- **Frontend:** React 19 + Vite + Tailwind CSS v4 + shadcn/ui
- **DnD:** @dnd-kit/core + @dnd-kit/sortable
- **State:** Zustand
- **IPC:** Electrobun typed RPC (see `shared/rpc.ts`)
- **App DB:** bun:sqlite (project registry + preferences only)
- **Task DB:** mdkanban.md files (markdown is the source of truth)

## Architecture
- `shared/` - Types and parser shared between main process and webview
- `src/bun/` - Main process (file I/O, file watching, SQLite, RPC handlers)
- `src/mainview/` - React webview (kanban UI)

## Key Rules
- The `mdkanban.md` file IS the database. Never store task data elsewhere.
- Parser must have round-trip fidelity (parse -> serialize -> identical output).
- All file operations go through the main process via RPC. The webview never touches the filesystem.
- Use `electrobun/bun` imports in main process, `electrobun/view` in webview.
- Dark theme by default (Linear-inspired design tokens in CSS custom properties).

## File Format
See `PLAN.md` Part 1 for the complete mdkanban.md specification.

## Implementation Order
Follow phases in `PLAN.md` Part 4: Foundation -> Board UI -> Task Editor -> Multi-Project -> Polish -> Advanced.
