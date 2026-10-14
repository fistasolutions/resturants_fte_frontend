# SPEC-035 — Report History Page & Trimmed Dropdown

**Status:** Implemented
**Backend contract:** SPEC-029 `/reports/history` (server-side pagination,
limit 10, SQL search). Owner reference: the claude.ai Chats page pattern.

## Design

1. **Dropdown (HistoryMenu):** shows the **latest 5** report dates + one
   **"Show more"** item → navigates to `/reports/history`. No scrolling list.
2. **`/reports/history` (RSC):** search input (plain GET form — the URL is
   the state: `?q=meli&page=2`, zero client JS), rows for EVERY stored report
   (all + brand + location scopes) with human labels (location ids resolved
   via `/reports/scopes`), date, generated-by badge; row click →
   `/reports?date=…&scope=…`.
3. **Pagination is server-side:** 10 per page from the API with total count;
   Previous/Next links + "Page X of Y"; disabled states at bounds. The
   browser never holds more than one page.
4. HCI: labeled search with placeholder "Search brands or locations…",
   keyboard-native links, empty state with the active query named, skeleton
   `loading.tsx` mirroring the layout, both themes, tokens only.

## Files

`types/reports.ts` (ReportHistory), `services/reports.ts`
(`getReportHistory`), `features/reports/history-menu.tsx` (trim + Show more),
`app/(app)/reports/history/page.tsx` + `loading.tsx`,
`app/(app)/reports/page.tsx` (fetch 5 for the menu).

## Acceptance Criteria

1. Dropdown lists exactly 5 + Show more; Show more lands on the history page.
2. Search + pagination round-trip through the API (network tab shows
   limit/offset calls); URL reflects q + page.
3. Four gates green.

## Patches

- 2026-07-20 (owner decision) — the SPEC-028 "Saved views" chip row is
  removed: with the pickers AND the history page, it was a third control for
  the same task. Component/service/type deleted; the backend
  `/reports/{date}/saved` endpoint stays (tested, harmless, useful to future
  consumers).

- 2026-07-20 (owner requests) — history rows now show the GENERATION time
  ("Generated Jul 20, 2026 · 2:07 PM", from `updated_at` — regenerations
  refresh it), a server-side **type filter** row (All / Daily briefings /
  Brands / Locations → `?type=` on the API), recency ordering
  (updated_at DESC — chats-style, latest generated on top), and a
  layout-mirroring row skeleton in `loading.tsx` so search/page transitions
  never shift the layout. Search + filter + page all compose in the URL.

- 2026-07-20 (owner request) — the "Brands"/"Locations" type chips became
  searchable DROPDOWNS (shared `SearchPicker`, extracted from the scope
  picker): pick "All brands"/"All locations" for the type-wide filter or any
  specific brand/location to pin the archive to that exact view
  (`?scope=vendor:MELI` — exact-match server-side via the new `scope` param;
  invalid scopes 422). Chips remaining: All · Daily briefings. Search, pin,
  and pagination compose in the URL.
