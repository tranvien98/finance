---
phase: 03-dashboard-and-filters
plan: "02"
subsystem: ui
tags: [recharts, shadcn, chart, dashboard, vnd, pie-chart, line-chart]

# Dependency graph
requires:
  - phase: 03-01
    provides: getDashboardStats interface with categoryBreakdown and dailySeries data shapes

provides:
  - StatCard server component with VND formatting and MoM trend indicator
  - CategoryPieChart client component wrapping recharts PieChart in ChartContainer
  - ExpenseLineChart client component wrapping recharts LineChart in ChartContainer
  - recharts 3.8.0 installed
  - shadcn chart primitive (ChartContainer, ChartTooltip, ChartTooltipContent) at src/components/ui/chart.tsx

affects: [03-03-dashboard-page, any phase composing dashboard components]

# Tech tracking
tech-stack:
  added: [recharts@3.8.0, shadcn chart primitive]
  patterns: [ChartContainer wrapping recharts primitives, chartConfig with hsl(var(--chart-N)) cycling]

key-files:
  created:
    - src/components/ui/chart.tsx
    - src/components/dashboard/stat-card.tsx
    - src/components/dashboard/category-pie-chart.tsx
    - src/components/dashboard/expense-line-chart.tsx
  modified:
    - package.json (added recharts@^3.8.0)
    - src/models/expense.model.ts (removed default null on telegramMessageId for sparse index correctness)

key-decisions:
  - "Removed default:null from telegramMessageId in ExpenseSchema — sparse unique index requires field to be absent (not null) to allow multiple docs without telegramMessageId"
  - "StatCard is a Server Component (no use client) — pure display, no interactivity needed"
  - "CategoryPieChart sorts categories alphabetically for deterministic color assignment cycling over chart-1..chart-5"

patterns-established:
  - "Client chart components: 'use client' + ChartContainer(config) + recharts primitive + ChartTooltip"
  - "Empty data fallback: render text div instead of empty chart to avoid recharts warnings"

requirements-completed: [DASH-01, DASH-02, DASH-03, DASH-04]

# Metrics
duration: 4min
completed: 2026-03-22
---

# Phase 03 Plan 02: Dashboard Components Summary

**Recharts 3.8.0 + shadcn ChartContainer with StatCard (VND + MoM), CategoryPieChart (pie by category), and ExpenseLineChart (daily totals line)**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-22T16:11:48Z
- **Completed:** 2026-03-22T16:15:55Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- Installed recharts 3.8.0 and shadcn chart primitive (ChartContainer, ChartTooltip, ChartTooltipContent)
- StatCard server component with Intl.NumberFormat vi-VN VND currency, TrendingUp/TrendingDown icons, "No prior data" fallback
- CategoryPieChart and ExpenseLineChart client components with empty-data fallbacks and proper axis formatters

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Recharts and shadcn chart primitive** - `e22d069` (chore)
2. **Task 2: Create StatCard component** - `a77358e` (feat)
3. **Task 3: Create PieChart and LineChart components** - `0d9eb39` (feat)

## Files Created/Modified

- `src/components/ui/chart.tsx` - shadcn chart primitive: ChartContainer, ChartTooltip, ChartTooltipContent
- `src/components/dashboard/stat-card.tsx` - Server component: VND formatting, MoM trend badge
- `src/components/dashboard/category-pie-chart.tsx` - Client component: recharts PieChart in ChartContainer
- `src/components/dashboard/expense-line-chart.tsx` - Client component: recharts LineChart in ChartContainer
- `package.json` - Added recharts@^3.8.0
- `src/models/expense.model.ts` - Removed default:null on telegramMessageId (sparse index fix)

## Decisions Made

- Removed `default: null` from `telegramMessageId` in ExpenseSchema. Sparse unique indexes in MongoDB skip documents where the field is **absent**, but `default: null` causes Mongoose to always write `null`, making the sparse index see all documents as indexed — causing duplicate key errors. The fix restores correct behavior.
- StatCard intentionally has no `use client` — it's pure display with no event handlers or hooks, so server rendering is preferred.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed telegramMessageId sparse unique index causing duplicate key errors in tests**
- **Found during:** Task 3 (Create PieChart and LineChart components — verification step)
- **Issue:** `E11000 duplicate key error collection: test.expenses index: telegramMessageId_1 dup key: { telegramMessageId: null }` — `default: null` on a `sparse: true` field causes Mongoose to store explicit nulls, defeating sparse index sparseness
- **Fix:** Removed `default: null` from `telegramMessageId` field definition in `src/models/expense.model.ts`
- **Files modified:** `src/models/expense.model.ts`
- **Verification:** All 32 vitest tests pass consistently after fix
- **Committed in:** `0d9eb39` (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Fix corrects a pre-existing model definition error. No scope creep.

## Issues Encountered

- recharts shadcn add command installed recharts 2.x (shadcn dependency), required explicit `npm install recharts@3.8.0` to override to plan-specified version
- Test suite showed non-deterministic failures under parallel execution due to sparse index bug — fixed inline

## Next Phase Readiness

- All three dashboard display components (StatCard, CategoryPieChart, ExpenseLineChart) are importable and ready for composition in Plan 03 (dashboard page)
- recharts and ChartContainer available for any additional chart needs

---
*Phase: 03-dashboard-and-filters*
*Completed: 2026-03-22*

## Self-Check: PASSED

- FOUND: src/components/ui/chart.tsx
- FOUND: src/components/dashboard/stat-card.tsx
- FOUND: src/components/dashboard/category-pie-chart.tsx
- FOUND: src/components/dashboard/expense-line-chart.tsx
- FOUND: e22d069 (task 1 commit)
- FOUND: a77358e (task 2 commit)
- FOUND: 0d9eb39 (task 3 commit)
