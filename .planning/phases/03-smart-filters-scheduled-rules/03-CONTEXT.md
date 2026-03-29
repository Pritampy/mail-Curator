# Phase 03: Smart Filters & Scheduled Rules - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Auto-categorize emails by sender, subject patterns, or labels. Set up recurring cleanup rules (e.g., "archive newsletters older than 30 days").

</domain>

<decisions>
## Implementation Decisions

### the agent's Discretion
All filter criteria, actions, scheduling options, and UI approach — open to standard implementations.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Components
- `src/components/CardStack.tsx` — Email display component
- `src/components/StatsDashboard.tsx` — Stats display patterns
- `src/types.ts` — TypeScript interfaces

### Backend
- `server.ts` — Express server with API endpoints
- `src/services/dbService.ts` — Database service
- `src/models/EmailAction.ts` — Email action model
- `src/models/Milestone.ts` — Milestone model pattern

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- CardStack.tsx: Email card component for inbox display
- DbService: MongoDB service pattern to follow
- Existing API endpoints in server.ts

### Established Patterns
- REST API with Express
- MongoDB with Mongoose
- Tailwind CSS for styling

### Integration Points
- New filter/rules endpoints will connect to existing dbService
- New UI components will integrate with existing Navigation

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None

</deferred>

---

*Phase: 03-smart-filters-scheduled-rules*
*Context gathered: 2026-03-28*
