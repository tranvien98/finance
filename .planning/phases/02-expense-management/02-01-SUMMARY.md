---
phase: 02-expense-management
plan: 01
subsystem: api
tags: [mongoose, mongodb, shadcn, react-hook-form, categories, zod]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: auth() session with user.id, dbConnect(), User model pattern
provides:
  - Category Mongoose model with userId/name/isDefault fields and compound unique index
  - GET /api/categories with auto-seeding of 8 default categories on first access
  - POST /api/categories for custom category creation with 409 on duplicate
  - PATCH /api/categories/[id] for renaming with ownership check and 409 on duplicate
  - DELETE /api/categories/[id] with ownership check and default-category guard
  - shadcn components: select, dialog, alert-dialog, table, form
affects:
  - 02-03 (expense UI uses category dropdown from GET /api/categories)
  - 02-04 (category management UI uses all 4 CRUD endpoints)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Auto-seed pattern: query first, insertMany with ordered:false if empty, re-query
    - Ownership check: category.userId.toString() !== session.user.id
    - Duplicate key guard: catch err.code === 11000, return 409
    - Route params: const { id } = await ctx.params (Next.js 16 async params)

key-files:
  created:
    - src/models/category.model.ts
    - src/app/api/categories/route.ts
    - src/app/api/categories/[id]/route.ts
    - src/components/ui/select.tsx
    - src/components/ui/dialog.tsx
    - src/components/ui/alert-dialog.tsx
    - src/components/ui/table.tsx
    - src/components/ui/form.tsx
  modified: []

key-decisions:
  - "ordered: false on insertMany prevents race condition errors when concurrent first requests hit GET simultaneously"
  - "Form component created manually — shadcn base-nova registry does not include a form component; built to standard shadcn/ui form pattern wrapping react-hook-form FormProvider and Controller"
  - "Deleting a category does NOT cascade to expenses — expense.category is a string snapshot for historical accuracy"

patterns-established:
  - "Auto-seed pattern: check if collection is empty for user, insertMany with ordered:false if so, always re-query after seeding"
  - "Ownership check pattern: model.userId.toString() !== session.user.id → 403"

requirements-completed: [EXPN-05, EXPN-06]

# Metrics
duration: 2min
completed: 2026-03-22
---

# Phase 02 Plan 01: Category Model + API + shadcn UI Components Summary

**Category Mongoose model with compound unique index, full CRUD REST API with auto-seeding defaults, and 5 shadcn components (select, dialog, alert-dialog, table, form) installed for Phase 2 UI tasks**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-22T11:25:50Z
- **Completed:** 2026-03-22T11:27:38Z
- **Tasks:** 3
- **Files modified:** 8 created

## Accomplishments

- Category Mongoose model with compound unique index `{userId, name}` preventing duplicate category names per user, isDefault flag for the 8 seeded defaults
- Full category REST API: GET auto-seeds 8 defaults on first access using `ordered: false` insertMany to handle concurrent requests safely, POST creates custom categories with 409 on duplicate, PATCH renames with ownership + duplicate check, DELETE blocks default categories and checks ownership
- 5 shadcn UI components installed (select, dialog, alert-dialog, table) via CLI + form component created manually since it wasn't in the base-nova registry

## Task Commits

Each task was committed atomically:

1. **Task 1: Install shadcn UI components for Phase 2** - `c7ce8a8` (chore)
2. **Task 2: Create Category Mongoose model** - `560004d` (feat)
3. **Task 3: Create Category API routes (GET/POST/PATCH/DELETE)** - `10e88ef` (feat)

## Files Created/Modified

- `src/models/category.model.ts` - ICategory interface, CategorySchema with compound unique index, isDefault flag, timestamps
- `src/app/api/categories/route.ts` - GET (list + auto-seed) and POST (create) handlers
- `src/app/api/categories/[id]/route.ts` - PATCH (rename) and DELETE handlers with ownership checks
- `src/components/ui/select.tsx` - shadcn Select component (SelectTrigger, SelectContent, SelectItem)
- `src/components/ui/dialog.tsx` - shadcn Dialog component (DialogTitle, DialogContent, DialogFooter)
- `src/components/ui/alert-dialog.tsx` - shadcn AlertDialog component (AlertDialogAction, AlertDialogCancel)
- `src/components/ui/table.tsx` - shadcn Table component (TableHeader, TableBody, TableRow, TableCell)
- `src/components/ui/form.tsx` - shadcn Form component wrapping react-hook-form (FormField, FormItem, FormLabel, FormControl, FormMessage)

## Decisions Made

- `ordered: false` on insertMany in GET handler — prevents MongoDB duplicate key errors when multiple concurrent GET requests arrive for a new user before seeding completes
- Form component created manually — `npx shadcn@latest add form` returned no output (base-nova style registry does not include form component); manually created to standard shadcn/ui form spec wrapping react-hook-form FormProvider and Controller
- Deleting a category does NOT affect existing expenses — expense.category stores a string name (snapshot), not a reference; historical records remain intact per RESEARCH.md Pitfall 5

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Manually created form.tsx when shadcn CLI did not install it**
- **Found during:** Task 1 (Install shadcn UI components)
- **Issue:** `npx shadcn@latest add form --yes` ran silently with no files created — base-nova registry does not include a form component
- **Fix:** Created `src/components/ui/form.tsx` manually following the standard shadcn/ui form component specification, wrapping react-hook-form's FormProvider and Controller with FormField, FormItem, FormLabel, FormControl, FormDescription, and FormMessage sub-components
- **Files modified:** src/components/ui/form.tsx (created)
- **Verification:** File contains "FormField" — acceptance criterion passes
- **Committed in:** c7ce8a8 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical — missing component not available in registry)
**Impact on plan:** Form component is required by Phase 2 UI tasks (expense form). Auto-fix was necessary. No scope creep.

## Issues Encountered

- shadcn base-nova registry does not include a `form` component — resolved by creating it manually per the standard shadcn/ui form pattern

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Category model and full CRUD API are ready for expense form category dropdown
- All 5 shadcn components available for expense management UI (Plan 02-03)
- Category management UI (Plan 02-04) can use GET/POST/PATCH/DELETE endpoints directly

---
*Phase: 02-expense-management*
*Completed: 2026-03-22*
