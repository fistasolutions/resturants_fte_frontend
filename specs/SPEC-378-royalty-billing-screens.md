# SPEC-378 — Royalty billing screens: statements and the brand's rules

**Status:** implemented 2026-10-15 · **Repo:** frontend · **Backend:** SPEC-390 · **Builds on:**
SPEC-377 (restaurant screens), SPEC-358 (role gates), SPEC-229 (docs)

## What changes

- **Royalties** gets two tabs: **This period** (the SPEC-377 view, now on the gross-sales basis
  with the basis rules listed and each franchisee's branch lines) and **Statements** (weekly bills).
- **Statements:** filter by status (all · draft · issued · paid · void); each row shows the
  franchisee, the week, basis sales, royalty, ad fund, minimum top-up, total due and status, and
  expands to its branch lines. Head office has **Bill last week** (generates the last complete week's
  drafts), and per row **Issue**, **Mark paid** (with a payment reference) and **Void** — all on
  `network.manage`. A franchise member sees its own statements, read-only.
- **Network › Settings** (head office only): count delivery charges in the royalty basis (switch),
  the week's first day, the minimum weekly royalty per branch (blank = none) and the delivery on-time
  target; **Save** on `network.manage`.
- Reads in `lib/queries/restaurant.ts` (`statements`, `settings`); writes in
  `services/restaurant-actions.ts` (`generateStatements`, `moveStatement`, `saveRestaurantSettings`),
  each registered in `lib/action-permissions.ts`.
- Docs: Royalties and Network docs updated (new tabs, the basis, billing).

## Acceptance criteria

1. Tabs render; a franchise member has no Bill/Issue/Paid/Void controls and no Settings tab.
2. Actions refresh the statements list; a refused move shows the backend's message.
3. Tests, type-check and build pass.

## Verification (2026-10-15)

AC 1 done (Settings and billing controls are head-office only; franchise members read their own
statements) · 2 done · 3 done (`npm test`, `npx tsc --noEmit`, `npm run build` green).
