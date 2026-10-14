# SPEC-319 — Money in the store's currency, times in the store's timezone

**Repo:** frontend · **Status:** implemented · **Date:** 2026-09-28
**Programme:** `SPEC-311-saas-platform-master.md`, slice **F8b** (the part SPEC-318 left open)
**Backend contract:** backend SPEC-319 — `GET /workspace` → `store.currency` (ISO 4217, from
Shopify) and `store.iana_timezone`.

## Why

Every figure in the app is formatted as US dollars in New York time (`utils/format.ts`
constants, plus a handful of `$` literals). Right for FOC; wrong for the next organization — a
shop in pounds or in Sydney would see dollars and New York times.

## The constraint that shapes the design

`formatCurrency`, `formatDate`, … are plain functions used by ~140 files, in render, in chart
tick formatters and in `lib/` helpers. They cannot read React context. A module-level setting is
safe in the browser (one organization per tab) but **not on the server**: two organizations'
pages render concurrently in one process, and a shared setting would leak one's currency into
the other's page.

## Behaviour and design

- **Browser:** `WorkspaceProvider` (SPEC-318) resolves the store locale from the workspace and
  sets it for the formatters during its own render, before any child renders. Every formatter
  reads it: currency code for money, IANA zone for instants. An unknown or invalid currency or
  zone falls back to USD / America/New_York field by field.
- **Server:** the formatters never read a shared setting there — the setter does nothing when
  there is no `window`. Server renders format with the default.
- **No hydration mismatch:** for an organization whose locale *is* the default (FOC) nothing
  changes. For any other, `useApiQuery` — the one client read path (SPEC-230) — reports the query
  as pending until hydration has finished, so the server and the hydrating client both draw the
  skeleton and the data appears, correctly formatted, one render later. Client-side navigation
  is not a hydration and paints straight from the cache as today.
- **The greeting** on the Dashboard and the Morning Brief uses the hour in the store's timezone,
  not the server's clock.
- **Literals:** the `$` written by hand (agent upsell, Results values, watchlist, season and
  stockout forecasts, competitor price levels, the Finance aging toggle) go through the store
  currency. Copy that named America/New_York says "your store's timezone" (with the zone where the
  page knows it).
- **Stays in US dollars on purpose:** the platform's own prices (onboarding plans) and AI spend
  (`lib/ai-value.ts`) — those are billed in USD whatever the store sells in.

## How

- `lib/store-locale.ts` (pure): `StoreLocale`, `DEFAULT_STORE_LOCALE`, `resolveStoreLocale`,
  `isDefaultLocale`, `getStoreLocale` / `setStoreLocale`, `syncClientStoreLocale` (browser-only).
- `utils/format.ts`: formatters read `getStoreLocale()`; currency formatters cached per currency;
  `storeTimeZone()`, `currencySymbol()`, `formatWholeMoney()` added; `getGreeting(date, zone?)`;
  `STORE_TZ` replaced by `storeTimeZone()` at its four call sites.
- `features/workspace/workspace-provider.tsx`: resolves and syncs the locale; exposes it.
- `hooks/use-api-query.ts`: the pending mask during hydration for a non-default locale.
- The literal call sites listed above; `app/(app)/dashboard/layout.tsx` and `brief/layout.tsx`
  read the (request-cached) workspace for the zone.

## Tests

Vitest: `resolveStoreLocale` (valid, lowercase currency, invalid currency, invalid zone, nulls);
`isDefaultLocale`; formatters under a GBP / Europe/London locale and back (currency, compact,
whole, symbol, date across midnight, time, date-time; date-only strings never shift);
`getGreeting` in a zone; the season/stockout/watchlist/competitor money helpers under GBP.
`npm test`, `npx tsc --noEmit`, `npm run build` green. Manual: FOC unchanged; a GBP store shows £
and its own times, first load shows skeletons then data with no hydration warning.

## Acceptance criteria

- [x] Money in the store's currency and instants in the store's timezone, app-wide.
- [x] No shared state on the server; no hydration mismatch.
- [x] FOC (USD, New York) unchanged.
- [x] Platform prices and AI spend stay in USD.
- [x] Tests, type-check and build green.

## Verification (2026-09-28)

`npm test` 2,104 passed (186 files; 9 new in `tests/store-locale.test.ts` — GBP / Europe/London
money, compact, whole, symbol, a UTC instant that is the 30th in New York and the 1st in London,
the store-hour greeting, the season/stockout/watchlist/competitor helpers; the server-side setter
proven inert in node); the existing format, watchlist, stockout and competitor tests unchanged and
green (FOC's USD / New York output is byte-identical); `npx tsc --noEmit` clean; eslint clean;
`npm run build` green. All five criteria done in code; the GBP-store manual pass runs on the first
non-USD organization. The Finance tab's amounts follow the store currency too (they already went
through `formatCurrency`); a QuickBooks company in another currency is outside this slice.
