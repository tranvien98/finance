---
phase: 02-expense-management
plan: 02
subsystem: expense-api
tags: [api, expenses, crud, authentication, ownership, validation]
dependency_graph:
  requires: [02-00]
  provides: [expense-rest-api]
  affects: [02-03-expense-ui]
tech_stack:
  added: []
  patterns: [route-handler, zod-validation, mongoose-lean, ownership-check, async-params]
key_files:
  created:
    - src/app/api/expenses/route.ts
    - src/app/api/expenses/[id]/route.ts
  modified: []
decisions:
  - "Use z.number().int() for server-side integer validation (body is pre-parsed JSON, no coerce needed)"
  - "JSON.parse(JSON.stringify()) for ObjectId serialization to plain strings for client consumption"
  - "Next.js 16 async params pattern: await ctx.params before accessing id"
  - "runValidators: true on findByIdAndUpdate to enforce Mongoose integer constraint on updates"
metrics:
  duration: 67s
  completed: "2026-03-22"
  tasks_completed: 2
  files_created: 2
  files_modified: 0
---

# Phase 02 Plan 02: Expense REST API Summary

Expense CRUD REST API with integer VND validation, ownership checks, and proper HTTP status codes across four route handlers.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create expense collection route handlers (GET + POST) | 7fe2217 | src/app/api/expenses/route.ts |
| 2 | Create expense individual route handlers (PATCH + DELETE) | a9fcf8b | src/app/api/expenses/[id]/route.ts |

## What Was Built

### `src/app/api/expenses/route.ts`

- **GET**: Returns authenticated user's expenses sorted by date descending using `{ userId }.sort({ date: -1 }).lean()`
- **POST**: Creates expense with Zod validation enforcing integer VND (`z.number().int()`) and positive amount; returns 201 on success
- Both return 401 for unauthenticated requests; POST returns 400 for validation errors

### `src/app/api/expenses/[id]/route.ts`

- **PATCH**: Partial update with optional fields; 404 for missing expense; 403 for non-owner; `runValidators: true` enforces Mongoose constraints on update
- **DELETE**: Ownership check before `expense.deleteOne()`; 403 for non-owner; 404 for missing expense; 200 `{ ok: true }` on success
- Next.js 16 async params: `const { id } = await ctx.params`

## Test Results

All 14 tests passed: `vitest run tests/api/expenses.test.ts`

## Decisions Made

- **Server-side Zod with `z.number().int()`**: Body is pre-parsed JSON so no coerce needed; float amounts (e.g., 50000.5) are rejected at the Zod layer before hitting Mongoose
- **`JSON.parse(JSON.stringify())`**: Serializes Mongoose ObjectId instances to plain strings for safe client JSON consumption
- **`await ctx.params`**: Next.js 16 breaking change — params is a Promise in dynamic route handlers; must be awaited before destructuring

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all route handlers are fully wired to MongoDB via Mongoose.

## Self-Check: PASSED
