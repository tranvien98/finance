# Finance App

## What This Is

A personal finance management web app for tracking expenses and investments in VND. Features AI-powered expense classification via OpenRouter LLM and a Telegram bot for on-the-go expense logging. Built with Next.js, MongoDB, and a modern fintech-style UI.

## Core Value

Quick, frictionless expense tracking — send a Telegram message like "ate pho 50k" and it automatically creates a categorized expense entry.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User can sign up, log in, log out with JWT sessions (NextAuth)
- [ ] User can CRUD expenses with amount, category, note, date
- [ ] User can create and manage custom expense categories
- [ ] User can CRUD investments (mutual funds, crypto, gold) with asset type, amount, buy price, quantity, date
- [ ] Dashboard shows monthly overview: total expenses, total investments
- [ ] Dashboard shows pie chart by expense category and line chart over time
- [ ] Dashboard shows month-over-month comparison with % change
- [ ] Dashboard highlights simple insights
- [ ] User can filter by month, year, or custom date range
- [ ] AI classifies expenses from free-text input (extract amount, category, description)
- [ ] Rule-based fallback when AI classification fails
- [ ] AI results are cached to reduce API costs
- [ ] User can input Telegram Bot Token to receive messages
- [ ] Telegram webhook receives messages, parses them, and auto-creates expenses via AI
- [ ] User can store OpenRouter API key (encrypted with AES-256)
- [ ] Encrypt/decrypt helper functions for API key storage
- [ ] Dark mode, responsive design, loading skeletons, toast notifications
- [ ] Debounce AI calls, retry on API failure, error logging
- [ ] Seed data for development/demo

### Out of Scope

- Multi-currency support — VND only, single user
- Mobile native app — web-first, responsive covers mobile use
- Real-time investment price tracking — manual entry only for v1
- OAuth providers (Google, GitHub) — email/password sufficient for personal use
- Export to CSV/PDF — not needed for v1

## Context

- Single-user app (the developer is the sole user)
- Vietnamese context: VND currency, Vietnamese-language Telegram messages for expense input
- AI classification via OpenRouter API (external LLM service)
- Telegram bot as the primary quick-entry interface
- Security emphasis: API keys encrypted at rest with AES-256, decrypted only when calling external services

## Constraints

- **Tech stack**: Next.js + TailwindCSS + shadcn/ui + Mongoose + MongoDB — chosen by user
- **Auth**: NextAuth with JWT sessions
- **Charts**: Recharts or Chart.js
- **AI provider**: OpenRouter API (not direct OpenAI)
- **Security**: AES-256 encryption for stored API keys, encryption key from `ENCRYPTION_SECRET` env var
- **Structure**: /app, /components, /lib, /services, /hooks directory layout

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Mongoose over Prisma | Full MongoDB feature support, no Prisma-MongoDB limitations | — Pending |
| Single-user design | Personal finance tool, simplifies auth and data model | — Pending |
| OpenRouter over direct OpenAI | User preference for LLM routing flexibility | — Pending |
| VND only | Personal use in Vietnam, no multi-currency complexity | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-22 after initialization*
