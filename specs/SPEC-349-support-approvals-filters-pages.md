# SPEC-349 — Support Approvals: filters and pages that change only the list

**Status:** implemented 2026-10-07 · **Repo:** frontend (backend SPEC-358 serves it) ·
**Builds on:** SPEC-346-customer-support-agent.md, SPEC-347-support-email-send-safety.md,
SPEC-348-support-inbox-reading.md (the same keep-the-page pattern)

## Why

Owner (2026-10-07): "add proper pagination and filters to the Approvals page; make sure when I
switch any filter or move from one page to another, just the data renders, not the UI."

## What changes

- **The view is in the URL.** `lib/support-approvals.ts` (pure, unit-tested) reads and writes
  it: `topic`, `channel`, `confidence`, `q`, `sort` and `page`, next to `tab=approvals`. Every
  change moves the URL with `history.pushState`, or `replaceState` for search typing, so no
  server render happens and back/forward work.
- **The filter bar** sits above the list:
  - confidence as tags (All · High · Medium · Low), each with its count from `counts`;
  - Topic and Channel selects, each option with its count;
  - a search box (customer, email or subject), debounced by 300 ms;
  - a sort select (Oldest · Newest · Lowest confidence · Highest value);
  - "Clear filters" when any filter is set.

  Changing a filter goes back to page 1.
- **Pagination** sits under the list: "21–40 of 89", Previous and Next, and "Page 2 of 5".
  Hovering Previous or Next prefetches that page, and the next page is prefetched once this one
  shows.
- **Only the data changes.** The page query keeps the previous page on screen
  (`keepPreviousData`), dimmed, with `aria-busy`, until the next arrives. The header, the filter
  bar, the hints and the pagination stay mounted. The tab's skeleton shows only on the very first
  load.
- **Keys and bulk approval** work on the current page: `j`/`k`/`a`/`e`/`b`/`r` as in SPEC-347, and
  "Select all bulk-safe" selects that page's eligible replies. The selection clears when the page
  or the filters change.
- **Docs (Rule 11):** the Approvals section describes the filters and the pages.

**What FOC sees (Rule 12):** changed because the owner asked. Approvals gains filters and pages. No setting or data changes.

## Acceptance criteria

1. Every filter, the search, the sort and the pages update the URL and the list only; the tab
   never shows its skeleton after the first load.
2. The counts on the tags and options match the backend's `counts`.
3. A filter change returns to page 1; Previous and Next respect the bounds.
4. `npm test` (new `tests/support-approvals.test.ts`), `npx tsc --noEmit`, lint on the touched
   files and `npm run build` are green.

## Manual verification checklist

- Approvals: click High, then pick a topic, then type a name. Only the list changes, and the
  counts stay.
- Go to page 2 and back with the browser's back button: the URL and the list follow.
- Approve the last reply on the last page: the list moves to the new last page.
