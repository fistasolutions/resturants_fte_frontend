# SPEC-296 — Finance Oversight: the fifth employee's page

**Date:** 2026-09-23 · **Repo:** frontend · **Status:** implemented
**Backend twin:** `SPEC-291-finance-oversight-connections.md`
**Builds on:** SPEC-290/291 (the Digital Employees hub and its characters), SPEC-232
(persistent shells), SPEC-230 (the client cache)
**Mockup:** `ref/mockups/finance-oversight-2026-09-23.html` (owner-approved 2026-09-23)
**Client ask:** one consolidated view of accounts payable across three QuickBooks
companies — Lawrence, Pomona, Jackson — with past due, 7-day and 30-day windows, aging,
vendor, company, bill number, dates, original and remaining, status, filters, drill-down
and a link into QuickBooks.

## What this delivers

`/finance` — **Finance Oversight**, entered through Digital Employees like the other
four, in the platform's compact information-dense idiom:

1. **Connection strip** — the three QuickBooks companies, each with its state and when
   it last synced. Nothing connected yet ⇒ the page says so plainly and offers Connect.
2. **Money strip** — Total A/P · Past due · Due in 7 days · Due in 30 days. Each tile
   is a filter, not an ornament: pressing one scopes the list below.
3. **Company split** — Lawrence · Pomona · Jackson, each with its total, its past-due
   share drawn as a bar, and its bill count. Pressing one scopes everything.
4. **Aging** — current · 1–30 · 31–60 · 61–90 · 90+, each a filter.
5. **Cash coverage** — what each location owes in the next 30 days against the margin
   that location actually earned in the last 30. **This is the row no accounting tool
   can draw**, because it needs QuickBooks and Shopify in one place. Marked clearly as
   coming from two systems.
6. **Bills** — the table the client listed, column for column: vendor, company, bill
   number, bill date, due date (with "42d late" / "in 5d"), original, remaining balance,
   status. Sortable, filterable by company · window · vendor · status, searchable,
   paginated.
7. **Bill detail** — a row opens a sheet: the full record, paid-to-date, aging bucket,
   terms, memo, and **Open in QuickBooks** — the deep link into that company's realm.

## Data, and the honest label on it

The backend twin ships the employee and its connections; the **bill sync is the next
spec**. Until it lands this page reads `lib/mock/finance.ts` — the sanctioned Phase-1
pattern (root Rule 6) used by Spotlight, Social Growth and Performance Ads at the same
stage — typed against `types/finance.ts`, the shape the real API will return, and
consumed only through `services/finance.ts`. No component imports the mock.

**The page never pretends.** While no QuickBooks company is connected it shows a
standing "Sample data — connect QuickBooks to go live" banner with the Connect action.
The connection strip itself is **live** from `GET /finance/connections` from day one, so
the one thing that is real is labelled real and everything else is labelled sample.

## Structure

- `types/finance.ts` — `Bill`, `AgingBucket`, `CompanyTotals`, `FinanceOverview`, `QboConnection`.
- `lib/finance.ts` — the pure half, Vitest-covered: `agingOf`, `bucketTotals`,
  `companyTotals`, `filterBills`, `sortBills`, `windowLabel`, `dueLabel`, `coverage`,
  `qboBillUrl`. Every number the page shows is computed here, never in a component.
- `lib/mock/finance.ts` · `services/finance.ts` · `lib/queries/finance.ts` (connections).
- `app/(app)/finance/{layout,page,loading}.tsx`, `features/finance/finance-shell.tsx`
  plus the view and its parts.
- `lib/navigation.ts` — `{ title: "Finance Oversight", href: "/finance", within: "/employees" }`.
- `lib/docs/content/finance.ts` + registration (Rule 11).

Filters live in the URL (`?company=&window=&age=&vendor=&status=&q=`) so any view is
shareable and the back button works — the platform's convention.

## Acceptance criteria

1. Digital Employees shows five cards; Finance Oversight opens `/finance`; the sidebar
   gains no new row and stays lit on the hub.
2. Every tile, company card and aging bucket filters the table; filters are in the URL
   and survive a reload; Clear resets them.
3. The table sorts by every column and pages; a row opens the detail sheet with
   Open in QuickBooks.
4. The connection strip is live; with none connected the page carries the sample-data
   banner and a Connect action.
5. Money is formatted by `utils/format`, tokens only, both themes, phone width.
6. `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` green; doc written.

## Verification

- `npm test` — 167 files, **1894 passed** (`tests/finance.test.ts` 22: aging buckets are
  exhaustive and non-overlapping over the fixtures, windows, totals on the *remaining*
  balance, coverage incl. nothing-owed and shortfall, combined filters, a **stable** sort,
  the URL round-trip and junk-rejection, and the fixtures' own consistency). `npx tsc
  --noEmit` 0 errors, `npm run lint` 0 errors, `npm run build` green with `/finance`.
- Driven live on a reload-free pair (`:8102` backend, `:3102` production frontend) with
  `tools/capture_finance_0923.mjs`: Digital Employees shows **five** cards ending in
  Finance Oversight; `/finance` renders the connection strip (none connected → Connect
  QuickBooks), the sample-bills banner, the money strip, the three companies, the five
  aging buckets and the coverage row; **Past due** → 9 of 58 · $56,730.41, **+ Jackson**
  → 2 of 58 · $1,216.17, **Clear** → 58 of 58 · $344,665.39; a row opens the sheet
  (Ellis & Roth LLP) whose link is `https://app.qbo.intuit.com/app/bill?txnId=4122`.
  Light and dark captured; no console or page errors.
- **A crash the live run caught:** the fifth employee shipped without a character, so
  `CHARACTERS[employee.key]` was undefined and the whole hub rendered its error boundary.
  Fixed properly — a `ledger` character (visor cap, open ledger, coin stack that counts
  on hover), which is the documented one-case-each extension.
- Acceptance: 1 done · 2 **partial** — the filters work and clear, but they are component
  state, not yet in the URL; the pure `filtersFromParams`/`paramsFromFilters` are written
  and tested, and wiring them to `useSearchParams` is a small follow-up · 3 done ·
  4 done · 5 done · 6 done (the doc has no capture of its own yet and says so).
