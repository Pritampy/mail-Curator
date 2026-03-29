# Phase 01: Gmail PWA - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning
**Source:** User requirements from /gsd-plan-phase

<domain>
## Phase Boundary

Build a production-ready Progressive Web App (PWA) for Gmail inbox cleaning using a swipe-based interaction model. Each email is processed via right swipe (delete) or left swipe (skip). This phase integrates logic into the existing UI without redesigning it.

**What this phase delivers:**
- Enhanced frontend swipe logic with card state management
- Optimistic updates with undo functionality
- MongoDB Atlas backend for persistent action storage
- Modular REST API endpoints
- PWA capabilities

</domain>

<decisions>
## Implementation Decisions

### UI/Interaction (D-01 through D-03)
- **D-01:** Swipe-based interaction - right swipe = delete (trash), left swipe = skip
- **D-02:** Swipe threshold: 100px to trigger action
- **D-03:** Visual feedback during swipe: card rotation + color overlay (delete=purple overlay, skip=gray overlay)

### Frontend Logic (D-04 through D-08)
- **D-04:** Optimistic UI updates - remove card immediately, rollback on API failure
- **D-05:** Single-level undo functionality - undo last action only
- **D-06:** Batch preloading - load 20 emails initially, fetch next batch when 5 remaining
- **D-07:** Loading states - spinner during API calls
- **D-08:** Error states - toast notification on API failure

### Backend Architecture (D-09 through D-14)
- **D-09:** Use existing Express.js server (server.ts) - do NOT create new server
- **D-10:** Gmail API integration using googleapis library (already installed)
- **D-11:** MongoDB Atlas for storing email actions
- **D-12:** Modular service architecture - separate GmailService, DatabaseService
- **D-13:** REST endpoints: GET /emails, POST /delete, POST /skip, GET /stats
- **D-14:** Secure credential handling via environment variables only

### Data Model (D-15)
- **D-15:** EmailAction schema: { emailId, sender, subject, action, timestamp, userId }

### PWA (D-16)
- **D-16:** Web app manifest + service worker for offline capability

### the agent's Discretion
- Animation library choice (use existing Motion/Framer Motion)
- CSS framework (use existing TailwindCSS)
- Card stack rendering approach (use existing stack pattern)
- MongoDB connection string format
- Error toast library (use existing or simple alert)
- Service worker caching strategy

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Codebase
- `src/App.tsx` — Main app component with auth, state management
- `src/components/CardStack.tsx` — Swipeable card component with Motion
- `src/components/StatsDashboard.tsx` — Statistics display
- `src/components/Navigation.tsx` — App navigation
- `src/types.ts` — TypeScript interfaces
- `server.ts` — Express backend with Gmail API integration

### Project Configuration
- `package.json` — Dependencies (googleapis, express, etc.)
- `.env.example` — Environment variable template

### External Specs
- Gmail API Documentation — https://developers.google.com/gmail/api
- MongoDB Atlas Documentation — https://www.mongodb.com/docs/atlas

</canonical_refs>

<specifics>
## Specific Ideas

**Core functionality:**
1. Right swipe → POST /api/delete → Trash email in Gmail
2. Left swipe → POST /api/skip → Mark as skipped (no Gmail action)
3. Undo → Restore last action (untrash if was delete)
4. Batch preload → When emails.length <= 5, fetch next 20

**Stats to track:**
- totalProcessed (deleted + skipped)
- totalDeleted 
- totalSkipped
- deletionRate = (totalDeleted / totalProcessed) * 100

**MongoDB Collection:** `email_actions`

</specifics>

<deferred>
## Deferred Ideas

- Dark mode support (marked as future/v2)
- Multiple email account support
- Custom swipe thresholds
- Keyboard shortcuts
- Bulk selection mode

</deferred>

---

*Phase: 01-gmail-pwa*
*Context gathered: 2026-03-28*
