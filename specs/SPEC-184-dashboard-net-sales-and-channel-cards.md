# SPEC-184 — Dashboard: net-sales waterfall + channel-correct location cards

Status: implemented
Depends on: backend SPEC-201 (net sales), backend SPEC-202 (channel cards), SPEC-055 (location cards)

## Problem (client, two messages)

1. > "On dashboard tab can you please add under revenue discounts and returns and then
   > do net sales so we have full picture."

2. He circled the "Online Store" revenue on a location card: *"This number is not
   correct."* Verified — 26% of that card was app channels and draft orders, not the
   online store (backend SPEC-202).

## Design

### Net-sales waterfall

A new `NetSalesWaterfall` card sits directly beneath the KPI row, so "under revenue"
means what he meant. Four rows, each a label and an amount:

```
Gross sales                     $629,241.23
Discounts                       −$657,749.62
Returns                          −$338,018.26
─────────────────────────────────────────────
Net sales                        $…
```

Deductions render in `text-destructive` with an explicit minus sign; net sales is the
emphasised total above a border. The card carries a one-line note naming the basis —
*"Before tax and shipping, matching Shopify's Sales report"* — because the headline
Revenue KPI above it uses a different basis and the two will not tie. Without that line
the card creates the exact confusion it exists to remove.

Values come from the new backend fields; nothing is computed in the browser (root
Rule 8). The card renders only when `gross_sales` is present, so an older backend
degrades to the current dashboard rather than showing zeros.

### Location cards

The backend now returns one card per POS location *and* per sales channel, each with a
`channel` field (null for physical locations). Two presentation changes:

- Channel cards take a `Globe` icon; physical locations keep `MapPin`. Same card,
  different mark — a reader should not have to read the name to know which is which.
- The "Review orders" link drops its `?location=` param for channel cards, which have no
  location id — it previously fell through to an unfiltered list, which was misleading
  rather than merely unhelpful.

No change to card layout, ordering or the mini chart.

## Acceptance Criteria

- [x] `NetSalesWaterfall` renders under the KPI row: gross sales, discounts, returns,
      net sales.
- [x] Deductions show a minus sign and destructive colour; net sales is visually the
      total.
- [x] The basis note is present, explaining why it differs from the Revenue KPI.
- [x] Card is omitted entirely when the backend does not supply `gross_sales`.
- [x] `LocationKpi` carries `channel`; channel cards use `Globe`, locations `MapPin`.
- [x] Channel cards link to unfiltered `/orders/review` with no `location` param.
- [x] All amounts use `formatCurrency`; tokens only, no hardcoded colours (Rule 9).
- [x] `npm test` green (adapter unit tests for the waterfall + channel passthrough).
- [x] `npx tsc --noEmit` clean; `npm run build` passes.

## Manual verification checklist

(No component test runner exists — root Rule 4.)

- [ ] Dashboard shows the waterfall under the KPIs; net sales = gross − discounts − returns.
- [ ] "Online Store" card revenue now matches Shopify's Online Store channel report.
- [ ] "Draft Orders" and "Other apps" cards appear with a globe icon.
- [ ] Sum of all location + channel card revenue is unchanged from before the split.
- [ ] Light and dark themes both legible.

## Patches

### Duplicate React key on the split cards (client-reported console error)

`LocationCards` keyed each card `loc.location_id ?? "online"`. That was unique while
exactly one card had a null `location_id`; after SPEC-202 split the no-location bucket
there are three — Online Store, Draft Orders, Other apps — and all three keyed as
`"online"`, so React warned *"Encountered two children with the same key"* and could
duplicate or omit cards.

Keyed on the channel instead: `loc.location_id ?? \`channel:${loc.channel ?? loc.name}\``.
The channel name is unique per card by construction — the service merges rows sharing a
humanised name — so it is a stable identity across re-renders, which is what a key must be.

`features/discounts/location-table.tsx` uses the same `?? "online"` idiom but is fed by
`DiscountAnalyticsService`, whose query was not part of SPEC-202 and still returns a
single null-location row. Left unchanged.

- [x] Each card has a unique key; the console warning is gone.
- [x] No other consumer of `LocationKpi` exists (only `location-cards.tsx`).
- [x] `npm test` green; `npx tsc --noEmit` clean; `npm run build` passes.
