# SPEC-002 — Typed Mock Data Layer & Services (the API contract)

**Status:** Implemented
**Phase:** 1 — Frontend Foundation (docs/Phases.md)
**Governing docs:** ../docs/prd.md §3, ../docs/Architecture.md §9, root CLAUDE.md Rule 6
(Phase 1 mock exception) & Rule 8 (no calculations in the UI)

## Goal

Define the TypeScript interfaces that mirror the future backend API, fixture data that
matches the approved dashboard mockup, and the `services/` layer components consume —
so Phase 8 swaps the service implementation from mock to real API without touching a
single component.

## Scope

### `types/` — the contract

- `types/analytics.ts` — `Kpi` (id, label, value, changePercent, format:
  `currency|number|percent`), `RevenuePoint` (day label, current, previous),
  `TopProduct` (id, name, revenue, orders), `AlertsSummary` (lowStockVariants,
  outOfStockVariants, highDiscountProducts, refundsAmount, refundsCount),
  `ChannelShare` (channel, share 0–1).
- `types/orders.ts` — `OrderStatus` (`paid|pending|refunded`), `RecentOrder`
  (id, number, customerName, total, status, createdAt ISO).
- `types/store.ts` — `StoreConnection` (domain, status `active|disconnected`,
  lastSyncAt ISO), `UserProfile` (name, email).
- `types/chat.ts` — `ChatMessage` (id, role `user|assistant`, content, createdAt ISO),
  suggested prompt type.
- `types/dashboard.ts` — `DashboardData` aggregating: periodLabel, comparisonLabel,
  kpis, revenueSeries, topProducts, alerts, recentOrders, channels.

### `lib/mock/` — fixtures (the ONLY place mock values live)

- `lib/mock/dashboard.ts` — values matching the approved mockup (revenue $24,130.50,
  214 orders, AOV $112.77, 34.2% returning, 68 new; weekly series; 5 top products;
  alert counts; 4 recent orders; 4 channels).
- `lib/mock/store.ts` — `mystore.myshopify.com`, active; Admin user profile.
- `lib/mock/chat.ts` — suggested prompts (the 5 from the mockup) + canned assistant
  replies keyed by prompt, with a sales-summary reply for "yesterday's sales".

### `services/` — what components import (never `lib/mock` directly)

- `services/dashboard.ts` — `getDashboardData(): Promise<DashboardData>`.
- `services/store.ts` — `getStoreConnection()`, `getCurrentUser()`.
- `services/chat.ts` — `getSuggestedPrompts()`, `getAssistantReply(prompt)` (async,
  streamed-shaped later; canned mock now).
- Services are async from day one (same signature as the future HTTP client). No
  artificial latency.

### `utils/format.ts` — display-only formatting (Rule 8: format, never derive)

`formatCurrency`, `formatCompactCurrency`, `formatNumber`, `formatPercent`,
`formatChange` (signed, for deltas), `formatDate` (ISO → "May 15, 2026"),
`getInitials(name)`, `getGreeting(date)` → morning/afternoon/evening.

### Test runner (root Rule 4 trigger: first `lib`/`utils` logic)

- **Vitest** added (node env, `tests/**/*.test.ts`, `@` alias resolved).
- `npm test` script wired.
- `tests/format.test.ts` covers every formatter incl. edge cases (0, negatives,
  boundary hours for greeting, single-word names for initials).

## Out of scope

Components/pages (SPEC-003/004). Real API client (Phase 8).

## Acceptance Criteria

1. All listed types, mocks, services, and utils exist; components can build the whole
   dashboard without importing `lib/mock` directly.
2. Mock values match the approved mockup exactly.
3. `npm test` runs Vitest and all formatter tests pass.
4. `npx tsc --noEmit` and `npm run lint` pass.
