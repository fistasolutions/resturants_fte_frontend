# SPEC-041 — Morning Brief Page

**Repo:** `ecommerce-fte-frontend`  
**Spec date:** 2026-07-23  
**Backend contract:** SPEC-036-morning-brief-api  
**Status:** In progress

---

## 1. Goal

Add the **Morning Brief** page at `/brief` — the V2 centerpiece. The client
lands here every morning, reads the greeting, acts on 0–3 prepared decision
cards, glances at overnight watch and KPIs, and is done in 10 minutes.

Design reference: `ref/Platform_Mockup.html` — Morning Brief section.
Design system: `docs/Design.md`, tokens from `globals.css`. No Framer Motion.
Light mode default.

---

## 2. Route

`app/(app)/brief/page.tsx` — Server Component, `export const dynamic = "force-dynamic"`.

Navigation entry: added **first** in `lib/navigation.ts` with a `Sun` icon and
a `"NEW"` badge variant. Dashboard stays at `/` (no home-route change).

---

## 3. Data flow

```
page.tsx (server)
  └─ services/brief.ts → GET /api/v1/brief  (serverApi)
       └─ returns BriefData (types/brief.ts)

DecisionCard (client, "use client")
  └─ on Approve / Skip → POST /api/proxy/brief/actions  (clientApi)
       └─ updates local optimistic state, no full re-fetch
```

The page fetches via `serverApi` on the server; action POSTs go through the
Next.js proxy (`/api/[...path]`) as `clientApi` calls from the client component.

---

## 4. Page layout

```
<main class="space-y-8 p-4 md:p-6">

  <BriefHeader />          ← greeting line + yesterday one-liner

  <section>
    <SectionLabel>⚡ Decisions waiting</SectionLabel>
    <DecisionCard /> × 0–3   ← if 0, shows <NoDecisionsState />
  </section>

  <section>
    <SectionLabel>🌙 What I watched overnight</SectionLabel>
    <OvernightWatch />       ← 4 status tiles in a 2×2 or 4-col grid
  </section>

  <section>
    <SectionLabel>Your business at a glance — yesterday</SectionLabel>
    <BriefKPIs />            ← 5 KPI tiles
  </section>

  <section>
    <SectionLabel>What I can see</SectionLabel>
    <BriefCoverage />        ← 3 integration cards
  </section>

  <BriefTrustBar />          ← 3 trust statements

</main>
```

---

## 5. Component specs

### 5.1 `BriefHeader` (server, `features/brief/brief-header.tsx`)

Props: `{ greeting: string; date: string; yesterday: BriefYesterday }`

Renders:
- H1: `"Good {greeting} 👋 — {date formatted as 'Wednesday, July 22'}"`
- One-liner beneath: `"Yesterday: {revenue} ({delta}% vs last {weekday}) · {orders} orders · {N} decisions waiting."`
  - Revenue in green (`text-emerald-700 dark:text-emerald-400`), delta with `▲`/`▼` arrow
  - 0 decisions → omit "N decisions waiting" clause

### 5.2 `DecisionCard` (client, `features/brief/decision-card.tsx`)

Props: `{ decision: BriefDecision; onAction: (type, action) => Promise<void> }`

States: `idle` | `acting` | `approved` | `skipped`

Initial state derived from `decision.state` (server-rendered state).

**Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│ Headline text ─ AMOUNT in {risk=danger / opportunity=emerald}   │
│ Why text (text-muted-foreground, text-sm)                       │
│                                                                 │
│ ┌─ evidence block (bg-muted/50, rounded-lg, p-3) ────────────┐ │
│ │ TAG IN CAPS (text-xs text-muted-foreground)                 │ │
│ │ • Label: value (detail)                                     │ │
│ │ • …                                                         │ │
│ │ Definition: italic small text                               │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ [Primary action btn]  [View btn]  [Skip ghost]  prepared at→   │
└─────────────────────────────────────────────────────────────────┘
```

**Approved state:**  
Card border turns `border-emerald-200 dark:border-emerald-800`,
bg `bg-emerald-50/40 dark:bg-emerald-950/20`. Action row replaced by:
`"✓ Approved — recorded at HH:MM AM"` in `text-emerald-700`.

**Skipped state:**  
Card opacity `opacity-60`. Action row replaced by:
`"Skipped for today — comes back tomorrow if still true"` in `text-muted-foreground`.

Both state changes are **optimistic**: update local state immediately on button
click, fire the POST in background. On POST error, revert state and show an
inline `"Could not save — try again"` error (no toast, no redirect).

**Animations:** none. State transitions are instant CSS class swaps.

**Primary action label by decision type:**
- `unfulfilled_48h` → `"Mark as done ✓"`
- `transfer_opportunity` → `"Approve transfer ✓"`
- `dormant_vips` → `"Export list ✓"`

### 5.3 `OvernightWatch` (server, `features/brief/overnight-watch.tsx`)

Props: `{ items: BriefWatchItem[] }`

4-column grid (2-col on mobile). Each tile is a `card` (shadcn Card):
- Status dot: `●` in `text-emerald-600` (ok) or `text-amber-500` (warn) or `text-destructive` (error)
- Title: `font-medium text-sm`
- Detail: `text-xs text-muted-foreground mt-0.5`
- Tiles with `href` are wrapped in a `<Link>` — the whole card is clickable

### 5.4 `BriefKPIs` (server, `features/brief/brief-kpis.tsx`)

Props: `{ kpis: BriefYesterdayKpis }`

5-column grid (2-col on mobile, 3-col on sm). Each tile (shadcn Card):
```
label (text-xs text-muted-foreground uppercase tracking-wide)
value (text-2xl font-semibold tabular-nums)
delta (text-xs, ▲ text-emerald-600 / ▼ text-destructive / — text-muted)
```

KPI order: Revenue, Orders, AOV, New Customers, Refunds.

Delta display:
- Revenue/Orders/AOV/NewCustomers: show `▲ N%` or `▼ N%` vs last same weekday
- Refunds: show `N% of revenue` (no delta arrow — it's a rate)

### 5.5 `BriefCoverage` (server, `features/brief/brief-coverage.tsx`)

Props: `{ items: BriefCoverageItem[] }`

3-column grid. Each card:
- Name + status badge: `Connected` (emerald), `Next` (amber), `Planned` (muted)
- Detail text

### 5.6 `BriefTrustBar` (server, `features/brief/brief-trust-bar.tsx`)

No props. Static. Three statements in a flex-wrap row:
- `"Every number computed — never guessed by AI"`
- `"Every claim shows its evidence — the math is on the card"`
- `"Nothing is sent without your approval — you hold the only green button"`

Separated by `·`. `text-xs text-muted-foreground`. Border-top separator above.

### 5.7 `NoDecisionsState` (server, `features/brief/no-decisions-state.tsx`)

Shown when `decisions.length === 0`. A muted card:
`"✓ No decisions today — everything is running smoothly."`

---

## 6. TypeScript types — `types/brief.ts`

```typescript
export type DecisionSentiment = "risk" | "opportunity";
export type DecisionState = "approved" | "skipped" | null;
export type WatchStatus = "ok" | "warn" | "error";
export type CoverageStatus = "connected" | "coming" | "planned";

export interface BriefEvidenceItem {
  label: string;
  value: string;
  detail: string;
}

export interface BriefDecision {
  type: string;
  headline: string;
  amount: number;
  amount_label: string;
  sentiment: DecisionSentiment;
  why: string;
  evidence_tag: string;
  evidence_items: BriefEvidenceItem[];
  evidence_definition: string;
  view_href: string;
  state: DecisionState;
  acted_at: string | null;
}

export interface BriefWatchItem {
  key: string;
  status: WatchStatus;
  title: string;
  detail: string;
  href?: string;
}

export interface BriefYesterdayKpis {
  revenue: number;
  revenue_delta_pct: number | null;
  orders: number;
  orders_delta_pct: number | null;
  aov: number;
  aov_delta_pct: number | null;
  new_customers: number;
  new_customers_delta: number | null;
  refunds_total: number;
  refunds_pct_of_revenue: number | null;
}

export interface BriefYesterday {
  date: string;
  revenue: number;
  orders: number;
  revenue_delta_pct: number | null;
}

export interface BriefCoverageItem {
  key: string;
  name: string;
  status: CoverageStatus;
  detail: string;
}

export interface BriefData {
  generated_at: string;
  yesterday: BriefYesterday;
  decisions: BriefDecision[];
  overnight_watch: BriefWatchItem[];
  yesterday_kpis: BriefYesterdayKpis;
  coverage: BriefCoverageItem[];
}
```

---

## 7. Service — `services/brief.ts`

```typescript
import { serverApi } from "@/lib/api";
import type { BriefData } from "@/types/brief";

export async function getBriefData(): Promise<BriefData> {
  return serverApi<BriefData>("/brief");
}
```

Client-side action (in `decision-card.tsx`, uses `clientApi`):
```typescript
export async function postBriefAction(
  decisionType: string,
  action: "approved" | "skipped",
): Promise<void>
```

---

## 8. Navigation update — `lib/navigation.ts`

Add to the **top** of `navItems`:
```typescript
{ title: "Morning Brief", href: "/brief", icon: Sun, enabled: true, badge: "NEW" }
```

`NavItem` interface gains an optional `badge?: string` field. The sidebar
renders it as a small pill after the label when `badge` is set, using
`text-[9px] font-extrabold text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-950 rounded px-1`.

---

## 9. Files changed

| File | Action |
|---|---|
| `types/brief.ts` | NEW |
| `services/brief.ts` | NEW |
| `features/brief/brief-header.tsx` | NEW |
| `features/brief/decision-card.tsx` | NEW |
| `features/brief/overnight-watch.tsx` | NEW |
| `features/brief/brief-kpis.tsx` | NEW |
| `features/brief/brief-coverage.tsx` | NEW |
| `features/brief/brief-trust-bar.tsx` | NEW |
| `features/brief/no-decisions-state.tsx` | NEW |
| `app/(app)/brief/page.tsx` | NEW |
| `lib/navigation.ts` | update — add Morning Brief first + badge |
| `components/layout/app-sidebar.tsx` | update — render optional badge |
| `tests/brief.test.ts` | NEW |

---

## 10. Acceptance Criteria

- [ ] `/brief` renders with all four sections; `force-dynamic` is set
- [ ] Decision cards show correct headline, amount (color-coded), evidence block
- [ ] Approve → card transitions to approved state immediately (optimistic); POST fires
- [ ] Skip → card dims, skip note appears; POST fires
- [ ] POST error → state reverts, inline error shown
- [ ] 0 decisions → `NoDecisionsState` renders instead
- [ ] Overnight watch tiles with `href` are clickable links
- [ ] `Morning Brief` is first in sidebar with `NEW` badge
- [ ] Both light and dark themes render correctly (tokens only, no hardcoded colors)
- [ ] `npm test` green; `npm run build` passes
