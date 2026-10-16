# SPEC-397 — Labor by daypart on the Back Office

**Status:** implemented 2026-10-16 · **Repo:** frontend · **Backend:** SPEC-418 · **Extends:** SPEC-396

## What

The Schedule tab's "Planned against worked" panel gains a table of the week's worked hours, labor
cost, net sales and labor % per daypart (`LaborActuals.dayparts`, optional so an older backend draws
the panel as before). A daypart above 30% shows its labor % as a destructive badge. The table shows only
when some hours were worked. The Back Office doc describes it (Rule 11).

## What FOC sees (Rule 12)

Nothing — restaurant brands only.

## Acceptance criteria

1. The daypart table renders from the backend's figures and is hidden with no worked hours.
2. tsc, lint, tests and build are green.

## Manual verification checklist

- Clock a crew member in and out across lunch; the Schedule tab shows their hours under Lunch with the
  week's lunch sales and labor %.
