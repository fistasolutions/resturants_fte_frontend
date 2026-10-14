# SPEC-299 — Finance Oversight, live: connect a company and read its real bills

**Date:** 2026-09-23 · **Repo:** frontend · **Status:** implemented
**Backend twin:** `SPEC-294-quickbooks-connect-and-sync.md` (the handshake, the sync,
`GET /finance/ap`) · **Builds on:** `SPEC-296-finance-oversight-page.md`
**Owner:** "Complete end to end." Also: *"WHY THESE ARE CLICKABLE???" → "yes please a
quicker one"* — the tiles become links, and *"why does switching tabs take time, is it
caching or not?"* — it was not; now it is.

## What this delivers

Three things, all of which the page needed before it could be believed:

1. **Connect really connects.** The button opens Intuit, the company comes back named,
   and the page shows that company's own bills.
2. **The bills are real.** `lib/mock/finance.ts` is deleted. Every figure comes from
   `GET /finance/ap`, which computes it in SQL (backend Rule 8).
3. **It is instant on a revisit, and every tile is a link.** The page joins the SPEC-230
   client cache, and the filters live in the URL — so a tile is a `<Link>`, the state is
   shareable and back/forward work.

## 1 · The connect round trip

The redirect URI is **ours, on the frontend origin** — `/api/integrations/quickbooks/callback`
— because the browser can reach it, it carries the session cookie, and it can talk to
the backend server-side. **No token ever touches the browser.**

```
Connect QuickBooks (client)
  → POST /finance/connect                      … returns Intuit's authorize URL
  → window.location = authorize_url            … the owner picks a company at Intuit
  → GET /api/integrations/quickbooks/callback  … Intuit redirects here with code+realmId+state
      → POST /finance/callback (serverApi, bearer from the httpOnly cookie)
      → redirect to /employees/finance?connected=<company>   (or ?qbo_error=<message>)
```

The callback route is a Route Handler, not a page: it renders nothing, so there is no
flash of an empty screen while the code is exchanged. Intuit's `error=access_denied`
(the owner pressed Cancel) redirects back with nothing but a dismissed notice — it is not
a failure worth a red banner.

`app/api/integrations/quickbooks/callback/route.ts` is the third route handler in the
app and keeps the existing rule: `app/api/session` mints tokens, `app/api/proxy` is the
browser's path to the backend, and this one exists only because Intuit redirects a
browser rather than calling an API.

## 2 · The reads

`lib/queries/finance.ts`, registry shape (SPEC-230):

| query | path | used by |
| --- | --- | --- |
| `financeQueries.ap()` | `GET /finance/ap` | the page |
| `financeQueries.connections()` | `GET /finance/connections` | the connection line, Integrations |
| `financeQueries.bill(id)` | `GET /finance/bills/{id}` | the bill page |

**The payable is read whole, once, and narrowed in the browser.** `GET /finance/ap`
filters — that is the contract every other consumer uses, and the only thing that scales
past a few thousand open bills — but this page asks for all of it and narrows with
`filterBills`, which already exists and is Vitest-covered. A store's *unpaid* bills are
hundreds of rows; keying the query by the filters instead made every tile click a round
trip to a database in another region (measured: 3.7 s to settle, against one frame now).

`lib/mock/finance.ts` is **deleted**, and with it `services/finance.ts` — the registry is
the whole data seam now, and a `serverApi` face nothing imported would have been dead
code. The `live` flag the mock existed to qualify is true whenever a company is
connected, and false only because nothing is.

### Adapters

`lib/finance-api.ts` (pure, Vitest-covered) maps the backend's snake_case to the view
models in `types/finance.ts`. Two contract changes fall out of it:

- `Coverage.margin30` and `.shortfall` become `number | null`, and `Coverage` gains
  `matched: boolean`. A company the backend could not match to a store location has no
  margin, and the tile must say "margin unmatched" rather than draw a shortfall of the
  whole amount out of a missing number.
- `lib/finance.ts`'s own `coverage()` is **removed**: coverage needs the analytics
  engine's per-location margin, so it is the backend's to compute (root Rule 8). Its
  Vitest coverage moves to the adapter.

## 3 · The URL is the state

Every tile in the money strip, every company tile and every aging band is a `<Link>` to
the same page with one parameter changed; pressing the active one clears it. `lib/finance.ts`
already had `filtersFromParams` / `paramsFromFilters` — the view now uses them instead of
`useState`, and `financeHref(tab, filters)` builds the link.

Consequences the owner asked for, in order: a tile no longer *looks* pressable without
being a link; tab and filter changes are cached, so returning to a view is instant; and a
filtered payable can be sent to somebody as a URL.

## Files

`app/api/integrations/quickbooks/callback/route.ts` (new), `lib/queries/finance.ts` (new),
`lib/finance-api.ts` (new), `services/finance-actions.ts` (new — connect · sync now ·
disconnect), `app/(app)/employees/finance/page.tsx` + `loading.tsx` +
`bills/[billId]/page.tsx` + its `loading.tsx` (prefetch + `HydrationBoundary`),
`features/finance/finance-view.tsx` (URL state, live query, connect/sync/disconnect),
`features/finance/finance-skeleton.tsx` + `bill-skeleton.tsx` (new — shared by the route's
`loading.tsx` and the view's own pending state, so the shape never changes between them),
`features/finance/bill-view.tsx` (new client view over the bill query; `bill-page-view.tsx`
becomes its presentational half), `features/finance/finance-notice.tsx` (new — the
`?connected=` / `?qbo_error=` line), `features/finance/{bills,vendors}-table.tsx` (an
`empty` message, because "nothing connected" and "nothing matches your filter" are
different facts), `features/finance/finance-tabs.tsx` + `finance-shell.tsx` (the tabs carry
the filters across a switch), `lib/finance.ts` (`financeHref`, `toggledFilters`;
`coverage()` removed), `types/finance.ts`, `lib/docs/content/employees.ts` (Rule 11),
`tests/finance.test.ts` + `tests/finance-api.test.ts` + `tests/query-registries.test.ts`,
`tools/capture_finance_live_0923.mjs`.
**Deleted:** `lib/mock/finance.ts`, `services/finance.ts`.
**Backend, in the same change:** the Finance employee's set-up action now points at
`/employees/finance` rather than `/integrations`, which had no QuickBooks row on it
(`app/services/employees/roster.py`).

## Acceptance criteria

1. Pressing **Connect QuickBooks** reaches Intuit's consent screen; returning lands on
   `/employees/finance` with the company named in a notice, and the connection line
   shows it with a masked realm id.
2. A cancelled or failed connect returns to the page with a readable, dismissible line
   and no red state — and never with a stack trace or Intuit's own error body.
3. Every figure on the page comes from `GET /finance/ap`. With nothing connected the
   page says so and shows zeroes — never sample bills.
4. Each money tile, company tile and aging band is an `<a href>`; the active one clears
   itself; back/forward and a pasted URL restore the same view.
5. A revisit paints from the cache with no visible reload (measured, like SPEC-230).
6. The bill page reads `GET /finance/bills/{id}` and 404s honestly for a bill that has
   been paid since.
7. `npm run lint`, `npx tsc --noEmit`, `npm test` and `npm run build` all green; the
   Finance Oversight section of the Digital Employees doc updated and `updated` bumped.

## Verification

Verified against the live backend (a reload-free `uvicorn` on :8102 reading the real
Railway database) and the **production** frontend build on :3102 — never `next dev`, and
never :3000/:8000, which another session is using.

### Acceptance criteria

1. **done** — `POST /finance/connect` returns
   `https://appcenter.intuit.com/connect/oauth2?client_id=AB2W9H…2GSU&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fintegrations%2Fquickbooks%2Fcallback&response_type=code&scope=com.intuit.quickbooks.accounting&state=4.…`.
   **Intuit accepts it:** following that URL lands on `accounts.intuit.com/app/sign-in`
   with our client id, redirect and state intact — no `invalid_client`, no
   "invalid request". The only step left is the owner's own Intuit login and the
   company picker, which nobody else can perform.
2. **done** — both failure paths were driven end to end through the running frontend:
   - a bogus code → the callback posts to the backend → the backend really calls
     Intuit's token endpoint → Intuit refuses → `307 → /employees/finance?qbo_error=QuickBooks+refused+that+connection+—+it+may+have+expired+or+been+disconnected.+Connect+the+company+again.`
     Intuit's own body never appears in it.
   - `?error=access_denied` (Cancel) → `307 → /employees/finance?qbo_cancelled=1`,
     which renders as a neutral dismissible line, not a red one.
3. **done** — `lib/mock/finance.ts` is deleted and nothing imports it; the capture
   asserts zero occurrences of the old "Sample bills" label. With nothing connected the
   page reads `live: false`, shows zeroes, and the table says *"Nothing connected yet —
   connect a QuickBooks company to see what it owes."* rather than "no bills match these
   filters", which would have been a lie about a filter nobody set.
4. **done** — the capture reads twelve tile `href`s
   (`?window=past`, `?age=1-30`, `?company=…`, …); clicking the active one clears it
   (`toggledFilters`, unit-tested); browser back restores the previous view in **8 ms**.
   Two defects found by looking at the render and fixed: the *Total A/P* tile drew itself
   as selected on an unfiltered page (it is where the page already is, so it is the way
   back, not a selection), and Next's default `<Link>` prefetch was firing **twelve**
   extra server renders of this dynamic page — one per tile — on every view.
5. **done** — see the measurements below.
6. **done** — `GET /finance/bills/999` against the live backend returns
   `404 {"error":{"code":"quickbooks_bill_not_found","message":"That bill is no longer outstanding."}}`,
   and the page renders it through the shared `QueryErrorState` rather than an empty page.
7. **done** — `npm run lint` 0 errors (3 pre-existing warnings in Spotlight files this
   spec does not touch), `npx tsc --noEmit` clean, `npm test` **1909 passed in 168
   files**, `npm run build` compiled with `/employees/finance`,
   `/employees/finance/bills/[billId]` and `/api/integrations/quickbooks/callback` all
   present. The Digital Employees doc's Finance Oversight section is rewritten for the
   live behaviour and `updated` is bumped; `tests/docs.test.ts` green (42).

### Latency (production build, live remote database)

| | |
| --- | --- |
| cold load, empty cache | 2674 ms |
| **soft revisit (the owner's actual path)** | **62 / 73 ms** |
| **tab switch Overview ⇄ Bills** | **55 / 56 ms** |
| filter click (tiles stay on screen throughout) | 1191 ms, settled at the same moment |
| browser back | 8 ms |

The cold load is one backend round trip, and on this laptop a single query against the
Railway database costs 800–1100 ms — that is the network, not the SQL (backend SPEC-294's
measurements). Everything after it is the client cache.

**This is the answer to "why does switching tabs take time — is it caching or not?"**: it
was not, and now it is. The page was not on the SPEC-230 cache at all; it awaited its
service reads in the Server Component on every navigation.

One measuring trap worth recording, because it nearly sent this the wrong way: timing a
revisit with Playwright's `page.goto` measures nothing useful — a hard load builds a new
`QueryClient`, so the cache is empty by construction and every "revisit" looks like 2.4 s.
The numbers above come from real in-app clicks.

### Screens

`ref/screens/finance-live-2026-09-23/` — nothing connected, the connected notice, the
refused notice, the Bills tab filtered to past due, and the hub with all five employees,
light and dark. `tools/capture_finance_live_0923.mjs` regenerates them and reports zero
page errors in both themes.

### What only the owner can do

Press **Connect QuickBooks**, sign in to Intuit, and pick a company. Everything on both
sides of that click is verified above. Two notes for when that happens:

* `QBO_REDIRECT_URI` is `http://localhost:3000/...`, so the connect round trip completes
  against a frontend on port **3000**. To connect from the deployed app, add its callback
  URL to the Intuit app and set `QBO_REDIRECT_URI` to match byte for byte.
* The app is on Intuit **development** keys, so it reads the sandbox company. Production
  keys need Intuit's review, and the privacy/EULA pages that review asks for are not
  built yet.
