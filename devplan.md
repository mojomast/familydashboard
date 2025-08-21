# Family Dashboard — Development Plan

Goal: build a simple, maintainable React + Vite app for a family to manage weekly recurring tasks and one-off tasks.

This document is written so an AI agent can follow the steps and mark progress. It contains the high-level plan, a checklist of requirements, the data model, component breakdown, dev tasks, quality gates, and commands.

## Assumptions
- We'll use Vite + React with TypeScript for better DX and safety. If you prefer plain JavaScript, change the scaffolding step accordingly.
- Initial storage will be local (localStorage). Backend/sync will be a later optional milestone.
- The app targets modern desktop and mobile browsers.

## Requirements (extracted)
- Create a React dashboard using Vite.
- Support weekly recurring tasks.
- Support one-off tasks.
- Provide an AI-agent-friendly devplan with steps and progress marking.
- Include setup, build, test, and lint instructions.

Mark each requirement below as Done/Deferred when completed.

## Contract (tiny)
- Inputs: user actions creating/updating tasks; optional recurrence rules (weekly weekdays); mark complete/uncomplete; date/time inputs.
- Outputs: UI that lists upcoming tasks for the week, shows one-off tasks, allows create/edit/delete, supports recurring rules, persists locally.
- Error modes: invalid date input; conflicting recurrence; storage failures (quota, private browsing). Agent should show friendly errors and fall back to in-memory.
- Success criteria: app boots, tasks persist between reloads, recurring tasks appear each week on their defined days, one-off tasks appear on their due date.

## Edge cases
- A recurring task edited to a different set of weekdays should not duplicate historical completions.
- Timezone differences for due dates.
- Deleting a task that has completion history.
- Leap-day/edge-date handling for one-offs.
- Large number of tasks impacting performance.

## Milestones
1. Project scaffold (Vite + React + TypeScript) and tooling (ESLint, Prettier, Vitest).
2. Core data model and local persistence (localStorage wrapper + migrations).
3. UI skeleton: Dashboard, TaskList, TaskEditor modal, and Recurring settings.
4. Recurrence engine: weekly recurrence generation and next-due calculation.
5. Completion logging: marking tasks done with timestamp and undo.
6. Filters and week view (by weekday + one-off view).
7. Tests (unit for recurrence engine + simple component tests), linting, and build verification.
8. Optional: simple backend sync API or export/import.

## Files to create (initial)
- `package.json` — project config (created by Vite).
- `index.html`, `src/main.tsx`, `src/App.tsx` — app entry.
- `src/components/TaskList.tsx` — list UI.
- `src/components/TaskEditor.tsx` — create/edit task modal.
- `src/components/WeekView.tsx` — shows days and tasks.
- `src/lib/storage.ts` — localStorage wrapper and types.
- `src/lib/recurrence.ts` — recurrence helper logic and tests.
- `src/types.ts` — Task/Recurrence types.
- `devplan.md` — this file.

## Data model (recommended)
- Task
  - id: string (uuid)
  - title: string
  - notes?: string
  - createdAt: string (ISO)
  - type: 'one-off' | 'recurring'
  - dueDate?: string (ISO) // for one-off tasks
  - recurrence?: {
      days: number[] // 0-6 (Sun-Sat) for weekly recurrence
      startDate?: string // ISO, optional
      endDate?: string // ISO, optional
    }
  - assignedTo?: string (optional family member name/id)
  - archived?: boolean
- Completion
  - taskId: string
  - completedAt: string (ISO)
  - instanceDate?: string (ISO) // the date instance the task was completed for (useful for recurring tasks)

## Recurrence rules
- Only weekly recurrence is required initially.
- For each recurring task, compute the instances for the visible week range (Mon-Sun or Sun-Sat; pick consistent week-start).
- When a recurring task is marked complete for an instance, record a Completion with instanceDate.
- When editing a recurring task, do not retroactively change past Completions; new instances from the edit date onward follow new rules.

## UX / Pages
- Dashboard (root): shows today's tasks and upcoming week summary.
- Week view: shows each weekday and tasks assigned that day (recurring + one-offs whose dueDate is that day).
- Task editor modal: create/edit a task with recurrence controls and due date.
- Settings: configure week start, family members (optional), export/import JSON.

## Implementation steps (detailed)
Each step below is marked with a checkbox syntax so an agent can update it in-place.

### 1 — Scaffold
- [ ] Create a Vite + React + TypeScript project.
  - PowerShell commands (run in project root):

```powershell
# from workspace root
npm create vite@latest . -- --template react-ts
npm install
```

- [ ] Add ESLint + Prettier + Vitest
  - Suggested commands:

```powershell
npm i -D eslint eslint-config-prettier prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm i -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

Acceptance: `npm run dev` starts Vite and shows the React app.

### 2 — Types & Storage
- [ ] Create `src/types.ts` with `Task` and `Completion` types.
- [ ] Implement `src/lib/storage.ts` — a small wrapper exposing load/save/migrate functions and feature toggles for backend later.
- [ ] Add sample fixtures `src/data/sampleTasks.ts` for development.

Acceptance: simple unit test that saves a task and reads it back.

### 3 — Recurrence Engine
- [ ] Implement `src/lib/recurrence.ts`:
  - Function: `instancesForWeek(tasks: Task[], weekStart: Date): Array<{ task: Task, date: string }>`
  - Function: `nextInstance(task: Task, fromDate?: Date): Date | null`
- [ ] Unit tests for:
  - Single recurring task on Mon/Wed/Fri returns correct dates for a sample week.
  - Editing recurrence does not retroactively edit completion history.

Acceptance: vitest passes for recurrence tests.

### 4 — UI Components
- [ ] `TaskList` — render tasks for a given date; shows completion state and toggle.
- [ ] `WeekView` — 7 columns (configurable start), each column shows tasks and a create button.
- [ ] `TaskEditor` — modal to create/edit tasks. Support: title, notes, type, dueDate, recurrence days.
- [ ] `Header` — app title and settings.

Acceptance: Manual smoke test; create recurring and one-off tasks and see them in views.

### 5 — Completion Flow
- [ ] Implement completion logging in `src/lib/storage.ts`.
- [ ] UI toggles mark a task as done for that instance date.
- [ ] Undo operation to remove latest completion.

Acceptance: completion persists and is reflected after reload.

### 6 — Filters & Settings
- [ ] Filter: show only tasks assigned to a person or only recurring/one-off.
- [ ] Settings page: week start and export/import.

Acceptance: filters apply correctly.

### 7 — Tests, Lint, CI
- [ ] Add unit tests for recurrence and storage.
- [ ] Add ESLint/Prettier config.
- [ ] Add GitHub Actions workflow (optional) for node install + test + lint.

Acceptance: CI pipeline runs and passes locally.

### 8 — Optional: Backend Sync
- [ ] Design simple REST contract for tasks and completions.
- [ ] Implement a tiny Express/SQLite server or suggest Supabase.

Acceptance: basic sync works with local server.

## How an AI agent should mark progress
- Edit this `devplan.md` and update checkboxes from `[ ]` to:
  - `[in-progress]` when starting a task (include `@who` and timestamp),
  - `[done]` when finished (timestamp + short note),
  - `[blocked]` with a short reason if blocked.

Example:
- [in-progress] Scaffold project — @agent-name 2025-08-21T12:00Z
- [done] Create `src/types.ts` — @agent-name 2025-08-21T12:10Z — basic Task/Completion types

Also add a short `## Progress Log` section at the top of the file for quick status messages.

## Quick dev commands (PowerShell)
- Start dev server:

```powershell
npm run dev
```

- Run tests:

```powershell
npm test
# or if using vitest
npx vitest
```

- Build:

```powershell
npm run build
```

- Lint (if configured):

```powershell
npx eslint "src/**/*.{ts,tsx}"
```

## Quality gates
- Build: `npm run build` — must succeed.
- Lint: no new ESLint errors.
- Tests: recurrence + storage tests pass.
- Smoke: create a recurring and a one-off task and verify persistence.

## Next steps (what I'll do now)
1. Create `devplan.md` in the repo (done by this file creation).
2. If you want, I will scaffold the Vite project next and update the checklist statuses.

---

## Progress Log
- [done] Created `devplan.md` — automated agent 2025-08-21
 - [done] Scaffold Vite + React + TypeScript project — automated agent 2025-08-21

## Files created by scaffold
- `index.html` — app entry HTML
- `package.json` — project metadata and scripts
- `tsconfig.json` — TypeScript config
- `src/main.tsx` — React bootstrap
- `src/App.tsx` — starter app component
- `src/assets` — static assets
- `public` — public assets (if any)

## Progress Log (updates)
- [done] Implemented types, storage API (including completions) and recurrence engine — automated agent 2025-08-21
- [done] Added minimal components and wired sample data — automated agent 2025-08-21
- [done] Wired completion toggles with localStorage persistence — automated agent 2025-08-21
- [done] Implemented `TaskEditor` and wired task create/save to localStorage — automated agent 2025-08-21
- [done] Fixed runtime type import in `src/lib/recurrence.ts` to avoid missing export at runtime — automated agent 2025-08-21
- [done] Implemented edit/delete flows for tasks (UI hooks + storage helpers) — automated agent 2025-08-21
- [done] Implemented 5-day rows UI with categories (meals/chores/other) and per-day notes saved to localStorage — automated agent 2025-08-21
- [in-progress] Add quick-add (+) buttons per column/day and 7-day meal edit flow — automated agent 2025-08-21
- [done] Added `MealPlanner` UI for editing next 7 days of meals inline and wired + buttons — automated agent 2025-08-21



