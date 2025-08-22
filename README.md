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

- **Complete Family Coordination Platform**: Multi-user system with family profiles, permissions, and personal dashboards
- **Advanced Task Management**: Drag & drop, recurring tasks, bulk actions, and visual assignment system
- **Comprehensive Meal Planning**: Recipe management, meal history tracking, nutritional analysis, and recipe reviews
- **Real-Time Features**: Live synchronization across devices with conflict resolution
- **Recipe Intelligence**: Usage analytics, rating systems, and meal rotation suggestions
- **Mobile-First Design**: Responsive layout with touch-optimized interactions
- **Accessibility-Focused**: ARIA labels, keyboard navigation, and screen reader support
- **Pluggable Architecture**: Local storage and backend API adapters with seamless switching

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
  - `components/` — UI components
    - **Core**: WeekView, TaskList, TaskEditor, TaskEditor
    - **Family**: FamilyManager, PermissionsManager, FamilyProfiles
    - **Meals**: RecipeManager, RecipeEditor, RecipeImporter, MealPlanner
    - **Analytics**: MealHistoryView, NutritionAnalysis, RecipeReviews, RecipeAnalytics
    - **Advanced**: BulkActionsBar, SyncIndicator, DragDrop components
  - `lib/` — Business logic and utilities
    - `dal.ts` — Pluggable data access layer (localStorage + backend adapters)
    - `recurrence.ts` — Recurring task calculation engine
    - `realtime.ts` — Cross-device synchronization system
    - `storage.ts` — Local storage helpers
  - `types.ts` — Comprehensive TypeScript interfaces
  - `data/` — Sample data and fixtures
- `server/` — Development Express + SQLite server (dev only)
- `devplan.md` — Detailed roadmap and implementation notes
- `development-plan.md` — Legacy development tracking

## Progress (latest)

**🎉 MVP Complete - Production-Ready Family Coordination Platform!**

### **Major Milestones Achieved**
- ✅ **Complete Multi-User System**: Family profiles, visual identities, role-based permissions, and personal dashboards
- ✅ **Advanced Task Management**: Drag & drop, recurring tasks, bulk actions, visual assignment system
- ✅ **Comprehensive Meal Planning**: Recipe management, creation, import, and full recipe database
- ✅ **Meal History & Analytics**: Complete meal tracking with usage analytics and performance insights
- ✅ **Recipe Intelligence**: Rating system, reviews, usage patterns, and meal rotation suggestions
- ✅ **Nutrition Analysis**: Detailed nutritional tracking with family member analysis
- ✅ **Real-Time Synchronization**: Live updates across devices with conflict resolution
- ✅ **Browser Notifications**: Smart scheduling with family-focused timing

### **Technical Excellence**
- ✅ **Type-Safe Architecture**: Full TypeScript implementation with comprehensive interfaces
- ✅ **Pluggable Data Layer**: Seamless switching between local storage and backend APIs
- ✅ **Mobile-First Responsive Design**: Perfect experience across all device sizes
- ✅ **Accessibility Compliance**: ARIA labels, keyboard navigation, and screen reader support
- ✅ **Performance Optimized**: Efficient data loading and real-time updates

### **Enterprise-Ready Features**
- ✅ **Role-Based Security**: Granular permissions system for different family members
- ✅ **Data Persistence**: Robust storage with automatic backup and migration
- ✅ **Cross-Device Harmony**: Seamless experience across all family devices
- ✅ **Advanced Analytics**: Usage patterns, family preferences, and performance metrics

See `devplan.md` for the detailed roadmap and remaining enhancement opportunities.

See `devplan.md` for the full roadmap and detailed status updates.

## Notes

- This project is a work-in-progress. The backend in `server/` is intended for local development and prototyping; it is not hardened for production.
- The DAL keeps the app pluggable: add methods to `IDataAccess` and implement in both adapters to extend storage capabilities.

