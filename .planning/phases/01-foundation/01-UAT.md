---
status: partial
phase: 01-foundation
source: [01-01-SUMMARY.md, 01-02-SUMMARY.md, 01-03-SUMMARY.md, 01-04-SUMMARY.md]
started: "2026-03-22T16:59:00+07:00"
updated: "2026-03-22T17:07:30+07:00"
---

## Current Test
[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running server. Run `npm run dev`. Server boots without errors on http://localhost:3000. The page loads (redirects to /auth).
result: pass

### 2. Sign-Up Flow
expected: Go to /auth → Click "Sign up" tab → Enter email + password (8+ chars) + confirm password → Click "Create account" → Auto-signed in and redirected to /expenses.
result: pass

### 3. Sign-In Flow
expected: Go to /auth → "Sign in" tab → Enter the credentials you just created → Click "Sign in" → Redirected to /expenses.
result: pass

### 4. Inline Validation Errors
expected: On Sign Up tab, leave email empty and click "Create account" → Red error appears under each invalid field. Enter mismatched passwords → "Passwords do not match" appears under confirm field.
result: pass

### 5. Route Protection
expected: Open a new incognito/private window → Navigate directly to /expenses → Redirected to /auth page instead.
result: issue
reported: "no directly"
severity: major

### 6. Dashboard Sidebar Navigation
expected: After sign-in, sidebar shows 4 nav links: Expenses, Dashboard, Investments, Settings. Clicking each navigates to that page. Active page is highlighted with purple background. User email shown at bottom.
result: pass

### 7. Sign Out
expected: Click "Sign out" (red button) in the sidebar → Immediately redirected back to /auth. No confirmation dialog.
result: pass

### 8. Settings — API Keys Card
expected: Go to /settings → Three expandable cards visible. Click "API Keys" card → Expands with chevron rotating. Shows input field for OpenRouter API key. Card collapses when clicked again.
result: pass

### 9. Settings — Telegram Bot Card
expected: Click "Telegram Bot" card → Expands. Shows input for bot token. Status shows "Not configured" when no token is saved.
result: pass

### 10. Settings — Account Card
expected: Click "Account" card → Expands showing your email (read-only input) and a "Sign out" button.
result: pass

### 11. Seed Data in Database
expected: Run `npm run seed` in terminal → Output shows "Created demo user: demo@finance.app", "Created 61 expenses", "Created 3 investments", "Seed complete!". Sign in as demo@finance.app / password123 works.
result: pass

## Summary

total: 11
passed: 10
issues: 1
pending: 0
skipped: 0

## Gaps

- truth: "Open a new incognito/private window → Navigate directly to /expenses → Redirected to /auth page instead."
  status: failed
  reason: "User reported: no directly"
  severity: major
  test: 5
  artifacts: []
  missing: []
