# Roadmap: Finance App

## Overview

Seven phases deliver a personal finance tracker from zero to a fully working Telegram-driven expense logger. Phase 1 lays the non-negotiable foundation (auth, database connection, encryption, seeded data). Phases 2-3 build the core data entry and analytics loop. Phases 4-5 deliver the app's primary differentiator: natural Vietnamese text sent to Telegram becomes a categorized expense record. Phase 6 adds investment tracking. Phase 7 consolidates UI polish and AI-generated spending insights.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Auth, database connection, encryption, and project infrastructure
- [ ] **Phase 2: Expense Management** - Full expense CRUD and custom category management
- [x] **Phase 3: Dashboard and Filters** - Analytics dashboard with charts and date filtering (completed 2026-03-22)
- [ ] **Phase 4: AI Classification** - Free-text expense parsing via OpenRouter with Vietnamese NLP
- [ ] **Phase 5: Telegram Bot** - Webhook integration turning Telegram messages into expenses
- [ ] **Phase 6: Investment Tracking** - Full investment CRUD for mutual funds, crypto, and gold
- [ ] **Phase 7: UI Polish and Insights** - UI/UX completeness and AI-generated spending insights

## Phase Details

### Phase 1: Foundation
**Goal**: The application runs with working authentication, a safe database connection, encrypted secret storage, and seeded development data — every later phase builds on this without needing to revisit these concerns
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, SETT-01, SETT-02, SETT-03, SETT-04, INFR-01, INFR-02, INFR-03, INFR-04
**Success Criteria** (what must be TRUE):
  1. User can sign up with email and password, log in, and be redirected to the dashboard
  2. User who is not logged in is redirected to login when accessing any protected route
  3. User can log out and is returned to the login page
  4. User can store and update their OpenRouter API key in settings; it is not visible in plain text after saving
  5. Development seed script runs without error and populates the database with usable demo data
**Plans**: 4 plans

Plans:
- [x] 01-01-PLAN.md — Project scaffold, DB connection, Mongoose models, .env.example
- [x] 01-02-PLAN.md — NextAuth credentials provider, auth UI, middleware, protected routes
- [x] 01-03-PLAN.md — AES-256-GCM encryption, settings API, settings page UI
- [x] 01-04-PLAN.md — Seed data script with Vietnamese data, error logging utility

### Phase 2: Expense Management
**Goal**: Users can fully manage their expenses and custom categories through the web UI — the core data model is live and all manual entry workflows are complete
**Depends on**: Phase 1
**Requirements**: EXPN-01, EXPN-02, EXPN-03, EXPN-04, EXPN-05, EXPN-06
**Success Criteria** (what must be TRUE):
  1. User can create an expense with amount (integer VND), category, note, and date via a web form
  2. User can see all their expenses in a list and navigate between entries
  3. User can edit an existing expense and see the updated values immediately
  4. User can delete an expense and it disappears from the list
  5. User can create, rename, and delete custom categories; default categories (Food, Transport, Entertainment, Shopping, Health, Utilities, Housing, Other) exist on first login
**Plans**: 5 plans

Plans:
- [x] 02-00-PLAN.md — Test infrastructure (vitest, mongodb-memory-server, RED test stubs)
- [x] 02-01-PLAN.md — shadcn components, Category model, Category API routes
- [x] 02-02-PLAN.md — Expense API routes (GET/POST/PATCH/DELETE)
- [x] 02-03-PLAN.md — Expenses page UI (list, create/edit dialog, delete confirmation)
- [x] 02-04-PLAN.md — Category manager dialog, integration, visual verification

### Phase 3: Dashboard and Filters
**Goal**: Users can see a meaningful financial overview of their expenses — the dashboard turns raw entries into insight through aggregations, charts, and date filtering
**Depends on**: Phase 2
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, FILT-01, FILT-02, FILT-03
**Success Criteria** (what must be TRUE):
  1. Dashboard shows total expenses and total investments for the current month by default
  2. Dashboard shows a pie chart of expenses broken down by category
  3. Dashboard shows a line chart of expense amounts over time within the selected period
  4. Dashboard shows month-over-month comparison with a percentage change indicator
  5. User can filter all views by month, by year, or by a custom date range (from - to)
**Plans**: 4 plans

Plans:
- [x] 03-00-PLAN.md — Wave 0 test stubs for all 7 dashboard requirements
- [x] 03-01-PLAN.md — Dashboard API route, MongoDB aggregations, date range resolver
- [x] 03-02-PLAN.md — Recharts install, stat card, pie chart, and line chart components
- [x] 03-03-PLAN.md — Filter controls and dashboard page assembly

### Phase 4: AI Classification
**Goal**: Free-text input in Vietnamese is reliably parsed into structured expense data — the AI service is stable, cached, and resilient enough for the Telegram bot to depend on it
**Depends on**: Phase 1
**Requirements**: AICL-01, AICL-02, AICL-03, AICL-04, AICL-05
**Success Criteria** (what must be TRUE):
  1. Entering "ăn phở 50k" produces a structured expense: amount 50000 VND, category Food, description populated
  2. Vietnamese shorthand ("50k", "2 trieu", "100 ngan") is correctly converted to integer VND amounts
  3. When the OpenRouter API is unavailable, the rule-based fallback extracts amount and a default category without error
  4. Submitting the same text twice hits the cache on the second call (no additional API cost incurred)
  5. A failed AI call is retried automatically; multiple failures do not crash the page — an error toast appears instead
**Plans**: TBD

Plans:

### Phase 5: Telegram Bot
**Goal**: Sending a message to the Telegram bot creates a categorized expense entry in the app — the core value proposition of the product is delivered end-to-end
**Depends on**: Phase 4, Phase 2
**Requirements**: TGBR-01, TGBR-02, TGBR-03, TGBR-04, TGBR-05
**Success Criteria** (what must be TRUE):
  1. User can enter their Telegram Bot Token in settings and the webhook is registered without manual steps
  2. Sending "ca phe 25k" to the Telegram bot creates a new expense entry visible in the expense list
  3. The Telegram bot replies with a confirmation message showing the parsed expense details
  4. Sending a message with a missing or incorrect secret token returns a 401 and creates no expense
  5. The webhook returns HTTP 200 immediately regardless of how long AI classification takes; duplicate messages from Telegram retries do not create duplicate expenses
**Plans**: TBD

Plans:

### Phase 6: Investment Tracking
**Goal**: Users can record and review their investment portfolio alongside expenses — the financial picture is complete
**Depends on**: Phase 1
**Requirements**: INVS-01, INVS-02, INVS-03, INVS-04, INVS-05
**Success Criteria** (what must be TRUE):
  1. User can create an investment entry with asset type (mutual fund, crypto, gold), amount, buy price, quantity, and date
  2. User can view a list of all their investment entries
  3. User can edit an existing investment and see updated values immediately
  4. User can delete an investment and it is removed from the list and dashboard totals
**Plans**: TBD

Plans:

### Phase 7: UI Polish and Insights
**Goal**: The app feels complete and trustworthy to use daily — every screen handles loading, empty, and error states gracefully, and AI-generated insights add value to the dashboard
**Depends on**: Phase 3, Phase 4
**Requirements**: UIUX-01, UIUX-02, UIUX-03, UIUX-04, UIUX-05, DASH-05
**Success Criteria** (what must be TRUE):
  1. Dark mode toggle is accessible from any page and preference persists across browser sessions
  2. All pages are usable on a 375px-wide mobile screen without horizontal scrolling
  3. Every data-fetching view shows a loading skeleton while waiting, not a blank screen
  4. Every create, edit, delete, and error action shows a toast notification with a clear message
  5. Dashboard shows an AI-generated narrative insight summarizing spending patterns for the current month
**Plans**: TBD

Plans:

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7

Note: Phase 4 depends only on Phase 1 (not Phase 2 or 3), and Phase 6 depends only on Phase 1. Both can begin after Phase 1 completes. The sequence above is the recommended delivery order.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/4 | Planning complete | - |
| 2. Expense Management | 1/5 | In Progress|  |
| 3. Dashboard and Filters | 4/4 | Complete   | 2026-03-22 |
| 4. AI Classification | 0/? | Not started | - |
| 5. Telegram Bot | 0/? | Not started | - |
| 6. Investment Tracking | 0/? | Not started | - |
| 7. UI Polish and Insights | 0/? | Not started | - |
