# Phase 1: Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-22
**Phase:** 01-foundation
**Areas discussed:** Auth UX flow, Settings page, Seed data shape, Project scaffold

---

## Auth UX Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Dashboard | Go straight to main dashboard with charts | |
| Expenses list | Land on expenses page — most used feature | ✓ |
| You decide | Claude picks | |

**User's choice:** Expenses list
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Centered card | Clean centered form on dark/gradient background — fintech style | ✓ |
| Split layout | Left branding/illustration, right form — like Stripe/Linear | |
| You decide | Claude picks | |

**User's choice:** Centered card

| Option | Description | Selected |
|--------|-------------|----------|
| Tabs on same page | Toggle between Sign Up and Login tabs on one card | ✓ |
| Separate pages | /login and /signup as distinct routes | |
| You decide | Claude picks | |

**User's choice:** Tabs on same page

| Option | Description | Selected |
|--------|-------------|----------|
| Inline errors | Red text below each field | ✓ |
| Toast only | Single toast notification for errors | |
| Both | Inline for field, toast for server errors | |

**User's choice:** Inline errors

---

## Settings Page

| Option | Description | Selected |
|--------|-------------|----------|
| Masked (sk-...xxxx) | Show last 4 chars, reveal button | ✓ |
| Fully hidden | Just show 'API key saved ✓' | |
| You decide | Claude picks | |

**User's choice:** Masked with reveal button

| Option | Description | Selected |
|--------|-------------|----------|
| API key + Telegram token | Both keys on one page | |
| Sectioned settings | Sections: API Keys, Telegram Bot, Account — expandable cards | ✓ |
| You decide | Claude picks | |

**User's choice:** Sectioned settings with expandable cards

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, validate | Test API call on save | ✓ |
| No, just store | Save as-is, errors surface later | |
| You decide | Claude picks | |

**User's choice:** Validate API key on save

---

## Seed Data Shape

| Option | Description | Selected |
|--------|-------------|----------|
| Realistic Vietnamese | Real VND amounts, Vietnamese names, 3 months | ✓ |
| Generic placeholder | Lorem-style, round numbers, English | |
| You decide | Claude picks | |

**User's choice:** Realistic Vietnamese

| Option | Description | Selected |
|--------|-------------|----------|
| Expenses + investments | Seed both | ✓ |
| Expenses only | Investments seeded in Phase 6 | |
| You decide | Claude picks | |

**User's choice:** Expenses + investments

---

## Project Scaffold

| Option | Description | Selected |
|--------|-------------|----------|
| App Router | Next.js 16 default — /app, RSC, layouts | ✓ |
| Pages Router | Classic /pages — simpler, no RSC | |

**User's choice:** App Router

| Option | Description | Selected |
|--------|-------------|----------|
| TypeScript | Type safety, better DX | ✓ |
| JavaScript | Less boilerplate | |

**User's choice:** TypeScript

| Option | Description | Selected |
|--------|-------------|----------|
| pnpm | Fast, disk-efficient | |
| npm | Default Node.js | ✓ |
| yarn | Classic alternative | |
| You decide | Claude picks | |

**User's choice:** npm

| Option | Description | Selected |
|--------|-------------|----------|
| src/ root | /src/app, /src/components, /src/lib, /src/services, /src/hooks | ✓ |
| Flat root | /app, /components, /lib — no src wrapper | |
| You decide | Claude picks | |

**User's choice:** src/ root

---

## Claude's Discretion

- Loading states and transitions during auth flow
- Exact gradient/color scheme for login page background
- Password requirements
- Settings page card animations
- Seed data exact amounts and distribution

## Deferred Ideas

None — discussion stayed within phase scope
