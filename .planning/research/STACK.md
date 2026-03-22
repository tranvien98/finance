# Stack Research

**Domain:** Personal finance web app with AI classification and Telegram bot integration
**Researched:** 2026-03-22
**Confidence:** HIGH (core stack validated against official docs and npm registry)

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 16.x (16.2.1 current) | Full-stack React framework | App Router is the standard for new projects; server actions eliminate the need for separate API boilerplate for most CRUD; API routes still work for webhooks (Telegram) |
| React | 19.x | UI runtime | Ships with Next.js 16; concurrent features and server components are now stable |
| TailwindCSS | 4.x | Utility-first CSS | v4 (released Jan 2025) is 5x faster, zero-config content detection, CSS-first config replaces tailwind.config.js |
| shadcn/ui | CLI v4 (March 2026) | Accessible component primitives | Not a library — copies source into your repo, so you own the components; fully compatible with Next.js 16 + React 19 + Tailwind v4 |
| Mongoose | 8.x (8.10+ recommended) | MongoDB ODM | v9 exists but v8 is supported until at least Feb 2026; v8 is battle-tested with Next.js serverless caching patterns; Mongoose's official Next.js guide targets v8 patterns |
| MongoDB Atlas | 7.x | Document database | Free tier sufficient for single-user; Atlas handles connection pooling; pairs naturally with Mongoose |
| next-auth | 5.x beta (`next-auth@beta`) | Authentication | v5 is the only actively developed version; v4 is unmaintained; v5 beta is production-ready despite the label — widely used in production with Next.js 15/16 App Router |
| Recharts | 3.x (3.8.0 current) | Data visualization | Built natively for React (SVG-based, virtual DOM); integrates as standard React components; v3 rewrote state management; significantly outperforms Chart.js for interactivity |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Zod | ^3.x | Runtime schema validation | Validate all AI-parsed input, Telegram message parsing, and form submissions server-side; pairs with server actions via `safeParse()` |
| react-hook-form | ^7.71.x | Client-side form state | CRUD forms for expenses/investments; integrates cleanly with Zod resolver (`@hookform/resolvers`) |
| @hookform/resolvers | ^3.x | Zod adapter for react-hook-form | Required bridge between react-hook-form and Zod schema validation |
| grammy | ^1.x | Telegram bot framework | TypeScript-first, explicitly optimized for serverless/Vercel webhook deployments; lighter than Telegraf; actively maintained |
| @openrouter/ai-sdk-provider | latest | OpenRouter via Vercel AI SDK | Official provider for OpenRouter; integrates with `ai` package for streaming and structured output; type-safe |
| ai (Vercel AI SDK) | ^4.x | AI SDK wrapper | Used alongside `@openrouter/ai-sdk-provider`; handles streaming, retries, structured output (JSON mode) which is critical for expense classification |
| sonner | ^1.x | Toast notifications | shadcn/ui's recommended toast library; replaces the older shadcn Toast component |
| date-fns | ^3.x | Date utilities | Lightweight; used for VND financial month/year formatting, date range filtering, and chart axis labels |
| Node.js crypto (built-in) | native | AES-256-GCM encryption | Built into Node.js; use `crypto.createCipheriv` with AES-256-GCM for API key encryption; no external dependency needed |
| lucide-react | ^0.4xx | Icon library | Default icon set for shadcn/ui; already installed via shadcn init |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| TypeScript | ^5.x | Type safety | Required for meaningful shadcn/ui, Zod, and grammy integration; catches shape mismatches between AI output and DB schema at compile time |
| ESLint + next/eslint config | Linting | `eslint-config-next` ships with Next.js; use it verbatim |
| Prettier | Code formatting | Pair with `prettier-plugin-tailwindcss` to auto-sort class names |
| `prettier-plugin-tailwindcss` | Tailwind class sorting | Prevents class order bugs in Tailwind v4 |

---

## Installation

```bash
# Bootstrap (Next.js 16 with App Router, TypeScript, Tailwind v4)
npx create-next-app@latest finance --typescript --tailwind --app

# shadcn/ui init (CLI v4 — auto-detects framework)
npx shadcn@latest init

# Core auth
npm install next-auth@beta

# Database
npm install mongoose

# AI stack
npm install ai @openrouter/ai-sdk-provider

# Telegram bot
npm install grammy

# Validation and forms
npm install zod react-hook-form @hookform/resolvers

# UI utilities
npm install sonner date-fns lucide-react

# Dev dependencies
npm install -D prettier prettier-plugin-tailwindcss @types/node
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Mongoose | Prisma | Prisma's MongoDB support still has known limitations (no transactions in some cases, limited aggregation pipeline support); Mongoose gives full MongoDB feature access — correct call for this project |
| Mongoose | Native MongoDB driver (`mongodb`) | Only when you want zero schema enforcement and full manual control; Mongoose's schema validation prevents bad expense records from entering the DB |
| Recharts | Chart.js | Chart.js is canvas-based and better for extremely simple charts on non-React stacks; for a React dashboard with interactive tooltips and date filters, Recharts is the correct choice |
| Recharts | Nivo | Nivo is more opinionated and heavier; Recharts has a smaller bundle and simpler API for the pie + line chart use case here |
| grammy | Telegraf | Both are viable; grammy is explicitly designed for Vercel/Cloudflare Workers webhook deployments whereas Telegraf targets AWS Lambda/Firebase; grammy is the better fit for a Next.js API route webhook handler |
| next-auth v5 beta | next-auth v4 | v4 is not receiving new features; v4 does not support App Router natively; avoid v4 for any new Next.js 14+ project |
| @openrouter/ai-sdk-provider + ai | Raw fetch to OpenRouter | The Vercel AI SDK handles retry logic, structured output (JSON mode), streaming, and type safety; raw fetch works but adds significant error-handling boilerplate |
| Node.js built-in crypto | CryptoJS or bcrypt | CryptoJS is unmaintained (last release 2021); the built-in `crypto` module implements AES-256-GCM correctly and needs no npm dependency |
| next-auth v5 | Lucia Auth | Lucia v3 is in maintenance mode as of 2024; Auth.js (next-auth v5) is the ecosystem standard for Next.js |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| next-auth v4 | Doesn't support App Router natively; unmaintained for new features; `getServerSession` pattern is deprecated | `next-auth@beta` (v5) |
| CryptoJS | Unmaintained since 2021; known vulnerabilities in older versions | Node.js built-in `crypto` module |
| Chart.js with react-chartjs-2 | Canvas-based rendering adds complexity in React; requires imperative ref-based updates; worse DX than native React charting libs | Recharts |
| Mongoose v9 (right now) | v9 was released Nov 2025 and is still being stabilized; v8 is officially supported and has a documented Next.js integration guide | Mongoose v8.x |
| Telegraf | Fine library but grammY has better first-class serverless/Vercel support; grammY documentation is more current | grammy |
| SWR | For this app's data fetching, Next.js server components + server actions cover most cases; SWR adds complexity without benefit for a single-user app | Next.js built-in fetch caching + server actions |
| node-telegram-bot-api | Largely unmaintained compared to grammy and telegraf; poor TypeScript types | grammy |
| `pages/` directory | Legacy routing; new Next.js features (server actions, React server components, `use cache`) are App Router only | `app/` directory |

---

## Stack Patterns by Variant

**For AI expense classification (the core feature):**
- Use `@openrouter/ai-sdk-provider` + Vercel AI SDK `generateObject()` with a Zod schema
- This gives structured JSON output with type safety — AI returns `{ amount, category, description }` validated against your Zod schema automatically
- Cache results using a MongoDB collection keyed on normalized input text hash

**For the Telegram webhook:**
- Use grammy's `webhookCallback()` adapter inside a Next.js `app/api/telegram/route.ts` POST handler
- Store the bot token in the user's MongoDB document (encrypted); decrypt it per-request when initializing the bot
- Set webhook URL via Telegram's `setWebhook` API on user save

**For the MongoDB connection in Next.js:**
- Use the `global.mongoose` caching pattern (documented in Mongoose's official Next.js guide)
- Store connection promise on `global` to survive hot-reload in development and be reused across serverless invocations
- Do NOT use `mongoose.disconnect()` in route handlers

**For AES-256 encryption of API keys:**
- Use Node.js `crypto.createCipheriv('aes-256-gcm', key, iv)`
- Store: `iv + authTag + ciphertext` as a single hex string in MongoDB
- Key source: `ENCRYPTION_SECRET` env var (32-byte base64-encoded value)
- Decrypt only in server-side code (server actions or API routes) — never expose to client

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| next@16.x | react@19.x | Ships together; do not mix Next.js 16 with React 18 |
| next-auth@beta (v5) | next@14+, react@18/19 | Minimum Next.js 14; works with both React 18 and 19 |
| mongoose@8.x | mongodb@6.x driver | Mongoose 8 bundles the MongoDB Node.js driver 6.x |
| recharts@3.x | react@18+, react@19 | v3 requires React 18+; fully compatible with React 19 |
| tailwindcss@4.x | next@15+, postcss@8+ | Requires `@tailwindcss/postcss` plugin; no `tailwind.config.js` needed |
| shadcn/ui (CLI v4) | tailwindcss@4.x, next@15+ | shadcn init auto-detects Tailwind v4 and skips creating `tailwind.config.js` |
| grammy@1.x | node@18+, next@any | Works in Next.js API routes; no special adapter needed beyond `webhookCallback` |
| ai@4.x | next@14+, react@18/19 | Vercel AI SDK v4 is stable; `generateObject()` is the key method for JSON extraction |

---

## Sources

- [Next.js releases — GitHub](https://github.com/vercel/next.js/releases) — confirmed v16.2.1 current
- [Next.js upgrade guide v16](https://nextjs.org/docs/app/guides/upgrading/version-16) — confirmed App Router only for new features
- [Tailwind CSS v4 release](https://tailwindcss.com/blog/tailwindcss-v4) — confirmed Jan 2025 release, CSS-first config
- [Tailwind + Next.js install guide](https://tailwindcss.com/docs/guides/nextjs) — installation steps verified
- [shadcn/ui changelog March 2026](https://ui.shadcn.com/docs/changelog/2026-03-cli-v4) — CLI v4 confirmed
- [shadcn/ui React 19 + Next.js 15 compat](https://ui.shadcn.com/docs/react-19) — compatibility confirmed
- [next-auth npm](https://www.npmjs.com/package/next-auth) — v4.24.13 stable; v5 via `@beta` tag
- [Auth.js v5 migration guide](https://authjs.dev/getting-started/migrating-to-v5) — App Router patterns confirmed
- [Mongoose Next.js guide](https://mongoosejs.com/docs/nextjs.html) — connection caching pattern (v8 docs)
- [Recharts npm](https://www.npmjs.com/package/recharts) — v3.8.0 current
- [Recharts 3.0 migration guide](https://github.com/recharts/recharts/wiki/3.0-migration-guide) — state management rewrite confirmed
- [OpenRouter quickstart](https://openrouter.ai/docs/quickstart) — integration patterns
- [@openrouter/ai-sdk-provider npm](https://www.npmjs.com/package/@openrouter/ai-sdk-provider) — official provider package
- [grammY documentation](https://grammy.dev/) — serverless/Vercel deployment confirmed
- [grammY vs Telegraf comparison](https://grammy.dev/resources/comparison) — feature comparison
- [react-hook-form npm](https://www.npmjs.com/package/react-hook-form) — v7.71.2 current
- WebSearch (multiple results) — Recharts vs Chart.js performance comparison, MEDIUM confidence for benchmark numbers

---
*Stack research for: personal finance web app (Next.js + MongoDB + AI + Telegram)*
*Researched: 2026-03-22*
