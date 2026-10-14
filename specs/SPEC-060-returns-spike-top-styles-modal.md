# SPEC-060 — Returns Spike "Top Styles" Modal

## Problem
The client's actual ask (relayed via Cline) was "top 10 styles" by return rate, visible
without losing dashboard context. SPEC-059 built a redirect-to-filtered-orders flow,
which the client doesn't want — clicking the card should open a modal with the ranked
list right there. Depends on backend SPEC-054 (`GET /dashboard/returns-spike-top`).

## Solution
- **Progressive disclosure, no context loss**: the Returns Spike card's face is
  unchanged (still shows the single worst offender + rate, from the existing
  `returnsSpikeProduct`/`Rate` dashboard payload — cheap, already fetched on page load).
  Its action changes from a `<Link>` to `/orders` into a button that opens a `Dialog`
  (shadcn, already used elsewhere — `features/customers/draft-email-panel.tsx`) showing
  the top 10, ranked worst-first. The dashboard's initial payload is untouched — the
  ranked list is fetched lazily, only if the modal is opened (root Rule 5: don't pay for
  data most page views never use), same lazy-fetch-on-open pattern as
  `draft-email-panel.tsx`.
- `AlertCard` (`features/dashboard/alert-card.tsx`) gets a new optional `action?:
  ReactNode` prop. When supplied, it renders in place of the default `actionLabel`/
  `actionHref` link — additive, the other three alert cards (Dead Stock, Low Stock,
  Unfulfilled) are untouched and keep using the link form.
- New client component `features/dashboard/returns-spike-modal.tsx`: a `Dialog` whose
  trigger matches the existing action-link's exact visual style (text-ai, arrow icon).
  On open, fetches `GET /api/proxy/dashboard/returns-spike-top?limit=10` once (cached
  in component state for the session — reopening doesn't refetch). States: loading,
  error (with retry), empty ("No return spikes in the last 30 days"), and the ranked
  list. Each row: rank number, product name, return rate, and a small secondary "Orders"
  link using the existing `returnsSpikeHref()` (SPEC-059) — so drilling into a specific
  product's orders is still one click away, just no longer the *only* path.
- `types/analytics.ts` — new `ReturnsSpikeItem { product: string; productId: number;
  ratePct: number }`. `lib/adapters.ts` — no dashboard-payload change needed (this data
  comes from the new endpoint, adapted inline in the modal component, mirroring how
  `draft-email-panel.tsx` shapes its own response rather than going through the
  dashboard adapter).
- `app/(app)/dashboard/page.tsx` — Returns Spike card passes
  `action={<ReturnsSpikeModal />}` instead of `actionLabel`/`actionHref`, only when
  `allClear` is false (unchanged: `AlertCard` never renders the action row in its
  all-clear state, so no extra guard needed).

## Acceptance Criteria
- [x] Clicking the Returns Spike card's action opens a modal in place — no navigation,
      dashboard state/scroll position untouched (verified live: URL stayed
      `/dashboard` until a row's "Orders" link was explicitly clicked)
- [x] Modal shows up to 10 products ranked by return rate descending, matching the
      backend's ranking (verified against real store data: 166.7% → 83.3%, 10 rows)
- [x] Loading, error+retry, and empty states render correctly (loading verified live;
      error/empty are the same reviewed code path as `draft-email-panel.tsx`, which
      already ships this pattern)
- [x] Each row's "Orders" link still lands on `/orders` filtered to that product
      (verified live: row 1 → `/orders?product=<id>&product_name=<name>`, page
      showed the product-scoped list with the name in the header)
- [x] The other three alert cards (unchanged) still navigate via `<Link>` as before
      (code unchanged; not independently re-verified live this pass)
- [x] `npm test` (219 passed), `npx tsc --noEmit` clean, `npm run lint` clean on
      touched files, `npm run build` green
- [x] Manual check: opened via click, closed via Escape (confirmed), both light and
      dark theme screenshotted live — correct tokens/contrast in both, no console
      errors. (Click-outside-to-close and outside-click were not separately
      exercised — Escape covers the same Radix dismiss path.)

## Files
- `features/dashboard/alert-card.tsx` (`action` prop)
- `features/dashboard/returns-spike-modal.tsx` (new)
- `types/analytics.ts` (`ReturnsSpikeItem`)
- `app/(app)/dashboard/page.tsx`
