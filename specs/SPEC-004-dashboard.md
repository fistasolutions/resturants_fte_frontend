# SPEC-004 — Dashboard Page & AI Analyst Panel

**Status:** Implemented
**Phase:** 1 — Frontend Foundation (docs/Phases.md)
**Governing docs:** ../docs/prd.md §3 (Dashboard, AI Insight), ../docs/Design.md
§13–§16/§19/§21, approved dashboard mockup, root CLAUDE.md Rules 5/6/8/9

## Goal

The landing page (`/`) of the app: the full Business Intelligence dashboard from the
approved mockup — KPI cards, revenue chart, top products, alert cards, recent orders,
sales-by-channel donut — plus the docked **AI Business Analyst** panel on the right.
All data flows from `services/` (SPEC-002); zero values are computed in components.

## Layout (mockup)

- Content grid (left, scrollable) + AI panel (right, `xl:` and up only; below `xl`
  the panel sits after the grid in normal flow).
- Content order: page header → 5 KPI cards → (Revenue Overview ⅔ + Top Products ⅓) →
  4 alert cards → (Recent Orders ⅔ + Sales by Channel ⅓).

## Components (each single-responsibility, `features/dashboard/`)

- `dashboard-header.tsx` — time-of-day greeting (server-rendered) + "Here's what's
  happening with your store today." + period chip (calendar icon + `periodLabel`) +
  comparison chip (`comparisonLabel`). Chips are static display in Phase 1 — period
  selection wires up with real data in Phase 8 (documented here, not a placeholder:
  they render the period the data describes).
- `kpi-card.tsx` — icon tile (per-KPI token color: revenue=info, orders=ai,
  aov=primary, returning=warning, new customers=success), label, formatted value,
  delta line (`formatChange`, success/destructive by sign, ↑/↓ arrow) + "vs yesterday".
- `revenue-chart.tsx` (client) — Recharts line chart via shadcn `ChartContainer`:
  solid `--chart-1` line = This Week, dashed muted line = Last Week; compact currency
  Y-axis; tooltip with full values; legend as in mockup.
- `top-products.tsx` — ranked list (1–5): rank number, product icon tile, name,
  revenue (formatted), order count; "View all" button (→ `/products`, disabled until
  that page ships, consistent with nav).
- `alert-card.tsx` — icon tile + count/value + caption + "View details" link (same
  disabled-until-route-exists behavior). Variants: low stock (warning), out of stock
  (destructive), high discounts (ai), refunds (success/neutral money icon).
- `recent-orders.tsx` — table: order #, customer, total, status badge
  (paid=success, pending=warning, refunded=destructive), date; "View all".
- `channel-donut.tsx` (client) — Recharts donut of channel shares with legend +
  percent labels, chart token colors.
- `ai-panel.tsx` (client) — docked analyst chat:
  - Header: sparkle mark (ai token), "AI Business Analyst", Online status dot.
  - Intro card: greeting + capabilities + "Try asking:" suggested prompt buttons
    (from `services/chat.getSuggestedPrompts`).
  - Conversation: user bubbles (primary bg, right) / assistant bubbles (card bg,
    left), timestamps, auto-scroll to newest.
  - Composer: input + send (disabled while empty/awaiting reply), Enter submits.
  - Assistant "typing" state = pulsing dots (skeleton-style, allowed motion).
  - Footer disclaimer: "AI can make mistakes. Verify important data."
  - Replies come from `services/chat.getAssistantReply` (mock; streamed API in
    Phase 8 behind the same service).

## Non-negotiables

- Tokens only; no entrance animations (chart draw + skeleton pulse + hover states are
  the only motion); semantic HTML (`<table>`, lists, headings hierarchy — one `<h1>`).
- Server components except the two charts and the AI panel.
- Page fetches via `Promise.all` (dashboard + prompts) — no waterfalls.

## Acceptance Criteria

1. `/` reproduces the mockup structure with mock values from SPEC-002 exactly.
2. AI panel: clicking a suggested prompt or sending text yields the canned analyst
   reply in a bubble; input clears; auto-scrolls; disabled states correct.
3. All statuses/alerts readable by text, not color alone.
4. Responsive: 5→2→1 KPI columns; chart/list stack below `lg`; AI panel drops below
   content under `xl`; usable at 375px.
5. No hardcoded colors; no framer-motion; nothing animates on load.
6. `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` all green.

## Manual verification checklist

- [ ] Load `/`: all sections render instantly, correct values, no motion.
- [ ] Send "What were yesterday's sales?" → sales summary bubble.
- [ ] Keyboard: Tab through prompts → input → send; Enter sends.
- [ ] 375px/768px/1280px/1600px breakpoints look correct.
