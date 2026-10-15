# SPEC-386 — Local pages: Search Visibility for a restaurant brand

**Status:** implemented 2026-10-16 · **Repo:** frontend · **Backend:** SPEC-403 · **Plan:** backend
SPEC-401 (W3)

## Why

A restaurant is found by local searches. Search Visibility gains a **Local pages** tab where the brand
writes, edits and publishes one page per branch, and the brand's own site serves those pages to
guests and to Google.

## The tab

`/spotlight?tab=local-pages` — shown in the Search Visibility bar **only** when the organization has
the `restaurant` feature (`spotlightTabsFor(features)` in `lib/spotlight.ts`; everyone else's bar is
unchanged).

- Tiles: branches · pages written · published; a link to the brand's site (`/r/<slug>`).
- **Write the missing pages** (`spotlight.manage`) — every branch without a page.
- One row per branch: code, name, town, status (No page · Draft · Published, and "plain" when the
  model could not write it), the page's headline; actions **Write / Rewrite** (`spotlight.manage`),
  **Edit** (a dialog: headline, intro, search title ≤ 60 with a counter, search description ≤ 155),
  **Publish / Unpublish** (`spotlight.publish`), **View** (opens the public page when published).
- Reads `lib/queries/spotlight.ts` `localPages()`; writes in `services/local-pages-actions.ts`, each in
  `lib/action-permissions.ts`; pure helpers in `lib/local-pages.ts` (counts, status label, the length
  counter).

## The public site (no sign-in; `/r` is an open route)

- `/r/[slug]` — the brand's locations: one card per published page (name, town, address) linking to
  it, and an Order online button (`/order/<slug>`).
- `/r/[slug]/[location]` — the page: headline, intro, the address with a map link, phone, open now,
  delivery/carryout, the week's hours, **favourites** with prices (the branch's own menu), an
  Order online button, and schema.org `Restaurant` JSON-LD (name, address, telephone, geo,
  `openingHoursSpecification`, `servesCuisine` omitted, `url`, `menu`). `generateMetadata` uses the
  page's search title and description and a canonical URL.
- `/r/[slug]/sitemap.xml` — the brand's location pages for search engines.
- Server-rendered through `lib/public-api.ts` (`publicGet` — the backend origin, no cookie, revalidated
  every 5 minutes; a 404 renders Next's not-found).

## What FOC sees (Rule 12)

Unchanged — the tab exists only with the `restaurant` feature; `/r` serves restaurant brands only.

## Acceptance criteria

1. The tab appears for a restaurant brand only; the others' bar is unchanged.
2. Write, rewrite, write missing, edit (with length checks), publish, unpublish — each behind its role.
3. The public index and page render server-side with live hours, menu prices and JSON-LD; an unknown
   or draft page is a 404.
4. Unit tests for `lib/local-pages.ts`, the JSON-LD builder and `spotlightTabsFor`.

`app/robots.ts` now allows `/r/` (and still disallows everything else): the location pages exist to be
found. FOC has no `/r` pages, so nothing of FOC's is indexed.

## Verification (2026-10-16)

`tests/local-pages.test.ts` (5): AC 4 done (states and counts, length checks, the JSON-LD with an
after-midnight span closing at 23:59 and `<` escaped, the sitemap, prices, hours, directions, the tab
for a restaurant brand only). `tests/guided-view.test.ts` pins the new tab against the backend list.
Full suite 2756 passed; `tsc` clean; `npm run build` lists `/r/[slug]`, `/r/[slug]/[location]`,
`/r/[slug]/sitemap.xml`. Manual on the local demo: AC 1 done (the Local pages tab in Search
Visibility) · 2 done (write missing, rewrite, publish, unpublish) · 3 done (the page server-rendered
with its search title, JSON-LD, hours and eight favourites with prices; the sitemap; an unknown page
is 404).
