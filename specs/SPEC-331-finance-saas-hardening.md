# SPEC-331 — Finance Oversight, fully multi-tenant: disconnect one or all, currency, copy

**Repo:** frontend · **Status:** implemented · **Date:** 2026-10-01
**Backend:** SPEC-339 · **Builds on:** SPEC-299/300/301/303 (Finance Oversight), SPEC-330

## Why

Backend SPEC-339 makes Finance work for any organization: any number of QuickBooks companies,
any currency, any time zone. This is what the owner sees of it.

## 1. Disconnect one company, or all of them

- **One company:** the × beside each company on the Overview's QuickBooks line and the
  Disconnect action on the Integrations card stay, with a confirmation that names the company
  and says what is removed (bills, payments, bank balances, findings, and the "Before Finance"
  baseline, which is rebuilt from the companies still connected) and that nothing in
  QuickBooks changes.
- **All companies:** when two or more are connected, a **Disconnect all** action sits on both
  surfaces. Its confirmation lists every company and requires typing `DISCONNECT` before the
  button enables — the enterprise pattern for an action that removes several sets of books at
  once. It calls `DELETE /finance/connections`.

## 2. Currency

- The Overview's QuickBooks line says what currency every figure is in ("All figures in USD")
  and, when a company books in another currency, the rate used: "CAD → USD 0.7342 · QuickBooks,
  Oct 1" (or "· your rate" for an owner-entered one).
- A company blocked for want of a rate shows a warning on that line — "Books in CAD — no
  exchange rate in QuickBooks" — with **Set rate**, a dialog that takes `1 CAD = ? USD`
  (positive number, up to 6 decimals) and calls `PUT /finance/fx/{currency}`; the next sync
  includes the company.
- A bill in a foreign currency shows its original amount under the converted one on the Bills
  table and its own page ("CAD 12,400.00 at 0.7342").
- `compactMoney` writes small amounts in the store's currency too (it hard-coded "$" under
  1,000 while larger amounts used the store's currency).

## 3. Copy for any organization

No Finance or Integrations screen assumes a number of companies or names a client's company:
the vendor page's "One vendor, three sets of books" becomes "One vendor, every set of books";
code comments that named the first client's companies are rewritten; the Traffic store-league
tooltip no longer names client stores.

## Code

- `services/finance-actions.ts`: `disconnectAllQuickBooks()`, `setExchangeRate(currency, rate)`.
- `features/finance/use-finance-actions.ts`: `disconnectAll`, `setRate`.
- `lib/finance-currency.ts` (pure, tested): rate labels, the original-amount line, the
  `DISCONNECT` confirmation check, rate input parsing.
- `types/finance.ts`, `lib/finance-api.ts`: `reportingCurrency`, `rates`, per-company
  `homeCurrency` / `fxMissing`, per-bill `currency` / `originalAmount` / `originalBalance`.
- `features/finance/disconnect-dialogs.tsx`: the one-company and all-companies confirmations,
  shared by the Overview and the Integrations card. `features/finance/rate-dialog.tsx`.

## Acceptance Criteria

1. One company can be disconnected from the Overview and from Integrations, after a
   confirmation naming it.
2. With two or more companies, Disconnect all is offered on both surfaces, lists every
   company, and only enables after typing DISCONNECT.
3. The reporting currency and any rates in use are shown; a blocked company can be given a
   rate.
4. Foreign-currency bills show their original amount; no screen writes "$" for a non-USD store.
5. No Finance or Integrations copy assumes three companies or names a client.
6. `npm test`, `npx tsc --noEmit`, lint and `npm run build` pass; the in-app doc is updated.
