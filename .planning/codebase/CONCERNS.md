# Codebase Concerns

**Analysis Date:** 2026-03-28

## Security Issues

**Hardcoded Session Secret:**
- Issue: Cookie session uses hardcoded key `'kinetic-secret-key'` in `server.ts` line 36
- Files: `server.ts`
- Impact: Anyone with code access can forge sessions. Not suitable for production.
- Fix approach: Use `process.env.SESSION_SECRET` with a fallback that errors in production

**Missing Input Validation:**
- Issue: `/api/action` endpoint accepts any `emailId`, `action`, `emailData` without validation
- Files: `server.ts` (lines 143-172)
- Impact: Could accept malformed data or arbitrary actions
- Fix approach: Add Zod/yup validation schema for request body

**OAuth Security Gaps:**
- Issue: No CSRF protection on OAuth callback, no state parameter validation
- Files: `server.ts` (lines 61-86)
- Impact: Vulnerable to CSRF attacks during auth flow
- Fix approach: Generate and validate `state` parameter in OAuth flow

**Overly Permissive CORS:**
- Issue: CORS configured without origin restrictions
- Files: `server.ts` (line 33)
- Impact: API can be called from any origin
- Fix approach: Use `origin: process.env.ALLOWED_ORIGIN` whitelist

**No Rate Limiting:**
- Issue: All API endpoints lack rate limiting
- Files: `server.ts`
- Impact: Vulnerable to abuse, DoS attacks
- Fix approach: Add `express-rate-limit` middleware

## Technical Debt

**In-Memory Data Storage:**
- Issue: `sessionActions` array stored in memory (`server.ts` line 23)
- Files: `server.ts`
- Impact: All stats lost on server restart. Not suitable for production.
- Fix approach: Integrate database (PostgreSQL, MongoDB, or Redis) for persistence

**Token Refresh Not Handled:**
- Issue: No logic to refresh expired OAuth tokens
- Files: `server.ts`
- Impact: Users must re-authenticate when tokens expire (typically 1 hour)
- Fix approach: Implement token refresh in middleware or before each API call

**Undo Feature is Incomplete:**
- Issue: Frontend has undo for visual purposes only; backend doesn't support untrash
- Files: `server.ts`, `src/App.tsx` (line 113 comment)
- Impact: Users think they can undo but deleted emails are actually trashed
- Fix approach: Add `/api/action` endpoint to support `untrash` action, or remove undo UI

**Hardcoded Config Values:**
- Issue: Various hardcoded values throughout codebase:
  - `"+12% vs LW"` in `StatsDashboard.tsx` line 54
  - `"+200 today"` inbox prediction in `StatsDashboard.tsx` line 122
- Files: `src/components/StatsDashboard.tsx`
- Impact: Misleading UI showing fake data
- Fix approach: Remove hardcoded strings or fetch from API

**Milestones Section is Static:**
- Issue: All milestone data is hardcoded, no backend integration
- Files: `src/components/StatsDashboard.tsx` (lines 88-116)
- Impact: Non-functional feature
- Fix approach: Either implement proper milestone tracking or remove section

**Limited Email Fetch:**
- Issue: Only fetches 20 emails with no pagination or filtering
- Files: `server.ts` (line 110)
- Impact: Users can't process more than 20 emails per session
- Fix approach: Add pagination params and "load more" UI

## Missing Features

**Logout Not Connected:**
- Issue: `/api/logout` endpoint exists but no UI button triggers it
- Files: `server.ts` (lines 215-218), `src/components/Navigation.tsx`
- Impact: Users cannot log out through the UI
- Fix approach: Add logout button to TopBar component

**No Error Boundaries:**
- Issue: React app has no error boundaries
- Files: `src/App.tsx`, `src/main.tsx`
- Impact: Uncaught errors crash entire app
- Fix approach: Add React error boundary component

**No Loading Feedback on Actions:**
- Issue: Email actions (delete/skip) show no loading state
- Files: `src/App.tsx` (lines 91-107)
- Impact: Poor UX when network is slow
- Fix approach: Add loading spinner or disable buttons during action

**Missing Popup Blocker Handling:**
- Issue: OAuth popup can be blocked but no handling
- Files: `src/App.tsx` (lines 73-89)
- Impact: Silent failure if popup is blocked
- Fix approach: Check if `authWindow` is null and show error message

**No User Feedback on API Errors:**
- Issue: API errors logged but users not notified
- Files: `src/App.tsx` (multiple catch blocks)
- Impact: Users don't know why operations failed
- Fix approach: Add toast/alert notifications for errors

**Unused Google AI Integration:**
- Issue: `@google/genai` dependency installed but never used
- Files: `package.json` line 15
- Impact: Wasted dependency, potential confusion
- Fix approach: Either implement AI features or remove dependency

## Code Quality Issues

**TypeScript `any` Usage:**
- Issue: `sessionActions` declared as `any[]`
- Files: `server.ts` (line 23)
- Impact: No type safety for stats data
- Fix approach: Define proper TypeScript interface for action objects

**Non-Null Assertions:**
- Issue: Multiple non-null assertions (e.g., `msg.id!`)
- Files: `server.ts` (lines 118, 64)
- Impact: Runtime errors if data is unexpectedly null
- Fix approach: Add null checks or use optional chaining properly

**Missing Strict Mode:**
- Issue: TypeScript strict mode not enabled
- Files: `tsconfig.json`
- Impact: More potential runtime errors
- Fix approach: Add `"strict": true` to compilerOptions

**Inconsistent Error Responses:**
- Issue: Some endpoints return `{ error: string }`, others return generic status codes
- Files: `server.ts`
- Impact: Inconsistent API contract for clients
- Fix approach: Standardize error response format

## Performance Concerns

**No Pagination for Emails:**
- Issue: Fetches all 20 emails at once, then processes sequentially
- Files: `server.ts` (lines 108-136)
- Impact: Slow initial load, no virtualization
- Fix approach: Add pagination params, consider virtualized list

**Promise.all Without Limit:**
- Issue: `Promise.all` fetches all email details simultaneously
- Files: `server.ts` (line 115)
- Impact: Could hit rate limits with large email batches
- Fix approach: Use batching or throttling for API calls

## Testing Gaps

**No Test Files:**
- Issue: No test files found in repository
- Files: None
- Impact: No regression protection, hard to refactor safely
- Fix approach: Add Vitest/Jest tests for critical paths

---

*Concerns audit: 2026-03-28*
