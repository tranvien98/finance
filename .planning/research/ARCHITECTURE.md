# Architecture Research

**Domain:** Personal finance web app with AI classification and Telegram bot integration
**Researched:** 2026-03-22
**Confidence:** HIGH (Next.js patterns), MEDIUM (Telegram+Next.js combination), HIGH (encryption patterns)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                │
│  ┌───────────────┐  ┌───────────────┐  ┌────────────────────────┐   │
│  │  Dashboard    │  │  Expense /    │  │  Settings              │   │
│  │  (charts,     │  │  Investment   │  │  (API keys, bot token) │   │
│  │  insights)    │  │  CRUD pages   │  │                        │   │
│  └───────┬───────┘  └───────┬───────┘  └───────────┬────────────┘   │
│          │ fetch()           │ Server Actions/fetch   │              │
└──────────┼───────────────────┼───────────────────────┼──────────────┘
           │                   │                        │
┌──────────┼───────────────────┼───────────────────────┼──────────────┐
│          │           API LAYER (Next.js Route Handlers)              │
│  ┌───────▼──────┐  ┌────────▼──────┐  ┌─────────────▼────────┐     │
│  │ /api/        │  │ /api/         │  │ /api/                 │     │
│  │ expenses     │  │ investments   │  │ settings              │     │
│  └───────┬──────┘  └────────┬──────┘  └─────────────┬────────┘     │
│          │                   │                        │              │
│  ┌───────▼──────┐  ┌────────▼──────┐  ┌─────────────▼────────┐     │
│  │ /api/        │  │ /api/         │  │ /api/                 │     │
│  │ classify     │  │ dashboard     │  │ telegram/webhook      │     │
│  └───────┬──────┘  └────────┬──────┘  └─────────────┬────────┘     │
│          │ withAuth()        │ withAuth()              │ (public)    │
└──────────┼───────────────────┼───────────────────────┼──────────────┘
           │                   │                        │
┌──────────┼───────────────────┼───────────────────────┼──────────────┐
│                       SERVICE LAYER                                   │
│  ┌────────▼──────┐  ┌────────▼──────┐  ┌────────────▼──────────┐    │
│  │ ExpenseService│  │ DashboardSvc  │  │ TelegramService        │    │
│  │ InvestmentSvc │  │               │  │ (parse → classify →    │    │
│  │               │  │               │  │  create expense)       │    │
│  └────────┬──────┘  └────────┬──────┘  └────────────┬──────────┘    │
│           │                   │                       │               │
│  ┌────────▼──────────────────▼───────────────────────▼──────────┐    │
│  │                     AI Service                                 │    │
│  │  classifyExpense(text) → { amount, category, description }    │    │
│  │  cache lookup → OpenRouter API call → cache store             │    │
│  └────────────────────────────┬──────────────────────────────────┘    │
└───────────────────────────────┼──────────────────────────────────────┘
                                │
┌───────────────────────────────┼──────────────────────────────────────┐
│                     DATA LAYER                                         │
│  ┌────────────────┐  ┌────────▼──────┐  ┌──────────────────────┐     │
│  │ MongoDB        │  │ Mongoose      │  │ Encryption Helper     │     │
│  │ Collections:   │  │ Models:       │  │ (AES-256-GCM)         │     │
│  │  - expenses    │  │  - Expense    │  │  - encrypt(apiKey)    │     │
│  │  - investments │  │  - Investment │  │  - decrypt(ciphertext)│     │
│  │  - users       │  │  - User       │  └──────────────────────┘     │
│  │  - ai_cache    │  │  - AiCache    │                                │
│  └────────────────┘  └───────────────┘                                │
└────────────────────────────────────────────────────────────────────────┘
           ↕                                          ↕
┌──────────────────────────────────────────────────────────────────────┐
│                     EXTERNAL SERVICES                                  │
│  ┌─────────────────────────┐       ┌────────────────────────────┐    │
│  │ OpenRouter API           │       │ Telegram Bot API           │    │
│  │ (LLM classification)    │       │ (webhook registration,     │    │
│  │ POST /chat/completions  │       │  message replies)          │    │
│  └─────────────────────────┘       └────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| Next.js Pages (RSC) | Render UI, fetch data via Server Components or client fetch | API routes, Mongoose models (server-side) |
| API Route Handlers (`/api/**`) | HTTP endpoints — validate input, call services, return JSON | Service layer, NextAuth session |
| `withAuth()` middleware | Wrap route handlers to enforce JWT session | NextAuth `getServerSession()` |
| ExpenseService | CRUD operations for expenses, AI classification trigger | Mongoose Expense model, AiService |
| InvestmentService | CRUD operations for investments | Mongoose Investment model |
| DashboardService | Aggregate queries for charts, MoM comparison, insights | Expense + Investment models |
| AiService | Parse free text, call OpenRouter, cache results | OpenRouter API, AiCache model |
| TelegramService | Parse incoming webhook, invoke AiService, persist expense | AiService, ExpenseService |
| Encryption helper | AES-256-GCM encrypt/decrypt for stored API keys | Node.js `crypto` module |
| Mongoose models | Schema definition + query interface | MongoDB |
| `dbConnect()` | Singleton MongoDB connection (reused across requests) | Mongoose |

## Recommended Project Structure

```
/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx          # Login page
│   │   └── layout.tsx              # Auth layout (no nav)
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Main app layout with nav
│   │   ├── page.tsx                # Dashboard overview
│   │   ├── expenses/
│   │   │   ├── page.tsx            # Expense list + add form
│   │   │   └── [id]/page.tsx       # Edit expense
│   │   ├── investments/
│   │   │   ├── page.tsx            # Investment list + add form
│   │   │   └── [id]/page.tsx       # Edit investment
│   │   └── settings/page.tsx       # API keys, bot token config
│   └── api/
│       ├── auth/[...nextauth]/route.ts   # NextAuth handler
│       ├── expenses/
│       │   ├── route.ts            # GET list, POST create
│       │   └── [id]/route.ts       # GET, PUT, DELETE by ID
│       ├── investments/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       ├── dashboard/route.ts      # GET aggregated dashboard data
│       ├── classify/route.ts       # POST free-text → classification
│       ├── settings/route.ts       # GET/PUT user settings (encrypted keys)
│       └── telegram/
│           └── webhook/route.ts    # POST — Telegram message handler (public)
├── components/
│   ├── ui/                         # shadcn/ui base components
│   ├── charts/                     # Recharts wrappers (ExpenseChart, TrendLine)
│   ├── expenses/                   # ExpenseForm, ExpenseTable, ExpenseCard
│   ├── investments/                # InvestmentForm, InvestmentTable
│   ├── dashboard/                  # DashboardStats, InsightCard, MonthPicker
│   └── shared/                     # LoadingSkeleton, ErrorBoundary, Toast
├── lib/
│   ├── db.ts                       # dbConnect() singleton
│   ├── auth.ts                     # NextAuth config (authOptions)
│   ├── encryption.ts               # encrypt() / decrypt() AES-256-GCM
│   ├── with-auth.ts                # withAuth() route handler wrapper
│   └── utils.ts                    # formatVND(), dateHelpers, etc.
├── services/
│   ├── expense.service.ts          # ExpenseService (CRUD + AI trigger)
│   ├── investment.service.ts       # InvestmentService
│   ├── dashboard.service.ts        # DashboardService (aggregations)
│   ├── ai.service.ts               # AiService (classify + cache)
│   └── telegram.service.ts         # TelegramService (parse + route to expense)
├── models/
│   ├── expense.model.ts            # Expense schema + model
│   ├── investment.model.ts         # Investment schema + model
│   ├── user.model.ts               # User schema (settings, encrypted keys)
│   └── ai-cache.model.ts           # AiCache schema (hash → classification)
└── hooks/
    ├── useExpenses.ts              # Client data fetching + mutation
    ├── useInvestments.ts
    └── useDashboard.ts
```

### Structure Rationale

- **`services/`:** Business logic is isolated from HTTP concerns. Services are callable from both API routes and Server Components without code duplication. This is the key layer that allows the Telegram webhook and the web UI to share the same expense creation logic.
- **`models/`:** Mongoose model definitions live separate from services. Each model file uses the `mongoose.models.X || mongoose.model('X', schema)` guard to prevent recompilation during hot reload.
- **`lib/`:** Pure utilities with no business logic — DB connection, auth config, encryption helpers, middleware wrappers.
- **`app/api/`:** Thin handler layer. Each route handler validates input, calls a service, and serializes the response. No business logic lives here.
- **`(auth)/` and `(dashboard)/` route groups:** Separate layouts — the auth pages have no navigation bar; dashboard pages have the main nav sidebar.

## Architectural Patterns

### Pattern 1: Service Layer — Shared Logic Across Entry Points

**What:** All business logic (create expense, classify text, calculate dashboard stats) lives in `services/`. Both API route handlers and the Telegram webhook call the same service functions.

**When to use:** Whenever the same operation can be triggered from multiple entry points (web form and Telegram bot both create expenses).

**Trade-offs:** Adds one indirection layer. For a single-user personal app this is light overhead with a high payoff: the Telegram webhook reuses `ExpenseService.create()` identically to the web UI.

```typescript
// services/expense.service.ts
export async function createExpense(data: CreateExpenseInput) {
  await dbConnect();
  return Expense.create(data);
}

// app/api/expenses/route.ts
export const POST = withAuth(async (req) => {
  const body = await req.json();
  const expense = await createExpense(body);
  return Response.json(expense, { status: 201 });
});

// services/telegram.service.ts — same service, different entry point
export async function handleTelegramMessage(text: string) {
  const classified = await classifyExpense(text);
  return createExpense(classified);
}
```

### Pattern 2: withAuth() Wrapper — Centralized Auth Guard

**What:** A higher-order function that wraps any route handler to require a valid NextAuth JWT session. Unauthenticated requests return 401 before the handler runs.

**When to use:** All API routes except `/api/auth/**` and `/api/telegram/webhook`.

**Trade-offs:** Lightweight alternative to Next.js `middleware.ts` for per-route control. Easier to test individual handlers in isolation.

```typescript
// lib/with-auth.ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export function withAuth(handler: Handler): Handler {
  return async (req, ctx) => {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return handler(req, ctx);
  };
}
```

### Pattern 3: AI Cache — Hash-Based Deduplication

**What:** Before calling OpenRouter, compute a normalized hash of the input text. Check MongoDB for a cached result. If found, return it; if not, call OpenRouter, store the result, return it.

**When to use:** Any AI classification call. Telegram messages are often similar ("cafe 30k", "pho 50k") — caching cuts repeated costs significantly.

**Trade-offs:** Cache invalidation is not needed here (a given text always classifies the same way). The risk is stale categories if the user renames categories, but for a personal app manual cache clearing is sufficient.

```typescript
// services/ai.service.ts
export async function classifyExpense(text: string): Promise<Classification> {
  const cacheKey = hashText(text.toLowerCase().trim());
  const cached = await AiCache.findOne({ key: cacheKey }).lean();
  if (cached) return cached.result;

  const result = await callOpenRouter(text);

  // Rule-based fallback if OpenRouter fails or returns unusable data
  const final = isValidClassification(result) ? result : ruleBased(text);

  await AiCache.create({ key: cacheKey, result: final });
  return final;
}
```

### Pattern 4: Telegram Webhook — Public Endpoint with Secret Validation

**What:** `/api/telegram/webhook` is a public POST route (no `withAuth()`). It must validate that the request originates from Telegram using the bot token hash, then delegate to `TelegramService`.

**When to use:** Telegram webhook registration requires a publicly accessible HTTPS URL. NextAuth sessions don't apply here — Telegram sends requests directly.

**Trade-offs:** Must validate the Telegram signature on every request. The bot token is stored encrypted in the User document; the webhook handler retrieves and decrypts it per request. For a single-user app this is one decrypt per message — acceptable.

```typescript
// app/api/telegram/webhook/route.ts
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // 1. Validate request comes from Telegram (token hash check)
  // 2. Parse update body
  // 3. Delegate to TelegramService
  const update = await req.json();
  await handleTelegramMessage(update.message?.text ?? '');
  return Response.json({ ok: true });
}
```

## Data Flow

### Request Flow — Web Expense Creation

```
User fills form
    ↓
Client Component → POST /api/expenses (JSON body)
    ↓
withAuth() → validate JWT session
    ↓
Route Handler → validate body schema
    ↓
ExpenseService.create() → Expense.create() → MongoDB
    ↓
Route Handler → Response.json(expense, { status: 201 })
    ↓
Client → toast notification + list refresh
```

### Request Flow — AI Expense Classification (Web)

```
User types free text in AI input
    ↓ (debounced 500ms)
Client → POST /api/classify { text }
    ↓
withAuth() → AiService.classifyExpense(text)
    ↓
Hash text → check AiCache in MongoDB
    ↓ [cache miss]
POST openrouter.ai/api/v1/chat/completions
  headers: Authorization: Bearer {decrypt(user.openrouterKey)}
    ↓
Parse response → validate → fallback if invalid
    ↓
AiCache.create({ key, result }) → return result
    ↓
Client → pre-fill expense form fields
```

### Request Flow — Telegram Bot Message

```
User sends "pho bo 60k" to Telegram bot
    ↓
Telegram servers → POST /api/telegram/webhook
    ↓
Validate Telegram origin (secret token header)
    ↓
TelegramService.handle(update)
    ↓
AiService.classifyExpense("pho bo 60k")
    ↓  [calls OpenRouter with user's decrypted API key]
{ amount: 60000, category: "Food", description: "Pho bo" }
    ↓
ExpenseService.create(classified)  →  MongoDB
    ↓
Telegram Bot API → sendMessage("Logged: Pho bo 60,000 VND (Food)")
```

### Request Flow — Dashboard Load

```
User navigates to /dashboard
    ↓
React Server Component (no fetch needed, direct DB access)
    ↓
DashboardService.getMonthlyOverview(month, year)
    ↓
MongoDB aggregation pipeline:
  - Sum expenses by category (for pie chart)
  - Sum expenses by day (for line chart)
  - Compare to previous month (for % change)
    ↓
Pass data as props → Client chart components (Recharts)
```

### Encryption Flow — API Key Storage

```
User saves OpenRouter API key in Settings
    ↓
POST /api/settings { openrouterKey: "sk-or-..." }
    ↓
encrypt(openrouterKey, ENCRYPTION_SECRET) → ciphertext
    ↓
User.findOneAndUpdate({ encryptedOpenrouterKey: ciphertext })
    ↓
At classification time:
decrypt(user.encryptedOpenrouterKey, ENCRYPTION_SECRET) → plaintext key
    ↓
Use plaintext key in Authorization header → discard after request
```

## Scaling Considerations

This is a single-user app. Scaling is not a concern. The architecture choices that matter here are:

| Concern | Single-User Approach |
|---------|---------------------|
| DB connections | `dbConnect()` singleton prevents connection pool exhaustion in serverless |
| AI costs | Cache in MongoDB eliminates redundant LLM calls |
| Telegram rate limits | One user sending ~10-50 messages/day — no concern |
| Bundle size | Server Components keep client JS minimal |

**First real bottleneck if scope ever expands:** MongoDB connection limits under high concurrency. Fix: connection pooling via dedicated MongoDB Atlas tier or a connection pooler.

## Anti-Patterns

### Anti-Pattern 1: Business Logic in Route Handlers

**What people do:** Put Mongoose queries, OpenRouter calls, and encryption directly inside `app/api/expenses/route.ts`.

**Why it's wrong:** The Telegram webhook needs to create expenses too. Without a service layer, you either duplicate code or import route logic into other route files — both produce maintenance debt quickly.

**Do this instead:** Route handlers call services. Services are independently testable and reusable across entry points.

### Anti-Pattern 2: Decrypting API Keys in Multiple Places

**What people do:** Copy-paste the decrypt call in every service that needs the API key (AiService, a potential future service).

**Why it's wrong:** Encryption logic scattered everywhere means one wrong usage breaks security guarantees. IV management errors are subtle bugs.

**Do this instead:** The `encryption.ts` helper is the single place that knows about AES-256-GCM. Services call `decrypt(ciphertext)` — they never touch `crypto` directly. The key is loaded from `process.env.ENCRYPTION_SECRET` inside the helper only.

### Anti-Pattern 3: Not Caching AI Classification Results

**What people do:** Call OpenRouter on every free-text input without a cache layer.

**Why it's wrong:** "pho 50k" and "Pho 50K" trigger two API calls returning identical results. In a Telegram-first workflow with repeated similar messages, costs accumulate quickly and latency is noticeable.

**Do this instead:** Normalize input (lowercase, trim) → hash → check MongoDB cache first. Cache hit returns in ~5ms. Cache miss calls OpenRouter and stores the result.

### Anti-Pattern 4: Putting Mongoose Queries in React Server Components Directly

**What people do:** Call `Expense.find({ ... })` directly inside a page file (RSC).

**Why it's wrong:** The Dashboard RSC can call `DashboardService.getMonthlyOverview()` directly since it runs server-side. But skipping the service layer means the aggregation logic can't be reused in an API route for future CSV export or API access.

**Do this instead:** RSCs call service functions, not models directly. This keeps aggregation logic in one place.

### Anti-Pattern 5: Using Long Polling for Telegram in Production

**What people do:** Use `bot.launch()` (Grammy/Telegraf polling mode) from a Next.js API handler.

**Why it's wrong:** Long polling blocks a serverless function indefinitely. It conflicts with Next.js stateless handler lifecycle and will time out or spawn duplicate pollers on restarts.

**Do this instead:** Register a webhook URL with Telegram's API at startup. Telegram pushes updates to `/api/telegram/webhook` — one POST per message, stateless, compatible with Next.js.

## Integration Points

### External Services

| Service | Integration Pattern | Key Notes |
|---------|---------------------|-----------|
| OpenRouter API | `fetch` POST to `https://openrouter.ai/api/v1/chat/completions` from `AiService` | Use OpenAI-compatible format. Decrypted user API key in Authorization header. Never cached in memory — decrypted fresh per request. |
| Telegram Bot API | Webhook: Telegram POSTs to `/api/telegram/webhook`. Bot replies via `fetch` to `https://api.telegram.org/bot{token}/sendMessage` | Token stored encrypted in User document. Register webhook URL via Telegram's `setWebhook` API on first setup. Validate incoming requests with secret_token header. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Route Handler ↔ Service | Direct function call (same process) | No HTTP overhead. Services are plain async functions. |
| Service ↔ Model | Mongoose model methods (`.find()`, `.create()`, `.aggregate()`) | Always call `dbConnect()` first in every service function. |
| AiService ↔ AiCache | Mongoose `AiCache` model | Cache key = SHA-256 of normalized input text. |
| TelegramService ↔ ExpenseService | Direct function call | Telegram message handler reuses the same create path as the web API. |
| Encryption helper ↔ Services | `encrypt(plaintext)` / `decrypt(ciphertext)` from `lib/encryption.ts` | `ENCRYPTION_SECRET` env var read once at module load. Never logged. |

## Build Order (Dependencies)

Build in this sequence — each phase's dependencies are satisfied before proceeding:

```
Phase 1: Foundation
  dbConnect() → Mongoose models (User, Expense, Investment) → NextAuth config

Phase 2: Core CRUD
  ExpenseService + InvestmentService → API routes → Basic UI pages
  [Requires: Phase 1]

Phase 3: Dashboard
  DashboardService (aggregations) → Dashboard API route → Chart components
  [Requires: Phase 2 — needs real data to aggregate]

Phase 4: AI Classification
  Encryption helper → AiCache model → AiService → /api/classify route
  AI input UI component → pre-fill expense form
  [Requires: Phase 1 for encryption, Phase 2 for expense creation]

Phase 5: Telegram Bot
  TelegramService (calls AiService + ExpenseService) → /api/telegram/webhook
  Settings page (store/update encrypted bot token + OpenRouter key)
  [Requires: Phase 4 — depends on AiService being stable]

Phase 6: Polish
  Loading skeletons, toast notifications, dark mode, error handling, seed data
  [Can be layered into any prior phase but deprioritized until core works]
```

## Sources

- [Building APIs with Next.js (Official, Feb 2025)](https://nextjs.org/blog/building-apis-with-nextjs) — Route Handler patterns, `withAuth()` wrapper, webhook handling
- [Mongoose with Next.js (Official)](https://mongoosejs.com/docs/nextjs.html) — `dbConnect()` singleton, model recompilation guard
- [Telegram + Next.js App Router (LaunchFa.st, 2025)](https://www.launchfa.st/blog/telegram-nextjs-app-router/) — Grammy webhook callback, force-dynamic cache config
- [Next.js App Router Architecture Patterns 2026 (DEV Community)](https://dev.to/teguh_coding/nextjs-app-router-the-patterns-that-actually-matter-in-2026-146) — Server-first, client islands, service layer
- [AES-256-GCM in Node.js (GitHub Gist)](https://gist.github.com/rjz/15baffeab434b8125ca4d783f4116d81) — GCM mode with authentication tag, IV management
- [Building a Scalable Telegram Bot with Node.js and Webhooks (Medium)](https://medium.com/@pushpesh0/building-a-scalable-telegram-bot-with-node-js-bullmq-and-webhooks-6b0070fcbdfc) — Webhook vs polling trade-offs

---
*Architecture research for: Personal finance web app (Next.js + MongoDB + OpenRouter + Telegram)*
*Researched: 2026-03-22*
