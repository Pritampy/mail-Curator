# Phase 02: Analytics Dashboard - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Enhance the existing StatsDashboard with additional metrics, real milestone tracking, and inbox growth predictions.

</domain>

<decisions>
## Implementation Decisions

### Stats Display
- **D-01:** Add skipped count to stats grid — display 4 metrics: totalProcessed, totalDeleted, totalSkipped, efficiency

### Milestones
- **D-02:** Implement real milestone tracking system
  - Space Guardian: 10,000 emails deleted total
  - Inbox Zero Streak: 7 consecutive days with empty inbox
  - Track and persist milestone completions

### Predictions
- **D-03:** Add real inbox growth predictions based on historical data

### the agent's Discretion
- Chart visualization style (keep existing bar chart or change)
- Milestone threshold values (defaults: 10k emails, 7-day streak)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Components
- `src/components/StatsDashboard.tsx` — Current stats dashboard implementation
- `src/types.ts` — Stats interface definition

### Backend
- `server.ts` — Stats API endpoint
- `src/services/dbService.ts` — Stats aggregation

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- StatsDashboard.tsx: Current dashboard with chart using Recharts
- Stats type in types.ts: { totalProcessed, totalDeleted, totalSkipped, efficiency, activity }

### Established Patterns
- Using Recharts for visualization
- Tailwind CSS for styling (existing design system)
- Motion for animations

### Integration Points
- Stats data comes from GET /api/stats
- Need to extend Stats interface if adding new metrics

</code_context>

<specifics>
## Specific Ideas

- Display totalSkipped alongside totalDeleted in the stats grid
- Track milestones in MongoDB (EmailAction collection can be used for milestones)
- Use historical email activity to predict daily inbox growth

</specifics>

<deferred>
## Deferred Ideas

None

</deferred>

---

*Phase: 02-analytics-dashboard*
*Context gathered: 2026-03-28*
