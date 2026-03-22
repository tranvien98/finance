# Pitfalls Research

**Domain:** Personal finance management web app with AI expense classification and Telegram bot integration
**Researched:** 2026-03-22
**Confidence:** HIGH (most pitfalls verified through multiple official/community sources)

---

## Critical Pitfalls

### Pitfall 1: Storing Monetary Amounts as Floating-Point Numbers

**What goes wrong:**
JavaScript's IEEE-754 floating-point cannot exactly represent many decimal values. `0.1 + 0.2 === 0.30000000000000004`. At the scale of thousands of transactions with aggregations (monthly totals, category sums), accumulated rounding errors silently corrupt financial calculations. The errors are small and may not be noticed until totals stop matching.

**Why it happens:**
Developers model amounts as `Number` in Mongoose schemas and never consider that MongoDB stores them as IEEE-754 doubles. The bug only surfaces at aggregation time, making it hard to trace back.

**How to avoid:**
Store all VND amounts as integers (smallest unit — dong, since VND has no subunit). Define the Mongoose schema field as `amount: { type: Number, integer: true }` and enforce integer-only values at the API boundary. Display layer converts to formatted string. Never perform arithmetic on the raw `Number` type from MongoDB — validate integer assumption in the service layer.

**Warning signs:**
- Monthly totals differ by ±1 VND from the sum of individual transactions
- Dashboard pie-chart percentages don't add to exactly 100
- Aggregation pipeline results don't match in-memory sums

**Phase to address:**
Data model phase (foundation) — this must be correct from day one. Retrofitting integer storage after data exists is a migration nightmare.

---

### Pitfall 2: Telegram Webhook Without Request Origin Validation

**What goes wrong:**
Any HTTP client that discovers the webhook URL can POST arbitrary payloads to the `/api/telegram/webhook` endpoint. Without validating the `X-Telegram-Bot-Api-Secret-Token` header, an attacker can forge expense entries, flood the database, or cause the AI classifier to incur unbounded API costs. A real-world CVE (GHSA-jq3f-vjww-8rq7) demonstrated body-parsing before secret validation enabling unauthenticated resource exhaustion.

**Why it happens:**
Developers scaffold the webhook route to receive messages quickly and treat it as "internal." The URL is not secret once deployed — Telegram's API confirms it publicly if queried with the bot token.

**How to avoid:**
1. Register a `secret_token` parameter when calling `setWebhook` via Telegram Bot API.
2. On every incoming request, validate the `X-Telegram-Bot-Api-Secret-Token` header **before** reading or parsing the body.
3. Return HTTP 401 immediately on mismatch — do not proceed to JSON parse or database calls.
4. Validate that `message.from.id` matches the expected single-user ID.

**Warning signs:**
- Webhook endpoint has no header-check middleware
- `setWebhook` call does not include `secret_token` parameter
- No user-ID allow-list check in the handler

**Phase to address:**
Telegram bot integration phase — before the webhook is deployed to any public URL.

---

### Pitfall 3: AES Encryption Key Stored as a Raw Password (No KDF)

**What goes wrong:**
Passing `ENCRYPTION_SECRET` directly as the AES key via `Buffer.from(secret, 'utf8').slice(0, 32)` is insecure. Short or guessable secrets become weak keys. IV reuse (using the same IV every time) completely breaks AES-GCM security and renders ciphertext reversible. Using AES-256-CBC instead of AES-256-GCM removes authentication, enabling padding oracle attacks.

**Why it happens:**
Sample code on Stack Overflow and DEV.to commonly shows raw password → key patterns. Developers copy them without recognizing the cryptographic flaws.

**How to avoid:**
- Use AES-256-GCM (not CBC) — it provides authenticated encryption.
- Derive the key via `crypto.scryptSync(secret, salt, 32)` — never use the raw password as the key.
- Generate a fresh random IV with `crypto.randomBytes(12)` for every encryption call and store it alongside the ciphertext.
- Store the auth tag from GCM and verify it on decryption.
- Load `ENCRYPTION_SECRET` from environment only — never from the codebase.

**Warning signs:**
- `createCipheriv('aes-256-cbc', ...)` in the encryption helper
- IV is a hardcoded string or reused across calls
- No auth tag checked during decryption
- `Buffer.from(process.env.ENCRYPTION_SECRET).slice(0, 32)` without scrypt/pbkdf2

**Phase to address:**
Authentication/security phase — implement the encryption helper correctly before any API key is saved by the user.

---

### Pitfall 4: MongoDB Connection Pool Exhaustion in Next.js Serverless

**What goes wrong:**
Next.js API routes are serverless functions (or edge-compatible modules). Without connection caching, each cold start opens a new MongoDB connection. Under any non-trivial load — even just multiple rapid tab reloads — you hit MongoDB Atlas's connection limit (500 for free tier). Connections held open without `maxPoolSize: 1` can rapidly exhaust the shared cluster.

**Why it happens:**
Developers write `mongoose.connect(URI)` directly inside the route handler or inside a lib that is imported without a singleton guard. Hot module reloading in development compounds the issue by creating multiple connections during development, masking the production behavior.

**How to avoid:**
- Create a `lib/mongoose.ts` singleton: cache the connection promise in `global._mongoose` across module reloads.
- Set `maxPoolSize: 1` in the connection options for serverless deployments.
- Check `mongoose.connection.readyState` before reconnecting.
- Use Mongoose's recommended Next.js pattern from their official docs.

**Warning signs:**
- `mongoose.connect()` called inside route handler or without singleton guard
- MongoDB Atlas dashboard shows connection count climbing with each request
- `MongoServerSelectionError: connection pool exhausted` appears in logs

**Phase to address:**
Foundation/setup phase — establish the singleton pattern before writing any route that queries the database.

---

### Pitfall 5: AI Classification Without Structured Output Enforcement

**What goes wrong:**
Sending a free-text expense like "ăn phở 50k" to an LLM and asking it to return JSON can produce: markdown-wrapped JSON (\`\`\`json...\`\`\`), extra commentary before/after the JSON, partially valid JSON when the model cuts off, hallucinated category names not in the allowed set, or inverted amount sign. Without schema enforcement, `JSON.parse()` fails and the expense is silently dropped — or worse, saved with corrupt data.

**Why it happens:**
Developers trust the LLM to "follow instructions" in the system prompt. This works 94% of the time but fails the other 6% in ways that are hard to reproduce because failures depend on the specific input.

**How to avoid:**
- Use OpenRouter with a model that supports native JSON mode or structured output (function calling).
- Define a strict JSON schema: `{ amount: number, category: string, description: string, date: string }`.
- Enforce the category field against the user's actual category list in the prompt — "category MUST be one of: [list]".
- Wrap the LLM call in a try/catch with JSON.parse validation; on parse failure, fall back to rule-based parsing.
- Strip markdown code fences before parsing as a defensive measure.
- Log all raw LLM responses in development to build intuition for failure modes.

**Warning signs:**
- LLM response is parsed with plain `JSON.parse()` and no validation
- Category field is a free string, not validated against the known category list
- No fallback when the parse fails
- No logging of raw LLM output

**Phase to address:**
AI integration phase — structured output schema and fallback must be implemented before the feature ships.

---

### Pitfall 6: Serverless Function Timeout on AI + Telegram Path

**What goes wrong:**
The Telegram webhook handler calls the OpenRouter AI API and waits for the response before returning HTTP 200 to Telegram. If the AI call takes longer than the function timeout (10s on Vercel Hobby), the function times out. Telegram interprets the missing 200 response as a failure and **retries the same message** — potentially triggering duplicate expense creation and duplicate AI API calls.

**Why it happens:**
The natural implementation is synchronous: receive webhook → call AI → save expense → return 200. This works locally but breaks under LLM latency spikes (GPU cold starts, rate limits, network jitter).

**How to avoid:**
- Respond HTTP 200 to Telegram immediately upon receipt of the webhook payload.
- Process the AI classification asynchronously after the response (using Next.js `after()`, a background queue, or a fire-and-forget pattern with proper error capture).
- Implement idempotency: hash the Telegram `message_id` and check for duplicate processing before inserting.
- Set `export const maxDuration = 60` in the route for paid Vercel plans if synchronous processing is preferred.

**Warning signs:**
- Telegram webhook route returns 200 only after awaiting the AI API call
- No idempotency check on `message_id`
- Duplicate expense entries appear during testing when the AI is slow

**Phase to address:**
Telegram bot integration phase — design the async response pattern from the start.

---

### Pitfall 7: NextAuth Credentials Provider + JWT Session Secret Missing in Production

**What goes wrong:**
With NextAuth's Credentials provider (email/password) and JWT session strategy, the session is entirely client-side in a signed cookie. If `NEXTAUTH_SECRET` is missing or weak in production, anyone can forge session tokens. A secondary issue: JWT tokens cannot be invalidated server-side — if the user's password is changed, old tokens remain valid until expiry.

**Why it happens:**
Local dev works without `NEXTAUTH_SECRET` (NextAuth generates one). Developers deploy without setting it and encounter either broken sessions or a silently insecure deployment.

**How to avoid:**
- Always set `NEXTAUTH_SECRET` as a 32-byte random value (`openssl rand -base64 32`) in environment variables.
- Set a short `maxAge` (e.g., 7 days) to limit the window for stale tokens.
- Do not use the Database session strategy with Credentials provider — it is unsupported and causes silent failures.
- Add a `secret` property to the NextAuth config and throw at startup if it is missing in production.

**Warning signs:**
- `NEXTAUTH_SECRET` not set in `.env.production` or deployment platform
- Session maxAge is not configured (defaults to 30 days — too long for a finance app)
- `strategy: "database"` used with `CredentialsProvider`

**Phase to address:**
Authentication phase — before any protected route is tested.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Storing amounts as `Number` (float) | Simple schema, no conversion logic | Silent rounding errors in aggregations — requires data migration | Never |
| Hardcoding LLM model name (`openai/gpt-4o-mini`) | Works immediately | Model deprecations break the app silently; OpenRouter model names change | MVP only — abstract to a config constant from day one |
| No LLM response caching | Simpler implementation | Every identical phrase re-classifies, burning API credits fast | Never for identical inputs — cache key = normalized input string |
| Skipping webhook secret validation for speed | Faster local dev | Public endpoint can be abused to create fraudulent expenses | Never in production |
| Raw `mongoose.connect()` in route handler | Fewer abstraction layers | Connection pool exhaustion under any non-trivial load | Never |
| Synchronous AI call in Telegram webhook | Simpler control flow | Telegram retries on timeout → duplicate expenses | Never — always return 200 first |
| `aes-256-cbc` mode for API key encryption | More example code available | Susceptible to padding oracle attacks; no integrity check | Never — use GCM |

---

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| OpenRouter API | Sending the full user message history as context | For single-message expense classification, keep context to system prompt + single user message — no history needed; reduces cost and latency |
| OpenRouter API | Not setting `response_format: { type: "json_object" }` | Always enable JSON mode when the model supports it; prevents markdown wrapping |
| OpenRouter API | Using a single global API key for all calls | Store the user's own key (encrypted); use it per-request so costs are isolated |
| Telegram Bot API | Calling `setWebhook` without `secret_token` | Always pass `secret_token` and validate on every incoming request |
| Telegram Bot API | Not handling `callback_query`, `edited_message`, non-text updates | Bot receives many update types; handler must guard with `message?.text` check to avoid crashes |
| Telegram Bot API | Setting webhook to `localhost` URL | Use ngrok or similar for local dev; production URL must be HTTPS |
| MongoDB Atlas | Not setting `maxPoolSize: 1` in serverless | Each function invocation opens a new connection; exhausts the 500-connection limit on free tier |
| NextAuth | Using `strategy: "database"` with Credentials provider | Unsupported combination — silently fails to persist sessions; use `strategy: "jwt"` |

---

## Performance Traps

Patterns that work at small scale but degrade over time.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| No MongoDB indexes on `date` and `userId` fields | Dashboard queries become slow as expense count grows | Add compound index on `{ userId, date }` at schema definition time | ~1,000+ expense documents |
| Fetching all expenses for aggregation in JavaScript | Memory spikes, slow dashboard loads | Use MongoDB aggregation pipeline for grouping/summing — do math in the DB | ~500+ documents |
| No AI result caching | High OpenRouter API spend, slow repeated classifications | Cache by normalized input key in MongoDB (TTL-indexed collection) or in-memory LRU | Day 2 of heavy Telegram usage |
| Rendering all expense rows without pagination | Long DOM, slow browser paint | Add server-side pagination from the start; `limit`/`skip` in Mongoose queries | ~200+ expenses rendered at once |
| Re-computing dashboard aggregations on every page load | Slow dashboard, repeated DB load | Cache dashboard summary in a `summaries` collection; invalidate on expense write | Noticeable at ~100 expenses with complex charts |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Decrypting user's OpenRouter API key and logging it anywhere | API key leaked to log aggregators, monitoring services | Never log decrypted keys; log only masked form (`sk-...****`) |
| Storing `ENCRYPTION_SECRET` in `.env` committed to git | Compromises all stored API keys if repo is public | Add `.env*` to `.gitignore`; use environment variable injection at deploy time |
| No rate limit on `/api/telegram/webhook` | DoS via webhook floods triggers unbounded AI API calls at user's expense | Validate `X-Telegram-Bot-Api-Secret-Token` first (free reject), then validate sender ID |
| Allowing arbitrary model names from client input | Model injection — attacker could route to expensive or malicious models | Hardcode or whitelist allowed OpenRouter model identifiers server-side |
| JWT session with no expiry configured | A stolen cookie is valid indefinitely | Set `maxAge: 60 * 60 * 24 * 7` (7 days) in NextAuth session config |
| Telegram bot token in environment variable exposed via `/api` route | Full bot control takeover | Never return the bot token in any API response; treat like a private key |

---

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Too many expense categories (20+) | AI classification becomes ambiguous (is "pho" Food or Dining Out?); user gets confused correcting mistakes | Start with 8-10 mutually exclusive categories; add more only when a clear need emerges |
| No confirmation after Telegram expense entry | User doesn't know if the message was processed successfully | Always send a Telegram reply: "Saved: Food 50,000 VND - Pho" with a brief summary |
| AI classification shown as final without edit option | Wrong classifications are silently accepted | Show extracted data in the web UI with inline edit before final save; or send editable confirmation in Telegram |
| Dashboard loads all-time data by default | Overwhelming when data accumulates; slow queries | Default to current month view; persist the user's last filter selection |
| VND formatting without thousand separators | "50000000" is hard to read | Always format VND as "50.000.000 ₫" or "50,000,000 ₫" consistently across all views |
| Loading states missing on AI calls (2-5s latency) | UI appears frozen; user submits twice | Always show a loading skeleton or spinner immediately on AI classification submission |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Telegram bot:** Bot responds to messages — verify it also handles non-text messages (photos, stickers, voice) without crashing
- [ ] **AI expense classification:** Classification works for "pho 50k" — verify it handles edge cases: no amount, ambiguous category, amount in millions ("1tr"), Vietnamese shorthand ("ck" for chuyển khoản)
- [ ] **AES encryption:** Encrypt/decrypt round-trip works in tests — verify it uses GCM mode with a fresh random IV per call, not a hardcoded IV
- [ ] **Authentication:** Login/logout works — verify that protected API routes return 401 when called without a valid session (not just the UI redirecting)
- [ ] **Dashboard charts:** Charts render — verify they handle months with zero data (empty state, not a crash)
- [ ] **Expense CRUD:** Create/read works — verify that delete hard-deletes and does not leave orphaned references in any aggregation
- [ ] **Caching:** AI results are cached — verify cache keys are normalized (trim, lowercase, collapse whitespace) so "pho 50k" and "Phở  50K" hit the same cache entry
- [ ] **Webhook idempotency:** Expense is created on first Telegram message — verify sending the same message_id twice does not create a duplicate expense
- [ ] **MongoDB connection:** Works in dev — verify the singleton pattern is used and `maxPoolSize: 1` is set for the serverless deployment target

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Float amounts already stored in DB | HIGH | Write a migration script: fetch all expenses, re-save `amount = Math.round(amount)` as integer, validate totals match before and after |
| Telegram token leaked via git commit | HIGH | Immediately revoke via BotFather (`/revoke`), generate new token, update environment variables, audit recent bot activity |
| OpenRouter API key leaked from DB (encryption broken) | HIGH | Revoke the key in OpenRouter dashboard, re-encrypt with corrected implementation, notify user to rotate key |
| Duplicate expenses from Telegram retries | MEDIUM | Add `telegramMessageId` unique index on Expense collection; run dedup script to remove duplicates keeping oldest |
| MongoDB connection pool exhausted | MEDIUM | Restart the serverless deployment to drain connections; add singleton guard immediately; reduce `maxPoolSize` to 1 |
| AI classification silently failing (parse errors) | LOW | Check server logs for raw LLM output; add JSON parse fallback; add monitoring on classification error rate |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Float amount storage | Data model / foundation phase | Check Mongoose schema: `amount` field has an integer validator; aggregation test returns exact integers |
| Telegram webhook without validation | Telegram integration phase | Integration test: send request without secret token → assert 401; send with wrong token → assert 401 |
| AES encryption mode (GCM, fresh IV) | Auth/security phase | Unit test: encrypt same value twice → assert different ciphertexts (fresh IV); decrypt → assert plaintext matches |
| MongoDB connection pool exhaustion | Foundation/setup phase | Code review: singleton guard exists in `lib/mongoose.ts`; `maxPoolSize: 1` in connection options |
| AI output without structured schema | AI integration phase | Unit test: parse LLM response for 10 edge-case inputs; assert all parse without throwing |
| Serverless timeout on AI+Telegram path | Telegram integration phase | Load test: simulate slow AI (mock with 8s delay) → assert 200 returned immediately; assert expense eventually created |
| NextAuth secret missing in production | Auth phase | Deployment checklist: `NEXTAUTH_SECRET` set in prod env; startup assertion throws if absent |
| Too many categories causing ambiguity | Categories/data-model phase | Review: categories list has no overlapping semantics; AI prompt includes explicit category list |
| No Telegram reply confirmation | Telegram integration phase | Manual test: send expense message → assert bot sends confirmation with amount and category |
| VND float display formatting | UI phase | Visual review: all monetary values shown with thousand separators and ₫ symbol |

---

## Sources

- OpenClaw Telegram webhook validation vulnerability: https://github.com/openclaw/openclaw/security/advisories/GHSA-jq3f-vjww-8rq7
- Telegram bot token exposure case study: https://medium.com/@cameronbardin/hardcoded-secrets-strike-again-how-a-telegram-bot-token-exposed-customer-support-and-pii-cb412551239b
- AES-256-GCM best practices Node.js 2026: https://copyprogramming.com/howto/javascript-node-js-aes-crytpto-key
- Floats and monetary values: https://www.moderntreasury.com/journal/floats-dont-work-for-storing-cents
- JavaScript rounding errors in financial apps: https://www.robinwieruch.de/javascript-rounding-errors/
- Mongoose Next.js connection singleton: https://mongoosejs.com/docs/nextjs.html
- MongoDB serverless connection pool exhaustion: https://www.mongodb.com/community/forums/t/next-js-serverless-high-connection-count-to-mongodb-despite-following-best-practices/156122
- LLM structured output reliability 2025: https://www.cognitivetoday.com/2025/10/structured-output-ai-reliability/
- LLM failure modes field guide: https://medium.com/@adnanmasood/a-field-guide-to-llm-failure-modes-5ffaeeb08e80
- Next.js serverless timeout and AI calls: https://www.inngest.com/blog/how-to-solve-nextjs-timeouts
- NextAuth JWT session security: https://next-auth.js.org/v3/faq
- NextAuth session persistence issues: https://clerk.com/articles/nextjs-session-management-solving-nextauth-persistence-issues
- Building Telegram bot on Next.js lessons learned: https://dev.to/rikurouvila/what-i-learned-from-building-a-telegram-bot-on-next-js-2llh
- Personal finance app category taxonomy: https://www.expensesorted.com/blog/ai-expense-categorization-personal-finance-apps
- OpenRouter rate limiting: https://openrouter.ai/docs/api/reference/limits
- Finance app mistakes and churn: https://www.netguru.com/blog/mistakes-in-creating-finance-app

---
*Pitfalls research for: Personal finance app with AI expense classification (OpenRouter) and Telegram bot (Next.js + Mongoose + MongoDB)*
*Researched: 2026-03-22*
