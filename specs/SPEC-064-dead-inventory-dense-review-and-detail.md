# SPEC-064 — Dead Inventory Alerts: dense review table + client pagination + row-detail route

## Problem
The first pass (SPEC-062) rendered every sentient review page in this app has
already moved to (SPEC-061 `orders/[id]`, `/brief/transfers`): real page, real
URL, breadcrumb, browser back works. SPEC-063 established client-side,
component-only pagination so paged tables don't re-render the whole page.

The Dead Inventory Alerts page was still on the SPEC-062 layout:
- 3 loose, oversized summary "stat cards" (space-4 grid, p-4, text-xl) —
  heavy chrome for 3 numbers;
- a vertical stack of full-width `Card`s per alert (p-5, inner muted mini-grid,
  ~160px+ each) — low density (~3 alerts/viewport), no cross-row comparison,
  no "money impact ranked" scanability;
- no pagination (the backend returns up to 200 rows in one payload, which the
  card stack rendered end-to-end);
- rows weren't interactive — no drill-down into "this exact style at this
  location".

## Solution
Three coordinated changes, all on the same page family:

### 1) Dense layout (redesign — this spec ratifies it retroactively)
- **Summary strip:** the 3 stat cards collapse into ONE bordered band
  (`rounded-card ring-1 divide-x`), four inline stats (Styles flagged /
  Unsold value (warning tone) / Locations affected / Window). `px-4 py-3`,
  `text-lg` number + `text-[10px] uppercase tracking-widest` label.
- **Alert list:** the per-card stack becomes ONE dense shadcn `Table` inside a
  bordered shell (`rounded-card ring-1`), header `sticky` in a
  `max-h-[70vh] overflow-auto` container. Columns: `#` (API rank),
  `Style` (name + 1-line gap context), `Location · idle` (name + "never sold
  here / Nd since sale"), `Stock`, `Value` (warning, tabular), `Gap`,
  `Selling elsewhere` (secondary badges, max-w-52), `Sizes` (outline badges,
  first 3 + "+N (units)"), `Status/Action` (per-row Send button or
  `✓ Sent hh:mm`). Cells `py-2`, header `text-[10px] uppercase tracking-widest`.
  Footer: `N of M still pending`. All tokens, 8px scale — zero new colors.

### 2) Client-side pagination (10/page, component-only re-render)
The backend `GET /analysis/inventory/dead-inventory-alerts` returns the whole
windowed set ranked by money impact in ONE payload (no `page`/`page_size`
query params; `limit` caps at 200). Per SPEC-063's rule ("never waterfall a
page reload for a table update") and the user's explicit requirement —
"when we move to next page ONLY the component re-renders, not the whole page"
— `DeadInventoryReview` paginates over the already-fetched array in React
state:
- `page` state, `PAGE_SIZE = 10`; `useMemo`'d `rows = alerts.slice((page-1)*10, page*10)`;
- Footer gains `‹ Prev  Page N of M  Next ›` (`Button size="xs" variant="outline"`,
  `disabled` at both ends); the `N of M still pending` count stays in the same footer row;
- Zero additional fetches total on page change — the payload was fetched once
  server-side; `sentMap`/`errorByKey`/`sendingKey` are keyed by
  `${product_id}:${location_id}`, so per-row send state survives any page
  change;
- No URL update on page change (session-local), matching SPEC-063's
  `/brief/transfers` behavior — deep-linking to page 1 is implicit.

### 3) Row → `/inventory/dead-inventory-alerts/[productId]/[locationId]` detail page
"Open the row in a sub tab with breadcrumbs, same page family, complete row
info" — the SPEC-061 stretched-link pattern, since each alert IS a small,
self-contained record:
- **New route** `app/(app)/inventory/dead-inventory-alerts/[productId]/[locationId]/page.tsx`
  (Server Component). Fetches via the existing `getDeadInventoryAlerts()`,
  matches the pair `(product_id, location_id)` from `alerts` — the API is
  already the per-(style, location) alert contract, so no new backend endpoint
  is needed (root Rule 8: backend calculates; this is a view selection, not a
  calculation).
- **Breadcrumb:** `Inventory Analyst / Dead Inventory Alerts / <title> · <location>`
  (each crumb a real `Link`, current page plain text).
- **Detail view** `features/inventory/dead-inventory-detail.tsx` (presentational):
  header block (`h1` title + context line), a dense metric strip mirroring the
  page's stat band (Stock here / Stuck value (warning) / Sales gap / Days idle
  as `Never sold here | Sold today, now idle | Nd since last sale`), a full
  `Selling elsewhere` section (one row per location, badges), and the complete
  `Size breakdown` (`variant_title · sku · units`) — the row table deliberately
  truncates these; the detail page shows all.
- **Row click:** each `<TableRow>` in the review table becomes relative; the
  Style cell contains a real `<Link href=...>` with `after:absolute after:inset-0`
  (stretched across the row) + `group-hover` styling, a trailing chevron as the
  "goes somewhere" cue. Ctrl/cmd-click and "open in new tab" work natively.
  The trailing Send cell gets `relative z-10` + `e.stopPropagation()` on the
  button so the per-row action competes with the stretched link safely.
- 404/unknown pair renders the same breadcrumb shell + "This alert was
  refreshed and is no longer flagged" plain message (alerts are windowed;
  a style can resolve between list load and detail click).

## Acceptance criteria
- [ ] First page shows exactly 10 rows; `Page 1 of M`, Prev disabled at first.
- [ ] Clicking Next/Prev re-renders ONLY `DeadInventoryReview` — the header,
      breadcrumb, and summary strip don't remount (no network on page change).
- [ ] Per-row send state (idle→sending→sent | error) survives page changes.
- [ ] Clicking a row opens `/inventory/dead-inventory-alerts/{pid}/{lid}` with
      breadcrumb; browser back returns to the list; cmd-click opens a new tab.
- [ ] Detail page shows complete info incl. all sizes (no truncation) and all
      selling-elsewhere entries; unknown/stale pair shows the graceful message.
- [ ] Empty state + loading skeleton mirror the dense table layout exactly.
- [ ] Design tokens only, no entrance animations, `npm test`,
      `npx tsc --noEmit`, `npm run lint`, `npm run build` green.

## Patches

- **HCI polish pass on the detail page** (`features/inventory/dead-inventory-detail.tsx`):
  the product title was repeated 3× on the page (breadcrumb, `<h1>`, and again
  inside the card) — removed the in-card repeat and promoted the FROM → TO
  line to that space instead, since that's the actual unique content the card
  adds. The size-breakdown table's "Move" column was a byte-for-byte duplicate
  of "Units stuck" with no distinct value — removed; the table is now Size /
  SKU / Units stuck. Rows now sort by units descending (highest-impact sizes
  first — display-order only, no new computation, root Rule 8 respected). The
  table is capped to a scrollable `max-h-80` with a sticky header instead of
  pushing the whole page down for styles with many sizes (this one has 49);
  the "Total to move" row moved out of the table into a fixed footer bar so
  it's visible regardless of scroll position. The "No recorded sale here"
  badge — the actual reason the item is flagged — got a warning tint instead
  of neutral, so it doesn't read the same as the two purely-informational
  badges next to it. Verified live against real store data in both themes.

- **Image-led product detail upgrade** (`features/inventory/dead-inventory-detail.tsx`):
  the detail card becomes a responsive editorial product layout: a large,
  portrait product image on the left and the actionable product intelligence
  on the right. The intelligence panel owns the source-to-destination verdict,
  send state/action, four key facts (stock, stuck value, sales gap, last sale),
  and the complete list of locations where the style is selling. The complete
  size breakdown remains a separate, full-width section below the hero so it
  scans as an operational table rather than competing with the product image.
  The old context strip is removed because it duplicated values now shown in
  the intelligence panel. On small screens the layout stacks image, details,
  and table; all styling remains semantic-token-only, uses the existing radius
  and spacing scales, and introduces no animation or new data calculation.
