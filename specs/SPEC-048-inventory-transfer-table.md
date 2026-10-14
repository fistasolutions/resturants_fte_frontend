# SPEC-048 — Inventory Transfer Table (Warehouse → Store)

**Status:** In progress  
**Date:** 2026-07-24  
**Repo:** Frontend  
**Depends on:** Backend SPEC-043

---

## Problem

The Inventory Analyst page has no visual representation of the warehouse
misallocation problem — the client's single biggest inventory concern per
V2 proposal §4.6. The by-location table shows the gap exists; nothing
tells them what to move, how much, or how urgently.

## Solution

A new `TransferTable` server component placed near the top of the inventory
page, below verdict tiles. It renders:

1. **Hero card** — "N products stranded · X units · $Y at risk" with urgency
   tone when critical products exist
2. **Transfer table** — sorted by urgency; each row shows product, warehouse
   stock, store stock, units sold, days of cover (urgency-coded), and
   suggested transfer quantity
3. **AI Transfer Plan** — `AiCommentary` with `initialCommentary` from server
   fetch, describes the transfer sequence in plain language

All three sections load server-side — no client skeleton, no loading state.

## New files

- `features/analysis/transfer-table.tsx` — pure server component
- Updates to `app/(app)/inventory/page.tsx`
- Updates to `services/analysis.ts`
- Updates to `types/analysis.ts`

## Types

```typescript
export type TransferUrgency = "critical" | "high" | "medium" | "low";

export interface InventoryTransfer {
  product_id: number;
  title: string;
  warehouse_units: number;
  store_units: number;
  units_sold: number;
  daily_rate: number;
  days_of_cover: number;
  suggested_transfer: number;
  revenue_at_risk: number;
  urgency: TransferUrgency;
}

export interface TransferSummary {
  products_misallocated: number;
  total_units_to_transfer: number;
  revenue_at_risk: number;
}

export interface InventoryTransfers {
  warehouse_location: string;
  summary: TransferSummary;
  transfers: InventoryTransfer[];
}
```

## Design decisions

- Urgency row: critical = `text-destructive` + red pill, high = `text-warning`
  + amber pill, medium = amber text, low = muted
- "→ Move N" quantity shown in `text-primary font-semibold`  
- Hero card uses `border-destructive/30 bg-destructive/5` if any critical;
  `border-warning/30 bg-warning/5` if any high; neutral if only medium/low
- Empty state (no transfers): ShieldCheck card "All products well-positioned"
- "Ask why →" links to `/chat?q=` pre-loaded question per product

## Acceptance criteria

- [ ] TransferTable renders with zero client-side loading
- [ ] Hero card reflects correct totals
- [ ] Urgency colours correct for all 4 tiers
- [ ] AI plan renders without skeleton (initialCommentary prop)
- [ ] "Ask why →" navigates to chat with pre-loaded question
- [ ] Empty state renders when transfers = []
- [ ] Build green, tsc clean, Vitest green
