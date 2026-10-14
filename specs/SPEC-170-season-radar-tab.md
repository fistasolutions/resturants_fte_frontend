# SPEC-170 — Foresight → Season Radar tab

**Status:** implemented
**Repo:** `ecommerce-fte-frontend`. Consumes backend **SPEC-177**.
**Replaces:** the Store Health tab in the Foresight tab bar.

## 1. Why Store Health was replaced

Owner review, third time on this axis: *"These same things we already have."* Store
Health composited six metrics that each already have a tab — margin (Profit Lens),
conversion (Store Traffic), discount discipline (Discounts), return rate (Returns
Analytics), fulfil speed (Warehouse), CSAT (Team Performance). It re-presented yesterday
in a seventh place under the heading "the forward-looking view".

## 2. What replaces it

The single largest driver of the store's revenue, which the platform could not see:
**the Jewish calendar.** Measured over 4-5 years, the three weeks before Pesach run at
**4.6x** baseline, Rosh Hashanah at **1.68x**, Chanukah at **0.44x** — and those dates
move 10-11 days a Gregorian year, so month-based seasonality cannot capture them.

The tab answers three questions Store Health could not:

1. **What is coming, and how big?** — lift with its observed range and confidence.
2. **Am I already late?** — the order-by date, and whether it has passed.
3. **Which store, and how much?** — expected daily revenue per location.

## 3. Layout

**Hero — the next occasion.** Name, days out, the lift as the headline figure, its
5-year range, and a confidence chip. Beside it, the **order-by state**, which is the
decision: `Order by <date>` in normal type, or a **loud warning** when that date has
passed — the most actionable thing on the page, since the merchant can still act on a
ramp already under way.

**Ramp curve.** An area chart of lift by weeks-out, with the ramp-start week marked.
This is what makes the order-by date self-evident rather than asserted: the reader can
see demand double before it quadruples.

**Per-store bars.** Expected daily revenue per location for the coming occasion, baseline
shown behind it so the *increment* is visible rather than the total alone.

**Timeline.** Every occasion in the 26-week horizon as a horizontal strip: lift, days
out, confidence, order-by status. **Suppressed occasions (lift < 1) render as clearly
suppressed** — knowing Chanukah runs at 0.44x prevents overstocking, so it must not be
hidden or shown as a weak surge.

**Accuracy ledger.** Predicted vs actual lift for occasions already passed.

## 4. Honest presentation rules

- An occasion with fewer than 3 years of history renders **"not enough history"** and
  **no multiplier**. One prior year is an anecdote and must never appear as a forecast.
- Confidence is shown as a chip (`high` / `medium` / `low`) derived from the year-over-year
  spread, with the range visible so the reader can judge it themselves.
- Before anything is scored the ledger says so — no fabricated hit rate.

## 5. Design compliance (root Rule 9)

Semantic tokens and `--chart-*` only. **Brand red is not used for urgency** —
`--destructive` carries the passed-deadline state, `--warning` the near ones,
`--success` a healthy lead. Recharts' built-in draw only; **no Framer Motion, no
entrance animation** — the chart and bars render at final value.

## 6. Acceptance criteria

1. Tab registered as **"Season Radar"** at `/foresight/season`; Store Health removed from
   the tab bar. ✅
2. Hero shows the next occasion with lift, range, days out and confidence. ✅
3. Order-by date is shown, and a passed deadline is visually distinct and unmissable. ✅
4. Ramp curve renders lift by weeks-out with the ramp-start marked. ✅
5. Per-store bars show expected vs baseline daily revenue. ✅
6. Timeline lists every occasion in horizon; suppressed ones read as suppressed. ✅
7. `insufficient_history` renders as such, with no multiplier. ✅
8. Ledger shows predicted vs actual, and an explicit empty state. ✅
9. `lib/season.ts` holds the formatting/ordering logic and is unit-tested. ✅
10. `npm test`, `npx tsc --noEmit`, `npm run build` green. ✅

## Patches

### 2026-08-27 — Per-occasion order list ("what to buy", not just "when")

The tab told the merchant *Pesach runs 4.6× busier, order by this date* — a deadline with
no order attached. Owner asked the obvious next question: **what do I actually order?**

**Measured before building** (the discipline that killed the size curve). If every
occasion simply lifted everything uniformly, a category list would be noise. It does not:

| Occasion | Category lifts |
| --- | --- |
| **Pesach** | Tees **10.83×** · Dresses 4.49× · Skirts 3.22× · Tops 1.96× |
| **Rosh Hashanah** | Tops **2.69×** · Dresses 1.44× · Skirts 1.23× · **Tees 0.10×** |
| **Sukkot** | Tops 2.30× · Dresses 1.58× · **Tees 0.04×** |
| Chanukah | every category suppressed |

**Tees run 10.83× for Pesach and 0.10× for Rosh Hashanah** — a ~100× swing between two
occasions, completely hidden by the company-wide 1.69×.

**Presented as two lists, not one ranking.** "Buy deeper" and "Pull back" are separate
sections, because in a single sorted list the collapses sit at the bottom — and that is
precisely where the costly mistake hides. Stocking Tees for Rosh Hashanah off the headline
multiplier would be badly wrong, and the UI has to make that impossible to miss.

Bars scale on magnitude in either direction, so a 10× surge and a 0.1× collapse are both
legible on one axis rather than the collapse rendering as an empty sliver.

**Added acceptance criteria:**

11. Each occasion shows its category mix, split into buy-deeper and pull-back. ✅
12. A collapsing category is as visually prominent as a surging one. ✅
13. Categories below the unit floor are omitted, never shown with a wild multiplier. ✅
