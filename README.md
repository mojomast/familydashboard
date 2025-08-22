# dashboardussy

<p align="center">
  <a href="https://github.com/mojomast/familydashboard"><img alt="repo size" src="https://img.shields.io/github/repo-size/mojomast/familydashboard?color=informational" /></a>
  <img alt="status" src="https://img.shields.io/badge/status-WIP-orange" />
  <img alt="license" src="https://img.shields.io/badge/license-MIT-lightgrey" />
</p>

dashboardussy is a compact, opinionated React + TypeScript app for family planning: weekly tasks, meal planning, and simple grocery lists.

Quick tags:

<p>
  <img alt="React" src="https://img.shields.io/badge/React-19.1.1-61DAFB?logo=react&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript&logoColor=white" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-7.x-646cff?logo=vite&logoColor=white" />
  <img alt="Express" src="https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white" />
  <img alt="SQLite" src="https://img.shields.io/badge/SQLite-better--sqlite3-003B57?logo=sqlite&logoColor=white" />
</p>

---

## Highlights

- Weekly dashboard with quick-add per day/category
- Meal planner for the coming week with attachable grocery items
- One-off and recurring weekly tasks with per-instance completion
- Pluggable Data Access Layer (localStorage adapter + backend API)
- Accessibility-focused components (ActionMenu), theming, responsive layout

## Quickstart (development)

Open PowerShell and run:

```powershell
cd C:\Users\kyle\projects\familydashboard
npm install
# optional: start the backend (recommended for full feature set)
npm run server
# in another shell: start the frontend dev server
npm run dev
```

The frontend runs at the Vite URL (usually http://localhost:5173). The dev server proxies `/api` to the backend at http://localhost:3001.

## Build

```powershell
npm run build
```

## Tests

```powershell
npx vitest run --reporter verbose
```

## Project layout

- `src/` — React app source
  - `components/` — UI components (WeekView, TaskList, TaskEditor, MealPlanner)
  - `lib/` — recurrence logic, DAL, storage helpers
  - `data/` — sample fixtures
- `server/` — development Express + SQLite server (dev only)
- `devplan.md` — roadmap and implementation notes

## Progress (latest)

- Backend scaffolded: Express + SQLite endpoints for tasks, completions, notes, groceries, categories, and settings.
- DAL implemented: pluggable `src/lib/dal.ts` with backend and local adapters.
- UI polish: accessible ActionMenu dropdown for task actions, modal backdrop, and mobile-centered create-task dialog.
- Features added: per-day grocery lists, QR share button, and settings to edit categories + toggle 5/7 day week.
- Safety: lint and type fixes; added a small `scripts/run-and-log.ps1` helper and `.assistant/PAUSE.md` to support pause/continue runs.

See `devplan.md` for the full roadmap and detailed status updates.

## Notes

- This project is a work-in-progress. The backend in `server/` is intended for local development and prototyping; it is not hardened for production.
- The DAL keeps the app pluggable: add methods to `IDataAccess` and implement in both adapters to extend storage capabilities.

