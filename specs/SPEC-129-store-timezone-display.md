# SPEC-129 — Timestamps display in store (New York) time

Status: implemented
Depends on: SPEC-031 (formatNextRun store-zone pattern), SPEC-101 (backend already
uses America/New_York for Store Traffic)

## Problem (client-reported)

> "This seems to be your time, can you change to NY time."

On the Discounts → discounted-transactions list (and elsewhere) timestamps render in the
**viewer's local timezone**, because the shared `formatTime` had no `timeZone` and many
call sites used bare `new Date(iso).toLocaleString()` / `.toLocaleTimeString()`. The
store operates in **America/New_York**; a transaction at 10:17 PM NY showed as whatever
the viewer's machine clock says. Timestamps are stored correctly (UTC) — this is purely
a **display** bug, and it must be fixed everywhere, not just one page.

## Design

Backend calculates/stores UTC and sends ISO instants unchanged. The frontend pins all
**instant** timestamps to the store timezone.

**`utils/format.ts`** — one canonical timezone + timezone-aware formatters:
- `export const STORE_TZ = "America/New_York"` (single source of truth; matches the
  backend's Store-Traffic zone).
- `formatTime(iso)` → renders in `STORE_TZ` (was viewer-local — the core bug).
- `formatDate(iso)` → **timezone-smart**: a full datetime instant renders its NY calendar
  date (so a late-night NY order near UTC-midnight shows the correct NY day); a
  **date-only** string (`YYYY-MM-DD`, e.g. a report/snapshot date) is rendered as its
  literal calendar date (parsed at local midnight, no zone shift — never off-by-one).
- `formatDateTime(iso)` (new) → "Aug 12, 2026, 10:17 PM" in `STORE_TZ`, for the
  combined date+time rows (transactions, alerts, activity, sync status).
- `formatNextRun` unchanged (already takes an explicit store zone).

**Call-site sweep** — every bare `toLocaleString`/`toLocaleTimeString` on an *instant*
routes through these helpers (DRY + one place owns the zone):
- Discounts: `transactions-table.tsx`, `alerts-list.tsx` → `formatDateTime`.
- Store Traffic: `store-traffic-view.tsx` "V-Count synced …" → `formatDateTime`.
- Inventory: `dead-inventory-detail.tsx`, `dead-inventory-review.tsx` → shared helpers.
- Morning Brief: `winback-sync-button`, `overdue-review`, `traffic-review`,
  `decision-card`, `transfer-review`, `app/brief/page.tsx`, `app/brief/history/page.tsx`
  → `formatTime`.
- Shared compose: `compose-panel.tsx`, `compose-history-sidebar.tsx` → `formatDateTime`.

**Left intentionally untouched:** date-only *calendar labels* that append `T00:00:00`
(chart axes, brief-header/date-picker day headings) — they represent a calendar day, not
a moment, and must not be zone-shifted; and non-timestamp `toLocaleString()` on numbers
(counts, chart values).

## Manual verification checklist (no jsdom runner)

- Discounts → a staff member's transactions: times now read in NY (e.g. a 10:17 PM NY
  order shows 10:17 PM regardless of the viewer's machine timezone).
- Chat message times, report "generated" times, order/refund times, sync status, brief
  activity times all read in NY.
- Report dates / snapshot dates / chart day axes are unchanged (no off-by-one).

## Acceptance Criteria

- [x] `STORE_TZ` single source of truth; `formatTime` + `formatDateTime` render in NY.
- [x] `formatDate` is timezone-smart (NY for instants, literal for date-only).
- [x] All instant call sites route through the shared helpers; date-only labels untouched.
- [x] Unit tests pin the NY behavior deterministically; `lint`/`tsc`/`test`/`build` green.
