# SPEC-114 — Store Traffic staffing nudge (Brief signal + manager send)

## Context / Why

Backend SPEC-114 closes the footfall loop: `GET /brief/traffic` returns a per-
under-performing-store staffing nudge (conversion gap, $ opportunity, busy hours,
manager email, sent state) + `/send` `/draft` `/history`, and adds a
`store_traffic_gap` item to `/brief/attention`. This is the frontend: the Needs-
Attention tile (auto-renders, zero change) links to a **review page** where the user
reviews each store's nudge and sends it to that store's manager via the shared
compose flow (SPEC-062) — mirroring the overdue/transfer send pattern exactly.

## Scope

- **Types** (`types/brief.ts`): `TrafficNudgeBusyHour`, `TrafficNudgeSheet`
  (`location_id, location, location_name, visitors, transactions, conversion_rate,
  benchmark_store, benchmark_rate, gap_pts, opportunity, avg_order_value, busy_hours[],
  manager_email, sent, sent_at`), `TrafficNudgeSheetsResponse`.
- **Service** (`services/brief.ts`): `getTrafficNudgeSheets()` → `serverApi("/brief/traffic")`.
- **Review** (`features/brief/traffic-review.tsx`, mirrors `OverdueReview`): per-store
  sidebar (name + gap badge + $ opportunity, sent/pending badge) → detail panel showing
  the conversion vs benchmark comparison, the $ opportunity, and the busy-hours table;
  a **"Send this nudge"** `Link` → `/brief/traffic/send/[locationId]`. Pure display +
  navigation; never sends itself.
- **Routes**:
  - `app/(app)/brief/traffic/page.tsx` — fetch `getTrafficNudgeSheets`, render
    `TrafficReview`; ApiError → error card.
  - `app/(app)/brief/traffic/send/[locationId]/page.tsx` — resolve the store name,
    render the shared `ComposePanel` at `/api/proxy/brief/traffic/{draft,send,history}`,
    `requestBody={{ location_id }}`.
- **No DecisionCard / BriefService change** — the entry point is the Needs-Attention
  tile linking to `/brief/traffic`.

## Design / perf (Rules 5/9)
Server-fetched page (RSC), client review component only for tab selection; semantic
tokens only; no Framer Motion; loading/empty/error states (empty = "no under-performing
stores"); responsive sidebar+detail like overdue. Reuses `ComposePanel`, the proxy,
`serverApi` — no new fetch waterfalls.

## Tests (Rule 4)
No pure `lib/`/`utils/` logic added (display + navigation only), so it ships with the
manual checklist below; `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build`
all green.

## Manual verification checklist
- [ ] Brief "Needs Attention": a "Store converting below benchmark" tile appears when a
      gap exists, linking to `/brief/traffic` (and hides when there's none).
- [ ] `/brief/traffic`: sidebar lists under-performing stores with gap + $ opportunity;
      detail shows conversion vs benchmark + busy-hours table.
- [ ] "Send this nudge" → compose page draft loads, AI self-writes, subject/body
      editable; Send records + returns; back on the review page the store shows ✓ Sent.
- [ ] Second send of the same store today is blocked (409 surfaced), sent badge sticks.
- [ ] Light + dark; mobile layout; error card on fetch failure.

## Acceptance Criteria
- [ ] Needs-Attention tile → `/brief/traffic` → per-store compose → send works end to end.
- [ ] `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` green (output pasted).
