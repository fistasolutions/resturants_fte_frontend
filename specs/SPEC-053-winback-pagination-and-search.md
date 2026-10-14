# SPEC-053 — Winback List: Pagination + Search UI

- **Status:** Implemented
- **Date:** 2026-07-24
- **Backend:** SPEC-047-winback-pagination-and-search.md.
- **Owner request:** "not all at once" — paginate the winback table (10
  per page) and add search on the page, matching the backend pagination.

## Design

### `lib/winback-filters.ts` (new, pure, unit-tested)

Mirrors the `lib/order-filters.ts` pattern at a much smaller scale (only
two params here): `parseWinbackFilters(params) -> {q, page}` and
`winbackPageHref(filters, page) -> string` for building prev/next links
that preserve the current search term.

### `app/(app)/brief/winback/page.tsx`

Becomes fully server-driven via `searchParams` (`q`, `page`), same
convention as `/orders`:

- A plain `<form method="get">` search box (no JS) — search-as-you-submit,
  not live client-side filtering, since the source of truth is the
  paginated backend response.
- `getWinbackCustomers(page, 10, q)` — one server-side fetch per page.
- Prev/Next pagination nav (`ChevronLeft`/`ChevronRight`, same as the
  orders page), disabled at the boundaries.
- Table renders exactly the current page's 10 rows (or however many
  remain on the last page).

### `features/brief/winback-review.tsx` simplifies

No longer holds the customer list in client state (the RSC page now owns
pagination/search) — shrinks to a small client island that only holds the
`sent`/`sending`/error/notice state and renders the "Sync to Klaviyo"
button. **The send button still fires the full-list sync** — this is a
display-only pagination; the backend's `/brief/winback/send` (SPEC-047)
was never scoped to a page in the first place, so no frontend change is
needed there beyond passing through the already-current `sent`/`sent_at`
props each page load.

## Tests (Rule 4)

- `tests/winback-filters.test.ts` — `parseWinbackFilters` (clamps page to
  ≥1, trims/caps `q` length) and `winbackPageHref` (preserves `q`, omits
  empty params) — pure logic, fully unit-testable (unlike the page itself,
  per this repo's no-jsdom-runner convention).

## Acceptance criteria

- [x] Search box + Prev/Next pagination, 10 per page, mirrors `/orders`
      conventions.
- [x] Sending still syncs every qualifying customer, not just the visible
      page.
- [x] `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` green.

## Manual verification checklist

- [ ] Typing a search term and submitting filters the table and resets to
      page 1.
- [ ] Prev/Next preserve the active search term.
- [ ] "Sync to Klaviyo" still works with a search term or page 2+ active.
- [ ] Both themes; 375px responsive.

## Patches

- **2026-07-24 (owner request: "add more filer... almost 15 person...
  ADD THE TABLE HEADER A COLOR"):**
  - Page size raised from 10 to 15 (`PAGE_SIZE` in the page component;
    `getWinbackCustomers` default `limit` also 15).
  - Two more filter inputs (min lifetime spend, min days silent) added
    to the same GET form alongside search — `lib/winback-filters.ts`
    gained `minSpend`/`minSilent` (parsed, validated positive-number,
    preserved across page links by `winbackPageHref`), matching backend
    SPEC-047's Patch.
  - Table header shaded with the `bg-muted` semantic token (no hardcoded
    color, per root Rule 9).
