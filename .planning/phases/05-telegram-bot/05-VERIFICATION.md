---
phase: 05-telegram-bot
verified: 2026-03-23T14:30:00Z
status: human_needed
score: 9/9 must-haves verified
re_verification:
  previous_status: gaps_found
  previous_score: 7/9
  gaps_closed:
    - "Sending a text message to the Telegram bot creates a new expense in the database (AI path now works — ai-classify.ts stub replaced with real bridge to parseExpenseAI + parseExpenseFallback)"
    - "The bot replies with a confirmation message showing parsed amount, category, and description (fallback path now uses parseExpenseFallback — handles k, tr, trieu, ngan, bare numbers)"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "End-to-end Telegram message flow"
    expected: "Sending 'ca phe 25k' to the bot creates an expense and bot replies with 'Expense recorded: 25,000 VND - Food (or Other if no AI) — ca phe'"
    why_human: "Requires a real Telegram bot token, configured webhook URL accessible from the internet, and APP_URL pointing to a live deployment"
  - test: "Settings page webhook registration"
    expected: "After entering a valid bot token and clicking 'Save & Connect', status changes to 'Connected' (green)"
    why_human: "Requires a real Telegram bot token and APP_URL reachable by Telegram servers"
---

# Phase 05: Telegram Bot Verification Report

**Phase Goal:** Sending a message to the Telegram bot creates a categorized expense entry in the app — the core value proposition of the product is delivered end-to-end
**Verified:** 2026-03-23T14:30:00Z
**Status:** human_needed (all automated checks passed)
**Re-verification:** Yes — after gap closure (Plan 05-03, commits 2c2a99c and 0fdfd1f)

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can enter Telegram Bot Token in settings and click save | VERIFIED | TelegramBotCard renders Input + "Save & Connect" button; handleSave calls PUT /api/settings |
| 2 | Saving the token triggers automatic webhook registration with Telegram | VERIFIED | handleSave chains POST /api/telegram/register after successful PUT /api/settings |
| 3 | Webhook URL is registered as {APP_URL}/api/telegram/webhook | VERIFIED | register/route.ts: webhookUrl = `${appUrl}/api/telegram/webhook` |
| 4 | A unique secret token is generated per user and sent to Telegram as secret_token param | VERIFIED | generateWebhookSecret() called in register route; stored as telegramWebhookSecret on User (sparse unique index) |
| 5 | Settings UI shows success/error feedback after registration attempt | VERIFIED | message state rendered conditionally; three-state badge: Connected/Token saved/Not configured |
| 6 | Sending a text message to the Telegram bot creates a new expense in the database | VERIFIED | ai-classify.ts now calls parseExpenseAI (with retry) + parseExpenseFallback (fallback); never throws; webhook test "creates expense from valid Telegram message" passes |
| 7 | The webhook returns HTTP 200 before AI classification completes | VERIFIED | after() used correctly from next/server; Response.json({ ok: true }) at line 150 is reached before any after() callback runs |
| 8 | A message with a missing or wrong X-Telegram-Bot-Api-Secret-Token header returns 401 | VERIFIED | Lines 28-31: missing header → 401; User.findOne at lines 49-52: wrong secret → 401; tests 1 and 2 of 5 confirm this |
| 9 | Sending the same Telegram message twice does not create a duplicate expense | VERIFIED | Pre-response idempotency check (lines 55-63) + duplicate key 11000 catch inside after() (lines 127-138); test 4 of 5 confirms this |

**Score:** 9/9 truths verified

### Gap Closure Verification (Plan 05-03)

| Gap | Was | Now | Fix |
|-----|-----|-----|-----|
| ai-classify.ts stub | `throw new Error('classifyExpense is not implemented yet')` | Real bridge: `parseExpenseAI` with retry + `parseExpenseFallback` fallback; caches with `getCache`/`setCache`; never throws | Commits 2c2a99c |
| Webhook inline regex | `/(\d+)\s*k/i` only handled "Nk" pattern | `parseExpenseFallback(messageText)` handles k, tr, trieu, triệu, ngàn, ngan, bare numbers | Commit 0fdfd1f |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/telegram.ts` | Telegram API helpers (setWebhook, sendMessage) | VERIFIED | Exports setWebhook, sendMessage, deleteWebhook, generateWebhookSecret — all substantive |
| `src/app/api/telegram/register/route.ts` | POST endpoint that registers webhook with Telegram | VERIFIED | Authenticated, decrypts token, calls setWebhook, stores secret on user |
| `src/models/user.model.ts` | User model with telegramWebhookSecret field | VERIFIED | Field present in IUser interface and UserSchema with sparse unique index |
| `src/app/api/telegram/webhook/route.ts` | POST handler for Telegram webhook callbacks | VERIFIED | Full implementation: header validation, idempotency, after() async processing, parseExpenseFallback for no-key path |
| `src/lib/ai-classify.ts` | classifyExpense function bridging Phase 4 parsers | VERIFIED | Imports parseExpenseAI + parseExpenseFallback + cache; retry + fallback; never throws; no more NotImplemented stub |
| `src/lib/ai-parser.ts` | parseExpenseAI calling OpenRouter | VERIFIED | Full implementation with SYSTEM_PROMPT, OpenRouter fetch, JSON parse |
| `src/lib/fallback-parser.ts` | parseExpenseFallback handling Vietnamese shorthands | VERIFIED | Handles k/tr/trieu/triệu/ngàn/ngan + bare numbers (<1000 assumed thousands) |
| `src/lib/cache.ts` | In-memory cache with TTL | VERIFIED | Map-based with 24h TTL; exports getCache/setCache |
| `tests/api/telegram-webhook.test.ts` | Integration tests for webhook | VERIFIED | 5 tests, all passing (confirmed by test run) |
| `src/components/settings/telegram-bot-card.tsx` | UI for bot token input with webhook registration | VERIFIED | Full implementation with three-state status badge |
| `src/app/api/settings/route.ts` | GET returns hasTelegramWebhook | VERIFIED | hasTelegramWebhook: !!user.telegramWebhookSecret |
| `.env.example` | APP_URL variable | VERIFIED | APP_URL=http://localhost:3000 |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| telegram-bot-card.tsx | /api/telegram/register | fetch POST after token save | WIRED | fetch('/api/telegram/register', { method: 'POST' }) chains after PUT /api/settings |
| register/route.ts | src/lib/telegram.ts | setWebhook call | WIRED | await setWebhook(botToken, webhookUrl, webhookSecret) |
| webhook/route.ts | src/models/user.model.ts | User.findOne({ telegramWebhookSecret }) | WIRED | Line 49: User.findOne({ telegramWebhookSecret: secretToken }).lean() |
| webhook/route.ts | src/models/expense.model.ts | Expense.create with telegramMessageId | WIRED | Line 119: Expense.create({...telegramMessageId: messageId}) |
| webhook/route.ts | src/lib/telegram.ts | sendMessage for confirmation reply | WIRED | Line 143: sendMessage(botToken, chatId, replyText) |
| webhook/route.ts | src/lib/ai-classify.ts | dynamic import inside after() with .catch() fallback | WIRED | Module now exports real classifyExpense — AI path operational for users with API key |
| webhook/route.ts | src/lib/fallback-parser.ts | static import, used in no-API-key else branch | WIRED | Line 8: import { parseExpenseFallback }; Line 104: parsed = parseExpenseFallback(messageText) |
| src/lib/ai-classify.ts | src/lib/ai-parser.ts | import parseExpenseAI | WIRED | Line 1: import { parseExpenseAI }; called at lines 28 and 32 |
| src/lib/ai-classify.ts | src/lib/fallback-parser.ts | import parseExpenseFallback as catch fallback | WIRED | Line 2: import { parseExpenseFallback }; called at line 35 on retry failure |
| src/lib/ai-classify.ts | src/lib/cache.ts | getCache/setCache for result caching | WIRED | Line 3: import { getCache, setCache }; used at lines 22 and 40 |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| TGBR-01 | 05-01 | User can input Telegram Bot Token in settings | SATISFIED | TelegramBotCard Input + PUT /api/settings saves encrypted token |
| TGBR-02 | 05-01 | App registers a webhook endpoint at /api/telegram/webhook | SATISFIED | POST /api/telegram/register calls Telegram setWebhook with {APP_URL}/api/telegram/webhook |
| TGBR-03 | 05-02, 05-03 | Webhook receives Telegram messages, parses via AI, auto-creates expenses | SATISFIED | Webhook receives and validates messages; AI path (classifyExpense) and fallback path (parseExpenseFallback) both work; 5 tests passing |
| TGBR-04 | 05-02 | Webhook validates Telegram secret token before processing | SATISFIED | Header validation at lines 28-31 and user lookup at lines 49-52 of webhook/route.ts |
| TGBR-05 | 05-02, 05-03 | Webhook returns 200 immediately and processes AI classification asynchronously | SATISFIED | after() pattern implemented correctly; 200 returned at line 150 before any async work |

All 5 TGBR requirements satisfied. No orphaned requirements found — REQUIREMENTS.md traceability table maps exactly TGBR-01 through TGBR-05 to Phase 5.

### Anti-Patterns Found

No blockers. Previous blocker (`ai-classify.ts` stub throw) is resolved.

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| src/lib/ai-classify.ts | — | No anti-patterns | — | Clean implementation |
| src/app/api/telegram/webhook/route.ts | — | No anti-patterns | — | parseExpenseFallback replaces former inline regex |

### Human Verification Required

#### 1. End-to-End Telegram Message Flow

**Test:** Configure a real Telegram bot token in settings, send "ca phe 25k" to the bot
**Expected:** Expense appears in the app with amount 25,000 VND; bot replies with confirmation showing formatted amount and category
**Why human:** Requires a publicly accessible deployment URL (APP_URL) and a real Telegram bot token with a working webhook registered via Telegram Bot API

#### 2. Settings Webhook Registration

**Test:** Enter a valid bot token, click "Save & Connect"
**Expected:** Status badge changes to "Connected" (green); no manual API calls needed
**Why human:** Requires a real Telegram bot token and APP_URL reachable by Telegram's servers

### Re-verification Summary

Both gaps from the initial verification are closed.

**Gap 1 closed:** `src/lib/ai-classify.ts` is no longer a stub. Commit `2c2a99c` replaced the entire file with a real bridge to `parseExpenseAI` (with one retry) and `parseExpenseFallback` as the catch fallback. The function never throws — critical because the webhook's outer catch silently swallows errors. Result caching uses the same normalization key as `/api/expenses/classify`.

**Gap 2 closed:** The inline `/(\d+)\s*k/i` regex in `webhook/route.ts` is gone. Commit `0fdfd1f` added a static import of `parseExpenseFallback` and replaced the else-branch body with a single call. The full Vietnamese shorthand set (k, tr, trieu, triệu, ngàn, ngan, bare numbers) is now handled for users without an OpenRouter API key.

**Test suite:** All 5 telegram-webhook integration tests pass after both changes.

**Remaining items needing human verification** are external-service tests (live Telegram API + public webhook URL) — these cannot be verified programmatically.

---

_Verified: 2026-03-23T14:30:00Z_
_Verifier: Claude (gsd-verifier)_
_Re-verification of: 2026-03-23T00:45:00Z gaps_found result_
