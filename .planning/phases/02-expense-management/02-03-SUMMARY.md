---
phase: 02-expense-management
plan: 03
subsystem: ui
tags: [react, nextjs, mongodb, shadcn, rhf, zod, date-fns, base-ui]

# Dependency graph
requires:
  - phase: 02-expense-management-01
    provides: Expense model, Category model, GET /api/categories
  - phase: 02-expense-management-02
    provides: GET/POST /api/expenses, PATCH/DELETE /api/expenses/[id]

provides:
  - ExpensesPage server component at /expenses with direct MongoDB query
  - ExpenseList client component with responsive table/card layout and empty state
  - ExpenseForm client dialog for create/edit expenses with RHF + Zod
  - DeleteExpenseDialog client AlertDialog for delete confirmation
  - SerializedExpense type exported for cross-component use

affects: [02-04-category-manager, 02-05-dashboard]

# Tech tracking
tech-stack:
  added: [date-fns (format dates), @hookform/resolvers/zod (form validation)]
  patterns: [Server Component page shell + Client Component list, Controller for base-ui Select + RHF, string-amount-to-number pattern]

key-files:
  created:
    - src/app/(dashboard)/expenses/page.tsx
    - src/components/expenses/expense-list.tsx
    - src/components/expenses/expense-form.tsx
    - src/components/expenses/delete-expense-dialog.tsx
  modified: []

key-decisions:
  - "Amount field uses string schema in RHF form (not z.coerce.number) to avoid @hookform/resolvers v5 TypeScript incompatibility with coerce input type unknown"
  - "base-ui Select requires Controller wrapper for RHF integration — onValueChange not compatible with form.register()"
  - "ExpenseForm converts amount string to Number before API submission to satisfy integer VND requirement"

patterns-established:
  - "Controller pattern for base-ui Select: wrap in <Controller control={form.control} render={({field}) => <Select value={field.value} onValueChange={field.onChange}>} />"
  - "Server Component page shell with JSON.parse(JSON.stringify()) serialization for Mongoose documents passed to Client Components"
  - "String amount validation: z.string().refine() chain for integer VND amounts in client forms"

requirements-completed: [EXPN-01, EXPN-02, EXPN-03, EXPN-04]

# Metrics
duration: 25min
completed: 2026-03-22
---

# Phase 02 Plan 03: Expenses Page UI Summary

**Full CRUD expenses UI with server-fetched table, RHF+Zod create/edit Dialog, and AlertDialog delete confirmation using base-ui shadcn components**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-03-22
- **Completed:** 2026-03-22
- **Tasks:** 3 completed + 1 auto-fix
- **Files modified:** 4

## Accomplishments

- ExpensesPage Server Component fetches expenses via direct MongoDB query (Expense.find with userId), serializes with JSON.parse(JSON.stringify) for Client Component compatibility
- ExpenseList Client Component: responsive desktop table (shadcn Table) + mobile card layout, empty state with Receipt icon and CTA, edit/delete action buttons with proper aria-labels
- ExpenseForm Dialog: RHF + Zod validation, categories populated from GET /api/categories, base-ui Select integrated via Controller, create/edit modes, toast success/error
- DeleteExpenseDialog AlertDialog: confirmation with loading state, DELETE /api/expenses/:id, toast success/error

## Task Commits

Each task was committed atomically:

1. **Task 1: Expenses page Server Component and expense list Client Component** - `cb881cc` (feat)
2. **Task 2: Expense form Dialog with RHF + Zod** - `1feac3d` (feat)
3. **Task 3: Delete expense AlertDialog** - `1fbbfe8` (feat)
4. **Auto-fix: TypeScript errors in expense-form** - `1777df4` (fix)

## Files Created/Modified

- `src/app/(dashboard)/expenses/page.tsx` - Server Component: auth check, Expense.find by userId, serialized props to ExpenseList
- `src/components/expenses/expense-list.tsx` - Client Component: table/card layout, empty state, state management for form/delete dialogs
- `src/components/expenses/expense-form.tsx` - Client Component: create/edit Dialog with RHF + Zod, base-ui Select integration
- `src/components/expenses/delete-expense-dialog.tsx` - Client Component: AlertDialog with confirmation, loading state, DELETE API call

## Decisions Made

- **String amount in RHF form:** `z.coerce.number()` causes TypeScript incompatibility with `@hookform/resolvers` v5 because coerce input type is `unknown`, which doesn't extend `FieldValues`. Used `z.string().refine()` chain instead and convert to `Number()` before API submission.
- **Controller for Select:** base-ui Select's `onValueChange` prop is not compatible with `form.register()` spread pattern. Used RHF `Controller` component to bridge the gap.
- **Server Component serialization:** Mongoose `lean()` documents contain `ObjectId` instances which cannot be passed directly to Client Components — `JSON.parse(JSON.stringify())` converts them to plain strings.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript errors from z.coerce.number() with @hookform/resolvers v5**
- **Found during:** Task 2 verification (TypeScript check)
- **Issue:** `z.coerce.number()` produces input type `unknown` in Zod's inferred schema, which is incompatible with RHF's `FieldValues` constraint in resolver typing. Two TS errors: resolver type mismatch and SubmitHandler incompatibility.
- **Fix:** Replaced `z.coerce.number().int()` with `z.string().refine()` chain for integer VND validation. Amount stored as string in form, converted with `Number(data.amount)` before API submission.
- **Files modified:** `src/components/expenses/expense-form.tsx`
- **Verification:** `npx tsc --noEmit` exits clean (0 errors)
- **Committed in:** `1777df4` (separate fix commit after Task 2)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug)
**Impact on plan:** Required fix for TypeScript correctness. The string-based amount approach is functionally equivalent — validation messages preserved, API receives integer number.

## Issues Encountered

- base-ui shadcn components (Dialog, AlertDialog, Select) use `@base-ui/react` primitives instead of Radix UI — API surface is largely compatible (`open`, `onOpenChange`, `onValueChange`) but required verifying type signatures before implementation.

## Known Stubs

None — all data is wired to real API endpoints. The `{/* Category manager will be added in Plan 04 */}` comment is a planned future feature, not a stub blocking this plan's goal.

## Next Phase Readiness

- Expenses CRUD UI complete — users can view, create, edit, and delete expenses at /expenses
- Plan 04 (Category Manager) can add CategoryManager component and render it below the expense list where the placeholder comment currently sits
- SerializedExpense type is exported and available for any other component that needs to reference expense data

---
*Phase: 02-expense-management*
*Completed: 2026-03-22*
