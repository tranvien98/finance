# Requirements: Finance App

**Defined:** 2026-03-22
**Core Value:** Quick, frictionless expense tracking — send a Telegram message and it automatically creates a categorized expense entry.

## v1 Requirements

### Authentication

- [ ] **AUTH-01**: User can sign up with email and password
- [ ] **AUTH-02**: User can log in and stay logged in across browser refresh (JWT session)
- [ ] **AUTH-03**: User can log out from any page
- [ ] **AUTH-04**: Unauthenticated users are redirected to login (protected routes)

### Expense Management

- [ ] **EXPN-01**: User can create an expense with amount (integer VND), category, note, and date
- [ ] **EXPN-02**: User can view a list of their expenses
- [ ] **EXPN-03**: User can edit an existing expense
- [ ] **EXPN-04**: User can delete an expense
- [ ] **EXPN-05**: User can create, rename, and delete custom expense categories
- [ ] **EXPN-06**: Default categories exist on first use (food, entertainment, transportation, bills, other)

### Dashboard & Analytics

- [ ] **DASH-01**: Dashboard shows monthly total expenses and total investments
- [ ] **DASH-02**: Dashboard shows pie chart of expenses by category
- [ ] **DASH-03**: Dashboard shows line chart of expenses over time
- [ ] **DASH-04**: Dashboard shows month-over-month comparison with % change
- [ ] **DASH-05**: Dashboard highlights simple AI-generated spending insights

### Filters

- [ ] **FILT-01**: User can filter expenses and investments by month
- [ ] **FILT-02**: User can filter expenses and investments by year
- [ ] **FILT-03**: User can filter expenses and investments by custom date range (from - to)

### AI Classification

- [ ] **AICL-01**: AI classifies free-text input into structured expense (amount, category, description) via OpenRouter API
- [ ] **AICL-02**: AI understands Vietnamese shorthand ("50k" = 50,000 VND, "trieu" = million)
- [ ] **AICL-03**: Rule-based fallback parses common formats when AI is unavailable or fails
- [ ] **AICL-04**: AI classification results are cached by normalized input to reduce API costs
- [ ] **AICL-05**: AI calls are debounced and retried on failure

### Telegram Bot

- [ ] **TGBR-01**: User can input their Telegram Bot Token in settings
- [ ] **TGBR-02**: App registers a webhook endpoint at /api/telegram/webhook
- [ ] **TGBR-03**: Webhook receives Telegram messages, parses them via AI, and auto-creates expenses
- [ ] **TGBR-04**: Webhook validates Telegram secret token before processing
- [ ] **TGBR-05**: Webhook returns 200 immediately and processes AI classification asynchronously

### Investment Management

- [ ] **INVS-01**: User can create an investment with asset type, amount, buy price, quantity, and date
- [ ] **INVS-02**: User can view a list of their investments
- [ ] **INVS-03**: User can edit an existing investment
- [ ] **INVS-04**: User can delete an investment
- [ ] **INVS-05**: Supported asset types: mutual funds, crypto, gold

### Settings & Security

- [ ] **SETT-01**: User can store their OpenRouter API key in settings
- [ ] **SETT-02**: API keys are encrypted with AES-256-GCM before storing in database
- [ ] **SETT-03**: Encrypt/decrypt helper functions use ENCRYPTION_SECRET env var with scrypt key derivation
- [ ] **SETT-04**: API keys are decrypted only when calling external services

### UI/UX

- [ ] **UIUX-01**: Dark mode toggle with persistent preference
- [ ] **UIUX-02**: Responsive design works on mobile (375px+) and desktop
- [ ] **UIUX-03**: Loading skeletons on all data-fetching views
- [ ] **UIUX-04**: Toast notifications for success/error actions
- [ ] **UIUX-05**: Empty states for lists and charts when no data exists

### Infrastructure

- [ ] **INFR-01**: Mongoose connection singleton for serverless (maxPoolSize: 1)
- [ ] **INFR-02**: Error logging for API failures
- [ ] **INFR-03**: Seed data script for development/demo
- [ ] **INFR-04**: Example .env file with all required environment variables

## v2 Requirements

### Notifications

- **NOTF-01**: Telegram bot sends confirmation message with parsed expense details before saving
- **NOTF-02**: Telegram bot supports read commands (e.g., "summary" returns monthly totals)

### Export

- **EXPT-01**: User can export expenses to CSV
- **EXPT-02**: User can export monthly report to PDF

### Enhanced AI

- **EAAI-01**: AI suggests budget warnings based on spending patterns
- **EAAI-02**: Weekly AI spending summary via Telegram

## Out of Scope

| Feature | Reason |
|---------|--------|
| Multi-currency support | VND only; single user in Vietnam |
| Bank account sync / Open Banking | Vietnam Open Banking immature; manual + Telegram is sufficient |
| Budget creation and tracking | Product in itself; MoM comparison covers overspending detection |
| Recurring transaction templates | Telegram bot makes re-entry fast enough |
| Receipt OCR / photo scanning | Vietnamese receipt OCR accuracy low; text parsing is simpler |
| Push notifications / email alerts | Telegram bot already provides messaging channel |
| Real-time investment price tracking | Manual entry only for v1; user updates when relevant |
| Social / shared expense splitting | Breaks single-user design assumptions |
| OAuth providers (Google, GitHub) | Email/password sufficient for personal use |
| Mobile native app | Responsive web covers mobile use |
| Web-based AI text parsing | AI parsing only via Telegram; web form is manual fields |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | — | Pending |
| AUTH-02 | — | Pending |
| AUTH-03 | — | Pending |
| AUTH-04 | — | Pending |
| EXPN-01 | — | Pending |
| EXPN-02 | — | Pending |
| EXPN-03 | — | Pending |
| EXPN-04 | — | Pending |
| EXPN-05 | — | Pending |
| EXPN-06 | — | Pending |
| DASH-01 | — | Pending |
| DASH-02 | — | Pending |
| DASH-03 | — | Pending |
| DASH-04 | — | Pending |
| DASH-05 | — | Pending |
| FILT-01 | — | Pending |
| FILT-02 | — | Pending |
| FILT-03 | — | Pending |
| AICL-01 | — | Pending |
| AICL-02 | — | Pending |
| AICL-03 | — | Pending |
| AICL-04 | — | Pending |
| AICL-05 | — | Pending |
| TGBR-01 | — | Pending |
| TGBR-02 | — | Pending |
| TGBR-03 | — | Pending |
| TGBR-04 | — | Pending |
| TGBR-05 | — | Pending |
| INVS-01 | — | Pending |
| INVS-02 | — | Pending |
| INVS-03 | — | Pending |
| INVS-04 | — | Pending |
| INVS-05 | — | Pending |
| SETT-01 | — | Pending |
| SETT-02 | — | Pending |
| SETT-03 | — | Pending |
| SETT-04 | — | Pending |
| UIUX-01 | — | Pending |
| UIUX-02 | — | Pending |
| UIUX-03 | — | Pending |
| UIUX-04 | — | Pending |
| UIUX-05 | — | Pending |
| INFR-01 | — | Pending |
| INFR-02 | — | Pending |
| INFR-03 | — | Pending |
| INFR-04 | — | Pending |

**Coverage:**
- v1 requirements: 44 total
- Mapped to phases: 0
- Unmapped: 44 ⚠️

---
*Requirements defined: 2026-03-22*
*Last updated: 2026-03-22 after initial definition*
