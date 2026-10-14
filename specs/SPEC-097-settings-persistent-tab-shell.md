# SPEC-097 — Settings persistent tab shell

## Context

Settings (`/settings`) is a tabbed page — General, Daily Report, Automatic Brief Sending,
Manager Notifications — but unlike Inventory (SPEC-085), Orders (SPEC-087), Products (SPEC-090),
and the Gorgias workspace (SPEC-094), it was **never** moved to a persistent shell. Each of the
four tab pages renders its **own** `<main>` + `PageHeader` + `SettingsTabs`, so switching tabs
re-renders the whole chrome and drops to the segment's full-page `loading.tsx` — the header and
tab bar visibly blink/reload on every switch. The owner reported this directly ("as I move from
one tab to another it loads the whole page instead of the component — move the tab bar out to a
fixed component").

## Goal

Identical UX to the other four shells: header + tab bar live in a **persistent `layout.tsx`**
that stays mounted across tab switches, so only the content area swaps, behind a **content-only
skeleton**. No behavioral/data changes — pure structural refactor.

## Design

- **New `app/(app)/settings/layout.tsx`** (server) — fetches `getSettingsOverview()` once and
  renders `<SettingsShell …badges>{children}</SettingsShell>`. A layout is not unmounted on
  navigation between its child routes, so the shell is fetched once and persists; tab switches
  re-fetch only the child page's own data. `router.refresh()` (on a save) still refreshes the
  layout, so the tab badges stay live.
- **New `features/settings/settings-shell.tsx`** (`"use client"`) — renders `<main>` +
  `PageHeader` (title "Settings" + a per-tab description chosen from `usePathname`) +
  `SettingsTabs` (active tab derived from the pathname) + `{children}`. Owns the description map
  that previously lived inline in each page.
- **Four pages slimmed** — General (`/settings`), Daily Report, Automatic Brief Sending, Manager
  Notifications drop their `<main>` + `PageHeader` + `SettingsTabs` and render **only their body
  cards**, still fetching only the data that body needs. Per-page `metadata` (titles) unchanged.
- **`loading.tsx` → content-only** — the header/tabs now live in the persistent shell, so the
  Suspense fallback fills only the body below them (matching the Gorgias/Inventory loading).
- `SettingsTabs` keeps its badge props (auto-send On/Off, manager emails N/M) — now fed from the
  shell's props instead of each page.

## Non-goals

- No new settings, no copy changes, no backend changes. The four tabs show the same cards with
  the same data; only the page composition changes.

## Acceptance criteria

1. Switching between the four Settings tabs never re-renders the header or tab bar (they stay
   painted); only the content area swaps, with a content-only skeleton on the pending tab.
2. Each tab still shows exactly its current cards and data; badges (auto-send, manager N/M) are
   correct and update after a save (`router.refresh()`).
3. Active-tab underline and per-tab description match the current route.
4. `tsc`, `lint`, full Vitest, and `next build` all green; verified light + dark; no entrance
   animation; responsive.

## Manual verification checklist (no jsdom runner yet — root Rule 4)

- [ ] `/settings` → click each tab: header "Settings" + tab bar stay fixed, only body swaps.
- [ ] Descriptions change per tab; active underline follows the route; badges correct.
- [ ] Toggle auto-send / set a manager email → save → badge updates without a full reload.
- [ ] Both themes; keyboard-navigable tabs; mobile/tablet/desktop.

## Patches

- 2026-08-06 — **Shipped.** New `settings/layout.tsx` (server, one
  `getSettingsOverview` fetch) + `features/settings/settings-shell.tsx`
  (`"use client"`, active tab + description from `usePathname`). The four tab
  pages (General / Daily Report / Automatic Brief Sending / Manager
  Notifications) now render body-only (dropped `<main>`/`PageHeader`/
  `SettingsTabs`); `loading.tsx` is content-only. Header + tab bar stay painted
  across switches — only the body swaps. No data/copy/backend change.
  `tsc` + `lint` + 321 tests + `next build` (all 4 settings routes) green.
