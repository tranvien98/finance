---
phase: 2
slug: expense-management
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest / vitest (Next.js project — check package.json) |
| **Config file** | jest.config.ts or vitest.config.ts |
| **Quick run command** | `npm test -- --passWithNoTests` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --passWithNoTests`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 2-01-01 | 01 | 1 | EXPN-05 | unit | `npm test -- --testPathPattern=category` | ❌ W0 | ⬜ pending |
| 2-01-02 | 01 | 1 | EXPN-05 | unit | `npm test -- --testPathPattern=category` | ❌ W0 | ⬜ pending |
| 2-01-03 | 01 | 1 | EXPN-06 | unit | `npm test -- --testPathPattern=category` | ❌ W0 | ⬜ pending |
| 2-02-01 | 02 | 1 | EXPN-01 | unit | `npm test -- --testPathPattern=expense` | ❌ W0 | ⬜ pending |
| 2-02-02 | 02 | 1 | EXPN-02 | unit | `npm test -- --testPathPattern=expense` | ❌ W0 | ⬜ pending |
| 2-02-03 | 02 | 1 | EXPN-03 | unit | `npm test -- --testPathPattern=expense` | ❌ W0 | ⬜ pending |
| 2-02-04 | 02 | 1 | EXPN-04 | unit | `npm test -- --testPathPattern=expense` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/api/categories.test.ts` — stubs for EXPN-05, EXPN-06
- [ ] `__tests__/api/expenses.test.ts` — stubs for EXPN-01, EXPN-02, EXPN-03, EXPN-04
- [ ] `__tests__/setup.ts` — shared test fixtures (mock mongoose, mock auth)

*Wave 0 must be committed before any implementation tasks begin.*

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

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
