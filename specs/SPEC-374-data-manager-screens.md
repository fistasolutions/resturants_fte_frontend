# SPEC-374 — Data Manager: the screens

**Status:** Implemented (screens; the import engine is a later spec)
**Date:** 2026-10-14
**Repo:** ecommerce-fte-frontend
**Contract:** backend `SPEC-383-data-manager-feature.md` (the `data_manager` feature and the
`data-manager` navigation destination) · **Console:** admin frontend `SPEC-006-data-manager-feature.md`
**Builds on:** SPEC-232 (persistent shells), SPEC-290/329 (Digital Employees), SPEC-301 (shallow tabs),
SPEC-325 (folder tabs), `SPEC-375-no-status-bar-on-employees.md`

## Why

Owner (2026-10-14):
- A new employee that brings a store's Airtable data in first, then replaces Airtable.
- It reads any sheet or invoice upload and copies it **exactly**: "if any place has a '.', you must
  get that '.' at the same place".
- From that copy it works out real price, real cost price, real revenue and real profit.
- It is generic SaaS, built for any company and not for one store.
- Airtable is read **manually**, not hourly, because a free Airtable plan cannot afford hourly reads.
- No status bar under the header.
- "For now, create the user interface."

The owner's screenshots of their Airtable show the kinds of records this must hold:
- payments by card, location, vendor and invoice, with verified and entered-into-accounting checks;
- supplier balances;
- purchase-order lines (vendor, PO, style, colour, quantity by size, unit price, line total, delivery,
  location);
- styles shipped per location.

## Decision

1. **A new route, `/data-manager`.** It follows the employee pattern: `layout → DataManagerShell →
   page`. It sits under Digital Employees (`within: "/employees"`) and appears in the hub's roster
   order after Customer Support Agent.
   - The shell holds the breadcrumb, the header (with an "Upload a sheet" button) and the folder
     tabs.
   - **There is no status bar**, per SPEC-375. The connection and the reading control live on
     Sources and Settings.
2. **Seven tabs**, moved with `ShallowLink`:
   - **Overview:** real revenue, profit and margin against Shopify's, cost coverage, rows copied,
     what needs you, and what it did.
   - **Sources:** Airtable bases with a manual **Read now**, and the upload area.
   - **Tables:** the exact copy with search.
   - **Matching:** column meanings with confidence and Confirm, and rows that need a look.
   - **Real profit:** by product, vendor or location, against what Shopify says.
   - **Changes:** cell-level old and new values, added and removed rows, and Apply.
   - **Settings:** the connection, autonomy, and which cost wins.
3. **Exact copy.**
   - `lib/data-manager.ts` `parseDelimited` reads CSV, TSV and semicolon sheets with RFC 4180
     quoting and changes nothing else: no trim, no number parsing, and leading zeros, decimals and
     a lone "." are kept.
   - `guessFieldType` is a display hint only.
   - A CSV or TSV dropped on Sources is copied in the browser at once and opens on Tables.
   - Excel, PDF and image invoices are accepted and listed as waiting for the import engine.
4. **Example data, clearly labelled.**
   - Until the import engine exists, the screens read `lib/mock/data-manager.ts` through
     `services/data-manager.ts`, the one seam the backend will replace.
   - Every tab carries the note "Example data. Your own tables, matches and real profit appear here
     after your first import."
   - All names are invented. No figure is calculated in a component (root Rule 8): the profit rows
     arrive computed.
5. **Visibility per organization.** The backend hides `data-manager` unless the organization has
   the `data_manager` feature. An operator switches that on in the console, with no store named in
   code (Rule 12).
6. **Docs (Rule 11).** `lib/docs/content/data-manager.ts` (area Merchandising) is registered after
   Product Analyst. Its own captures follow on the next capture run, as each section says.

## Not in this spec

- The import engine:
  - storing copies;
  - Airtable read through its API;
  - Excel, PDF and image reading;
  - matching and the profit calculation.
- An Airtable card on Integrations, and the employee's card on the Digital Employees page (it comes
  from the backend roster).
- A chat tab, which needs the employee chat engine to have Data Manager's tools.
- Writes: Read now is disabled until Airtable is connected. Apply, Confirm and "This one" change
  only this visit's view, so nothing is registered in `lib/action-permissions.ts` (Rule 13 applies
  when they write).

## FOC after this change

**Unchanged until an operator switches Data Manager on for FOC's organization in the console**,
which the owner asked for. FOC then sees the screens with labelled example data. No FOC row or
setting is changed.

## Acceptance criteria

1. `/data-manager` renders the shell (no status bar) and the seven tabs. Each tab is linkable by
   `?tab=`.
2. A CSV dropped on Sources appears on Tables with every cell exactly as written. Excel, PDF and
   image files are listed as waiting.
3. The sidebar lists Data Manager under Digital Employees, after Customer Support Agent. It is
   hidden when the workspace gives the reason `feature`.
4. Every tab says the data is an example.
5. The doc exists and the coverage test passes.
6. `npx tsc --noEmit`, `npm run lint`, `npm test` and `npm run build` are green.

## Manual verification

1. Switch the feature on for an organization in the console, then open Digital Employees → Data
   Manager.
2. Sources → drop a CSV that has `00123`, `12.50` and a lone `.`. Tables shows them unchanged.
3. Matching → change a meaning and press Confirm meanings. Changes → Apply. The Changes count on its
   tab goes away.
4. Check light and dark themes, and phone width.

## Verification (2026-10-14)

| # | Criterion | Status |
|---|---|---|
| 1 | Shell and seven tabs, no status bar | done |
| 2 | Exact-copy CSV; other formats waiting | done (`tests/data-manager.test.ts`, 11 tests) |
| 3 | Sidebar order, hidden by `feature` | done (`tests/navigation.test.ts`) |
| 4 | Example note on every tab | done |
| 5 | Doc and coverage | done (`tests/docs.test.ts`) |
| 6 | Lint, types, tests, build | see the day's log |
