# SPEC-217 — Data Trust surface

Status: implemented
Backend: SPEC-225-catalogue-data-trust
Depends on: SPEC-045 (dead stock tab it sits beside)

## Problem

Backend SPEC-225 established that **83% of the Dead Stock figure ($8,928,310 of
$10,695,027) is three test products** left ACTIVE in the Shopify catalogue. The
backend now excludes them from every stock-derived metric.

That fix creates a new obligation. Yesterday the client saw $10.7M; today the same
tab says $1.77M. If the UI does not explain the drop, the correction reads as a bug
and costs more trust than the wrong number did.

## Design

A **Data Trust** tab on `/inventory`, plus a one-line disclosure banner on the
surfaces that were actually corrected.

**Page structure**

1. **The headline correction** — three figures side by side: what the raw catalogue
   says, what was excluded, what we trust. The trusted figure is the emphasised one.
2. **Rules table** — one row per check: what it found, how many, what it costs, which
   pages it affects, and whether it was excluded or merely flagged.
3. **Samples** — the actual offending products, named, so the client can act in
   Shopify. This is the point of the page: it is a worklist, not a lecture.

**Tone.** Every row states who fixes it. We are read-only toward Shopify (root Rule 8),
so the page never implies the platform will clean the catalogue — it says *"archive
these in Shopify"* and names them.

**Excluded vs flagged must be visually distinct.** Excluded rows changed the numbers;
flagged rows did not. Conflating them would be the same failure the page exists to
prevent. Excluded uses `--warning`, flagged uses `--muted-foreground`. Brand red is
never used for status (root Rule 9).

## Non-goals

- No "fix it for me" button. We cannot write to Shopify.
- No hiding of the raw figure — the uncorrected number stays on the page permanently,
  because a correction the reader cannot audit is just a different unexplained number.

## Verification checklist (no component runner in this repo — root Rule 4)

- [x] `/inventory` → Data Trust tab renders with live data.
- [x] Excluded and flagged rows are distinguishable without relying on colour alone
      (a text badge, not just a tint).
- [x] Loading skeleton, empty state ("no integrity issues found"), and error state.
- [x] Tokens only — no hardcoded colours; verified in light and dark.
- [x] No entrance animation; content renders in final position (root Rule 9).
- [x] Responsive: table scrolls inside its own container on mobile, page does not.
- [x] `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` green.

## Acceptance Criteria

- [x] Reported / excluded / trusted stock value shown together, trusted emphasised.
- [x] Each rule shows count, value impact, affected surfaces, and the action to take.
- [x] Rules with no dollar figure render "—", never a fabricated number.
- [x] Offending products are listed by name so the client can act.
- [x] Adapter + formatting logic unit-tested in `lib/` (the layer Vitest covers).

## Patches

### 2026-09-17 — header alignment (quick fix)

The Check / Status / Affects column headers rendered right-aligned over left-aligned cells. `` `${HEAD} text-left` `` never won because Tailwind resolves a `text-left`/`text-right` conflict by stylesheet order, not by the order the classes appear in the string. `data-trust-view.tsx` now splits the base into `HEAD_BASE` with `HEAD` (right) and `HEAD_LEFT` (left) — the same pattern the Cash Release and Allocation tables already use.
