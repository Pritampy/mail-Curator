---
plan: 03-01
phase: 03-smart-filters-scheduled-rules
status: complete
wave: 1
completed: 2026-03-28
---

## Plan 03-01: Backend - Filter & Rule Models + API

**Objective:** Create backend models, database service extensions, and API endpoints for smart filters and scheduled rules.

### Tasks Completed

| # | Task | Status | Result |
|---|------|--------|--------|
| 1 | Create Filter model | ✓ | Created src/models/Filter.ts with IFilter interface and FilterSchema |
| 2 | Create Rule model | ✓ | Created src/models/Rule.ts with IRule interface and RuleSchema |
| 3 | Extend DbService | ✓ | Added filter CRUD methods and rule CRUD methods with schedule calculation |
| 4 | Add API endpoints | ✓ | Added all filter and rule endpoints |

### Key Artifacts Created

- **src/models/Filter.ts** — Filter model with conditions (sender/subject/label), operators (contains/equals/startsWith/regex), actions (auto-delete/archive/skip/categorize)
- **src/models/Rule.ts** — Rule model with schedule (daily/weekly/monthly), execution history, nextRun calculation
- **src/services/dbService.ts** — Extended with filter and rule CRUD + getRulesDueForExecution
- **server.ts** — Added endpoints: GET/POST/PATCH/DELETE /api/filters, POST /api/filters/:id/toggle, GET/POST/PATCH/DELETE /api/rules, POST /api/rules/:id/toggle, GET /api/rules/due, POST /api/rules/:id/execute

### Verification

- [x] Filter model with CRUD operations persisted in MongoDB
- [x] Rule model with CRUD operations persisted in MongoDB
- [x] All filter and rule API endpoints functional
- [x] Rules track execution history and next-run timing

---

*Plan completed: 2026-03-28*
