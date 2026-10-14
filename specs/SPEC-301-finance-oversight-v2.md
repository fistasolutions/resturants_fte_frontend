# SPEC-301 — Finance Oversight v2: eight tabs, as an employee

**Date:** 2026-09-24 · **Repo:** frontend · **Status:** implemented
**Backend twin:** `SPEC-295-finance-oversight-v2.md`
**Builds on:** `SPEC-296-finance-oversight-page.md`, `SPEC-299-finance-live.md`,
`SPEC-293` (the employee chat), SPEC-230 (the cache), SPEC-232 (persistent shells)
**Design:** `ref/mockups/finance-oversight-v2-2026-09-24.html` — the owner: *"just wow …
I LOVE THIS. Add this properly and professionally: a proper database end to end, a proper
backend, the best UI with proper skeleton loading, proper navigation, proper caching,
proper column alignment, responsive, pagination where it's needed, proper subtabs and
breadcrumbs."*

## The page

`/employees/finance`, the same shell as every route (SPEC-232): breadcrumb
**Digital Employees › Finance Oversight**, the header with **Sync now** and **Ask Finance
Oversight**, and one tab bar. The tabs, in order, each kept in the URL as `?tab=`:

| tab | what it answers | backend read |
| --- | --- | --- |
| **Overview** | what's owed, what's late, can each company pay its week, what needs a look | `/finance/ap` |
| **Bills** | the client's list: every column, saved views, filters, group-by, totals | `/finance/ap` (same cache entry) |
| **Payment run** | what to pay, in what order, from which account | `/finance/run?through=` |
| **Aging** | company × age grid, who we owe, the trend | `/finance/aging` |
| **Vendors** | each vendor across all three companies, and how fast it's paid | `/finance/vendors` |
| **Cash** | the next 13 weeks: bank + takings − bills | `/finance/cash?company=` |
| **Chat** | Finance Oversight's own threads | the SPEC-287 engine, `employee=finance` |
| **Profile** | the job, the authority, the scorecard, the books | `/finance/profile` |

A/R and P&L sit at the end of the bar as muted, non-link **Soon** labels. That is the
roadmap the owner approved in the mockup, and they say so rather than lead nowhere.

Drill-downs keep the platform pattern — their own page with the breadcrumb, never a
drawer:
- `/employees/finance/bills/[billId]` — the bill, why it's flagged, its lines, the
  payments against it, the vendor's other open bills, and the note that a QuickBooks link
  opens in whichever company the browser is signed into.
- `/employees/finance/vendors/[vendorKey]` — **new**: the vendor across companies, its
  open bills, its split by company, its payments.

## Navigation that costs nothing

**Tab and filter changes never reach the server.** Next 16 syncs native
`history.pushState` with `useSearchParams`, so the tab bar, every tile and every saved view
is a `ShallowLink`: a real `<a href>` (middle-click and new-tab still work), whose plain
click pushes the URL in place. No RSC request, no server prefetch, no refetch — the view
re-renders from the cache in one frame. Back and forward work because the URL moved.

**Every tab reads through the SPEC-230 cache**, one registry entry per endpoint in
`lib/queries/finance.ts`. The page prefetches the overview's reads on the server (the most
common landing). Other tabs load on first open behind their own skeleton, and each tab
link **prefetches its query on hover or focus**, so by the time the click lands the data
is usually there. A second visit to any tab is instant.

`placeholderData: keepPreviousData` holds the rows on screen while a keyed read (the run's
cut-off, the cash company) refetches, so a switch never flashes a skeleton over data.

## Skeletons

Every tab has its own skeleton, shaped like the tab (tile row, grid, table rows), shared
by the route's `loading.tsx` and the view's pending state so the shape never changes
between them. The bill and vendor pages carry their own, header included — they own their
header.

## Tables — alignment, sorting, paging

- Money and counts are right-aligned with `tabular-nums`; names and dates left; status and
  flags left, after the figures. Headers align with their column.
- Bills: sortable columns, group-by company or vendor with subtotals, a total row for
  what is shown, **25 per page** with a page control that keeps sort and filters.
- Vendors: sortable, **25 per page**.
- The payment run, the aging grids, the cash weeks and the profile are bounded (tens of
  rows at most) and don't page.
- Every table sits in its own `overflow-x: auto` container. The page never scrolls sideways
  at phone width, and the first column stays readable.

## The pieces

- **Overview:**
  - the connection line and the morning note (backend wording, with its action links);
  - six money tiles: Total A/P · Past due · Due 7 days · Due 30 days · Cash in QuickBooks ·
    Left after this week;
  - one tile per company: owed, past due, late + next 7 days, bank, and the verdict chip
    (Short · Tight · Covered · No bank account);
  - three queues: **Pay now** · **Due this week** · **Needs a look** — the flags, labelled
    "rules, not AI";
  - aging tiles and **Since yesterday**.
- **Bills:**
  - saved-view chips (All open · Past due · Due 7 · Due 30 · Partially paid · Flagged);
  - company, vendor and group-by selects, search, and a removable chip per active filter;
  - flag chips on each row.
- **Payment run:**
  - the cut-off segment (This week · Next Friday · 30 days) in the URL;
  - one tile per company: bank vs this run, the bar, what's left, the verdict;
  - the ordered table: a checkbox per bill (the held-back second copy starts
    unticked), the reason chip, and **company cash after** each bill;
  - **Copy list** puts the ticked bills on the clipboard.
  - It's a plan: the page says paying happens in QuickBooks.
- **Aging:**
  - the heat grid (click a cell → Bills with that company and age);
  - vendor concentration (% ⇄ $);
  - the snapshot trend, which says it starts the day snapshots did when it has fewer than
    two points;
  - the vendor × age grid.
- **Vendors:** summary tiles, then the table (companies as chips, owed, past due, next
  due, terms with a discount chip, typical bill, days to pay with "slower than terms").
- **Cash:**
  - the company segment;
  - tiles: bank, due this week, takings per week, the lowest week;
  - the 13-week chart (takings and bills as bars, cash as a line, the cushion dashed) and
    the week table;
  - what the view leaves out, stated.
- **Chat:** the SPEC-293 employee chat, generalised: one `EmployeeChatPanel` takes the
  employee's meta and icon. Spotlight's tab becomes a two-line wrapper over it, and the
  Ask Glisp pill is suppressed on this tab as on Spotlight's (`isChatWorkspace`).
- **Profile:**
  - the job description;
  - the authority ladder (does alone · brings to you · never);
  - the scorecard from `/finance/profile` (on-time rate, days to pay, discounts taken
    vs offered and the amounts, open flags);
  - the connected books.

All arithmetic that decides anything is the backend's (Rule 8). What remains in `lib/` is
narrowing, ordering, formatting and chart geometry — each pure and unit-tested:
- `lib/finance.ts` — the filters, including `watch` and group-by;
- `lib/finance-run.ts` — cash after each ticked bill, and the reason labels;
- `lib/finance-charts.ts` — trend and cash-chart geometry;
- `lib/finance-api.ts` — the adapters.

## Files

`lib/queries/finance.ts`, `lib/finance-api.ts`, `lib/finance.ts`, `lib/finance-run.ts`,
`lib/finance-charts.ts`, `lib/employee-chat.ts`, `lib/chat-drawer-prompts.ts`,
`types/finance.ts`, `components/shared/shallow-link.tsx`,
`features/finance/{finance-shell,finance-tabs,finance-view,finance-skeleton,finance-notice,bills-table,vendors-table,bill-page-view,bill-view,bill-skeleton}.tsx`,
`features/finance/tabs/{overview,bills,run,aging,vendors,cash,chat,profile}-tab.tsx`,
`features/finance/{vendor-view,vendor-page-view,vendor-skeleton,trend-chart,cash-chart}.tsx`,
`features/employees/employee-chat-panel.tsx`,
`features/spotlight/employee-chat/spotlight-chat-tab.tsx`,
`app/(app)/employees/finance/vendors/[vendorKey]/{page,loading}.tsx`,
`lib/docs/content/employees.ts`,
`tests/{finance,finance-api,finance-run,finance-charts,query-registries,chat-drawer-prompts}.test.ts`.

## Acceptance criteria

1. Eight tabs in the order above, each at `?tab=`, with the breadcrumb and header
   persistent. Switching a tab or a filter makes **no server request** (checked in the
   browser's network log) and is measured under 100 ms on a warm cache.
2. Each tab and both drill-down pages show a skeleton shaped like themselves while their
   read is pending, and a recoverable error state if it fails.
3. Every money column is right-aligned and tabular; Bills and Vendors page at 25 rows and
   keep sort and filters across pages.
4. The overview shows the backend's note, the per-company verdicts and the three queues;
   every tile and queue item is a link to the filtered list or the bill.
5. The payment run starts with the second copy of a duplicate unticked. Ticking updates
   each company's "cash after" in place without a request, and Copy list copies the ticked
   rows.
6. The vendor page loads at `/employees/finance/vendors/<key>` with its breadcrumb; an
   unknown key shows the backend's 404 message.
7. The Chat tab runs Finance Oversight's own threads. Spotlight's chat still works
   unchanged.
8. At 390 px wide every tab is usable and the page never scrolls sideways.
9. `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` green; the Digital
   Employees doc's Finance section describes all eight tabs and `updated` is bumped.

## Verification

Run 2026-09-24. Live data: the production database has no QuickBooks company connected
today, so every endpoint was checked there for its empty payload (all 200; an unknown vendor
404, `through=year` 422), and the populated UI was checked against a **scratch SQLite copy
of the app** seeded with three companies' books (50 open bills, 13 months of paid bills and
payments, bank balances, 31 daily snapshots, store sales per location) served on :8103 →
production build on :3103. Nothing was written to the production database.

1. **done.** Eight tabs, breadcrumb and header persistent. Measured with real clicks on a
   production build: tab switches 36–87 ms, warm revisits 28–50 ms. A switch makes no
   server render (no RSC request); a tab's first open makes its one data read unless hover
   already warmed it. Found and fixed during verification: `next/link` viewport prefetch
   was firing two RSC requests per bill/vendor link on the Run and Aging tabs (22 on
   Run) — every Finance link is now `prefetch={false}`.
2. **done (code), partial (browser).** Each tab, the bill page and the vendor page have
   their own shaped skeleton and a `QueryErrorState`; the skeletons were seen live, the
   error states were not forced in the browser.
3. **done.** Money right-aligned, tabular; Bills pages at 25 (page 2 captured), sort and
   filters live in the URL. Sortable headers now keep the uppercase header style (the
   button reset it — fixed).
4. **done.** Note, verdicts, three queues; every tile and row links. The "Needs a look"
   queue now puts flag chips on their own line (they truncated vendor names — fixed).
5. **done.** The second copy starts unticked with its reason; cash-after per company is
   pure (`lib/finance-run.ts`, 6 tests). Copy list is unit-tested (`runText`), not clicked
   in the browser.
6. **done.** Vendor page with breadcrumb captured; backend 404 verified by curl.
7. **done (tests).** `EmployeeChatPanel` shared; `tests/employee-chat.test.ts` covers both
   employees. Not exercised against a model (no paid calls).
8. **done.** 390 px: `scrollWidth` = 390 on every tab. Found and fixed: an `sr-only`
   header label escaped the Cash table's scroll box (no positioned ancestor) and widened
   the page to 640 px — `Section` is now `relative`.
9. **done.** `npm run lint` 0 errors (3 pre-existing `<img>` warnings in Spotlight),
   `npx tsc --noEmit` clean, `npm test` 171 files / 1,950 tests passed, `npm run build`
   compiled; employees doc Finance section rewritten for eight tabs, `updated` 2026-09-24.

Also fixed while verifying: small amounts rendered "$791.5" in compact cells —
`compactMoney` (whole dollars under $1,000) replaces the compact formatter across Finance;
the last axis label of both charts is end-anchored (it was clipped); the cash chart's
viewBox widened so its text is not blown up on desktop; empty cash weeks show "—" not
"−$0"; the run's company tiles read "$29K to pay · $18.3K in the bank". The v1
`vendors-table.tsx` and its `vendorTotals` helper were unused and removed.

Known, not Finance: on the scratch SQLite stack every route (including `/employees` and
`/integrations`) logs React #418 on first load; on the real stack (:3102) none do.
