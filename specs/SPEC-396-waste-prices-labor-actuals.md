# SPEC-396 — Waste log, supplier price watch and labor actuals on the Back Office

**Status:** implemented 2026-10-16 · **Repo:** frontend · **Backend:** SPEC-417 · **Extends:** SPEC-394

## What

- **Schedule tab:** "Planned against clocked" — each day's planned hours and cost against the clocked
  ones with the difference (`restaurantQueries.laborActuals(branch, week)` →
  `GET /restaurant/branches/{id}/labor?week=`), and each person's week with an Over / Near badge
  (`OVERTIME_LABELS`).
- **Inventory tab:** the variance line adds logged waste and the unexplained remainder; a **waste log**
  (ingredient · quantity · reason from `WASTE_REASON_LABELS` · date → `logWaste`, `network.manage`,
  `RoleButton`) with the latest entries; the **supplier price watch** (`restaurantQueries.prices()` →
  `GET /restaurant/inventory/prices`) with flagged rises first.
- The Back Office doc describes waste, prices and labor actuals (Rule 11).

## What FOC sees (Rule 12)

Nothing — restaurant brands only.

## Acceptance criteria

1. Labor actuals per day and per person with overtime flags.
2. Waste logged, listed, and split out of the variance.
3. The price watch with its 5% flag; writes role-gated; tests, tsc, lint and build green.
