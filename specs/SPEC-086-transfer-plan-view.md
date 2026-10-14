# SPEC-086 — Transfer Plan view (money-ranked, on the Transfers tab)

## Context / Why

The Inventory Analyst **Transfers tab** currently shows a warehouse→store table
(`TransferTable`) plus a small "Browse by store →" link to the otherwise-hidden
store→store index. The two transfer directions are split, unranked against each other,
and the store→store one is effectively undiscoverable.

Backend SPEC-084 now exposes `GET /analysis/inventory/transfer-plan`: both directions
merged into one list ranked by **dollar opportunity**, with a plain-language `reason`
per row. This spec surfaces that as the **hero of the Transfers tab** — the
"make these moves this week, biggest dollars first" list — which is the value Shopify
itself never provides (it shows stock; it never says what to move, how much, worth how
much).

Purely **additive**: the new `TransferPlan` section renders *above* the existing
`TransferTable` + store-transfers link, which stay as the per-direction detail views.
No existing behavior is removed (root RULE 7).

Conforms to `docs/Design.md` (semantic tokens only, no entrance animations — root
RULE 9) and root RULE 8 (all numbers arrive computed; the UI only formats/presents).

## Scope

**In scope**

- `types/analysis.ts`: `TransferPlan`, `TransferPlanRow`, `TransferPlanSummary`, etc.
- `services/analysis.ts`: `getTransferPlan(query)` (null on failure).
- `lib/transfer-plan.ts`: pure, unit-tested view helpers (direction label, action
  href/label) — the only non-presentational logic.
- `features/analysis/transfer-plan.tsx`: the ranked view (summary card + ranked rows).
- `features/inventory/inventory-page-content.tsx`: on `tab === "transfers"`, fetch the
  plan **in parallel** with the panel (root RULE 5, no waterfall) and render
  `<TransferPlan>` above the existing content.

**Out of scope**

- No new send action. Warehouse rows link to the existing Morning-Brief warehouse
  transfer review/send (`/brief/transfers`); store→store rows link to the existing
  read-only per-store drill-down (`/inventory/store-transfers/{id}`).
- No change to `TransferTable`, the store-transfers index, or the tab model.

## UI (premium redesign)

The v1 of this view read as a flat, undesigned list (weak hierarchy, floating figures,
generic gray pills). This is the redesign to Design.md's premium bar (Linear/Vercel/
Stripe). Money is the single color hero; direction is shown iconographically; urgency is
the only status color; brand red is never used (identity-only, RULE 9).

**Section header**: a real `<h2>` "Transfer Plan" + one-line subtitle ("The
highest-value stock moves to make now — ranked by dollars."). Not a tiny uppercase
label.

**Summary hero** (`Card`): the `total_opportunity_value` as a large `text-3xl
font-semibold tabular-nums` anchor with an uppercase micro-label and a one-line caption,
beside a 2-up grid of bordered mini-stats — **Warehouse → Store** (`Warehouse` icon) and
**Store → Store** (`ArrowRightLeft` icon) — each showing `{n} moves` and `${value}`.

**Ranked rows** (`Card` each, most valuable first) — aligned columns, not a free-flow
line:

- **Rank** `01, 02…` (muted, tabular) — makes the ranking legible at a glance.
- **Money block**: `opportunity_value` at `text-xl font-semibold tabular-nums` with an
  uppercase "Opportunity" micro-label — the visual hero, right-aligned in a fixed column.
- **Icon tile**: a rounded `bg-muted` tile with the `Warehouse` (warehouse→store) or
  `ArrowRightLeft` (store→store) icon — direction read by shape, not by a status color.
- **Content**: direction label (uppercase micro) + optional urgency pill (warehouse
  critical/high only, `--destructive`/`--warning`); product `title` (`font-medium`,
  truncates with `title` attr); `reason` (`text-muted-foreground`); a **route line** —
  `from_location` pill → destination pill (warehouse shows "Stores") + a "Move N" chip.
- **Urgency accent**: a thin left stripe on the card for critical (`--destructive`) /
  high (`--warning`) warehouse rows; none otherwise.
- **Action**: a real shadcn `Button` (`variant="outline" size="sm"`, `asChild` → `Link`,
  trailing `ChevronRight`):
  - warehouse row → `/brief/transfers`, "Review & send".
  - store→store row → `/inventory/store-transfers/{to_location_id}`, "Review at
    {to_location}".

**Responsive**: rows are `flex-col` on mobile → `sm:flex-row`; rank+money share a row
above the content on narrow widths; the action wraps below. No horizontal page scroll.

**States**: loading via the tab's Suspense skeleton; empty → a calm "No transfers needed
right now — every in-demand style is where it sells." (not an error); plan fetch failure
→ section simply omitted, existing tables still render. Keyboard-navigable, semantic list
markup. **No entrance animation** — renders in final position (RULE 9).

## Acceptance Criteria

1. Transfers tab shows a "Transfer Plan" section above the existing warehouse table.
2. Rows are ordered by `opportunity_value` descending, both directions interleaved.
3. Each row shows: dollar value, direction badge, title, reason, from→to, suggested
   units, and a working action link (correct href per direction).
4. Summary card shows total + per-direction breakdown from `summary`.
5. Warehouse rows link to `/brief/transfers`; store→store rows link to
   `/inventory/store-transfers/{to_location_id}`.
6. Plan is fetched in parallel with the panel (no added waterfall).
7. Empty plan → calm empty state; failed fetch → section omitted, tables still render.
8. Only semantic tokens; no hardcoded colors; no entrance animation.
9. `lib/transfer-plan.ts` helpers unit-tested (Vitest) and green.
10. `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` all green.

## Manual verification checklist (no jsdom runner yet — RULE 4)

- [ ] `/inventory/transfers` renders the ranked plan; top row is the largest `$`.
- [ ] A warehouse row → "Review & send →" opens `/brief/transfers`.
- [ ] A store→store row → "Review at {store} →" opens that store's drill-down.
- [ ] Toggle dark/light: tokens hold, nothing hardcoded.
- [ ] Narrow to mobile width: rows wrap, no horizontal page scroll.
- [ ] Reload: content appears in final position, nothing animates in.
```