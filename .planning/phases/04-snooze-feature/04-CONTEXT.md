# Phase 04: Snooze Feature - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Temporarily hide emails and bring them back at a specified time. Like Gmail's snooze but for your cleaning workflow.

</domain>

<decisions>
## Implementation Decisions

### the agent's Discretion
- Snooze duration options: standard presets (later today, tomorrow, next week, custom)
- UI interaction approach: standard implementation
- Return behavior: standard approach

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Components
- `src/components/CardStack.tsx` — Email display component
- `src/components/Navigation.tsx` — Navigation with tabs
- `src/types.ts` — TypeScript interfaces

### Backend
- `server.ts` — Express server with API endpoints
- `src/services/dbService.ts` — Database service
- `src/models/EmailAction.ts` — Email action model pattern

</canonical_refs>

\code_context
## Existing Code Insights

### Reusable Assets
- CardStack.tsx: Email card component - can add snooze action
- Navigation.tsx: Tab pattern for UI sections
- DbService: MongoDB service pattern to follow

### Established Patterns
- REST API with Express
- MongoDB with Mongoose
- Tailwind CSS for styling

### Integration Points
- New snooze endpoints will connect to existing dbService
- Snooze UI will integrate with CardStack component

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

*Phase: 04-snooze-feature*
*Context gathered: 2026-03-28*
