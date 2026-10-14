# SPEC-089 — "Dead Stock" tab + remove the Transfers/Dead-Inventory duplication

## Context / Why

After SPEC-086 (unified Transfer Plan on the Transfers tab), the **store→store**
signal appeared in **two tabs**: the Transfers plan *and* the "Dead Inventory" tab
(which is the store→store "dead here, selling there" alert). Same styles, two places —
confusing.

Client decision: **Transfers owns both transfer directions**; the "Dead Inventory" tab
should stop showing store→store and instead be about stock that won't sell *anywhere*
(markdown/liquidation candidates).

Investigation finding baked into this spec: truly-dead/aging stock **already** has views
(`DeadStockSection` on the Overstock & Movers tab, and the AI `markdown-plan` page). So
the move is a **re-home + relabel**, not new analytics — and the store→store alert's
**manager-nudge send** (SPEC-056/062/064) is preserved untouched, just no longer a tab.

## Scope (frontend only — no backend, no new data)

1. **Rename the tab** `dead-inventory-alerts` → **`dead-stock`** ("Dead Stock"), new
   base route `/inventory/dead-stock`. `hasRange: false` (fixed aged-stock lookback).
2. **New `/inventory/dead-stock` tab page** = truly-dead view: the aged-bucket
   `DeadStockSection` (reused) over a 365-day window + its built-in CTA into the AI
   Markdown Plan. No store→store here.
3. **Keep the store→store misplaced alert + send fully intact** at its existing route
   `/inventory/dead-inventory-alerts`, but it is **no longer a tab**. Because the
   inventory shell only paints its header on exact tab routes, this page now renders
   bare — so it gets **its own breadcrumb + header**, relabeled **"Misplaced stock"**.
4. **Dashboard card**: the "Dead Inventory" card's data is the store→store signal
   ("selling elsewhere"), so relabel it **"Misplaced stock"** (keeps its
   `/inventory/dead-inventory-alerts` link — which preserves the manager-nudge entry
   point, so nothing is orphaned).
5. Update the shell's non-range tab description to describe dead stock.

**Out of scope**: Overstock & Movers is untouched (its dead-stock teaser is a summary,
not the store→store duplicate). No route deletions, no backend changes, send flow
unchanged.

## Behavior

- Inventory tab bar shows **Dead Stock** (truly-dead) instead of **Dead Inventory**.
- **Transfers** remains the only tab showing store→store — the duplication is gone.
- Old `/inventory/dead-inventory-alerts` still resolves (now titled "Misplaced stock",
  with its own header) — reachable from the dashboard; its send/history/detail flow is
  unchanged.

## Acceptance Criteria

1. Inventory tabs show "Dead Stock" at `/inventory/dead-stock`; it renders the aged
   dead-stock view (buckets + markdown CTA) and **no** store→store content.
2. No inventory tab shows the store→store "dead here, selling there" list — only the
   Transfers plan does.
3. `/inventory/dead-inventory-alerts` still renders the store→store alert + send, now
   with its own breadcrumb/header titled "Misplaced stock" (no missing header).
4. Dashboard card reads "Misplaced stock" and links to `/inventory/dead-inventory-alerts`.
5. The manager-nudge send/draft/history flow is unchanged and reachable.
6. `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` all green.

## Manual verification checklist

- [ ] Inventory tab bar: "Dead Stock" present, "Dead Inventory" gone.
- [ ] Dead Stock tab shows aging buckets + "Build markdown plan" CTA; no store→store.
- [ ] Transfers tab still shows the store→store rows (the only place now).
- [ ] Dashboard "Misplaced stock" card opens `/inventory/dead-inventory-alerts`, which
      has its own header and the working "send to manager" action.
- [ ] Dark/light + mobile hold; nothing animates in on load.
