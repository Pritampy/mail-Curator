# Codebase Structure

**Analysis Date:** 2026-03-28

## Directory Layout

```
/home/pritam-singh/Personal/AI/
├── .planning/codebase/     # GSD planning documents
├── src/
│   ├── components/         # React components
│   ├── lib/                # Utility functions
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # Entry point
│   ├── types.ts            # TypeScript interfaces
│   └── index.css           # Global styles
├── server.ts               # Express backend
├── index.html             # HTML entry
├── package.json           # Dependencies
├── vite.config.ts         # Vite configuration
├── tsconfig.json          # TypeScript config
└── metadata.json          # Project metadata
```

## Directory Purposes

### src/
- **Purpose:** Source code for the React frontend
- **Contains:** All TypeScript/TSX files, CSS, components

### src/components/
- **Purpose:** React UI components
- **Contains:** Feature-specific components
- **Key files:**
  - `Navigation.tsx` - TopBar and BottomNav components
  - `CardStack.tsx` - Swipeable email card interface
  - `StatsDashboard.tsx` - Statistics display with charts

### src/lib/
- **Purpose:** Utility functions and helpers
- **Contains:** Reusable TypeScript utilities
- **Key files:**
  - `utils.ts` - Class name merging utility (cn function)

### Root Level Files
- **Purpose:** Configuration and build files
- **Key files:**
  - `server.ts` - Express backend with API routes
  - `index.html` - HTML template
  - `package.json` - npm dependencies and scripts
  - `vite.config.ts` - Vite bundler configuration
  - `tsconfig.json` - TypeScript compiler options

## Key File Locations

### Entry Points
- `src/main.tsx` - React app entry (mounts to #root)
- `index.html` - HTML template with #root div
- `server.ts` - Server entry (runs Express + Vite)

### Configuration
- `vite.config.ts` - Vite plugins (React, Tailwind), path aliases (@ → root)
- `package.json` - Dependencies, scripts, version

### Core Logic
- `src/App.tsx` - Main component with state management and routing
- `src/types.ts` - TypeScript interfaces (Email, Stats, User)
- `server.ts` - All backend API endpoints

### Components
- `src/components/Navigation.tsx` - TopBar and BottomNav
- `src/components/CardStack.tsx` - Email card display and swipe handling
- `src/components/StatsDashboard.tsx` - Statistics visualization

### Utilities
- `src/lib/utils.ts` - cn() function for Tailwind class merging

## Naming Conventions

### Files
- Components: PascalCase with component name (e.g., `Navigation.tsx`, `CardStack.tsx`)
- Utils: camelCase (e.g., `utils.ts`)
- Types: PascalCase (e.g., `types.ts`)
- Config: camelCase/kebab-case (e.g., `vite.config.ts`, `tsconfig.json`)

### Components
- React components: PascalCase export (e.g., `export const CardStack: React.FC<...>`)
- Props interfaces: ComponentNameProps (e.g., `CardStackProps`)

### TypeScript
- Interfaces: PascalCase (e.g., `Email`, `Stats`, `User`)
- Type exports: Named exports from `types.ts`

## Where to Add New Code

### New Feature (Frontend)
- Primary code: `src/components/` (create new component file)
- Types: `src/types.ts` (add interface)
- Styles: `src/index.css` (add CSS variables/classes)

### New Component/Module
- Implementation: `src/components/NewComponent.tsx`
- If utility needed: `src/lib/`

### New API Endpoint
- Implementation: Add route handler in `server.ts`
- Frontend integration: Add fetch function in `src/App.tsx` or create API module

### Styling Changes
- Global styles: `src/index.css`
- Component styles: Inline Tailwind classes in component files

## Special Directories

### .planning/codebase/
- **Purpose:** GSD planning documents
- **Generated:** Yes (by gsd-codebase-mapper)
- **Committed:** Yes

### node_modules/
- **Purpose:** npm dependencies
- **Generated:** Yes (npm install)
- **Committed:** No (in .gitignore)

### dist/
- **Purpose:** Production build output
- **Generated:** Yes (npm run build)
- **Committed:** No (in .gitignore)

## API Endpoints

All API endpoints are defined in `server.ts`:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/url` | GET | Get Google OAuth URL |
| `/auth/callback` | GET | OAuth callback handler |
| `/api/user` | GET | Fetch authenticated user |
| `/api/emails` | GET | Fetch inbox emails |
| `/api/action` | POST | Perform email action (delete/skip) |
| `/api/stats` | GET | Fetch processing statistics |
| `/api/logout` | POST | Clear session |

---

*Structure analysis: 2026-03-28*
