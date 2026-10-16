# SPEC-398 — Proper dialogs instead of browser pop-ups on the Back Office and Development pages

**Status:** implemented 2026-10-16 · **Repo:** frontend · **Extends:** SPEC-394, SPEC-395

## Why

Three actions asked for their values in the browser's own `window.prompt`: correcting a shift's break
(Back Office), signing a prospect (royalty and ad-fund rates), and opening a store (its store number).
A browser prompt cannot validate, label or explain, looks foreign to the app, and the rates were typed as
fractions (0.06) while the franchisee dialog takes them as percents (6).

## What

- `features/restaurant-os/field-dialog.tsx` — one small shadcn `Dialog` form: a title, a line of
  explanation, labelled inputs, an inline error, Cancel and a confirm button that is disabled while it
  saves. It closes only when the save succeeds; a failed save shows the server's message in the dialog.
- Pure parsing in `lib/restaurant-forms.ts` (Vitest):
  - `parseBreakMinutes` — a whole number from 0 to 600 (the backend's `ShiftFixIn` bound);
  - `parsePercentRate` — "6" or "6.5%" → 0.06 / 0.065, from 0 to 100% (the backend's `SignIn` bound);
  - `parseStoreCode` — trimmed, 1 to 40 characters (the backend's `OpenStoreIn` bound).
- Sign asks for **Royalty %** and **Ad fund %** (prefilled 6 and 4); Open asks for the **store number**;
  Break asks for **minutes**. Each gate is unchanged (`network.manage`, `RoleButton`).

## What FOC sees (Rule 12)

Nothing — restaurant brands only.

## Acceptance criteria

1. No `window.prompt` remains in the app.
2. Invalid values are refused in the dialog with a reason; the server's refusal (e.g. a store number in
   use) is shown in the dialog, which stays open.
3. tsc, lint, tests and build green.

## Manual verification checklist

- Development → Sign: type 6 and 4 → the prospect is signed with 0.06 and 0.04.
- Development → Open with a number already in use → the dialog shows the conflict and stays open.
- Back Office → Time clock → Break: type 700 or 12.5 → refused; 30 → saved.

## Verification (2026-10-16)

AC 1 done (no `window.prompt`/`confirm`/`alert` under `features/`, `app/`, `components/`, `lib/`) ·
AC 2 done (`tests/restaurant-forms.test.ts`, 3 tests; in a fresh local demo: Sign refused 150% in the dialog,
then signed at 6.5% → 0.065; Open with store number 101 showed "Store number '101' is already in use." and
stayed open, then 301 created the open branch; Break refused 12.5, then saved 30 minutes as a corrected
shift) · AC 3 done (`npm test` 2786 passed, `tsc` and lint clean, `npm run build` passes).
