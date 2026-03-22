---
phase: "05-telegram-bot"
plan: "05-01"
subsystem: "telegram"
tags: ["telegram", "webhook", "settings", "user-model"]
dependency_graph:
  requires: []
  provides: ["telegram-webhook-registration", "telegram-api-helpers"]
  affects: ["settings-ui", "user-model"]
tech_stack:
  added: ["src/lib/telegram.ts"]
  patterns: ["fetch-based Telegram Bot API wrapper", "per-user webhook secret (sparse unique index)"]
key_files:
  created:
    - src/lib/telegram.ts
    - src/app/api/telegram/register/route.ts
  modified:
    - src/models/user.model.ts
    - src/components/settings/telegram-bot-card.tsx
    - src/app/api/settings/route.ts
    - .env.example
decisions:
  - "telegramWebhookSecret stored as plain text (not encrypted) — required for lookupability in webhook handler"
  - "Webhook secret regenerated on every Save & Connect call to rotate security token"
  - "Token saved (yellow) status added as intermediate state when token exists but webhook registration failed"
metrics:
  duration: "1min"
  completed_date: "2026-03-22"
  tasks_completed: 3
  files_changed: 6
---

# Phase 05 Plan 01: Webhook Registration and Settings Integration Summary

**One-liner:** Telegram Bot Token saves to DB and auto-registers a per-user-secret webhook at `{APP_URL}/api/telegram/webhook` via the Telegram Bot API.

## What Was Built

Three tasks completed in sequence:

1. **User model extension + Telegram API helper library** — Added `telegramWebhookSecret` (sparse unique string) to the IUser interface and UserSchema. Created `src/lib/telegram.ts` exporting `setWebhook`, `sendMessage`, `deleteWebhook`, and `generateWebhookSecret`. Updated `.env.example` with `APP_URL`.

2. **POST /api/telegram/register endpoint** — Authenticated route that decrypts the user's stored bot token, generates a 32-byte hex webhook secret, calls the Telegram `setWebhook` API with the secret, and persists the secret to the user document on success. Returns 502 on Telegram API rejection.

3. **TelegramBotCard UI update** — Chains `POST /api/telegram/register` after a successful `PUT /api/settings` token save. Button relabeled "Save & Connect". Status display now has three states: Connected (green, both token and webhook registered), Token saved (yellow, token exists but no webhook), Not configured (gray). `GET /api/settings` extended with `hasTelegramWebhook` field.

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| `telegramWebhookSecret` not encrypted | Needs to be queryable as a lookup key when the webhook handler receives an incoming message — encryption would require decrypting every candidate |
| Secret regenerated on each registration | Rotating the secret on each save invalidates any stale webhook registrations, improving security |
| Token saved (yellow) state | Gives the user visibility when token save succeeded but webhook registration failed, so they know to retry |

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- FOUND: src/lib/telegram.ts
- FOUND: src/app/api/telegram/register/route.ts
- FOUND commit 57abb83 (Task 1)
- FOUND commit 27c1a67 (Task 2)
- FOUND commit 58e71c8 (Task 3)
