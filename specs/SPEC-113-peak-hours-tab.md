# SPEC-113 — Store Traffic "Peak Hours" tab (heatmap + lost hours)

## Context / Why

Backend SPEC-113 adds `GET /traffic/peak-hours` (weekday×hour footfall + peak/quiet +
"lost hours") on now-timezone-correct data. This adds the 4th `/traffic` tab — the
staffing view: *when* each store is busy, and which busy hours leak sales.

## Scope

- New tab **Peak Hours** (`/traffic/hours`) in the tab shell (SPEC-112 pattern).
- `PeakHoursView`:
  - **Insight tiles** — Busiest hour, Busiest day, Quietest hour, "$ lost in busy hours."
  - **Footfall heatmap** — weekday × hour grid, cells shaded by footfall intensity
    (fixed Tailwind opacity buckets on `bg-primary`, token-only — no hardcoded colors),
    conversion in the hover tooltip. The "when are we busy" picture.
  - **Lost hours** — busy hours (≥ median footfall) converting below the store average,
    with an estimated $ per hour — the understaffed-floor signal.
- Pure reshape in `lib/traffic-heatmap.ts` (`buildHeatmap` + `intensityClass`),
  unit-tested; service `getTrafficPeakHours`; types `TrafficPeakHours` etc.
- Connected-aware `TrafficEmpty` (shared) for no-data / not-connected.

## Design / perf (Rules 5/9)

Per-tab fetch (own endpoint) + content-only skeleton mirroring the layout; semantic
tokens only; no Framer Motion (skeleton pulse + CSS hover only); responsive
(heatmap scrolls on mobile); both themes.

## Tests

`tests/traffic-heatmap.test.ts` — grid reshape (aligned rows, nulls) + intensity
buckets. The view ships with the manual checklist below.

## Manual verification checklist

- [ ] `/traffic/hours`: tiles show peak/quiet/busiest-day/lost-$; heatmap shades by
      footfall; hover shows conversion; lost-hours list with $ per hour.
- [ ] Peak reads as a real hour (e.g. Sun 3 PM), not 6 AM (tz fix).
- [ ] No data → connected-aware empty; fetch failure → error card.
- [ ] Light + dark; mobile heatmap scrolls; range carried across tabs.

## Acceptance Criteria

- [ ] Peak Hours tab renders heatmap + peak/quiet + lost-hours from the backend.
- [ ] `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` green.

## Patches

- **2026-08-12 — heatmap info modal.** Added a top-right ⓘ button (`HeatmapInfo`,
  shadcn Dialog) on the Footfall heatmap card explaining the hour notation
  (10a/12p/3p), rows=days, shade=footfall, hover=conversion, and the store-local
  timezone + ~1-day lag. Also made the heatmap grid **full-width** (cells stretch,
  `min-w` for mobile scroll). tsc/lint clean.
