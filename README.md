
    # dashboardussy

    dashboardussy is a small React + TypeScript + Vite application for managing family-style tasks, meal planning, and a weekly dashboard view. This repository contains the app source and minimal tooling to run, build, and test locally.

    Author: Kyle Durepos

    Key features

    - Weekly dashboard view (calendar-like week) with tasks and quick add
    - Meal planner view with per-day meal entries
    - Task editor for creating, updating and deleting tasks
    - Local persistence (simple storage layer)

    Tech stack

    - React 19 + TypeScript
    - Vite as the dev server and build tool
    # Family Dashboard

    Family Dashboard is a small React + TypeScript + Vite application for managing family tasks, weekly planning, and meals.

    Author: Kyle Durepos

    ## Features

    - Weekly dashboard view with quick-add per day/category
    - Meal planner for the next 7 days
    - Task editor for one-off and recurring weekly tasks
    - Local persistence via a simple storage layer

    ## Tech stack

    - React 19 + TypeScript
    - Vite dev server and build
    - Vitest for unit tests
    - ESLint + Prettier

    ## Quick start (development)

    ```powershell
    cd c:\Users\kyle\projects\familydashboard
    npm install
    npm run dev
    ```

    Vite will print a local URL you can open in your browser.

    ## Build for production

    ```powershell
    npm run build
    ```

    ## Run tests

    ```powershell
    npx vitest run --reporter verbose
    ```

    ## Project layout

    - `src/` — React app source
      - `App.tsx` — main app and tabs
      - `components/` — `WeekView`, `MealPlanner`, `TaskEditor`, `TaskList`
      - `lib/` — recurrence logic and storage helpers
      - `data/sampleTasks.ts` — sample data used when storage is empty
    - `index.html` — Vite entry HTML
    - `package.json` — scripts and deps

    ## Roadmap (Phase 2 highlights)

    Planned improvements (see `devplan.md` for details):

    - SQLite-backed data layer (client-side WASM or backend service), with migration from localStorage
    - Visual polish via Tailwind/Radix or Mantine; accessibility and theming (light/dark)
    - Customizable categories, labels, and colors; tags and assignees
    - Improved schedule planning (multi-week views, drag-and-drop, ICS export)
    - Meal-linked grocery checklists and reusable meal templates
    - Mobile-friendly responsive layout, PWA support and offline mode
    - QR code button to open the app on a phone quickly
    - Expanded tests and CI

    ## Notes

    - Current persistence uses localStorage (`src/lib/storage.ts`). Migration tooling will move your data to SQLite when enabled.
    - Feedback and feature requests are welcome. Check `devplan.md` for progress.
