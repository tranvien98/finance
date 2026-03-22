# Phase 2: Expense Management - Research

**Researched:** 2026-03-22
**Domain:** Next.js 16 App Router CRUD, Mongoose, React Hook Form + Zod 4, shadcn/ui
**Confidence:** HIGH

---

## Summary

Phase 2 builds full CRUD for expenses and custom categories on top of the Phase 1 foundation. The Expense Mongoose model already exists with the correct schema (userId, amount integer, category string, note, date, telegramMessageId). What does NOT yet exist: a Category model (needed for EXPN-05/06), REST API routes for expenses and categories, and the `/expenses` page with list + form UI.

The stack is fully determined by Phase 1 decisions — Next.js 16 App Router, Mongoose 8, React Hook Form 7 with `@hookform/resolvers` 5 (which explicitly supports Zod 4 via dual-import of `zod/v3` and `zod/v4/core`), shadcn/ui components, Tailwind v4, and Zod 4.3.6. No new packages are required for this phase.

The key architectural question for EXPN-05/06 is whether custom categories live as an array on the User document or as a separate Category collection. A separate `Category` model is the right call: it is independently addressable (CRUD operations, not a nested array patch), can be validated for ownership on each operation, and aligns with the existing separate-model pattern used for Expense and Investment.

**Primary recommendation:** Implement REST Route Handlers for `/api/expenses` and `/api/categories` (following the established `settings/route.ts` pattern), with a new `Category` Mongoose model. Use Server Components to fetch and render the expense list with `revalidatePath` after mutations. Build the create/edit form as a Client Component with React Hook Form + Zod 4 + `zodResolver`.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| EXPN-01 | User can create an expense with amount (integer VND), category, note, and date | Route Handler POST `/api/expenses`, React Hook Form with Zod validation, integer-VND validation carried over from model |
| EXPN-02 | User can view a list of their expenses | Server Component at `/expenses` page, Mongoose `.find({ userId }).sort({ date: -1 })`, revalidatePath pattern |
| EXPN-03 | User can edit an existing expense | Route Handler PATCH `/api/expenses/[id]`, ownership check before update, `revalidatePath('/expenses')` after success |
| EXPN-04 | User can delete an expense | Route Handler DELETE `/api/expenses/[id]`, ownership check, `revalidatePath('/expenses')` |
| EXPN-05 | User can create, rename, and delete custom expense categories | New `Category` model, Route Handlers POST/PATCH/DELETE `/api/categories/[id]`, categories page or modal |
| EXPN-06 | Default categories exist on first use | Seed defaults in first `/api/categories` GET or on user creation; `DEFAULT_CATEGORIES` constant already defined in `expense.model.ts` |
</phase_requirements>

---

## Standard Stack

### Core (all already installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.2.1 | App Router, Route Handlers, Server Components | Project constraint |
| Mongoose | 8.23.0 | MongoDB ODM, model definitions | Phase 1 decision |
| React Hook Form | 7.72.0 | Uncontrolled form state, validation integration | Already in project |
| @hookform/resolvers | 5.2.2 | Bridges RHF with Zod; v5.2 supports both Zod 3 and Zod 4 | Already in project |
| Zod | 4.3.6 | Schema validation for forms and API request parsing | Already in project; used in settings route |
| shadcn/ui (via shadcn CLI 4) | 4.1.0 | Component library — Card, Button, Input, etc. | Phase 1 established |
| date-fns | 4.1.0 | Date formatting for display | Already in project |
| Tailwind CSS | 4.x | Utility styling | Project constraint |
| lucide-react | 0.577.0 | Icons | Phase 1 established |
| sonner | 2.0.7 | Toast notifications | Already installed; `Toaster` in layout |

### No New Packages Required

Phase 2 needs no new `npm install`. Every required capability is already present.

### shadcn Components to Add

The following shadcn components do not yet exist in `src/components/ui/` and must be added with `npx shadcn add`:

| Component | shadcn name | Usage |
|-----------|-------------|-------|
| Select | `select` | Category dropdown in expense form |
| Dialog | `dialog` | Create/edit expense modal, category management modal |
| Alert Dialog | `alert-dialog` | Delete confirmation |
| Table | `table` | Expense list (optional — could use plain `div` list) |
| Form | `form` | shadcn Form wrapper for RHF integration |

Existing: `button`, `input`, `card`, `badge`, `skeleton`, `separator`, `tabs`, `label`, `sonner`

---

## Architecture Patterns

### Recommended File Structure for Phase 2

```
src/
├── app/
│   ├── (dashboard)/
│   │   └── expenses/
│   │       └── page.tsx               # Server Component — fetches and renders expense list
│   └── api/
│       ├── expenses/
│       │   ├── route.ts               # GET (list), POST (create)
│       │   └── [id]/
│       │       └── route.ts           # PATCH (update), DELETE (delete)
│       └── categories/
│           ├── route.ts               # GET (list), POST (create)
│           └── [id]/
│               └── route.ts           # PATCH (rename), DELETE (delete)
├── models/
│   ├── expense.model.ts               # Already exists — no changes needed
│   ├── category.model.ts              # NEW — per-user custom categories
│   └── user.model.ts                  # Already exists — no changes needed
└── components/
    └── expenses/
        ├── expense-list.tsx           # Client Component — list with edit/delete actions
        ├── expense-form.tsx           # Client Component — create/edit form in Dialog
        └── category-manager.tsx       # Client Component — category CRUD UI
```

### Pattern 1: Route Handler with `withAuth` + Zod Validation

The established project pattern (from `src/app/api/settings/route.ts`) is:
1. Call `auth()` directly (not `withAuth` wrapper — `withAuth` is for context-passing routes)
2. Parse body with `z.object().safeParse()`
3. Return `Response.json(...)` with appropriate HTTP status

**Source:** `src/app/api/settings/route.ts` (project codebase)

```typescript
// src/app/api/expenses/route.ts
import { auth } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import Expense from '@/models/expense.model';
import { z } from 'zod';

const createExpenseSchema = z.object({
  amount: z.number().int().positive(),
  category: z.string().min(1).max(100),
  note: z.string().max(500).default(''),
  date: z.string().datetime(), // ISO string from client
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const expenses = await Expense.find({ userId: (session.user as { id: string }).id })
    .sort({ date: -1 })
    .lean();
  return Response.json({ expenses });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = createExpenseSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  await dbConnect();
  const expense = await Expense.create({
    userId: (session.user as { id: string }).id,
    ...parsed.data,
    date: new Date(parsed.data.date),
  });
  return Response.json({ expense }, { status: 201 });
}
```

### Pattern 2: Dynamic Route Handler with Ownership Check

```typescript
// src/app/api/expenses/[id]/route.ts
import type { NextRequest } from 'next/server';

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<'/api/expenses/[id]'>
) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await ctx.params;
  await dbConnect();

  const expense = await Expense.findById(id);
  if (!expense) return Response.json({ error: 'Not found' }, { status: 404 });

  // CRITICAL: ownership check — must verify userId before mutating
  if (expense.userId.toString() !== (session.user as { id: string }).id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  await expense.deleteOne();
  return Response.json({ ok: true });
}
```

**Source:** Next.js 16 route handler docs (`node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`) — `RouteContext<'/path/[param]'>` helper is the current pattern for typed params.

### Pattern 3: Server Component for Data Fetch + `revalidatePath`

The expenses list page should be a **Server Component** that fetches directly from MongoDB (not via `/api/expenses`). After mutations in Client Components, call `revalidatePath('/expenses')` in the Server Action / after the fetch.

```typescript
// src/app/(dashboard)/expenses/page.tsx
import { auth } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import Expense from '@/models/expense.model';
import { redirect } from 'next/navigation';

export default async function ExpensesPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth');

  await dbConnect();
  const expenses = await Expense.find({ userId: (session.user as { id: string }).id })
    .sort({ date: -1 })
    .lean();

  return <ExpenseList expenses={JSON.parse(JSON.stringify(expenses))} />;
}
```

**Source:** Next.js 16 docs `06-fetching-data.md` — ORM/database pattern in Server Components.

Note: Mongoose `.lean()` returns plain objects but with `ObjectId` instances. Serialize via `JSON.parse(JSON.stringify(...))` before passing to Client Components.

### Pattern 4: React Hook Form + Zod 4 (established project pattern)

The auth form (`src/components/auth/auth-form.tsx`) is the canonical RHF pattern in this project:
- `z.object()` schema
- `z.infer<typeof schema>` for TypeScript types
- `useForm<T>({ resolver: zodResolver(schema), defaultValues: {...} })`
- `form.register(...)` spread on `<Input>`
- `form.formState.errors.field?.message` for inline errors
- `form.formState.isSubmitting` to disable and show spinner

**The `zodResolver` from `@hookform/resolvers/zod` v5.2 automatically detects Zod 4 schemas** — no special import path needed.

### Pattern 5: Category Model (NEW — must be created)

Categories are NOT stored on the User document. A separate `Category` collection with `userId` + `name` + `isDefault` flag enables clean CRUD without document-level array manipulation.

```typescript
// src/models/category.model.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICategory extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

CategorySchema.index({ userId: 1, name: 1 }, { unique: true }); // no duplicate names per user

const Category: Model<ICategory> =
  mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);

export default Category;
```

### Pattern 6: Seeding Default Categories on First GET

When `GET /api/categories` is called and the user has zero categories, seed the 8 defaults from `DEFAULT_CATEGORIES` in `expense.model.ts`. This is simpler than hooking into user creation.

```typescript
// In GET /api/categories handler:
const existing = await Category.find({ userId: session.user.id });
if (existing.length === 0) {
  await Category.insertMany(
    DEFAULT_CATEGORIES.map(name => ({ userId: session.user.id, name, isDefault: true }))
  );
  return Category.find({ userId: session.user.id }).lean();
}
```

**Source:** EXPN-06 requirement + `DEFAULT_CATEGORIES` array already defined in `src/models/expense.model.ts`.

### Anti-Patterns to Avoid

- **Storing categories as an array on User**: Makes atomic rename/delete messy, breaks separate ownership checks. Use a separate collection.
- **Calling internal Route Handlers from Server Components**: Server Components should query MongoDB directly (like Phase 1 settings page). No `fetch('/api/expenses')` from the server.
- **Floating point VND amounts**: The Expense schema already enforces `Number.isInteger` validator. The form must use `z.number().int()` and parse the string input with `parseInt()` before submitting.
- **Not serializing Mongoose documents before passing to Client Components**: `.lean()` returns ObjectId instances. Always `JSON.parse(JSON.stringify(doc))` before passing to `'use client'` components.
- **Missing ownership check on PATCH/DELETE**: Every mutating route handler must verify `expense.userId.toString() === session.user.id` before modifying.
- **`revalidatePath` in Client Component**: Must call `revalidatePath` from a Server Action or Route Handler, not directly in client code.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation with inline errors | Custom validation logic | React Hook Form + Zod 4 + `zodResolver` | Already in project; auth form is the reference implementation |
| Date formatting (e.g., "22 tháng 3, 2026") | Custom date formatter | `date-fns` `format()` | Already installed; handles locale-aware formatting |
| Toast notifications | Custom toast system | `sonner` (already installed) | `Toaster` already in layout; call `toast.success()` / `toast.error()` |
| Confirmation dialogs | Custom confirm UI | shadcn `alert-dialog` | Handles focus trap, a11y, and Escape key automatically |
| Modal/overlay for create/edit form | Custom overlay | shadcn `dialog` | Handles portal, backdrop, focus management |
| Select dropdown for category | Custom `<select>` | shadcn `select` | Consistent with design system, keyboard navigation built in |

**Key insight:** Every UI primitive needed for this phase is either already in `src/components/ui/` or available as a `npx shadcn add` call. No third-party component libraries needed.

---

## Common Pitfalls

### Pitfall 1: ObjectId Serialization to Client Components

**What goes wrong:** Passing a Mongoose `.lean()` document to a Client Component throws "cannot serialize ObjectId" or results in `[object Object]` strings.
**Why it happens:** `.lean()` returns objects with `ObjectId` instances, not plain strings. Server Components serialize data differently.
**How to avoid:** Always `JSON.parse(JSON.stringify(expenses))` before passing via props to Client Components, or call `.toString()` on `_id` fields explicitly.
**Warning signs:** TypeScript type errors on `_id` props, runtime serialization errors in Next.js App Router.

### Pitfall 2: VND Amount as Float in Form Input

**What goes wrong:** User enters "45000" in a text input; it's submitted as the string `"45000"`. If parsed with `parseFloat` or if Zod coerces a float, the `Number.isInteger` Mongoose validator rejects it.
**Why it happens:** HTML inputs always return strings. Zod 4 `z.number()` doesn't auto-coerce strings.
**How to avoid:** Use `z.coerce.number().int().positive()` in the form schema, OR use `z.string().transform(v => parseInt(v, 10))` pipeline. The API schema should use `z.number().int().positive()` (body is pre-parsed JSON).
**Warning signs:** Mongoose validation error "Amount must be an integer (VND has no subunits)".

### Pitfall 3: `params` in Route Handlers is a Promise in Next.js 16

**What goes wrong:** Accessing `params.id` directly throws a runtime error or returns undefined.
**Why it happens:** Next.js 16 changed `params` to be a `Promise` in Route Handlers. The `context.params` must be awaited.
**How to avoid:** Always `const { id } = await ctx.params;` — this is shown in the official docs.
**Source:** `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md` — `RouteContext<'/path/[id]'>` typed helper requires `await ctx.params`.

### Pitfall 4: Category Name Uniqueness Across Rename

**What goes wrong:** User renames "Food" to "Transport" — MongoDB unique index `{ userId, name }` rejects it.
**Why it happens:** The unique compound index prevents duplicate names per user, which is correct behavior.
**How to avoid:** Check for name conflict before attempting update; return a 409 with a clear error message "A category with that name already exists."
**Warning signs:** Mongoose duplicate key error `E11000`.

### Pitfall 5: Deleting a Category That Has Expenses

**What goes wrong:** User deletes "Food" category. All expenses categorized as "Food" become orphaned (category string still exists on the Expense document, but no Category document matches).
**Why it happens:** Expense stores category as a free string, not a foreign key reference.
**How to avoid:** On `DELETE /api/categories/[id]`, check if any expenses reference that category name. Either (a) block deletion with a count message, or (b) allow deletion but leave expenses with the old string (they remain valid, just the category won't appear in the picker). **Recommended: option (b)** — silently allow, since the expense data is not corrupted. The category string remains valid for historical records.
**Warning signs:** Uncategorized expenses appearing in dashboards (Phase 3 concern, not Phase 2).

### Pitfall 6: Default Categories Seeded Multiple Times

**What goes wrong:** Each call to `GET /api/categories` re-seeds the 8 defaults, creating 16, 24... categories.
**Why it happens:** Naive "if count === 0, seed" logic runs before insert completes on concurrent calls.
**How to avoid:** The compound unique index `{ userId: 1, name: 1 }` will silently reject duplicates if using `insertMany` with `ordered: false`. Alternatively, use `findOneAndUpdate` with upsert for each default. The unique index is the safety net.

---

## Code Examples

### Zod 4 Schema for Expense Form (Client)

```typescript
// Source: project pattern from src/components/auth/auth-form.tsx + Zod 4 coerce
import { z } from 'zod';

export const expenseFormSchema = z.object({
  amount: z.coerce.number().int('Amount must be a whole number').positive('Amount must be positive'),
  category: z.string().min(1, 'Category is required'),
  note: z.string().max(500).default(''),
  date: z.string().min(1, 'Date is required'), // HTML date input value: "YYYY-MM-DD"
});

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;
```

### Zod 4 Schema for Expense API (Server)

```typescript
// Source: project pattern from src/app/api/settings/route.ts
import { z } from 'zod';

export const createExpenseApiSchema = z.object({
  amount: z.number().int().positive(),
  category: z.string().min(1).max(100),
  note: z.string().max(500).default(''),
  date: z.string().datetime(),
});
```

### Date Formatting with date-fns 4

```typescript
// Source: date-fns 4 — format API unchanged from v3
import { format } from 'date-fns';

// Display: "22 Mar 2026"
format(new Date(expense.date), 'dd MMM yyyy')

// Display: "March 22, 2026"
format(new Date(expense.date), 'MMMM d, yyyy')
```

### Sonner Toast (already in project)

```typescript
// Source: sonner 2.0 — installed, Toaster in layout
import { toast } from 'sonner';

toast.success('Expense created');
toast.error('Failed to save expense');
```

### `revalidatePath` After Mutation (Server Action pattern)

```typescript
// Source: Next.js 16 docs mutating-data.md
'use server'
import { revalidatePath } from 'next/cache';

export async function deleteExpenseAction(id: string) {
  // ... call DELETE /api/expenses/[id] or mutate DB directly
  revalidatePath('/expenses');
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `params.id` direct access | `await ctx.params` (Promise) | Next.js 15+ | All dynamic Route Handlers must await params |
| `revalidatePath` from `next/cache` | Same — still `next/cache` | No change | — |
| Zod 3 `.parse()` | Zod 4 — same API but `z.coerce.*` is the standard way to handle string→number conversion | Zod 4.0 | Use `z.coerce.number()` in forms |
| `@hookform/resolvers/zod` import | Same import — v5.2 auto-detects Zod 3 vs 4 | @hookform/resolvers v5 | No migration needed |

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected — no test files, no `jest.config.*`, no `vitest.config.*`, no `*.test.*` |
| Config file | None — Wave 0 must scaffold |
| Quick run command | `npx vitest run --reporter=verbose` (after setup) |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| EXPN-01 | POST /api/expenses creates expense with valid data | unit (route handler) | `npx vitest run tests/api/expenses.test.ts -t "POST"` | No — Wave 0 |
| EXPN-01 | POST /api/expenses rejects non-integer amount | unit | `npx vitest run tests/api/expenses.test.ts -t "integer"` | No — Wave 0 |
| EXPN-02 | GET /api/expenses returns only current user's expenses | unit | `npx vitest run tests/api/expenses.test.ts -t "GET"` | No — Wave 0 |
| EXPN-03 | PATCH /api/expenses/[id] updates expense | unit | `npx vitest run tests/api/expenses.test.ts -t "PATCH"` | No — Wave 0 |
| EXPN-03 | PATCH /api/expenses/[id] rejects when userId mismatch | unit | `npx vitest run tests/api/expenses.test.ts -t "ownership"` | No — Wave 0 |
| EXPN-04 | DELETE /api/expenses/[id] removes expense | unit | `npx vitest run tests/api/expenses.test.ts -t "DELETE"` | No — Wave 0 |
| EXPN-05 | POST /api/categories creates category | unit | `npx vitest run tests/api/categories.test.ts -t "POST"` | No — Wave 0 |
| EXPN-05 | PATCH /api/categories/[id] renames, rejects duplicate | unit | `npx vitest run tests/api/categories.test.ts -t "rename"` | No — Wave 0 |
| EXPN-05 | DELETE /api/categories/[id] removes category | unit | `npx vitest run tests/api/categories.test.ts -t "DELETE"` | No — Wave 0 |
| EXPN-06 | GET /api/categories seeds 8 defaults for new user | unit | `npx vitest run tests/api/categories.test.ts -t "seed"` | No — Wave 0 |

### Sampling Rate

- **Per task commit:** `npx vitest run tests/api/` (API layer only, fast)
- **Per wave merge:** `npx vitest run` (full suite)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `tests/api/expenses.test.ts` — covers EXPN-01 through EXPN-04
- [ ] `tests/api/categories.test.ts` — covers EXPN-05 and EXPN-06
- [ ] `vitest.config.ts` — test runner config
- [ ] `tests/helpers/mock-db.ts` — Mongoose memory server or mock
- [ ] Framework install: `npm install --save-dev vitest @vitest/coverage-v8 mongodb-memory-server`

---

## Open Questions

1. **Category management UI placement**
   - What we know: EXPN-05 requires create/rename/delete custom categories
   - What's unclear: Should this be a dedicated `/categories` page, a settings sub-section, or a panel within the `/expenses` page?
   - Recommendation: Embed a "Manage categories" button/panel in the `/expenses` page. Avoids a new route, keeps context with where categories are used. A shadcn `Dialog` handles the CRUD UI.

2. **Expense list pagination**
   - What we know: EXPN-02 says "see all their expenses in a list and navigate between entries" — "navigate between entries" is ambiguous
   - What's unclear: Does "navigate" mean pagination or just a scrollable list? No explicit pagination requirement in v1.
   - Recommendation: Render all expenses in a scrollable list for Phase 2. Pagination can be added in Phase 3 if needed for filter views. Keep it simple.

3. **Expense form: inline on page or in Dialog**
   - What we know: Success criteria says "via a web form" — doesn't specify modal vs inline
   - What's unclear: Whether a dialog (modal) or a sidebar or an inline form section is preferred
   - Recommendation: Use a shadcn `Dialog` for create and edit. This is the cleanest pattern for a list page and avoids layout shifts. The expense list remains visible behind the dialog.

---

## Sources

### Primary (HIGH confidence)

- Project codebase — `src/models/expense.model.ts` — Expense schema including `DEFAULT_CATEGORIES` constant
- Project codebase — `src/app/api/settings/route.ts` — established Route Handler pattern (auth + Zod + Response.json)
- Project codebase — `src/components/auth/auth-form.tsx` — established RHF + Zod 4 + zodResolver pattern
- Project codebase — `src/lib/with-auth.ts` — auth helper pattern
- `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md` — Route Handler conventions, `RouteContext` typed params, `await ctx.params`
- `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md` — Server Actions, `revalidatePath` after mutation
- `node_modules/next/dist/docs/01-app/01-getting-started/06-fetching-data.md` — Server Component DB query pattern
- `node_modules/@hookform/resolvers/zod/src/zod.ts` — Zod 3/4 dual support confirmed in v5.2

### Secondary (MEDIUM confidence)

- `node_modules/zod/package.json` — version 4.3.6 confirmed
- `node_modules/@hookform/resolvers/package.json` — version 5.2.2 confirmed

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified from node_modules
- Architecture: HIGH — Route Handler and RHF patterns verified from project source + Next.js 16 local docs
- Pitfalls: HIGH (ObjectId, VND integer, params Promise) — MEDIUM (category deletion behavior) — based on model inspection and framework docs
- Category model design: HIGH — confirmed no existing Category model; separate collection is the correct pattern

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable stack — Next.js, Mongoose, RHF versions pinned in package.json)
