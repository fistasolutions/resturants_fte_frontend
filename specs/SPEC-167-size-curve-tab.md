# SPEC-167 — Foresight → Size Curve tab (prediction + accuracy ledger)

**Status:** WITHDRAWN 2026-08-27 — superseded by SPEC-169 (Stockout Risk tab).

> **Why this was withdrawn.** Owner review of the live page: *"Just shows the size — we
> already have these things."* He was right, and the backend spec's own evidence had
> already said so: it measured category size-mix drifting **2.7pt over nine months** and
> read that as "stable enough to predict". The correct reading is the opposite — a
> quantity that barely moves is one nobody needs predicted, and the merchant already saw
> his size mix on Size Intelligence and Product Analyst. The tab, its route, its view,
> its `lib/size-curve.ts` and its tests are removed.
>
> The lesson is recorded rather than the code: **a forecast is only worth building where
> the answer is not already on the screen, where it changes a decision, and where being
> wrong costs money.** The size curve failed all three. Stockout risk (SPEC-169 / backend
> SPEC-176) passes all three, and ships with an adversarial critic agent whose explicit
> job is to catch exactly this class of mistake before it is built.
**Repo:** `ecommerce-fte-frontend`. Consumes backend **SPEC-174**.
**Depends on:** SPEC-152 (Foresight shell + tab model), SPEC-153 (Size Intelligence).

## 1. What this tab is, and how it differs from Size Intelligence

Foresight already has a **Size Intelligence** tab (SPEC-153): sell-through vs *return
rate* by size, i.e. *which sizes are coming back*. This is a different question:

> Of the next units bought in this category, **what share should be each size?**

Backward-looking quality vs a forward-looking buy. They must not be merged; the labels
are deliberately distinct ("Size Intelligence" vs "Size Curve").

## 2. Why it shows its own scorecard

The tab's defining feature is that **it grades itself in public**. Every committed
prediction carries a tolerance band declared before the outcome was known, and the tab
shows the running hit rate and mean error next to the curve.

This was earned, not assumed. A daily-revenue forecast was backtested first and rejected
at 27% median error (backend SPEC-174 §1); size mix at category level drifted 2.7pt.
Showing the track record is only honest because the number survives being shown.

## 3. Layout

**Header** — the scorecard. Hit rate, predictions judged, mean absolute error, and
pending count. Before anything is scored it reads "No predictions scored yet" with the
next horizon date. It never shows a fabricated rate.

**One card per curve**, where a curve is a `(category, size_system)` pair — Skirts sells
alpha *and* US-numeric simultaneously and each is a separate buy. Each card shows:

- Size bars with `predicted_share`, largest-first reading left-to-right in true size order
- A **"sold out"** marker on censored sizes, with a tooltip saying demand was likely
  understated — surfaced, never silently corrected
- `sample_units` and the window, so the buyer can judge the evidence themselves
- Status states rendered honestly, never as an empty card:
  `insufficient_data` → "Not enough units to call this"; `no_curve_sizes` → "One Size only"

**Commit action** — "Commit this forecast" posts the curve to the ledger with a horizon,
turning the page from a view into a record.

## 4. Design compliance (root Rule 9)

Semantic tokens only; no hardcoded colors. Brand red is **not** used for verdicts —
`--primary` for hit, `--muted-foreground` for unscorable, `--destructive` reserved for
genuine failure. No entrance animation of any kind: bars render at final width, no
staggered reveal, no Framer Motion. Bars use a CSS width only.

## 5. Acceptance criteria

1. New `sizes-curve` tab in `FORESIGHT_TABS`, label **"Size Curve"**, route
   `/foresight/size-curve`. ✅
2. Tab renders one card per `(category, size_system)`; systems are never blended. ✅
3. Shares render as percentages summing to 100% within a card. ✅
4. Censored sizes show a "sold out" marker with an explanation. ✅
5. `insufficient_data` / `no_curve_sizes` render an honest message, not an empty card. ✅
6. Accuracy header shows hit rate, judged count, mean error, pending; and an explicit
   empty state before anything is scored. ✅
7. Tokens only, no Framer Motion, no entrance animation. ✅
8. `lib/size-curve.ts` holds the formatting/ordering logic and is unit-tested (Rule 4 —
   the repo has no component runner, so logic lives in `lib/`). ✅
9. `npm test`, `npx tsc --noEmit` and `npm run build` green. ✅

## Patches

### 2026-08-27 — The commit action was specified but never built

§3 above described a "Commit this forecast" action. It was **not implemented** in the
original slice, and it was not listed in the acceptance criteria — which is exactly why
the omission survived verification. The backend `POST` route existed and worked; nothing
in the UI called it.

The visible symptom was a tab whose defining feature could never activate: the accuracy
panel read *"No predictions committed yet"* permanently, and the daily scoring job had
nothing to score. The panel was telling the truth about an unfinished feature.

**A button alone would not have fixed it.** The requirement is that the system predicts
*automatically*; a manual-only commit means the ledger fills solely when someone
remembers to press it. So the fix is both halves:

- **Backend (SPEC-174 Patches):** a weekly `size_curve_commit` job — the ledger now fills
  itself.
- **Frontend (here):** `CommitForecastButton`, for pinning a forecast immediately before a
  buy, so the call on record is the one the decision was actually made against. It posts
  through the identical backend path the weekly job uses, so manual and automatic calls
  are indistinguishable in the track record.

The empty state now also says when the panel will fill on its own, rather than leaving the
reader to guess whether anything is happening.

**Added acceptance criteria:**

10. A "Commit this forecast" control exists, posts to
    `/foresight/size-curve/predictions`, and reports what went on record (sizes,
    horizon date, band). ✅
11. The empty state explains that forecasts are taken automatically every Monday. ✅
12. Failures surface as a readable message, never a silent no-op. ✅

### 2026-08-27 (2) — The tab showed shares, not a decision

Owner feedback on the live page: *"Where is the prediction?"* — a fair reading of what was
actually rendered. The tab showed a percentage distribution under a caption saying "from
the last 180 days of unit sales", which reads as a **report of the past**, not a forecast.
The share genuinely *is* the prediction, but nothing on the page turned it into something
a buyer could act on.

The gap was framing plus arithmetic the user was left to do by hand: nobody orders "22.1%
M", they order **221 units**.

**Fix — a buy sheet, not a chart.** A "Planning a buy of *N* units" control at the top of
the board (presets 250 / 500 / 1,000 / 2,500, default 1,000). Every curve answers it with
real order quantities, the share kept beside them as supporting evidence rather than the
headline. The page copy now leads with *"What to order of each size on your next buy"*.

**Rounding is the part that had to be right.** Rounding each size independently lets the
order drift off the number the buyer typed — 1,000 in, 997 out — and a buy sheet that
cannot add up is one nobody trusts. `allocateUnits()` uses the largest-remainder method,
so the allocation sums to **exactly** the requested total while staying as close as
possible to each share. Covered by tests at 3, 37, 250, 500, 1,000 and 2,500 units.

The sold-out flag carries through to the buy sheet, where it matters most: that is the
size whose order quantity is most likely understated.

**Added acceptance criteria:**

13. A buy-quantity control converts every curve into unit quantities. ✅
14. Allocations sum to exactly the requested total at any quantity. ✅
15. Sizes flagged as sold out stay flagged on the buy sheet. ✅
