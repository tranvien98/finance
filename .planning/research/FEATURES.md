# Feature Research

**Domain:** Personal Finance Management Web App (Single-user, VND, Vietnam)
**Researched:** 2026-03-22
**Confidence:** MEDIUM-HIGH (core features HIGH, AI/bot patterns MEDIUM)

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Expense CRUD (amount, date, category, note) | Every finance tracker has this; no workaround exists | LOW | Core data model; must be solid before anything else |
| Expense category management | Users have diverse spending patterns; fixed categories frustrate | LOW | Allow create/rename/delete custom categories |
| Date filtering (month, year, custom range) | Users think in time periods ("what did I spend in January?") | LOW | Month/year picker is minimum; custom range adds polish |
| Dashboard with spending overview | Landing experience; users expect a summary at a glance | MEDIUM | Total expenses, top categories, recent entries |
| Category breakdown chart (pie/donut) | Standard visualization; expected in any tracker | MEDIUM | Max 7 slices; group small categories into "Other" |
| Trend chart over time (line/bar) | Users want to see if they're spending more or less | MEDIUM | Monthly bar or line chart; at minimum past 6 months |
| Month-over-month comparison | Users naturally compare "this month vs last month" | LOW | % change is more readable than raw delta |
| Manual expense entry via web UI | Bot fails? Network issues? Users need a fallback | LOW | Simple form with amount, category, date, note |
| Authentication (login/logout, session) | Security baseline for any app with personal data | LOW | NextAuth + JWT as already decided |
| Responsive, mobile-friendly UI | Vietnamese users primarily use mobile; web must work on phone | MEDIUM | Not native app, but must feel usable on 375px viewport |
| Dark mode | Standard expectation in 2026; many users prefer it | LOW | TailwindCSS dark variant + shadcn/ui theming |
| Empty states and loading skeletons | Without these, app feels broken during data load | LOW | Every list and chart needs handled empty/loading state |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Telegram bot for quick expense entry | Frictionless capture at point-of-spend; open Telegram, send "pho 50k", done — no app switching | HIGH | Core differentiator; webhook + AI pipeline required |
| AI free-text classification | "pho 50k" becomes {amount: 50000, category: Food, description: "pho"} without user picking a category | HIGH | OpenRouter API; rule-based fallback; caching to reduce cost |
| Vietnamese-language NLP understanding | Abbreviations like "k" for 1000 VND, "trieu" for million — AI must handle these natively | MEDIUM | Prompt engineering for VND context; "50k" = 50,000 VND |
| AI result caching | Same phrase → same result without re-calling LLM; reduces latency and API cost | MEDIUM | Cache by normalized input text; TTL-based or indefinite |
| Rule-based fallback for AI | When AI is unavailable or returns garbage, regex patterns catch common formats | MEDIUM | e.g., regex for "NUMBER k/trieu KEYWORD" patterns |
| Investment portfolio tracking (manual) | Most expense trackers don't cover investments; this unifies financial picture | MEDIUM | Mutual funds, crypto, gold asset types with buy price + quantity |
| Investment vs expense dashboard | See total wealth picture: what you spend vs what you've invested | LOW | Add investment totals to dashboard summary cards |
| Simple AI-generated spending insights | "You spent 30% more on food this month" — narrative insight vs raw numbers | MEDIUM | LLM prompt on aggregated stats; can be weekly summary |
| User-owned API key (OpenRouter) | User controls their own LLM costs and model choice; not locked into provider | LOW | AES-256 encrypted storage; decrypt only at call time |
| Per-user Telegram bot token | User brings their own Telegram bot; no shared infrastructure | MEDIUM | User sets token in settings; webhook registration via API |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Multi-currency support | "What if I travel?" | Doubles data model complexity (exchange rates, conversion history, display currency); out of scope for personal VND tool | VND-only with a note in UI; add later if needed |
| Bank account sync / Open Banking | "Auto-import transactions" | Vietnam Open Banking is immature; requires bank API partnerships; security/compliance burden; false sense of accuracy | Manual + Telegram bot is the right capture model for personal use |
| Budget creation and tracking | "Tell me when I overspend" | Budgets require goal-setting flow, notification system, and regular user engagement — a product in itself | Dashboard comparison (MoM %) shows overspending naturally |
| Recurring transaction templates | "Netflix charges me monthly" | Recurring detection requires background jobs, schedule management, and notification infra | Log once via Telegram; Telegram bot makes re-entry fast |
| Receipt OCR / photo scanning | "Take a photo of my receipt" | OCR accuracy for Vietnamese receipts is low; requires image storage (cost + complexity); Telegram voice/text is faster | AI text parsing from Telegram message is simpler and faster |
| Export to CSV / PDF | "I want a report for tax" | Requires report generation infra; formatting logic; for personal single-user app, the web dashboard is sufficient | Defer to v2 if needed; database is queryable directly |
| Push notifications / email alerts | "Alert me when I'm over budget" | Requires notification service, email provider, user preferences; adds infra and maintenance burden | Telegram bot already provides real-time messaging channel |
| Real-time investment price tracking | "Show me live crypto prices" | Requires price feed API subscriptions, polling/websocket infra, API cost; adds significant complexity | Manual entry with last-known price; user updates when relevant |
| Social / shared expense splitting | "Split rent with roommates" | Multi-user data model breaks single-user design assumptions; fundamentally different product | Out of scope; this is a personal tool |
| Gamification (streaks, badges) | "Keep me motivated" | Distracts from core value; engagement mechanics are a product strategy decision, not a feature | Consistent Telegram bot habit is the engagement mechanism |

## Feature Dependencies

```
[Authentication]
    └──required by──> [All features] (sessions gate everything)

[Expense CRUD]
    └──required by──> [Category Chart]
    └──required by──> [Trend Chart]
    └──required by──> [MoM Comparison]
    └──required by──> [AI Text Classification]
    └──required by──> [Dashboard Overview]

[Custom Categories]
    └──required by──> [Expense CRUD] (category must exist before assigning)

[AI Text Classification]
    └──required by──> [Telegram Bot] (bot relies on AI to parse free-text)
    └──enhances──> [Manual Web Entry] (could offer AI parse in web form too)

[Rule-Based Fallback]
    └──enhances──> [AI Text Classification] (graceful degradation path)

[AI Result Cache]
    └──enhances──> [AI Text Classification] (reduce redundant API calls)

[Telegram Webhook]
    └──requires──> [AI Text Classification] (parse the message)
    └──requires──> [Expense CRUD] (create the expense record)
    └──requires──> [User Telegram Token Setting] (which bot to listen on)

[Investment CRUD]
    └──required by──> [Investment Portfolio View]
    └──enhances──> [Dashboard Overview] (adds investment totals)

[OpenRouter API Key Setting]
    └──required by──> [AI Text Classification] (can't call API without key)
    └──requires──> [AES-256 Encryption] (key must be stored securely)
```

### Dependency Notes

- **Telegram Bot requires AI Classification:** The bot's core value is "send text, get categorized expense." Without AI, bot can only accept structured commands like `/expense 50000 food pho` — which defeats the UX goal.
- **AI Classification requires OpenRouter key:** User must configure their API key before AI features work. This should be surfaced prominently in onboarding.
- **Custom Categories should be seeded:** New users need default categories (Food, Transport, Entertainment, etc.) or the CRUD UI is daunting on first use.
- **Investment CRUD is independent:** Can be built in parallel with or after expense features; shares no hard dependency except auth.

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the core loop: log expense via Telegram, see it in dashboard.

- [x] Authentication (login/logout, JWT session) — gates all features
- [x] Expense CRUD with custom categories — core data model
- [x] AI text classification via OpenRouter — primary input method
- [x] Rule-based fallback for AI failures — resilience
- [x] AI result caching — cost control from day one
- [x] Telegram bot webhook with AI parsing — core differentiator
- [x] Dashboard with overview cards, category pie chart, monthly trend bar chart — the payoff for logging
- [x] Month-over-month comparison — simplest insight
- [x] Date filtering by month/year — basic navigation
- [x] OpenRouter API key setting (AES-256 encrypted) — enables AI
- [x] Telegram bot token setting — enables bot
- [x] Responsive UI, dark mode, loading skeletons, toasts — polish that makes v1 feel real
- [x] Seed data for dev/demo — developer experience

### Add After Validation (v1.x)

Features to add once core loop is confirmed working.

- [ ] Investment portfolio tracking (mutual funds, crypto, gold) — widens financial picture; add when expense tracking is stable
- [ ] Investment totals on dashboard — natural extension once investment data exists
- [ ] AI-generated spending insights (narrative) — once there's enough data to analyze
- [ ] Custom date range filter — current month/year filter is enough for v1
- [ ] Telegram bot: query commands (e.g., "how much did I spend this month?") — v1 bot is write-only; read is v1.x

### Future Consideration (v2+)

Features to defer until product has proven value.

- [ ] Export to CSV/PDF — only needed if others start using the app or for tax reporting
- [ ] Budget creation and tracking — significant product surface; validate demand first
- [ ] Receipt photo OCR via Telegram — image pipeline complexity; text is sufficient
- [ ] Voice message expense logging — interesting but requires audio transcription pipeline
- [ ] Multi-currency support — only if travel use case emerges

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Authentication | HIGH | LOW | P1 |
| Expense CRUD + Categories | HIGH | LOW | P1 |
| AI Text Classification | HIGH | MEDIUM | P1 |
| Telegram Bot Integration | HIGH | HIGH | P1 |
| Rule-Based Fallback | MEDIUM | LOW | P1 |
| AI Result Caching | MEDIUM | LOW | P1 |
| Dashboard Overview Cards | HIGH | LOW | P1 |
| Category Pie Chart | HIGH | MEDIUM | P1 |
| Monthly Trend Chart | HIGH | MEDIUM | P1 |
| MoM Comparison | MEDIUM | LOW | P1 |
| Date Filtering (month/year) | MEDIUM | LOW | P1 |
| API Key + Token Settings | HIGH | LOW | P1 |
| AES-256 Key Encryption | HIGH | LOW | P1 |
| Dark Mode + Responsive UI | MEDIUM | MEDIUM | P1 |
| Loading Skeletons + Toasts | MEDIUM | LOW | P1 |
| Investment CRUD | MEDIUM | MEDIUM | P2 |
| Investment Dashboard View | MEDIUM | LOW | P2 |
| AI Spending Insights | MEDIUM | MEDIUM | P2 |
| Custom Date Range Filter | LOW | LOW | P2 |
| Telegram Read Commands | LOW | MEDIUM | P2 |
| CSV/PDF Export | LOW | MEDIUM | P3 |
| Budget Tracking | MEDIUM | HIGH | P3 |
| Voice Message Logging | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Money Lover (Vietnam) | MISA Money Keeper | Our Approach |
|---------|----------------------|-------------------|--------------|
| Expense entry | Manual form UI | Manual form UI | Telegram bot + AI parse (differentiator) |
| Category management | Fixed + custom | Fixed + custom | Custom-first with seeded defaults |
| Dashboard charts | Category pie, trend bar | Category pie, trend bar | Same; add MoM % which is rarer |
| Investment tracking | Basic (stocks/savings) | None | Manual: mutual funds, crypto, gold |
| AI classification | None (rule-based only) | None | OpenRouter LLM with VND context |
| Telegram / chatbot | None | None | Core feature; key differentiator |
| Currency | Multi-currency | VND primary | VND only (simplicity advantage) |
| Export | CSV | CSV, Excel | Deferred to v2 |
| Budget tracking | Yes | Yes | Deliberately excluded from v1 |
| Platform | Mobile app | Mobile app | Web-first, responsive |

**Key insight:** Money Lover and MISA are mobile-native, manual-entry apps. Neither offers AI-powered natural language input or chatbot integration. The Telegram + AI pipeline is a genuine gap in the Vietnamese personal finance app market.

## Sources

- [Key Features Every Personal Finance App Needs in 2026 - Financial Panther](https://financialpanther.com/key-features-every-personal-finance-app-needs-in-2026/)
- [Best AI-Powered Expense Trackers in 2026 - SpendifiAI](https://www.spendifiai.com/blog/best-ai-expense-trackers)
- [Emerging personal finance applications in Vietnam - B-Company](https://b-company.jp/emerging-personal-finance-applications-in-vietnam/)
- [Vietnam's Personal Finance App Money Lover Adds New Features - Fintechnews SG](https://fintechnews.sg/3972/personalfinance/vietnams-personal-finance-app-money-lover-adds-new-features/)
- [Automating Expense Management using Telegram Bot, Google Sheet, and AI - Medium](https://omkarshetkar.medium.com/automation-using-telegram-bot-google-sheet-and-ai-2bbe57cf4992)
- [Cointry: Expense tracking bot for Telegram](https://cointry.io/)
- [7 Essential Financial Charts for Personal Finance Visualization - Syncfusion](https://www.syncfusion.com/blogs/post/financial-charts-visualization)
- [Delta by eToro: Investment Tracker](https://delta.app/en)
- [Best Investment Tracking Apps - Rob Berger](https://robberger.com/investment-tracking-apps/)
- [Zero-Touch Expense Reporting in 2026: How AI Is Killing Manual Entry](https://expenseanywhere.com/zero-touch-expense-reporting-ai-automated-expense-management-2026/)
- [The trend of using personal finance management apps in Vietnam - GSAR Publishers](https://gsarpublishers.com/wp-content/uploads/2025/06/GSARJEBM882025-Gelary-script.pdf)

---
*Feature research for: Personal Finance Management Web App (VND, Vietnam, Single-user)*
*Researched: 2026-03-22*
