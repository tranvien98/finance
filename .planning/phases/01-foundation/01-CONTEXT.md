# Phase 1: Foundation - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

The application runs with working authentication, a safe database connection, encrypted secret storage, and seeded development data. Every later phase builds on this without needing to revisit these concerns.

Requirements: AUTH-01, AUTH-02, AUTH-03, AUTH-04, SETT-01, SETT-02, SETT-03, SETT-04, INFR-01, INFR-02, INFR-03, INFR-04

</domain>

<decisions>
## Implementation Decisions

### Auth UX Flow
- **D-01:** After login, user lands on the expenses list page (not dashboard)
- **D-02:** Login/signup page is a centered card on dark/gradient background (fintech style)
- **D-03:** Sign up and login are tabs on the same page (single route, tab toggle)
- **D-04:** Auth errors shown as inline field validation (red text below each field) — no toasts for auth errors

### Settings Page
- **D-05:** Saved API key displayed masked (sk-...xxxx) with reveal button for temporary full display
- **D-06:** Settings page uses sectioned layout with expandable cards: API Keys, Telegram Bot, Account
- **D-07:** API key validated on save — test call to OpenRouter before storing. Show success/failure inline

### Seed Data
- **D-08:** Seed data uses realistic Vietnamese data: real VND amounts, Vietnamese expense names (phở, cà phê, xăng, điện, internet)
- **D-09:** Seed 3 months of expense data across all default categories
- **D-10:** Seed both expenses and investments (mutual funds, crypto, gold with realistic VND amounts)

### Project Scaffold
- **D-11:** Next.js 16 with App Router (/app directory, React Server Components, layouts)
- **D-12:** TypeScript throughout
- **D-13:** npm as package manager
- **D-14:** src/ root structure: /src/app, /src/components, /src/lib, /src/services, /src/hooks

### Claude's Discretion
- Loading states and transitions during auth flow
- Exact gradient/color scheme for login page background
- Password requirements (minimum length, complexity rules)
- Settings page card expand/collapse animation
- Seed data exact amounts and distribution

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project context
- `.planning/PROJECT.md` — Project vision, core value, constraints, key decisions
- `.planning/REQUIREMENTS.md` — Full v1 requirements with REQ-IDs
- `.planning/ROADMAP.md` — Phase structure and success criteria

### Research findings
- `.planning/research/STACK.md` — Validated tech stack with versions (Next.js 16, Mongoose v8, next-auth v5 beta, Recharts v3)
- `.planning/research/ARCHITECTURE.md` — Component boundaries, data flow, service layer pattern
- `.planning/research/PITFALLS.md` — Critical pitfalls: integer VND amounts, AES-256-GCM not CBC, Mongoose singleton

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, no existing code

### Established Patterns
- None yet — this phase establishes the foundational patterns

### Integration Points
- This phase creates the base that all subsequent phases connect to: auth middleware, DB connection, encryption helpers, project structure

</code_context>

<specifics>
## Specific Ideas

- Login page should feel like a fintech app — clean, centered card, dark background
- Vietnamese seed data should be realistic enough to demo the app convincingly
- Settings page sections: API Keys, Telegram Bot, Account — expandable cards pattern used throughout the app later

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-22*
