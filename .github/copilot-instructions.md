# Copilot / AI agent instructions — Smart Schedule

This file contains concise, actionable guidance for AI agents working on this repository so you can be productive immediately.

Summary
- Single-page React app scaffolded to run with Vite (dev: `npm run dev`, build: `npm run build`).
- UI uses Tailwind utility classes and a small design-system under `src/ui/*` (Radix-based primitives wrapped as `Button`, `Card`, `Select`, etc.).

Quick dev commands
- Install: `npm i`
- Dev server: `npm run dev` (Vite server, opens on port 3000 by default per `vite.config.ts`).
- Build: `npm run build` (output dir: `build` per Vite config).

Big picture architecture
- Entry: `src/main.tsx` -> renders `src/App.tsx`.
- `src/App.tsx` holds top-level UI state: authentication flag, `isAdmin`, `tasks` array (in-memory), selected date range and dialog visibility. There is currently no backend; tasks are stored in local React state.
- Views and panels are split into components under `src/components/`:
  - `ScheduleView.tsx` — main calendar grid and task rendering/positioning logic.
  - `TaskFormDialog.tsx` — task creation/edit form and the authoritative Task type (see Data shapes below).
  - `ScheduleHeader.tsx`, `Sidebar.tsx`, `RightPanel.tsx`, `AIChatPanel.tsx` — supporting UI.
- `src/ui/` contains small UI primitives and wrappers (use these rather than creating raw DOM markup when possible).

Key files to inspect when making changes
- `src/App.tsx` — app-level state, task overlap checks, and handlers (onCalendarClick, onTaskClick, onDateRangeChange).
- `src/components/ScheduleView.tsx` — how tasks are laid out into hours/days (top/height calculations, `onCalendarClick` usage).
- `src/components/TaskFormDialog.tsx` — Task interface (data shape), validation expectations, `datetime-local` inputs.
- `vite.config.ts` — alias `@` -> `./src`, dev port, build target/outDir.
- `package.json` — scripts and dependencies list (note: some packages like `next` appear but project is Vite + React).

Data shapes (authoritative)
Refer to `src/components/TaskFormDialog.tsx`. Task objects are expected to be shaped like:

```text
Task {
  id: string
  title: string
  description: string
  startDate: string // ISO string, used with <input type="datetime-local"> formatting
  deadline: string // ISO string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
}
```

Important project-specific patterns & conventions
- In-memory state: Right now tasks are kept in `App` state (no persistence). When adding server sync, update `App` handlers (`handleSaveTask`, `handleLogout`, etc.).
- Date/time formatting: `onCalendarClick` in `App.tsx` creates a `YYYY-MM-DDTHH:MM` string to prefill `datetime-local` inputs — maintain this format when producing example data.
- Overlap checks: `App.checkTaskOverlap` is the single place that detects conflicts; use it when changing save logic.
- Event handling: many grid elements rely on event.stopPropagation() to prevent parent click handlers (see task click handlers in `ScheduleView.tsx`). Preserve this when moving handlers.
- UI primitives: Use `src/ui/*` components (e.g., `Button`, `Card`, `Select`) for consistent styling and behavior.
- Styling: Tailwind utility classes are used everywhere (do not replace with inline styles or CSS modules without good reason).

Integration points & external deps
- Icons: `lucide-react` throughout.
- UI primitives: `@radix-ui/*` components wrapped in `src/ui`.
- Notifications: `sonner` is present in dependencies; search for uses before reintroducing.
- AI chat: `src/components/AIChatPanel.tsx` exists as a UI; check whether it wires to a backend or mock service before changing intent.

Examples (copy/paste friendly)
- Prefill Task dialog (how App formats the datetime): `2025-10-21T14:00` — use the same `YYYY-MM-DDTHH:MM` shape when setting `defaultStartDate`.
- To add a new task programmatically, produce an object matching the Task shape without `id` (the app will add `id: Date.now().toString()` when creating new tasks).

Practical guidance for AI edits
- Small UI changes: prefer editing `src/ui/*` primitives instead of touching many components.
- Adding a new feature that touches tasks: modify `App.tsx` handlers first (save/overlap/formatting) so children remain dumb/pure.
- When changing date logic, add tests or small run checks because `ScheduleView` layout depends on exact hour calculations (top, height, startHour).
- Preserve accessibility attributes from Radix wrappers when editing `src/ui` components.

Gotchas / oddities discovered
- `package.json` lists `next` and `next-themes` even though the project runs with Vite; treat these entries as leftovers unless you see code importing Next-specific APIs.
- There's no tests or CI defined in this copy; running `npm run dev` is the canonical quick verification.

If something is unclear
- Tell me which component or flow you'd like more detail about (I can extract prop shapes, walk a code path, or produce small examples/tests). Leave feedback and I'll iterate.

References (where to look for the examples above)
- `src/App.tsx`, `src/components/ScheduleView.tsx`, `src/components/TaskFormDialog.tsx`, `src/components/ScheduleHeader.tsx`, `src/ui/`.
