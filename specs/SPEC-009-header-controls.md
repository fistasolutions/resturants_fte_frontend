# SPEC-009 — Functional Header Controls (Store · Date · Comparison)

**Status:** Implemented
**Phase:** 1 — Frontend Foundation
**Supersedes:** SPEC-008's *placement* of the store switcher (sidebar → header;
owner request 2026-07-15). The switcher's menu behavior is unchanged.

## Goal

The dashboard header's right side becomes three working controls, in mockup style:
**[Store switcher] [📅 Date picker] [Compared-to selector]** — and the Connected
Store block is REMOVED from the sidebar.

## Behavior

1. **Store switcher (moved from sidebar)** — same dropdown as SPEC-008 (current store
   ✓, "Add another store" disabled + Coming soon), restyled as a header chip
   (icon + domain + status dot + chevron). Component:
   `components/layout/store-switcher.tsx`.
2. **Date picker** — the calendar chip opens a shadcn Popover + Calendar. Picking a
   day updates the dashboard's period.
3. **Comparison selector** — a Select with **Previous day / Previous week /
   Previous month**; trigger shows "Compared to <date>".
4. **State lives in the URL** (`/?date=YYYY-MM-DD&compare=<mode>`, `router.replace`,
   no scroll): back/forward work, links shareable, and the server page re-renders —
   `services/dashboard.getDashboardData(query)` recomputes `periodLabel`,
   `comparisonLabel` (real date math), and the KPI delta suffix
   ("vs yesterday/last week/last month").
5. **Honest Phase 1 limit (documented):** metric *values* remain the single mock
   snapshot regardless of selection — labels and plumbing are fully real, numbers go
   live in Phase 8 when the analytics API accepts the same query.

## Scope

- `utils/date.ts` (+ full tests): `ComparisonMode`, `COMPARISON_OPTIONS`
  (label + short label), `isValidISODate`, `comparisonDate` (UTC-safe; month-end
  clamped, e.g. May 31 → Apr 30), `dateToISO` (local-safe Date→YYYY-MM-DD).
- `types/dashboard.ts`: add `periodDate` (ISO) so the calendar knows the selection.
- `services/dashboard.ts`: accepts `{ date?, compare? }`, validates, computes labels.
- `app/(app)/page.tsx`: reads `searchParams` (Promise, Next 16), validates, passes to
  the service; fetches store connection in the same `Promise.all`.
- `features/dashboard/dashboard-header.tsx` → client component with the three chips.
- `components/layout/app-sidebar.tsx`: Connected Store group deleted.
- shadcn additions: `popover`, `calendar` (react-day-picker).

## Acceptance Criteria

1. Sidebar no longer shows Connected Store; header shows store/date/compare chips.
2. Picking a date or comparison updates the URL, the header labels, and every KPI
   card's delta suffix — server-rendered, no full reload.
3. Invalid/missing query params fall back to the snapshot defaults.
4. Date utils fully unit-tested (incl. month-end clamping); all suites green.
5. `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` green.

## Manual verification checklist

- [ ] Calendar opens on click/Enter, arrow-key navigable, Escape closes.
- [ ] Pick May 8 → chip shows "May 8, 2026", compare label shifts, URL updates.
- [ ] Switch to "Previous week" → KPI suffix reads "vs last week".
- [ ] Store menu identical to before, now in the header.

## Patches

- **2026-07-15 — future dates disabled (owner request).** The period calendar
  now sets `disabled={{ after: new Date() }}` — days after today render
  disabled and unselectable (there is no store data in the future to show).

## Patches

- **2026-07-15 (quick fix).** "Add another store" wrapped onto two lines in the
  store-switcher dropdown (the Coming-soon badge compressed it). Two-part fix:
  the label span is `whitespace-nowrap` (dropping `min-w-0`), and the menu gets
  `w-auto` — the shadcn `DropdownMenuContent` base pins width to the trigger
  (`w-(--radix-dropdown-menu-trigger-width)` + `overflow-x-hidden`), which
  otherwise clips the badge instead of letting the menu grow to fit the row.
