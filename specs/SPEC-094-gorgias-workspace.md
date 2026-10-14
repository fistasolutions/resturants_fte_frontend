# SPEC-094 — Gorgias Workspace (frontend, Phase C)

**Status:** in progress. Frontend for the Gorgias workspace expansion
(backend SPEC-087 data + SPEC-088 read API). Turns the single-table Team
Performance page into a dense, sub-tabbed support workspace on the shared
dashboard date-range filter. Governed by `docs/Design.md` + root Rule 9
(semantic tokens only, **no Framer Motion**, no entrance animation, shadcn).

## Scope

Route stays `/team-performance` (owner decision 2026-08-05 — no rename). It
becomes a persistent **shell** (PageHeader + `DateRangePicker` + tab bar,
cloning the Orders `layout.tsx`/shell pattern SPEC-087) around four sub-tabs:

1. **Overview** (`/team-performance`) — KPI hero row (conversations, resolution
   rate, avg first response, avg resolution, CSAT, open backlog) each with a
   **compare-vs-previous-period delta**; a color-coded **alerts strip**
   (green/amber/red per the client's ask); **contact-reason** + **channel**
   breakdowns; and the **agent leaderboard** (rows click through to agent
   detail).
2. **Conversations** (`/team-performance/conversations`) — the **Conversation
   Log**: search + status/agent filters, paginated table with every field the
   client listed (date, customer, order, subject, agent, response time, status,
   CSAT, refund `—`, snippets), **Export CSV**, each row → thread detail.
3. **Agents** (`/team-performance/agents`) — leaderboard; row → agent detail
   (`/agents/[id]`) showing that agent's metrics + their conversations.
4. **Alerts** (`/team-performance/alerts`) — the four alert lists (unanswered,
   unhappy, reopened, open>24h), color-coded, rows → thread detail.

Detail routes (`/conversations/[id]`, `/agents/[id]`) render **bare** (own
breadcrumb + `<main>`), gated by `activeGorgiasTab(pathname) === null` — exactly
the Orders shell convention.

## Data layer

- `types/gorgias.ts` — `GorgiasOverview`, `GorgiasConversation`,
  `GorgiasConversationList`, `GorgiasConversationDetail`, `GorgiasMessage`,
  `GorgiasAlerts` (leaderboard reuses `GorgiasAgentMetric` from
  `types/team-performance.ts`).
- `services/gorgias-workspace.ts` — `serverApi` calls to `/gorgias/overview`,
  `/gorgias/conversations`, `/gorgias/conversations/{id}`, `/gorgias/alerts`.
- `lib/gorgias-tabs.ts` — pure tab model + `activeGorgiasTab` (exact-match, unit
  tested).
- `lib/gorgias-filters.ts` — `parseConversationFilters` +
  `conversationsApiQuery` (shared by the list fetch, client pagination, and the
  CSV export href so they can't drift) (unit tested).
- Date range: reuse `DateRangePicker` + `resolveDateRange` (`lib/date-range.ts`)
  verbatim; compare defaults to `previous_period` so the Overview always shows
  deltas.

## Non-negotiables

- Semantic tokens only; brand red stays identity-only; `--destructive`/
  `--warning`/`--success` for the alert traffic-lights. No hardcoded colors.
- No entrance/scroll animation; content renders in final position. Allowed:
  hover/focus, shadcn dialog/dropdown, skeleton pulse.
- SSR-first; `"use client"` only for the picker, tab bar, filter controls,
  pagination panel. Parallel fetches (`Promise.all`), never waterfall.
- Every view ships loading / empty / error states; tables get search +
  pagination; keyboard-navigable, responsive (desktop-first, works to mobile).
- Refund column shows `—` (backend returns null — SPEC-087 decision).
- Row → detail uses the stretched-`<Link>` + `returnTo` convention (SPEC-080),
  detail is a full page (never a drawer — user preference).

## Verification (no jsdom runner — Rule 4)

- **Vitest** unit tests for `lib/gorgias-tabs.ts` (active-tab resolution incl.
  detail routes → null) and `lib/gorgias-filters.ts` (parse + query building).
- **Manual checklist** (in this spec): each tab loads on the live backend;
  range filter changes all tabs; search/filter/paginate/export on Conversations;
  row → thread detail + back; agent row → agent detail; alerts color-coded;
  empty state when unsynced; both light + dark themes; `npm run build`,
  `npx tsc --noEmit`, `npm test` all green.

## Patches

- 2026-08-05 — **Instant navigation (loading skeletons).** The workspace had a
  persistent shell but no `loading.tsx`, so entering the page or switching tabs
  hung on the previous view until the route's server data resolved, then jumped.
  Added `team-performance/loading.tsx` (content-only skeleton, renders inside the
  shell body across tab switches) plus full-page skeletons for the two bare detail
  routes (`agents/[id]/loading.tsx`, `conversations/[id]/loading.tsx`). Navigation
  now commits instantly and paints a skeleton while data streams — same treatment
  as the Returns dashboard (SPEC-095).
- 2026-08-05 — **Shipped.** `/team-performance` rebuilt as a persistent shell
  (`layout.tsx` + `GorgiasShell`, gated by `activeGorgiasTab`) hosting the
  shared `DateRangePicker` + a tab bar, around four sub-tabs: Overview (KPI hero
  with vs-previous-period deltas colored per-metric, color-coded alerts strip,
  contact-reason/channel breakdown bars, click-through leaderboard),
  Conversations (search + status/agent filters, client-paginated table, CSV
  export via `<a download>` through the proxy, stretched-link rows → thread
  detail), Agents (mapping banner + leaderboard → agent detail with that
  agent's metrics + conversations), and Alerts (four color-coded lists).
  Detail routes (`/conversations/[id]`, `/agents/[id]`) render bare with a
  breadcrumb (`returnTo` guarded by `isSafeGorgiasReturnPath`). New data layer:
  `types/gorgias.ts`, `services/gorgias-workspace.ts`, `lib/gorgias-tabs.ts`,
  `lib/gorgias-filters.ts`. Compare defaults to `previous_period` so the
  Overview always shows deltas. Verification: `npx tsc --noEmit` clean,
  `npm run lint` clean, `npm test` 303 passed (14 new across
  `gorgias-tabs.test.ts` + `gorgias-filters.test.ts`), `npm run build`
  compiles all six routes. Semantic tokens only; zero entrance animation; no
  Framer Motion.
- **Manual verification checklist** (Rule 4 — no jsdom runner): [ ] each tab
  loads on the live backend; [ ] date range changes all tabs; [ ]
  search/status/agent filter + client pagination + CSV export on Conversations;
  [ ] row → thread detail → back returns to the same tab/filters; [ ] agent row
  → agent detail; [ ] alerts color-coded, empty sections show "all clear"; [ ]
  empty state when unsynced; [ ] verified in light + dark themes.
- 2026-08-05 — **Surfaced the SPEC-089 Shopify/Loop context.** Conversation
  table's refund column now shows the customer's Shopify refund total (currency,
  labeled "Cust. refund"); the customer cell's order number is the customer's
  latest Shopify order. Thread detail gained a **"Customer's Shopify history"**
  panel (order count, latest order + status, Shopify refund total, Loop exchange
  total) with explicit "customer-level, not ticket-exact" copy. Leaderboard +
  agent detail gained a **Refund exposure** column (labeled association).
  Conversations controls gained a **contact-reason dropdown** (options from the
  list response's `reasons`). Types extended (`customer_matched`,
  `customer_order_count`, `latest_order_status`, `exchange_amount`,
  `refund_exposure`). tsc + lint clean, 303 tests pass, build compiles.
- **Cleanup note:** the pre-existing `features/team-performance/agent-metrics-table.tsx`
  and `services/team-performance.ts`'s `getGorgiasAgentMetrics` (single-day
  `/gorgias/metrics`) are no longer mounted (the leaderboard + range overview
  supersede them) but left in place — they remain valid, and SPEC-081/the
  single-day endpoint still reference them. Remove in a dedicated cleanup if the
  old page is formally retired.
- 2026-08-06 — **Conversation-detail UX + workspace defaults (4 fixes).**
  (1) **Message parsing:** `lib/format-message.ts` `cleanMessageBody` strips
  tracking URLs, marketing/footer boilerplate (unsubscribe, "UNLOCK PERKS",
  copyright), collapses blank runs, and dedupes repeated lines — the thread now
  reads cleanly instead of dumping raw emails (6 vitest cases). (2) **Sticky
  layout:** thread detail uses `lg:items-start` + `lg:sticky lg:top-6` on the
  sidebar, so the status/Shopify panel stays in view while the message column
  scrolls. (3) **Default range:** `withWorkspaceDefaultRange` defaults the whole
  workspace to **Last 30 days** (not "today") — support metrics over a single
  day were near-empty (0 CSAT responses / ~1 refund), making Overview + columns
  look broken on landing. (4) **Refund column → lifetime:** the per-conversation
  "Cust. refund"/exchange now shows the customer's all-time total (a customer
  attribute), not range-scoped — range-scoping stays on the Overview KPIs only.
  tsc + lint + 309 tests + build green.
- 2026-08-06 — **Agents-tab UI polish (presentation only — no data/logic/columns
  changed).** Owner: "all ok, just enhance this page UI." (1) **Unmapped-agents
  banner is now collapsible + compact** (`unmapped-agents-banner.tsx`): 32 stacked
  input rows had pushed the actual leaderboard below the fold. Collapsed by default
  to a single summary header ("N Gorgias agents aren't linked … · Map agents ▸");
  expanding reveals the same rows, now with an avatar-initials chip and tighter
  spacing. All save logic/state untouched. (2) **Leaderboard is now a real ranked
  table** (`leaderboard-table.tsx`, shared by Overview + Agents): a card header
  ("Agent leaderboard" + agent count), a **rank column** (#1–#3 get a tinted medal
  chip, rest a muted number), **avatar initials** beside each name, and uppercase
  tracked header labels. Row-as-stretched-link, columns, and every value are
  byte-for-byte the same — pure restyle. New pure helper `lib/initials.ts`
  (+ vitest). Tokens only, both themes, no entrance animation. tsc + lint + tests
  + build green.

- 2026-08-07 — **Agents tab → podium + paginated leaderboard (owner: make it
  beautiful, like a real leaderboard).** Replaced the flat all-agents table with:
  a **top-3 human podium** (`agent-podium.tsx`, 2·1·3 with the champion elevated +
  crown, avatar, resolved headline, CSAT/response secondary), then **the rest of
  the team as a client-paginated table** (`paginated-leaderboard.tsx`, 10 rows/
  page, rank 4+, page clicks re-render only the body — no navigation), and an
  **automation strip** (`automation-strip.tsx`) pooling bot accounts out of the
  human ranking. Ranks by resolved (backend SPEC-074 patch), humans-only podium
  via the new `is_bot` flag. `LeaderboardTable` stays for the Overview tab.
  Tokens only, both themes, no entrance animation. tsc + lint + 333 tests + build
  green.
