# SPEC-330 — Finance Oversight: the Value tab

**Repo:** frontend · **Status:** implemented · **Date:** 2026-10-01
**Backend:** SPEC-338 (the value ledger) · **Builds on:** SPEC-296/299/301/303 (Finance Oversight)

## Why

An owner should open Finance Oversight and read, in one line, what the employee is worth this
month — and be able to check every dollar of it. Backend SPEC-338 computes that; this is the
page. Research behind it is in SPEC-338: no small-business AP product shows an itemised,
checkable record of money saved, so this is the screen that sets the employee apart.

## The tab

**Value** is the second tab, after Overview: `?tab=value` on `/employees/finance`.

1. **The statement line** — "This month I kept you $X, measured, and about $Y more, estimated —
   about H hours." Measured and estimated are never added into one unlabeled number. A month
   picker (`?month=YYYY-MM`) steps through `months`.
2. **Measured** tiles: discounts kept, duplicates stopped — each "N bills".
   **Estimated** tiles: time, paying on time (timing), late fees — each marked *estimated* with
   the assumption it rests on; a `null` figure says why ("no paid bills to compare yet").
3. **At stake now**: open discounts (with the soonest deadline), open duplicates, estimated fees
   on past-due bills, each linking to the filtered Bills tab.
4. **The ledger**: one row per finding — kind, company, vendor, bill number, amount, status
   (*caught · kept · missed · paid twice · closed · dismissed*), how it was verified, the date.
   An open row links to its bill page. A manager can mark a row "Not a problem" (with a reason)
   or restore a dismissed one. Filters: All · Kept · At stake · Lost · Dismissed.
5. **Before Finance** (the baseline): the year before the first connection — discounts missed,
   bills paid late and the estimated fees, cash paid early and its cost, bills probably paid
   twice (each listed, "check with the vendor").
6. **Assumptions**: each assumed number with its source and a link; a manager edits them in a
   dialog. Measured figures are labelled *from your books*.
7. **Exposure**: the fraud context, stated as industry figures, never added to a total.

**Sample.** With no QuickBooks company connected the tab shows the backend's sample business
under a persistent notice ("Sample company — connect QuickBooks to see your own numbers"), and
the row actions are disabled. A sample is never shown once a company is connected.

## Tenant fixes on the Finance pages

The header description, the Overview's empty line, the Profile's job description and the
employee chat placeholder named the first client's three companies. They now speak of "your
QuickBooks companies".

## Code

- `types/finance.ts` — the value types; `lib/finance-api.ts` — `toFinanceValue` adapter.
- `lib/queries/finance.ts` — `financeQueries.value(month)`, keyed under `["finance","value",month]`.
- `services/finance-actions.ts` — `dismissFinding`, `restoreFinding`, `saveValueAssumptions`;
  callers invalidate `["finance"]`.
- `lib/finance-value.ts` — pure: statement wording, status labels, ledger filters, month labels,
  the assumption input parsing. Unit-tested.
- `features/finance/tabs/value-tab.tsx` + `features/finance/value/*` — presentational.
- `lib/finance.ts` — `value` added to `FINANCE_TAB_IDS` after `overview`.
- In-app doc: the Finance Oversight section of `lib/docs/content/employees.ts` gains the Value tab.

## Acceptance Criteria

1. `?tab=value` renders the statement, measured / estimated / at-stake tiles, the ledger, the
   baseline, the assumptions and the exposure, with skeleton, error and empty states.
2. Measured and estimated money are visibly separate everywhere; every estimate names its basis.
3. The month picker moves through the months the backend returns.
4. Dismiss (with a reason) and restore work for a manager and refresh the page's data.
5. Assumptions can be edited and saved; invalid input is refused before sending.
6. With nothing connected, the sample is shown under a notice and actions are disabled.
7. No Finance page names a specific client company.
8. `npm test`, `npx tsc --noEmit` and `npm run build` pass.

## Manual verification

- Light and dark themes: tokens only, no hard-coded colours.
- Keyboard: tab order through month picker, filters, row actions, the assumptions dialog.
- Phone width: tiles stack, the ledger scrolls horizontally inside its card.
