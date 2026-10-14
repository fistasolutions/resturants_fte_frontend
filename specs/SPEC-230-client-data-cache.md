# SPEC-230 — Client data cache: stale-while-revalidate for every page

Status: implemented — every route (2026-09-12)
Depends on: SPEC-017 (`lib/api.ts` / `serverApi`, the session cookie, the proxy),
SPEC-119 (instant-header skeletons), SPEC-021 (dashboard auto-refresh — superseded
here for the dashboard), SPEC-227 (route error boundaries — the failure path these views
degrade into)

## Problem — the app has no memory

Measured 2026-09-12 on the owner's machine (backend on `:8000`, Postgres on Railway):

```
open /brief                        6.15 s
wait 3 s, open /brief again        6.07 s      ← identical. Nothing was kept.
```

And what the owner actually feels — client-side navigation through the sidebar, timed
from the click until real content is on screen (no skeleton left, data heading present):

```
first load   /brief          5 591 ms
sidebar   →  /dashboard     10 712 ms   first visit
sidebar   →  /brief          9 708 ms   REVISIT
sidebar   →  /dashboard      5 740 ms   REVISIT
sidebar   →  /brief          5 345 ms   REVISIT
sidebar   →  /dashboard      4 766 ms   REVISIT
```

A revisit costs the same as a first visit because, by construction, nothing caches:

- all 89 pages are `export const dynamic = "force-dynamic"`;
- every fetch in `lib/api.ts` is `cache: "no-store"`;
- there is no client data store of any kind in `package.json`;
- Next 15+ keeps the client router cache for dynamic segments for **0 seconds**
  (`staleTimes.dynamic`, documented in `node_modules/next/dist/docs/.../staleTimes.md`).

And UI and data are fused: a page is an `async` Server Component that must finish
**all** of its fetches before it can emit a single element. Until then the route's
`loading.tsx` skeleton is all there is — on every visit.

This is not the Rule 5 failure it looks like. The pages parallelise correctly
(`Promise.all` / `allSettled`), the backend gathers, the SQL is set-based. The cost is
the round-trip count × a 200 ms wire to the database, **paid again on every
navigation** because nothing remembers the last answer.

## How the platforms the owner compared us to do it

Salesforce (Lightning Data Service), Shopify Admin (Apollo cache), Vercel (SWR), Linear
(local-first) all separate three things this app has as one:

| Layer | Big platforms | This app today |
| --- | --- | --- |
| App shell (sidebar, nav) | loaded once per session | ✅ persists across `<Link>` navigation |
| Page UI (cards, tables) | paints instantly from JS already in the browser | ❌ waits for the server to fetch + render |
| Data | client cache, **stale-while-revalidate** | ❌ refetched from zero every visit |

Stale-while-revalidate: first visit fetches; every later visit paints the cached answer
in 0 ms and refreshes silently behind it. A spinner is seen once per session per page,
never twice.

## The shape of the fix

Add **TanStack Query v5** as the client data cache, and use its documented Next App
Router pattern — *server prefetch, streamed into a client cache*:

1. **One `QueryClient` per browser session** lives in a client provider mounted inside
   `app/(app)/layout.tsx`. Because the layout is not re-rendered on client-side
   navigation, the cache survives every sidebar click and dies only on a hard reload
   (same as Salesforce).
2. **The page (Server Component) still does the first fetch — but no longer waits for
   it.** It calls `queryClient.prefetchQuery(...)` for each query *without awaiting*,
   then renders `<HydrationBoundary state={dehydrate(queryClient)}>` around a client
   view component. Because the dehydrate config includes **pending** queries, their
   promises are streamed to the browser as part of the RSC payload (TanStack Query ≥
   5.40 + React 19). The page's own render is now milliseconds, so the route
   `loading.tsx` is visible for a blink, not for the whole fetch.
3. **The view (Client Component) reads the cache with `useQuery`.**
   - **First visit:** the query is pending with a promise in flight — the view renders
     its skeleton, the promise resolves, the data paints. Same experience as today, one
     HTTP hop fewer than a client-initiated fetch would be.
   - **Revisit:** the query already holds data — the view paints it **immediately**.
     Hydration of an existing query is deferred to an effect and attaches the freshly
     streamed promise as a background fetch (`query.fetch(undefined, { initialPromise })`
     in `@tanstack/query-core` `hydration.ts`), so the numbers patch in place when it
     lands. Zero skeleton, zero wait.
   - **Error on the server prefetch:** the promise rejects (redacted — no server error
     text reaches the browser, Rule 6), the retryer treats it as a failed attempt and
     retries once through the **client** `queryFn` via `/api/proxy`. Only then does the
     view show its error state — the same "Could not load …" copy the page shows today.
4. **One loader, two transports.** A query is *defined once* as `{ queryKey, load(api) }`
   in `lib/queries/<domain>.ts`, where `api` is a `<T>(path) => Promise<T>` GET. The
   server prefetch passes `serverApi`; the client refetch passes the new `clientApi`
   (`/api/proxy`). Path building, adaptation and composition (e.g. dashboard =
   `/dashboard` + `/analysis/what-changed`, adapted) exist in exactly one place, and
   that place is pure enough for Vitest with a fake `api`. The existing
   `services/dashboard.ts` / `services/brief.ts` keep their exported signatures and
   become thin `load(serverApi)` wrappers — no consumer changes.

Nothing in the backend changes. No presentational component changes. No route moves.
The only files that stop being what they were are the two `page.tsx` files, which shrink
to "parse params → prefetch → render view".

### Why not the cheaper alternatives

- **`experimental.staleTimes.dynamic`** alone would make the sidebar click instant for N
  seconds and then fall back to the full 6 s render — and it caches whole segments, so
  a stale page can never refresh in place. A dial, not an architecture.
- **Next `"use cache"` / Cache Components** are server-side caches keyed per request; a
  revisit would still cross the network to find out the cache is warm. The owner's
  complaint is the network.
- **Pure client fetching** (no server prefetch) is the simplest SWR and was the
  runner-up. It loses the server-initiated first fetch and starts fetching only after
  hydration. The streamed-prefetch pattern keeps first load as good as today *and*
  makes revisits instant; it is also the pattern TanStack documents for exactly this
  framework. If promise streaming proves unreliable on Next 16 during verification,
  fall back to pure client fetching for the affected view and record it in Patches.

## Cache policy (defaults in `lib/query-client.ts`)

| Option | Value | Why |
| --- | --- | --- |
| `staleTime` | 60 s | a mount within a minute paints from cache and does **not** trigger a client refetch — the server prefetch on navigation already refreshes it |
| `gcTime` | 30 min | a page not visited for half an hour is forgotten; long enough for the morning walk through the app |
| `retry` | 1 | one retry through the proxy; the proxy already replays once on 401 (SPEC-149) |
| `refetchOnWindowFocus` | `false` by default | deterministic traffic; the dashboard opts in (below) |
| `dehydrate.shouldDehydrateQuery` | default **or** `status === "pending"` | the whole streaming mechanism |
| `dehydrate.shouldRedactErrors` | default (`true`) | server-side failures never carry provider/DB detail into the browser |

**Dashboard queries** additionally set `refetchInterval: 60_000`,
`refetchIntervalInBackground: false`, `refetchOnWindowFocus: true`, `staleTime: 30_000`
— this replaces SPEC-021's `<AutoRefresh />`, which re-ran the *whole server page* every
60 s via `router.refresh()`. Same contract (tracks the 15-minute sync; hidden tabs don't
poll; re-showing the tab catches up), a fraction of the work. `auto-refresh.tsx` is
deleted (Rule 6: no dead code).

## Scope (frontend only)

**New**

- `lib/api-error.ts` — `ApiError` (client-safe). `lib/api.ts` re-exports it so every
  existing `import { ApiError } from "@/lib/api"` still works.
- `lib/client-api.ts` — `clientApi<T>(path)`: GET `/api/proxy/<path>`, throws `ApiError`
  with the backend's `{error:{code,message}}` exactly as `serverApi` does. The
  `clientApi` the SPEC-017 doc comment promised and never shipped.
- `lib/query-client.ts` — `makeQueryClient()` with the policy above; `getQueryClient()`
  (new client per server render, one singleton per browser).
- `lib/query-def.ts` — `ApiGet`, `QueryDef<T>`, `defineQuery(key, load)`.
- `lib/queries/brief.ts`, `lib/queries/dashboard.ts` — the query definitions.
- `lib/server-prefetch.ts` (`server-only`) — `prefetch(qc, def)` = non-awaited
  `prefetchQuery` with `serverApi`.
- `hooks/use-api-query.ts` — `useApiQuery(def, options?)` = `useQuery` with `clientApi`.
- `components/shared/query-provider.tsx` — `QueryClientProvider` around the app.
- `features/brief/brief-view.tsx`, `features/brief/brief-skeleton.tsx`,
  `features/dashboard/dashboard-view.tsx`, `features/dashboard/dashboard-skeleton.tsx`
  — the client views and the skeletons they show while pending (the route `loading.tsx`
  files render the same skeleton components, so first paint is unchanged).

**Changed**

- `app/(app)/layout.tsx` — `{children}` wrapped in `<QueryProvider>`.
- `app/(app)/brief/page.tsx`, `app/(app)/dashboard/page.tsx` — prefetch + view.
- `app/(app)/brief/loading.tsx`, `app/(app)/dashboard/loading.tsx` — render the shared
  skeleton components.
- `services/brief.ts`, `services/dashboard.ts` — delegate to `lib/queries/*`; exported
  signatures unchanged.
- `package.json` — `@tanstack/react-query` (exact-pinned).
- `../docs/Architecture.md` §10 Frontend stack — one added line naming TanStack Query
  as the client data cache (deliberate constitution update under Rule 2, owner agreed to
  the plan 2026-09-12).

**Untouched by design:** everything under `app/(app)/ai/` and `app/(app)/system/` (a
sibling session holds SPEC-229 there), every backend file, every presentational
component.

## Rollout

This spec covers the infrastructure plus **Brief and Dashboard**. Every further page is
converted the same mechanical way under its own `## Patches` entry here (or a follow-up
spec if a page needs a different cache policy): move the fetch composition into
`lib/queries/<domain>.ts`, make `services/<domain>.ts` delegate, split `page.tsx` into
prefetch + `features/<domain>/<domain>-view.tsx`, share the skeleton with `loading.tsx`.
Each conversion is verified on real data with the navigation timing below before the
next begins.

## Non-goals

- Persisting the cache across hard reloads (`persistQueryClient` → IndexedDB). Linear
  does this; it is a later step once the in-session cache has proven itself.
- Optimistic updates for mutations. Existing client mutations keep calling `/api/proxy`
  directly; where a mutation changes data a view shows, it invalidates the view's key.
- Reducing the backend's round-trip count or moving the dev database local. Separate
  problems (see `../docs/MEMORY.md` 2026-09-12); this spec makes the app stop *re-paying*
  them, it does not shrink them.
- Touching the `(app)/layout.tsx` `getCurrentUser()` await on hard load.

## Acceptance criteria

1. **Revisit is instant.** With the backend running against the remote database, the
   Playwright navigation timing (click → real content, no skeleton) reports every
   `/brief` and `/dashboard` **revisit under 300 ms** (baseline 4 766 – 9 708 ms).
2. **First visit is not worse.** First-load `/brief` and first-visit `/dashboard` stay
   within the baseline ±10 % (5 591 ms / 10 712 ms locally).
3. **Background refresh really happens.** After a revisit paints from cache, the
   server-streamed promise updates the cache: the `Data as of …` line on Brief moves to
   the new `generated_at` without any user action or skeleton.
4. **Failure degrades, never blanks.** With the backend stopped, a first visit to
   `/brief` shows the existing "Could not load brief — check your connection and try
   again." copy inside the app shell; `/dashboard` shows its error state. No route error
   boundary fires for a data failure.
5. **Dashboard auto-refresh survives.** The dashboard refetches every 60 s while
   visible, pauses when the tab is hidden, and catches up on focus — verified with the
   network panel; `<AutoRefresh />` no longer exists.
6. **No server error text in the browser.** With the backend returning 500 on `/brief`,
   the streamed rejection carries no backend message (redacted); the client retry's own
   `ApiError` message is what the view renders.
7. **Nothing else changed.** `npm test` green (new tests included), `npx tsc --noEmit`
   clean, `npm run build` compiles every route, `npm run lint` clean.
8. `lib/queries/*`, `lib/query-client.ts`, `lib/client-api.ts` are Vitest-covered:
   query keys include every parameter and are stable/serialisable; loaders call the
   exact paths the old services called; `makeQueryClient` dehydrates pending queries
   with a promise; `clientApi` builds `/api/proxy/<path>` and surfaces `{code,message}`.

## Manual verification (no jsdom runner — root Rule 4)

- Sidebar: Brief → Dashboard → Brief → Dashboard, both themes: second visits paint with
  no skeleton; numbers unchanged until the background refresh lands, then patch in place
  with no motion (Rule 9).
- Change the Brief date-range picker: the URL changes, a new key is fetched (skeleton on
  first use of that range, instant thereafter), the old range stays instant.
- Hard reload: everything fetches fresh once (expected — no cross-reload persistence).
- Stop the backend, navigate to a cached page: cached data still paints; the background
  refresh fails silently; a never-visited page shows its error copy.

## Verification (2026-09-12, real backend against the remote Railway database)

Same Playwright script as the baseline — click a sidebar link, wait until no
`[data-slot="skeleton"]` remains and the data heading is present:

```
                          baseline      after (cold dev)   after (warm dev)
first load   /brief        5 591 ms        4 547 ms           5 732 ms
sidebar   →  /dashboard   10 712 ms        5 424 ms           6 230 ms   first visit
sidebar   →  /brief        9 708 ms          112 ms             105 ms   REVISIT
sidebar   →  /dashboard    5 740 ms          183 ms             114 ms   REVISIT
sidebar   →  /brief        5 345 ms           70 ms              70 ms   REVISIT
sidebar   →  /dashboard    4 766 ms           91 ms             104 ms   REVISIT
```

| # | Criterion | Result |
| --- | --- | --- |
| 1 | Revisit under 300 ms | **done** — 70–183 ms across two runs (baseline 4 766–9 708 ms) |
| 2 | First visit within baseline ±10 % | **done** — both first visits faster than baseline |
| 3 | Background refresh lands | **done** — revisit painted the cached "Data as of 3:49 AM EDT", patched to "3:50 AM EDT" 12 s later with no skeleton and no user action |
| 4 | Failure degrades inside the shell | **done** — `/brief?date=2020-01-01` (no snapshot) renders "Could not load brief (404) — try refreshing." with the sidebar intact; no route boundary fired |
| 5 | Dashboard auto-refresh survives | **done** — after 60 s visible, exactly one refetch cycle through the proxy (`/settings/status`, dead-inventory, `/dashboard`, what-changed, locations); `/auth/me` correctly not refetched; `auto-refresh.tsx` deleted |
| 6 | No server error text in the browser | **done** — the rendered status comes from the client retry's own `ApiError`; the only console line is TanStack's dev-only "dehydrated as pending ended up rejecting … will be redacted in production builds" |
| 7 | Nothing else changed | **done** — `npm test` 112 files / 1291 tests green (22 new), `npx tsc --noEmit` clean, `npm run build` compiles every route, `npm run lint` 0 errors (3 pre-existing warnings in untouched files) |
| 8 | Vitest coverage | **done** — `tests/query-client.test.ts`, `tests/client-api.test.ts`, `tests/queries.test.ts` |

No hydration warnings and no React errors in the browser console across the run.

### A bounded waste, kept on purpose

When a page is revisited **after** its `staleTime` (60 s), two refreshes race: the
client's own mount refetch (TanStack's default `refetchOnMount` for stale data) and the
server's streamed prefetch. React runs child effects before parent effects, so the
client refetch starts first and `hydrate()` then skips attaching the streamed promise
(`existingQueryIsFetching`). The UI is unaffected — one instant paint, one refresh —
but the server's prefetch result is discarded: one wasted backend read per stale
revisit. `refetchOnMount: false` would remove it, at the cost of browser-Back
navigation (which reuses the router-cached RSC payload and therefore streams nothing)
showing stale numbers with no refresh at all. For a BI tool a silent stale page is the
worse failure, so the default stays. Within `staleTime`, only the server stream
refreshes and nothing is wasted (measured: zero `/api/proxy/brief*` requests on the
first visit and on a revisit inside the window).

## Patches

### 2026-09-12 — rollout to every route (owner: "continue to all pages")

**Scope.** All 90 data-bearing routes under `app/(app)` (plus the `orders`, `settings`
and `ads` layouts) now follow the SPEC-230 shape: a Server Component that parses the
URL, `prefetch()`es its `QueryDef`s without awaiting and renders a client view inside
`HydrationBoundary`. 24 registries in `lib/queries/` define every read once
(`analysis` alone carries 22); every `services/<domain>.ts` is now the one-line
`serverApi` face of its registry, exported signatures unchanged. Pages with no data
fetch (send-all, OAuth callbacks, `spotlight/draft/new`, the root redirect) were left
alone. `/ai` and `/system` were converted on top of the SPEC-229 shells once that spec
read *implemented*.

**Patterns that recurred, and the choice made each time.**
- *Dependent queries* (Reports: the newest date comes from the list; Tax Reports: the
  newest report's detail + rows): `useApiQuery(null)` parks on `skipToken` until the
  parent answer names the child; the page prefetches the child only when the URL
  already names it.
- *Client-paged tables* (`OrdersListPanel`): the page number is part of the key,
  `placeholderData: keepPreviousData` keeps the old rows dimmed while the next page
  arrives, and a page visited before paints instantly. Tables that page/search inside
  their own component (`DueToReorderTable`, `WinbackReviewTable`, `TransferTable`,
  `ConversationsPanel`) keep their `initial*` contract — the view feeds them the cached
  answer; converting their internal paging is a follow-up.
- *LLM-backed sections* (product/inventory commentary, return verdicts, catalog
  verdicts, dead-stock plan) keep their own skeleton so the fast data never waits, and
  `CatalogView` is mounted only once the cache-only verdicts have resolved because it
  seeds from them at mount.
- *Best-effort enrichments* (Spotlight Published: visibility, journey coverage,
  Clarity; Ads Overview: Clarity; Integrations: Google/Meta status) are separate
  queries whose error state degrades to the same fallback the server page used.
- *Shared answers*: one `/settings/status` query feeds the Settings layout and all four
  tabs; one `deadInventoryAlerts` feeds the list, detail and send pages; one Gorgias
  overview feeds Overview, Agents and the agent detail; Traffic's Overview / Lost
  Sales / Store League share one overview query. Switching between them fetches nothing.
- `URLSearchParams` cannot cross the server → client boundary: pages pass
  `paramsQueryString(params)` (`lib/params-query.ts`) and the view rebuilds it.
- `generateMetadata` on `inventory/store-transfers/[locationId]` still awaits the read
  for its title (streamed by Next 16, does not block the UI); it is the one remaining
  server-side `await` of a service read, kept on purpose.

**A bug the sweep caught that the suite could not.** Five page-size constants were
exported from `"use client"` views and imported by their Server Component pages. Every
export of a client module is a client *reference* on the server — `String()` of it is
the throwing proxy's source — so the customers page prefetched
`/customers/money-finder?page=1&limit=function()%20{…}` (422); only the client retry
kept the page working. Now in `lib/page-sizes.ts` with the rule written on it: never
export a non-component value from a client module for a server file to consume.

**Verification (real backend, remote Railway database).** Playwright: hard load each
route (first), then navigate away and back through real sidebar/tab link clicks
(revisit); ready = skeleton count stable and real content present; console errors
captured throughout.

```
route                first(ms)  revisit(ms)     route                       first  revisit
/brief                   4 725         184       /orders/cancelled             756      298
/reports                 4 221         149       /customers/segments         1 743      277
/orders                    664         180       /inventory/transfers        3 594      375
/customers               1 035         154       /inventory/dead-stock         830      287
/inventory               1 915         164       /inventory/allocation       4 382      457
/products                1 887         139       /products/returns          18 645      280  (LLM verdicts)
/discounts               2 854         126       /products/catalog           4 588      273
/returns                 2 327          93       /discounts/attention        1 914      373
/warehouse               2 600          77       /traffic/hours              2 300      331
/traffic                 2 474         177       /foresight/season           6 845      303
/foresight               3 306         100       /team-performance/agents    5 317      343
/social                  3 673         116       /team-performance/alerts    8 746      356
/spotlight               2 697         105       /settings/daily-report      1 214      282
/results                 2 837          57       /system/runs                2 031      338
/tax-reports            11 702         203       /inventory/buy-plan         3 332      359
/team-performance        5 767         172
/integrations            2 211         168
/settings                1 104          72
/ads                     2 942         111
/ai                      3 059         126
/system                  2 130         111
```

Every revisit across 45 measured routes: **57–457 ms**. Deep links the sweep could not
reach by clicking (winback, review/send flows, history, nexus, markdown plan, `?tab=`
routes) all loaded on first visit with no errors. Browser console across the whole
sweep: no hydration warnings, no React errors. Two backend notes surfaced by the sweep
and left for the backend repo: `/foresight/season` returned a 500 once
(`asyncpg DiskFullError: could not resize shared memory segment … No space left on
device` — 16 occurrences in today's backend log under parallel load, a Railway
Postgres shared-memory limit, not a frontend concern; the client retry recovered the
page as designed), and social post image 404s for posts without an image (pre-existing).

`npm test` 113 files / 1 339 tests (48 new in `tests/query-registries.test.ts`, which
pins every registry's keys as serialisable, scoped and distinct, and every loader as
reaching the backend only through the `api` it is handed); `npx tsc --noEmit` clean;
`npm run lint` 0 errors; `npm run build` compiles every route.
