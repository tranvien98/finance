# Project Research Summary

**Project:** Personal Finance Management Web App
**Domain:** Single-user expense and investment tracker with AI classification and Telegram bot integration (VND, Vietnam)
**Researched:** 2026-03-22
**Confidence:** HIGH

## Executive Summary

This is a personal finance web app purpose-built for a Vietnamese single user, with two distinguishing characteristics that set it apart from mainstream trackers like Money Lover or MISA: a Telegram bot for zero-friction expense capture at point-of-spend, and an LLM-powered free-text classifier that converts natural Vietnamese input ("pho bo 60k") into structured expense records without requiring the user to interact with a form. Neither competitor in the Vietnamese market offers this combination. The correct architecture is a Next.js 16 App Router app with a service layer that decouples HTTP concerns from business logic, allowing both the web UI and the Telegram webhook to share the same expense creation and AI classification code paths.

The recommended stack is tight and modern: Next.js 16, React 19, TailwindCSS v4, shadcn/ui, MongoDB Atlas + Mongoose v8, next-auth v5, Recharts v3, grammy, and the Vercel AI SDK with the OpenRouter provider. Version choices are non-negotiable in several cases: next-auth v4 does not support App Router natively and is unmaintained; Mongoose v9 is still stabilizing; TailwindCSS v4 replaces the config file with CSS-first configuration and requires its own PostCSS plugin. The user brings their own OpenRouter API key (AES-256-GCM encrypted in MongoDB) and their own Telegram bot token — there is no shared infrastructure to operate.

Seven critical pitfalls were identified that can silently corrupt data or compromise security if not addressed at the correct phase. The most consequential are: storing VND amounts as floats (which accumulates rounding errors in aggregations), missing Telegram webhook secret validation (which exposes a public endpoint to forgery and API cost abuse), improper AES key derivation (raw password used as key instead of scrypt), and synchronous AI processing inside the Telegram webhook (which causes Telegram retry storms and duplicate expenses under LLM latency spikes). Each of these must be prevented at the phase where it is first introduced — retrofitting is expensive or impossible.

## Key Findings

### Recommended Stack

The stack centers on Next.js 16 with App Router as the full-stack framework, using API route handlers as a thin HTTP layer above a service layer, and React Server Components for dashboard data fetching. MongoDB Atlas provides the document store via Mongoose v8 using the officially documented `global._mongoose` connection singleton pattern — this is mandatory for serverless deployments to avoid connection pool exhaustion. Authentication uses next-auth v5 beta (the only production-ready option for App Router) with JWT session strategy and a Credentials provider.

The AI pipeline is Vercel AI SDK v4 with `@openrouter/ai-sdk-provider`, using `generateObject()` to enforce a typed Zod schema on LLM output — this eliminates the class of bugs where markdown-wrapped or partially valid JSON silently fails. Telegram integration uses grammy, which has first-class Vercel/serverless webhook support via `webhookCallback()`. AES-256-GCM encryption is implemented using Node.js built-in `crypto` (no external dependency), with `crypto.scryptSync` for key derivation.

**Core technologies:**
- Next.js 16 (App Router): Full-stack framework — server actions and API routes eliminate separate backend; App Router is required for all new features
- React 19 + TailwindCSS v4 + shadcn/ui: UI layer — ships together with Next.js 16; Tailwind v4 is CSS-first (no config file)
- MongoDB Atlas + Mongoose v8: Data layer — document model fits expense/investment schemas; v8 has documented Next.js singleton pattern
- next-auth v5 beta: Authentication — only version supporting App Router natively; JWT strategy required with Credentials provider
- Vercel AI SDK v4 + @openrouter/ai-sdk-provider: AI classification — `generateObject()` enforces typed output; handles retries and JSON mode
- grammy v1: Telegram bot — explicitly optimized for webhook/Vercel deployments; lighter than Telegraf
- Zod v3 + react-hook-form v7: Validation and forms — Zod validates all AI output and API input; react-hook-form handles CRUD forms
- Node.js built-in crypto: AES-256-GCM encryption — no external dependency; GCM mode provides authenticated encryption
- Recharts v3: Data visualization — native React SVG charting; better DX than Chart.js for interactive dashboards

### Expected Features

**Must have (table stakes):**
- Expense CRUD with custom categories — core data model; all other features depend on it
- Dashboard with overview cards, category pie chart, and monthly trend chart — the payoff for logging; users expect this
- Date filtering by month/year — users think in time periods; current-month default
- Month-over-month comparison — simplest insight; expected in any tracker
- Authentication (login/logout, JWT session) — gates all features; baseline security requirement
- Manual expense entry via web UI — fallback when bot is unavailable
- Responsive mobile-friendly UI and dark mode — Vietnamese users are mobile-primary; dark mode is a 2026 baseline expectation
- Loading skeletons, empty states, toast notifications — without these the app feels broken

**Should have (differentiators):**
- Telegram bot with AI free-text classification — core differentiator; genuine gap in Vietnamese personal finance market
- Vietnamese NLP understanding ("k" = 1000 VND, "trieu" = million, "ăn phở 50k") — required for bot to be usable
- Rule-based fallback for AI failures — resilience when OpenRouter is unavailable or returns garbage
- AI result caching — cost control and latency reduction for repeated similar phrases
- User-owned OpenRouter API key (AES-256 encrypted) — user controls LLM costs; no shared infrastructure
- Per-user Telegram bot token — user brings their own bot; no shared infrastructure
- Investment portfolio tracking (mutual funds, crypto, gold) — widens financial picture; no competitor in Vietnam offers this

**Defer (v2+):**
- CSV/PDF export — database is queryable directly for single user; add when demand is clear
- Budget creation and tracking — significant product surface; validate demand first
- Receipt OCR via Telegram — image pipeline complexity; text parsing is faster anyway
- Multi-currency support — VND-only is a simplicity advantage for the target user
- Telegram read commands ("how much did I spend this month?") — v1 bot is write-only; read is v1.x

### Architecture Approach

The architecture follows a strict layering: React Server Components and client components talk to API route handlers, which call a service layer (`services/`), which calls Mongoose models. Business logic never lives in route handlers or page components — it lives in services. This design is non-optional here because the same expense creation and AI classification logic must be reachable from both the web form (via `/api/expenses`) and the Telegram webhook (`/api/telegram/webhook`). The `DashboardService` runs MongoDB aggregation pipelines server-side rather than fetching raw data and summing in JavaScript. The `AiService` implements a hash-based cache check before every OpenRouter call. The Telegram webhook is a public endpoint and validates a secret token header before touching the request body.

**Major components:**
1. Next.js API Route Handlers — thin HTTP layer: validate input, call service, serialize response; no business logic
2. Service layer (`ExpenseService`, `InvestmentService`, `DashboardService`, `AiService`, `TelegramService`) — all business logic; shared across web and Telegram entry points
3. `AiService` — hash-based cache lookup → OpenRouter API call → rule-based fallback; single classification path
4. `TelegramService` — parse webhook update → call AiService → call ExpenseService → send Telegram confirmation reply
5. Mongoose models (`Expense`, `Investment`, `User`, `AiCache`) — schema enforcement; integer validator on amount field
6. `lib/encryption.ts` — single place for AES-256-GCM encrypt/decrypt; services never touch `crypto` directly
7. `lib/db.ts` — `dbConnect()` singleton using `global._mongoose` cache; called at top of every service function
8. Recharts chart components — receive pre-aggregated data as props from RSC; no client-side data fetching for dashboard

### Critical Pitfalls

1. **Float amount storage** — store all VND amounts as integers (dong is indivisible) from day one; add integer validator to Mongoose schema; aggregation rounding errors are impossible to trace after data exists
2. **Missing Telegram webhook origin validation** — validate `X-Telegram-Bot-Api-Secret-Token` header before parsing the request body on every POST; return 401 on mismatch; also validate `message.from.id` matches the expected user
3. **Improper AES key derivation** — use `crypto.scryptSync(secret, salt, 32)` not raw password bytes; use `crypto.randomBytes(12)` for a fresh IV on every encryption call; use GCM mode (not CBC) for authenticated encryption with integrity check
4. **MongoDB connection pool exhaustion** — use the `global._mongoose` singleton pattern with `maxPoolSize: 1`; never call `mongoose.connect()` directly in a route handler; free Atlas tier has a 500-connection limit that serverless functions exhaust rapidly
5. **Synchronous AI call in Telegram webhook** — respond HTTP 200 to Telegram immediately; process AI classification asynchronously using `next/after()` or equivalent; implement idempotency check on `message_id` to prevent duplicate expenses from Telegram retry storms

## Implications for Roadmap

Based on research, the architecture defines a clear dependency chain that maps directly to build phases. Each phase must satisfy its own pitfall requirements before the next phase can be built on top.

### Phase 1: Foundation

**Rationale:** Everything depends on auth, database connection, and the data model. Float amounts, connection pool exhaustion, and AES key errors must be addressed here — they cannot be retrofitted safely.
**Delivers:** Working authentication, MongoDB connection singleton, Mongoose models with integer-validated amount fields, AES-256-GCM encryption helper, seeded default categories
**Addresses:** Authentication, custom categories, AES-256 encrypted key storage settings page scaffold
**Avoids:** Float amount storage pitfall, MongoDB connection pool exhaustion, AES encryption mode pitfall, NextAuth JWT secret missing in production

### Phase 2: Expense CRUD and Web UI

**Rationale:** Expense CRUD is the dependency for every other data-producing feature. The web UI provides a testable baseline before the AI and bot layers are added.
**Delivers:** Expense list, create/edit/delete forms, manual expense entry, category management, date filtering by month/year, responsive UI, dark mode, loading skeletons, toasts
**Addresses:** Expense CRUD, custom category management, date filtering, manual web entry, responsive/dark mode, empty states, loading states
**Avoids:** Business logic in route handlers (service layer enforced from the start)

### Phase 3: Dashboard and Analytics

**Rationale:** Dashboard depends on real expense data existing (Phase 2). MongoDB aggregation pipelines must be built before AI and bot phases add more write volume.
**Delivers:** Dashboard overview cards, category pie chart, monthly trend bar chart, month-over-month comparison, DashboardService aggregation layer
**Addresses:** Dashboard overview, category breakdown chart, trend chart, MoM comparison
**Avoids:** Fetching all expenses into JavaScript for aggregation (use MongoDB pipeline); missing indexes on `{userId, date}`; dashboard defaulting to all-time view instead of current month

### Phase 4: AI Classification

**Rationale:** AI classification is the prerequisite for the Telegram bot (the bot's core value requires free-text parsing). The AiService, cache, and rule-based fallback must be stable before the bot is layered on top.
**Delivers:** AiService with OpenRouter integration, Zod schema-enforced structured output, hash-based AI result cache (AiCache model), rule-based fallback parser for Vietnamese VND patterns, `/api/classify` route, AI input UI component with pre-fill behavior
**Addresses:** AI free-text classification, Vietnamese NLP (k/trieu/shorthand), rule-based fallback, AI result caching, user-owned OpenRouter API key (encrypted settings)
**Avoids:** AI classification without structured output enforcement (Zod + JSON mode); no rule-based fallback; no cache layer; arbitrary model names accepted from client

### Phase 5: Telegram Bot Integration

**Rationale:** Telegram is the last phase because it depends on AI (Phase 4) and expense creation (Phase 2) being stable. The async response pattern and webhook security must be designed from the start of this phase, not added later.
**Delivers:** grammy webhook handler at `/api/telegram/webhook`, TelegramService (parse → classify → create → reply), settings page for bot token, webhook registration via Telegram `setWebhook` API, Telegram confirmation reply with expense summary, idempotency check on `message_id`
**Addresses:** Telegram bot for quick expense entry, per-user bot token, VND-formatted confirmation message
**Avoids:** Synchronous AI call in webhook (Telegram retry storm), missing webhook secret token validation, long polling in serverless, non-text update handling crashes

### Phase 6: Investment Tracking

**Rationale:** Investment tracking shares auth and the service layer with expenses but has no hard dependency on AI or Telegram. It can be built after Phase 5 or in parallel with Phase 5 since it is independent.
**Delivers:** Investment CRUD (mutual funds, crypto, gold), investment portfolio view, investment totals added to dashboard summary cards
**Addresses:** Investment portfolio tracking, investment vs expense dashboard
**Avoids:** Reusing float storage for investment values (same integer discipline applies)

### Phase 7: Polish and v1.x Features

**Rationale:** AI-generated spending insights require enough historical data to analyze. Telegram read commands ("how much this month?") are natural extensions once the write path is proven. Polish is layered in throughout but gets a dedicated consolidation pass here.
**Delivers:** AI-generated narrative spending insights, Telegram read commands, custom date range filter, any outstanding UX polish (VND formatting consistency, loading states, category count limits)
**Addresses:** AI spending insights, Telegram read commands, custom date range filter
**Avoids:** Too many categories causing AI ambiguity (enforce 8-10 max); missing loading states on AI calls (2-5s visible latency)

### Phase Ordering Rationale

- **Foundation first** because auth, DB connection, and the integer amount schema are impossible to retrofit safely after data exists. All three critical foundation pitfalls (float amounts, connection pool, AES mode) are addressed in Phase 1 precisely because they cannot be addressed later.
- **CRUD before dashboard** because aggregation pipelines require data to be meaningful. Indexes on `{userId, date}` are created at model definition time in Phase 1 but tested with real data in Phase 3.
- **AI before Telegram** because the bot's entire value proposition is free-text AI parsing. A bot without AI can only accept structured commands, which defeats the UX goal. The AiService must be tested in isolation via the web UI before the Telegram async pattern is layered on top.
- **Investment last (but independent)** because it shares no hard dependency with AI or Telegram. It is deferred to Phase 6 to keep Phase 2-5 focused on the core loop: log via Telegram, see in dashboard.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 5 (Telegram):** The async response pattern (`next/after()` vs background queue vs fire-and-forget) needs a concrete implementation decision. `next/after()` is the cleanest approach but has Vercel-specific behavior; needs verification for the deployment target.
- **Phase 4 (AI):** OpenRouter model selection and JSON mode support varies by model. The specific model identifier to use for Vietnamese expense classification (cost vs quality tradeoff) needs validation — the hardcoded model name should be a config constant from day one.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** next-auth v5 JWT + Credentials, Mongoose singleton, AES-256-GCM — all have established, documented patterns; no research needed
- **Phase 2 (CRUD):** Standard Next.js App Router CRUD with server actions and Zod validation — well-documented
- **Phase 3 (Dashboard):** Recharts + MongoDB aggregation pipeline — straightforward; patterns are documented
- **Phase 6 (Investment):** Identical patterns to Phase 2 (CRUD); no new research needed

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified against official docs and npm registry; compatibility matrix checked |
| Features | MEDIUM-HIGH | Core features HIGH (standard domain); AI/bot feature patterns MEDIUM (less prior art) |
| Architecture | HIGH | Next.js patterns HIGH (official docs); Telegram + Next.js combination MEDIUM (community sources) |
| Pitfalls | HIGH | Most pitfalls verified through multiple official and community sources; CVE reference included |

**Overall confidence:** HIGH

### Gaps to Address

- **Telegram async response implementation:** `next/after()` is the recommended approach but behavior on Vercel Hobby vs Pro plan needs verification before Phase 5 planning. Fallback: fire-and-forget with explicit error capture.
- **OpenRouter model for Vietnamese:** No Vietnamese-specific benchmark exists for expense classification. Best initial choice is `openai/gpt-4o-mini` (cost-effective, JSON mode, multilingual). Store as a config constant and expose as a user setting in Phase 5+ if needed.
- **Telegram bot token multi-user concern:** Research confirmed single-user design, but webhook registration (`setWebhook`) needs to handle the case where the user updates their bot token — the old webhook must be deregistered before the new one is set.
- **Category seeding:** Default category list needs a defined set before Phase 1 completes. Suggested seed: Food, Transport, Entertainment, Shopping, Health, Utilities, Housing, Other (8 categories — within the recommended 8-10 ceiling).

## Sources

### Primary (HIGH confidence)
- [Next.js releases — GitHub](https://github.com/vercel/next.js/releases) — v16.2.1 confirmed current
- [Next.js upgrade guide v16](https://nextjs.org/docs/app/guides/upgrading/version-16) — App Router requirement confirmed
- [Mongoose Next.js guide (Official)](https://mongoosejs.com/docs/nextjs.html) — connection singleton pattern
- [Auth.js v5 migration guide](https://authjs.dev/getting-started/migrating-to-v5) — App Router patterns, JWT strategy
- [Tailwind CSS v4 release](https://tailwindcss.com/blog/tailwindcss-v4) — CSS-first config, PostCSS plugin
- [shadcn/ui changelog March 2026](https://ui.shadcn.com/docs/changelog/2026-03-cli-v4) — CLI v4 compatibility
- [OpenRouter quickstart](https://openrouter.ai/docs/quickstart) — integration patterns
- [grammY documentation](https://grammy.dev/) — serverless webhook deployment
- OpenClaw Telegram webhook CVE: GHSA-jq3f-vjww-8rq7 — webhook validation requirement
- [Floats and monetary values — Modern Treasury](https://www.moderntreasury.com/journal/floats-dont-work-for-storing-cents) — integer storage requirement

### Secondary (MEDIUM confidence)
- [grammY vs Telegraf comparison](https://grammy.dev/resources/comparison) — grammy serverless advantage
- [Recharts 3.0 migration guide](https://github.com/recharts/recharts/wiki/3.0-migration-guide) — state management rewrite
- [LLM structured output reliability 2025 — Cognitive Today](https://www.cognitivetoday.com/2025/10/structured-output-ai-reliability/) — 6% failure rate without schema enforcement
- [Next.js serverless timeout and AI calls — Inngest](https://www.inngest.com/blog/how-to-solve-nextjs-timeouts) — async webhook pattern
- [Emerging personal finance apps in Vietnam — B-Company](https://b-company.jp/emerging-personal-finance-applications-in-vietnam/) — competitor landscape
- [MongoDB serverless connection pool exhaustion — MongoDB Community](https://www.mongodb.com/community/forums/t/next-js-serverless-high-connection-count-to-mongodb-despite-following-best-practices/156122) — maxPoolSize requirement

### Tertiary (LOW confidence)
- WebSearch benchmark results — Recharts vs Chart.js performance comparison (numbers not independently verified; recommendation stands regardless)
- [Automating Expense Management via Telegram — Medium](https://omkarshetkar.medium.com/automation-using-telegram-bot-google-sheet-and-ai-2bbe57cf4992) — pattern validation only; implementation differs

---
*Research completed: 2026-03-22*
*Ready for roadmap: yes*
