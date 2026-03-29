# Architecture

**Analysis Date:** 2026-03-28

## Pattern Overview

**Overall:** Single Page Application (SPA) with Express.js backend using Vite for development/production

**Key Characteristics:**
- Frontend: React 19 SPA built with Vite
- Backend: Express.js server that handles both API routes and serves the frontend
- Authentication: Google OAuth 2.0 for Gmail access
- Communication: REST API over HTTP between frontend and backend
- Development: Vite middlewareMode in development, static files in production

## Layers

### Frontend Layer (React SPA)
- **Location:** `src/`
- **Purpose:** UI rendering and user interaction
- **Contains:** React components, types, utilities
- **Depends on:** React 19, React Router, Recharts, Motion
- **Used by:** Browser

### Backend Layer (Express API)
- **Location:** `server.ts`
- **Purpose:** API endpoints, OAuth handling, Gmail integration, session management
- **Contains:** Express routes, Google APIs client, cookie session middleware
- **Depends on:** Express, Google APIs, cookie-session
- **Used by:** Frontend via fetch API

### Shared Types Layer
- **Location:** `src/types.ts`
- **Purpose:** TypeScript interfaces shared across frontend and backend (Email, Stats, User)
- **Contains:** TypeScript interfaces
- **Depends on:** None
- **Used by:** Frontend components, backend (via import conceptually)

## Data Flow

### User Authentication Flow:
1. User clicks "Connect Gmail" button in frontend
2. Frontend calls `/api/auth/url` to get OAuth URL
3. Backend generates Google OAuth URL with required scopes (Gmail, userinfo)
4. Frontend opens popup with OAuth URL
5. User authorizes application on Google
6. Google redirects to `/auth/callback` with authorization code
7. Backend exchanges code for tokens and stores in session
8. Callback sends postMessage to frontend with success status
9. Frontend fetches user info via `/api/user`

### Email Processing Flow:
1. User navigates to Inbox tab
2. Frontend calls `/api/emails` to fetch inbox emails
3. Backend uses Gmail API to list and fetch email details
4. Frontend displays emails as swipeable cards
5. User swipes right (delete) or left (skip)
6. Frontend optimistically removes card from UI
7. Frontend POSTs to `/api/action` with emailId and action
8. Backend performs action on Gmail and stores in session stats

### Stats Flow:
1. User navigates to Stats tab
2. Frontend calls `/api/stats`
3. Backend calculates stats from in-memory sessionActions array
4. Backend returns: totalProcessed, totalDeleted, totalSkipped, efficiency, activity (last 7 days)

## Key Abstractions

### Email Abstraction
- **Purpose:** Represents an email message from Gmail
- **Examples:** `src/types.ts` (Email interface)
- **Fields:** id, threadId, subject, from, snippet, date

### Stats Abstraction
- **Purpose:** Represents user email processing statistics
- **Examples:** `src/types.ts` (Stats interface)
- **Fields:** totalProcessed, totalDeleted, totalSkipped, efficiency, activity[]

### User Abstraction
- **Purpose:** Represents authenticated Google user
- **Examples:** `src/types.ts` (User interface)
- **Fields:** id, email, name, picture

## Entry Points

### Backend Server
- **Location:** `server.ts`
- **Triggers:** `npm run dev` or `npm start`
- **Responsibilities:**
  - Initialize Express app
  - Configure middleware (CORS, cookie-session, JSON parsing)
  - Set up Google OAuth2 client
  - Define API routes
  - Start Vite dev server (dev mode) or serve static files (prod mode)
  - Listen on port 3000

### Frontend Entry
- **Location:** `src/main.tsx`
- **Triggers:** Vite serves index.html which loads main.tsx
- **Responsibilities:**
  - Mount React app to #root element
  - Render App component in StrictMode

### Main App Component
- **Location:** `src/App.tsx`
- **Triggers:** Rendered by main.tsx
- **Responsibilities:**
  - Manage application state (activeTab, user, emails, stats, loading)
  - Handle authentication flow
  - Fetch emails, user info, and stats
  - Render Navigation, CardStack, or StatsDashboard based on activeTab

## Routing

**Approach:** Client-side state-based routing (no React Router configuration visible)

The application uses React state (`activeTab`) to switch between two main views:
- `'inbox'` - CardStack component for email processing
- `'stats'` - StatsDashboard component for viewing statistics

Navigation is handled by `BottomNav` component which calls `setActiveTab`.

## State Management

**Strategy:** React useState hooks in App.tsx

**State Variables:**
- `activeTab: 'inbox' | 'stats'` - Current navigation tab
- `user: User | null` - Authenticated user (null if not logged in)
- `emails: Email[]` - List of emails in inbox
- `stats: Stats | null` - Processing statistics
- `loading: boolean` - Loading state for initial data fetch
- `lastAction: { emailId, action, data } | null` - For undo functionality

## Error Handling

**Frontend Patterns:**
- Try/catch blocks around fetch calls
- Console.error for logging failures
- Optimistic UI updates with manual rollback on failure
- Loading states displayed during async operations

**Backend Patterns:**
- Try/catch blocks around async operations
- Console.error for logging errors
- HTTP status codes: 401 for unauthorized, 500 for server errors
- JSON error responses: `{ error: string }`

## Cross-Cutting Concerns

**Authentication:** Google OAuth 2.0 with cookie-session middleware
- Session stored in encrypted cookies
- Tokens persisted across requests via req.session.tokens

**API Communication:** REST over HTTP
- Frontend uses fetch API
- Endpoints: /api/auth/url, /auth/callback, /api/user, /api/emails, /api/action, /api/stats, /api/logout

**Styling:** Tailwind CSS 4 with custom design tokens
- CSS variables for colors, fonts
- Custom utility classes (editorial-gradient, glass-card, vibrant-glow)

---

*Architecture analysis: 2026-03-28*
