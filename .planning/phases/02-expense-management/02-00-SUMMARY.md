---
phase: 02-expense-management
plan: "00"
subsystem: testing
tags: [vitest, mongodb-memory-server, tdd, jest-mock, mongoose]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: "NextAuth auth(), dbConnect() — mocked in test setup"
provides:
  - "vitest test harness with MongoMemoryServer lifecycle helpers"
  - "RED test stubs for EXPN-01 through EXPN-06 (20 test cases total)"
  - "vitest.config.ts with @/* alias and 30s timeout for MMS startup"
affects: [02-expense-management, 03-investments, 04-ai-classification]

# Tech tracking
tech-stack:
  added: [vitest@4.1.0, mongodb-memory-server@11.0.1]
  patterns:
    - "Dynamic import wrapping for RED tests (route files don't exist yet — catch block expected)"
    - "MongoMemoryServer per-suite lifecycle: create in beforeAll, drop+disconnect+stop in afterAll"
    - "Module-level mock session state via mockSession() helper — avoids vi.mock hoisting issues"

key-files:
  created:
    - vitest.config.ts
    - tests/helpers/mock-db.ts
    - tests/api/categories.test.ts
    - tests/api/expenses.test.ts
  modified:
    - package.json

key-decisions:
  - "Dynamic imports (not static) used in test files so test files load without crashing before route handlers exist"
  - "vi.mock('@/lib/auth') and vi.mock('@/lib/db') called inside setupTestDB() to ensure MongoMemoryServer is connected before mocks register"
  - "testTimeout: 30000 in vitest.config.ts — MMS binary download + mongod startup can take 10-20s on first run"

patterns-established:
  - "Test helper pattern: setupTestDB/teardownTestDB/clearCollections/mockSession — all subsequent plans reuse this"
  - "Route handler testing pattern: import handler directly, pass mock Request objects, check res.status + res.json()"
  - "Ownership test pattern: create resource as user A, switch to user B via mockSession(), expect 403"

requirements-completed: [EXPN-01, EXPN-02, EXPN-03, EXPN-04, EXPN-05, EXPN-06]

# Metrics
duration: 2min
completed: 2026-03-22
---

# Phase 02 Plan 00: Test Infrastructure (Wave 0) Summary

**vitest + mongodb-memory-server harness with 20 RED test stubs covering all 6 EXPN requirements, using dynamic imports so test files compile before route handlers exist**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-22T11:21:43Z
- **Completed:** 2026-03-22T11:23:31Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Installed vitest@4.1.0 and mongodb-memory-server@11.0.1 as devDependencies
- Created vitest.config.ts with @/* alias matching tsconfig and 30s testTimeout for MMS startup
- Created tests/helpers/mock-db.ts with MongoMemoryServer lifecycle + auth/dbConnect module mocks
- Created tests/api/categories.test.ts with 8 test cases for EXPN-05 (CRUD) and EXPN-06 (default seeding)
- Created tests/api/expenses.test.ts with 12 test cases for EXPN-01 through EXPN-04
- All 20 tests are in RED state (route handler files don't exist yet — expected Wave 0 design)

## Task Commits

1. **Task 1: Install test dependencies and create vitest config** - `8b4ea6d` (feat)
2. **Task 2: Create mock-db helper and RED test stubs** - `bd19817` (test)

**Plan metadata:** (pending)

## Files Created/Modified

- `vitest.config.ts` - Vitest configuration with @/* path alias and 30s timeout
- `tests/helpers/mock-db.ts` - MongoMemoryServer setup/teardown + vi.mock for auth and dbConnect
- `tests/api/categories.test.ts` - 8 RED tests for EXPN-05 (category CRUD) and EXPN-06 (default seeding)
- `tests/api/expenses.test.ts` - 12 RED tests for EXPN-01 (create), EXPN-02 (list), EXPN-03 (update), EXPN-04 (delete)
- `package.json` - Added vitest and mongodb-memory-server devDependencies

## Decisions Made

- Dynamic imports (not static) in test files prevent compile errors before route handlers exist — the `try/catch` around dynamic imports is intentional Wave 0 design
- `vi.mock()` calls placed inside `setupTestDB()` rather than at module top-level, to ensure mongoose is connected to MongoMemoryServer before mocks execute
- No `test` script added to package.json — tests run via `npx vitest run` to avoid conflicting with any existing script

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. Test infrastructure runs fully in-process.

## Next Phase Readiness

- Test harness ready for Plans 01-04 (expense and category route handler implementation)
- Run `npx vitest run` after any plan implementation to verify GREEN state
- MongoMemoryServer downloads mongod binary on first run — expect 10-20s delay on first `npx vitest run`

## Self-Check: PASSED

All files verified present on disk. All task commits verified in git history.

---
*Phase: 02-expense-management*
*Completed: 2026-03-22*
