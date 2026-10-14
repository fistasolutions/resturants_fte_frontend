# SPEC-074 — Tabbed Settings Page

## Problem

`/settings` (`app/(app)/settings/page.tsx`) is a single long vertical stack of
7 cards (Profile, Shopify Connection, Daily Report schedule, Automatic Brief
Sending, Manager Notifications, System Status, Logout). As Settings has grown
(SPEC-012 → SPEC-031 → SPEC-065 → SPEC-069's manager-routing UI), it's become
a long scroll with no grouping. User request: split it into tabs, and each tab
must be a real, bookmarkable/shareable URL that survives a page reload (not
client-only tab state that resets).

## Goals

- 4 tabs, each its own route (so the URL is the source of truth and a reload
  keeps you on the same tab — no client-side-only tab index):
  1. **General** (`/settings`) — Profile, Shopify Connection, System Status,
     Logout.
  2. **Daily Report** (`/settings/daily-report`) — the report-schedule card.
  3. **Automatic Brief Sending** (`/settings/automatic-sending`) — the
     auto-send toggle/time card.
  4. **Manager Notifications** (`/settings/manager-notifications`) — the
     per-location manager-email list.
- The sidebar's existing `Settings` link (`lib/navigation.ts`, `href:
  "/settings"`) keeps working unchanged — it lands on the General tab.
- No card's existing behavior, props, or component changes — this is purely a
  layout/routing reorganization.

## Non-goals

- No new backend endpoint. `getSettingsOverview()` (`services/store.ts`)
  remains the single `/settings/status` call backing `connection`/`system`/
  `reportSchedule`/`briefAutoSend`/`locationManagers` — every tab that needs
  any of those fields re-issues that same call on its own page load. This is
  one fetch per page navigation (not a waterfall within one render), matching
  how every other route in this app already re-fetches per navigation — not a
  Rule 5 violation.
- No new shadcn `Tabs` (Radix) primitive. Each tab is a distinct route
  reached via `<Link>`, not client-side panel-switching within one page —
  the existing SPEC-033 precedent ("tabs are links, `aria-current="page"`, no
  client tab state") is followed exactly, just with path segments instead of
  a query string.
- No change to `ConnectionCard`/`StatusCard`/`ProfileForm`/
  `ReportScheduleCard`/`BriefAutoSendCard`/`LocationManagersCard`/
  `LogoutCard` internals — only which page imports/renders which.

## Design

### New shared component: `features/settings/settings-tabs.tsx`

A plain **server component** (no `"use client"`, no `usePathname` — the
active tab is known statically by whichever page renders it, so no client JS
is needed just to highlight a nav item):

```tsx
interface SettingsTabsProps {
  active: "general" | "daily-report" | "automatic-sending" | "manager-notifications";
}
export function SettingsTabs({ active }: SettingsTabsProps) { ... }
```

Renders a `<nav aria-label="Settings sections">` of 4 `<Link>`s
(`/settings`, `/settings/daily-report`, `/settings/automatic-sending`,
`/settings/manager-notifications`), each with `aria-current={tab === active ?
"page" : undefined}` and a bottom-border active-state class (semantic tokens
only — `border-foreground text-foreground` active vs. `border-transparent
text-muted-foreground hover:text-foreground` inactive, per Design.md's
existing nav-indicator convention).

### Routes

- `app/(app)/settings/page.tsx` — trimmed to General: `ProfileForm`,
  `ConnectionCard`, `StatusCard` + `LogoutCard` (same paired `sm:grid-cols-2`
  sub-grid as today). Fetches `getCurrentUser()` + `getSettingsOverview()` in
  parallel, same as today.
- `app/(app)/settings/daily-report/page.tsx` (new) — `ReportScheduleCard`
  only. Fetches `getSettingsOverview()`, uses `.reportSchedule`.
- `app/(app)/settings/automatic-sending/page.tsx` (new) — `BriefAutoSendCard`
  only. Fetches `getSettingsOverview()`, uses `.briefAutoSend`.
- `app/(app)/settings/manager-notifications/page.tsx` (new) —
  `LocationManagersCard` only. Fetches `getSettingsOverview()`, uses
  `.locationManagers`.

Each page renders its own `<PageHeader title="Settings" description="…tab-
specific…" />` + `<SettingsTabs active="…" />` + its card(s) — no shared
`layout.tsx`, so each tab keeps an accurate, tab-specific header description
and its own `metadata.title` (e.g. "Daily Report | Ecommerce FTE") without
fighting Next's metadata-template merging. This mirrors the existing pattern
of several independent, near-identical page wrappers already in this repo
(the 4 compose "send" pages each independently wrap `ComposePanel`).

## Acceptance Criteria

1. Visiting `/settings` shows exactly Profile, Shopify Connection, Status,
   Logout — the other 3 cards are gone from this page.
2. Visiting `/settings/daily-report`, `/settings/automatic-sending`,
   `/settings/manager-notifications` each show only their one card, and each
   is reachable directly by URL (typed/pasted/refreshed) without needing to
   have visited `/settings` first.
3. Reloading any of the 4 URLs keeps you on that same tab.
4. All 4 pages show the same 4-tab nav with the correct one marked
   `aria-current="page"` and visually distinct (active vs. inactive style).
5. The sidebar's "Settings" nav item still works, landing on `/settings`
   (General).
6. No card component's props or internal behavior changed — verified by the
   existing card behavior (save states, validation, etc.) still working
   identically on its new page.
7. `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` all green.

## Testing Plan

No new `lib/`/`utils/`/`services/` pure logic (this is routing/composition),
so no new Vitest file — verified via the manual checklist above (visit each
URL directly, reload each, confirm active tab + correct card set) run through
in the browser before calling this done.

## Patches

- **2026-08-01 — status badges on tabs (user-requested "value add").**
  `SettingsTabs` gained `autoSendEnabled`, `managerEmailsConfigured`, and
  `managerEmailsTotal` props: "Automatic Brief Sending" now shows an
  On/Off badge (green-tinted when on), and "Manager Notifications" shows an
  "N/M" badge (warning-tinted when some locations are missing a manager
  email, omitted entirely when there are zero locations to configure) —
  surfaces state at a glance without opening each tab. All 4 pages already
  fetch the full `getSettingsOverview()` payload, so this is zero additional
  round trips — just two more fields destructured from the same response.
  No new Badge variant added; used the existing `outline` variant with
  semantic `success`/`warning` token overrides (matching the pattern already
  used elsewhere, e.g. `overdue-review.tsx`'s sent-status badges).
