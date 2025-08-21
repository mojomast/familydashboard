# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
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
    - Vitest for unit tests
    - ESLint + Prettier for linting/formatting

    Quick start (development)

    Open a terminal and run:

    ```powershell
    cd c:\Users\kyle\projects\familydashboard
    npm install
    npm run dev
    ```

    Build for production

    ```powershell
    npm run build
    ```

    Run tests

    ```powershell
    npx vitest run --reporter verbose
    ```

    Project layout (important files)

    - `src/` - React app source
      - `App.tsx` - main app and tab UI
      - `components/` - UI components: `WeekView`, `MealPlanner`, `TaskEditor`, `TaskList`
    - `data/sampleTasks.ts` - sample data used when no stored tasks exist
    - `lib/` - utilities: recurrence logic, local storage helpers, tests
    - `index.html` - Vite entry HTML
    - `package.json` - scripts and dependencies

    Notes

    - The app uses a simple local-storage-based persistence layer (`lib/storage.ts`). If you plan to add syncing across devices, replace that layer with a backend API.
    - This README was updated to reflect the project name `dashboardussy` and author details.

    If you want changes to the README content or additional documentation (API, architecture diagram, or contributor guide), tell me what to add and I will update it.
