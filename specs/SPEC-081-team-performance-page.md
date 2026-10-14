# SPEC-081 — Team Performance Page (Gorgias per-agent metrics)

## Problem

Backend SPEC-074 built the read-only Gorgias connector, agent → staff
mapping, and per-agent metrics API — nothing on the frontend surfaces any of
it yet. Client wants a real page: for each support agent, tickets answered/
resolved, response speed, resolution speed, reopens, CSAT, and end-of-day
open backlog, plus a way to resolve unmapped agents (A-06 — surfaced, never
hidden).

## Design

### Nav

`lib/navigation.ts`: new top-level item **"Team Performance"**
(`/team-performance`, `Headset` icon) — its own tier, not nested under
Integrations (credential config) or Results (decision outcomes), matching
the placement reasoning from the earlier UI mockup.

### `types/team-performance.ts`

```ts
export interface GorgiasAgentSummary {
  gorgias_agent_id: number;
  name: string;
  email: string;
  staff_name: string | null;
  mapped: boolean;
}

export interface GorgiasAgentMetric {
  gorgias_agent_id: number;
  name: string | null;
  email: string | null;
  staff_name: string | null;
  mapped: boolean;
  tickets_answered: number;
  tickets_resolved: number;
  avg_first_response_seconds: number | null;
  avg_resolution_seconds: number | null;
  reopened_count: number;
  csat: number | null;
  open_backlog_eod: number;
  upsell_amount: number | null;
}
```

### `services/team-performance.ts`

`getGorgiasAgents()` → `GET /gorgias/agents`; `getGorgiasAgentMetrics(date?)`
→ `GET /gorgias/metrics?date=`, both via `serverApi` (RSC-side).

### `lib/format-duration.ts`

`formatDuration(seconds: number | null): string` — `null` → `"—"`; under a
minute → `"<1m"`; otherwise `"1h 20m"` / `"18m"` style, matching the
`HoursChip` duration-formatting convention already used elsewhere in this
repo. Pure logic → unit-tested in `tests/format-duration.test.ts` (root
Rule 4).

### `app/(app)/team-performance/page.tsx`

Server component. `searchParams: Promise<{ date?: string }>` (URL is the
source of truth — Today/Yesterday links, not client state, matching this
repo's established convention). Fetches agents + metrics for the day in
parallel (`Promise.all`, root Rule 5). States:
- **Zero agents synced at all** → empty state: "No Gorgias data synced yet"
  + a link to Integrations (not a crash, not a blank table — root Rule 6).
- **Some agents unmapped** → `UnmappedAgentsBanner` above the table.
- Otherwise → `AgentMetricsTable`.

### `features/team-performance/agent-metrics-table.tsx`

Server component, pure display. Columns: Agent (staff name if mapped, else
the raw Gorgias name + an "unmapped" badge), Answered, Resolved, Avg First
Response, Avg Resolution, Reopened, CSAT (color-coded: green ≥4.5, amber
≥3.5, red below — semantic tokens only, root Rule 9), Open (EOD) (flagged
if > 0), Upsell $ (em dash — not yet trackable, never fabricated).

### `features/team-performance/unmapped-agents-banner.tsx`

Client component (needs interactivity): one row per unmapped agent, a text
input + Save button, `PUT /api/proxy/gorgias/agents/{id}/mapping`, then
`router.refresh()` — same per-row save-state pattern as
`location-managers-card.tsx` (idle/saving/saved/error).

## Non-goals

- No date-range+compare — Today/Yesterday plus a plain date input is the
  complete scope (mirrors backend SPEC-074's single-day scope decision).
- No editing/removing an agent mapping once set from this page (only the
  unmapped banner writes) — not asked for.
- Not touching the Gorgias card on `/integrations` beyond already adding the
  `email` field there (small, separate patch, done alongside this).

## Acceptance Criteria

1. `/team-performance` reachable from the sidebar, its own nav tier.
2. Zero synced agents → clear empty state, not a crash or blank table.
3. Unmapped agents are visible and resolvable inline; mapping a name makes
   it reflect immediately on refresh.
4. Today/Yesterday navigation changes the URL and the data shown.
5. `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` all green.

## Testing Plan

`tests/format-duration.test.ts` covers the one new pure-logic unit
(duration formatting). No component/jsdom runner exists yet, so the page's
states (empty/unmapped/populated) are verified via a manual checklist in
the browser before calling this done.
