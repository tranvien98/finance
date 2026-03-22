---
phase: 2
slug: expense-management
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-22
updated: 2026-03-22
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run tests/api/` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/api/`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Wave 0 Plan

**Plan:** `02-00-PLAN.md` — Test Infrastructure Scaffold

| Artifact | Purpose | Status |
|----------|---------|--------|
| `vitest.config.ts` | Test runner config with @/* alias | pending |
| `tests/helpers/mock-db.ts` | MongoMemoryServer lifecycle + auth mock | pending |
| `tests/api/categories.test.ts` | RED stubs for EXPN-05, EXPN-06 (8 tests) | pending |
| `tests/api/expenses.test.ts` | RED stubs for EXPN-01 through EXPN-04 (12 tests) | pending |
| `npm install vitest mongodb-memory-server` | Dev dependencies | pending |

*Wave 0 must be committed before any implementation tasks begin.*

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 2-00-01 | 00 | 0 | ALL | infra | `npx vitest --version` | pending W0 | pending |
| 2-00-02 | 00 | 0 | ALL | infra | `test -f tests/helpers/mock-db.ts` | pending W0 | pending |
| 2-01-01 | 01 | 1 | EXPN-05 | structural | `ls src/components/ui/*.tsx` | pending | pending |
| 2-01-02 | 01 | 1 | EXPN-05 | unit | `npx vitest run tests/api/categories.test.ts` | pending W0 | pending |
| 2-01-03 | 01 | 1 | EXPN-06 | unit | `npx vitest run tests/api/categories.test.ts` | pending W0 | pending |
| 2-02-01 | 02 | 1 | EXPN-01 | unit | `npx vitest run tests/api/expenses.test.ts` | pending W0 | pending |
| 2-02-02 | 02 | 1 | EXPN-02-04 | unit | `npx vitest run tests/api/expenses.test.ts` | pending W0 | pending |

*Status: pending -- green -- red -- flaky*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Category list UI renders correctly | EXPN-05 | Visual rendering | Open /expenses, verify category dropdown shows all 8 defaults |
| Create expense form UX | EXPN-01 | Form interaction | Fill form, submit, verify expense appears in list |
| Edit expense inline update | EXPN-03 | UI state update | Edit an expense, verify list shows updated values without page reload |
| Delete expense disappears | EXPN-04 | UI state update | Delete expense, verify it is removed from list immediately |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved (Wave 0 plan 02-00-PLAN.md created)
