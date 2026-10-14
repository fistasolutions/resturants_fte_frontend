# SPEC-051 — Inventory Analyst UX Fixes

## Scope
Frontend only (+ small backend patch for transfer pagination).

## Fixes

### 1. AI commentary pre-fetched server-side (no loading on every page load)
- Add `getInventoryCommentary` server-side fetcher to `services/analysis.ts`
- Add to `Promise.all` in `inventory/page.tsx`
- Pass as `initialCommentary` to `<AiCommentary page="inventory">`

### 2. Transfer table: simple Prev / Next pagination (no Go button)
Backend: add `page: int = 1` and `page_size: int = 20` query params to
`GET /analysis/inventory/transfers`. Endpoint slices the already-computed
list; commentary endpoint is unaffected (calls service directly).

Frontend: URL-based — inventory page reads `?transfers_page=N`, passes to
`getInventoryTransfers`. TransferTable receives `currentPage`, `totalPages`,
`prevHref`, `nextHref` and renders simple Prev / Next `<Link>` buttons.

### 3. Remove Out of Stock + Low Stock AlertCard widgets
These already exist on the Dashboard. Remove both `<AlertCard>` components
and the surrounding `<section>` from `inventory/page.tsx`.

### 4. Markdown plan → full sub-page (not a drawer)
- Create `/inventory/markdown-plan` route: `app/(app)/inventory/markdown-plan/page.tsx`
- Server component pre-fetches dead stock aged data (fast SQL)
- Passes to `features/analysis/markdown-plan-page.tsx` client component
- Layout: breadcrumb ("Inventory Analyst → Markdown Plan") + page title
- Split panel: left = list of dead stock products; right = AI recommendation
  for selected product (fetched client-side, skeleton while loading)
- "Open markdown plan" button in dead-stock-section becomes a `<Link href="/inventory/markdown-plan">`

### 5. "Open markdown plan" button at top of dead-stock-section
Move the button from the card footer to directly below the hero card,
above the bucket table.

## Acceptance Criteria
- [ ] Inventory page loads with both AI verdicts pre-rendered (no skeleton flash)
- [ ] Transfer table shows Prev / Next buttons; navigates correctly
- [ ] No Go button or page-number input anywhere
- [ ] Out of Stock and Low Stock AlertCards are gone from /inventory
- [ ] /inventory/markdown-plan loads with breadcrumb + split panel
- [ ] Clicking a product on the left shows its AI recommendation on the right
- [ ] AI plan fetches client-side with skeleton while loading
- [ ] "Open markdown plan" is above the bucket table
- [ ] npm test green, npm run build green, tsc clean
