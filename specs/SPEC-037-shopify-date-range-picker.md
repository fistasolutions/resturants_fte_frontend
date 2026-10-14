# SPEC-037 — Shopify-Style Date Range Picker + Real Comparisons

- **Status:** Implemented
- **Date:** 2026-07-21
- **Backend:** SPEC-031-dashboard-range-compare.md (`GET /dashboard` gains
  `start`/`end`/`compare`; customer deltas + `net_revenue` change served).
- **Client request (2026-07-21, Sir Usman voice note 5 + texts + Shopify
  Analytics screenshot):** replace the single-date calendar with a
  Shopify-style range picker — presets, custom `from → to`, and a
  comparison selector — and show an honest "vs previous" delta on every
  number.

## Design

### New pure module `lib/date-range.ts` (fully unit-tested)

- `RANGE_PRESETS` — `today`, `yesterday`, `7d`, `30d`, `90d`, `mtd`, `qtd`,
  `ytd`, `bfcm` (each: label + `resolve(todayISO) → {from, to}`; all UTC).
  `bfcm` = the most recent Black Friday→Cyber Monday window (Black Friday =
  day after the 4th Thursday of November; falls back to last year's until
  this year's has started).
- `resolveDateRange({range?, from?, to?, date?}, todayISO)` → `{from, to,
  preset?, label}`. Precedence: valid `from`+`to` pair → custom range
  (clamped to today, swapped if inverted); else valid `range` preset; else
  legacy `date` (SPEC-028 URLs → single-day range); else default `7d`.
- `COMPARE_MODES` — `previous_period` / `previous_year` / `none` with UI
  labels ("Previous period", "Previous year", "No comparison") and KPI
  short labels ("vs previous period", "vs last year").
- `compareRangeFor(from, to, mode)` — the comparison window (same math as
  the backend: trailing same-length window / same dates a year earlier /
  null) used only for display labels; the backend computes the real one.
- `formatRangeLabel(from, to)` — "Jun 1 – Jul 1, 2026" (single day →
  "Jul 1, 2026"; cross-year → both years).

### URL contract (dashboard `/`)

`?range=<preset>&compare=<mode>` or `?from=YYYY-MM-DD&to=YYYY-MM-DD&compare=<mode>`.
Legacy URLs keep working: `?date=` → that single day; legacy `compare`
values (`previous_day|previous_week|previous_month`) map to
`today|7d|30d` presets with `compare=previous_period`.

### New component `features/dashboard/date-range-picker.tsx`

Replaces the single-date Popover + period Select in `dashboard-header.tsx`:

1. **Range button** (calendar icon + current label, spinner while pending —
   keeps the SPEC-028 `useTransition` loading pattern and aria-live
   announcement). Popover: preset list column (left) + shadcn `Calendar`
   `mode="range"` `numberOfMonths={2}` (single month < `sm`) + footer with
   Cancel / Apply. Draft state is local; only **Apply** commits to the URL
   (`router.replace`, no scroll). Future days disabled.
2. **Compare select** (shadcn Select): Previous period / Previous year /
   No comparison → `compare` URL param, applied immediately.
3. Tokens only; shadcn primitives; no entrance animation (Rule 9).

### Service + adapters

- `services/dashboard.ts` — `getDashboardData({from, to, compare})` calls
  `/dashboard?start=&end=&compare=`. Comparison KPI label comes from the
  mode (+ resolved compare window dates). `periodLabel` = range label.
- `lib/adapters.ts` — `ApiDashboard` gains `period.compare`,
  `kpis.customers_previous`, nullable `kpis.previous`, and the extended
  `change_pct` (incl. `net_revenue`, `new_customers`,
  `returning_rate_pct`). `adaptDashboardKpis` now serves REAL customer
  deltas (removing the hardcoded 0s — SPEC-017 limitation lifted) and
  passes `null` through when comparison is off.
- `types/analytics.ts` — `Kpi.changePercent: number | null`.
- `kpi-card.tsx` — `changePercent === null` renders a muted "—" (no arrow,
  no fake 0%); the returning-rate delta is percentage-*points* and renders
  via the existing `formatChange`.
- `revenue-chart.tsx` — legend/tooltip labels become props
  (`currentLabel`/`previousLabel`, defaults "This Week"/"Last Week");
  range mode passes "Selected period"/"Previous period"; the previous line
  is omitted when comparison is off. X-axis shows dates (not weekday
  names) for ranges longer than 7 days.

## Out of scope

Analyst pages / reports wiring (backend SPEC-031 out-of-scope note); the
picker component is reusable for that follow-up.

## Tests (Rule 4)

`tests/date-range.test.ts` — every preset resolution (fixed `todayISO`),
BFCM math for multiple years, `resolveDateRange` precedence + legacy
mapping + clamping/swapping, `compareRangeFor` both modes + none,
`formatRangeLabel` single-day/cross-year. `tests/adapters.test.ts` —
extended: real customer deltas, null pass-through, compare-off payload.
All four gates green (`npm test`, `npx tsc --noEmit`, `npm run lint`,
`npm run build`).

## Acceptance criteria

- [x] Preset + custom ranges drive every dashboard number via
      `start`/`end`; compare selector switches all deltas; "No comparison"
      hides them honestly.
- [x] Legacy `?date=`/`?compare=` URLs still resolve (Rule 7).
- [x] New Customers / Returning Rate cards show real deltas.
- [x] Vitest suites green; production build green.

## Manual verification checklist

- [ ] Presets: Today, Yesterday, Last 7/30/90 days, Month/Quarter/Year to
      date, BFCM each change the KPIs, chart, and label.
- [ ] Custom Jun 1 → Jul 1 range renders "Jun 1 – Jul 1, 2026" and the
      chart spans the range.
- [ ] Compare: Previous year vs Previous period changes deltas; No
      comparison shows "—" on every card and a single chart line.
- [ ] Keyboard: trigger → presets → calendar → Apply all reachable; Esc
      closes without applying.
- [ ] Both themes; 375px (single-month calendar, no horizontal scroll).

## Patches

- 2026-08-05 — **Owner feedback:** remove the “Compare to” label and its
  dropdown from the date-picker footer across Dashboard, Daily Brief, and
  Returns. The footer now presents only Cancel and Apply. Existing `compare`
  URL parameters are preserved when a date range is applied, so current
  comparison data and links keep their established behavior; the picker no
  longer exposes a UI for changing that setting.
- 2026-07-21 — **Owner feedback, first live look.** (1) **Default range is
  now Today** (was Last 7 days) — "the user came and see the last 7 days,
  it should be the today"; `resolveDateRange`'s fallback preset changed,
  tests updated. (2) **The standalone compare button is gone** — the
  comparison select ("Compare to: Previous period / Previous year / No
  comparison") moved INSIDE the picker popover footer next to Cancel/Apply,
  committed together with the range on Apply. (3) **Single-day ranges chart
  hourly** (backend SPEC-031 Patches) — `adaptRevenueSeries` detects ISO
  timestamps and labels the x-axis by hour ("2 PM"); Today now draws a real
  intraday curve against yesterday.
- 2026-07-21 — **Dark-theme range overlay invisible (owner bug report).**
  The calendar's range-middle days used `bg-muted` (#242521), which is
  indistinguishable from the dark popover (#222320). Changed to
  `bg-primary/15` in `components/ui/calendar.tsx` — ink-tint in light,
  white-tint in dark; visible in both themes, tokens only.
