# mdkanban

> repository: https://github.com/aravindhsampathkumar/mdkanban
> created: 2026-04-05
> updated: 2026-04-05

## TODO

- [ ] **Scaffold Electrobun project with react-tailwind-vite template** `#id-001` `priority:high` `label:foundation`
  Run `bunx electrobun init`, select react-tailwind-vite, install shadcn/ui and dependencies.

- [ ] **Define shared types (Task, Section, Board, Project)** `#id-002` `priority:high` `label:foundation`
  Create `shared/types.ts` with all core data types.

- [ ] **Build mdkanban.md parser** `#id-003` `priority:high` `label:foundation`
  Line-by-line parser: metadata, sections, tasks, subtasks, labels, priority.

- [ ] **Build mdkanban.md serializer** `#id-004` `priority:high` `label:foundation`
  Serialize Board back to markdown with round-trip fidelity.

- [ ] **Write parser/serializer tests** `#id-005` `priority:high` `label:foundation` `label:testing`
  Cover edge cases: empty file, missing sections, no descriptions, subtasks, ID generation.

- [ ] **Define RPC schema** `#id-006` `priority:high` `label:foundation`
  Type-safe contract in `shared/rpc.ts` for all main<->webview communication.

- [ ] **Implement main process file I/O and RPC handlers** `#id-007` `priority:high` `label:foundation`
  Read/write mdkanban.md, handle all RPC requests in `src/bun/`.

- [ ] **Build KanbanBoard with 4 columns** `#id-008` `priority:high` `label:ui`
  Column layout with TODO, IN_PROGRESS, DONE, CANCELLED columns.

- [ ] **Build KanbanCard component** `#id-009` `priority:high` `label:ui`
  Card with title, description preview, priority dot, labels, subtask count.

- [ ] **Integrate @dnd-kit drag and drop** `#id-010` `priority:high` `label:ui`
  Cross-column drag, sortable within columns, persist on drop.

- [ ] **Build task editor slide-over panel** `#id-011` `priority:medium` `label:ui`
  Edit title, description (markdown), priority, labels, subtasks.

- [ ] **Implement SQLite project registry** `#id-012` `priority:medium` `label:backend`
  bun:sqlite for storing project list, preferences, window state.

- [ ] **Build sidebar with project list** `#id-013` `priority:medium` `label:ui`
  Project navigation, add/remove projects, reorder.

- [ ] **Implement file watcher for external changes** `#id-014` `priority:medium` `label:backend`
  fs.watch per project, debounced, diff detection, conflict handling.

- [ ] **Add command palette (Cmd+K)** `#id-015` `priority:medium` `label:ui`
  Fuzzy search across projects and tasks.

- [ ] **Implement keyboard shortcuts** `#id-016` `priority:medium` `label:ui`
  Full shortcut system for navigation and actions.

- [ ] **Custom title bar and system tray** `#id-017` `priority:low` `label:ui`
  hiddenInset title bar, tray icon with menu.

- [ ] **Window state persistence** `#id-018` `priority:low` `label:backend`
  Save/restore window position, size, active project.

- [ ] **Design system and dark theme polish** `#id-019` `priority:medium` `label:ui`
  Linear-inspired design tokens, animations, transitions.

- [ ] **Create GitHub repository** `#id-020` `priority:high` `label:infra`
  Initialize remote repo and push initial scaffolding.

## IN_PROGRESS

## DONE

## CANCELLED
