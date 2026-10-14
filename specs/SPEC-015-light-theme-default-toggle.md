# SPEC-015 — the store Light Theme (Default) + Theme Toggle

**Status:** Implemented
**Phase:** 1 — Frontend Foundation
**Governing docs:** docs/Design.md §3 (updated in this change — owner decision
2026-07-15: LIGHT is now the primary theme), §5.1 Store Branding

## Goal

A light theme built from the **Ecommerce FTE** palette extracted from
examplestore.com, shipped as the **default**; the existing dark theme stays,
switchable via a toggle. All components are already token-driven — this is a
palette + provider change, zero component redesigns.

## Light palette (the store editorial — source: examplestore.com CSS)

- Background `#F8F9FA` (soft white; cards pure `#FFFFFF` for separation)
- Foreground/ink `#1A1B18` (the store button/ink color) — **also `--primary`**: black
  buttons/active states, exactly like the store's own UI. Focus ring follows.
- Muted text `#6A6A6A`, borders/inputs `#D2D5D9` (their exact values)
- Success `#008060` and warning `#C86800` (both lifted from the site's CSS)
- Destructive `#DC2626`, info `#0891B2`, AI `#7C3AED` (light-contrast tuned)
- `--brand` red `#E42828` unchanged — identity accents only (SPEC-007 rule holds;
  no clash since light primary is ink, not blue)
- Charts: darker light-legible series (`#2563EB`, `#7C3AED`, `#0891B2`,
  `#D97706`, `#16A34A`)
- Sidebar: white, ink text, `#F1F2F4` hover

Dark palette: unchanged (Design.md §5).

## Mechanics

- **next-themes**: `ThemeProvider` (attribute="class", `defaultTheme="light"`,
  system detection off — owner wants light initially, deterministic). Choice
  persists in localStorage. `suppressHydrationWarning` on `<html>`; hardcoded
  `dark` class removed.
- **`components/layout/theme-toggle.tsx`** — Sun/Moon icon button; hydration-safe
  via `useSyncExternalStore` mounted detection (no setState-in-effect); tooltip +
  aria-label. Placed in the sidebar footer (next to logout) and top-right of the
  auth layout.
- **Logo swaps per theme**: `logo-black.png` on light / `-white` on dark via
  `dark:hidden` / `hidden dark:block` pairs (sidebar + auth).

## Doc updates (same change, deliberate)

- Design.md §3: Light = primary, Dark = secondary (toggle); §5.1 logo table.
- Root CLAUDE.md Rule 9 + frontend CLAUDE.md: "dark default" → "light default,
  dark via toggle; every component theme-ready".

## Acceptance Criteria

1. Fresh visit renders LIGHT (white the store look, black logo, ink buttons); toggle
   switches to the existing dark theme and persists across reload.
2. Zero hardcoded colors added; both themes fully token-driven; brand red still
   identity-only.
3. Logo legible in both themes on sidebar and auth pages.
4. `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` green.

## Manual verification checklist

- [ ] First load: light. Toggle → dark → reload → still dark → toggle back.
- [ ] Dashboard, chat, tables, reports readable in both themes (badges, charts).
- [ ] No flash of wrong theme on load; no hydration warnings.

## Patches

- 2026-07-15 — **Light-mode depth fix (owner feedback: page reads as one flat white).** Light background deepened to `#F4F5F7` with `#ECEFF2` secondary surfaces so white cards actually separate; chat surfaces given explicit hierarchy (white header/rail/composer bar over gray conversation area); translucent assistant blocks (`bg-card/60`, invisible on white) became bordered solid cards in both themes; AI-panel intro + compact bubbles gained borders for the same reason.

## Patches

- 2026-07-21 — **next-themes removed (owner bug report: Next 16 console
  error "Encountered a script tag while rendering React component" at
  ThemeProvider).** next-themes injects its theme-bootstrap `<script>`
  through React, which Next 16 flags on client render. Replaced with ~50
  first-party lines: a `beforeInteractive` `next/script` in
  `app/layout.tsx` applies the stored `.dark` class before paint (the
  Next-sanctioned pattern per `node_modules/next/dist/docs`), and
  `useTheme` in `components/theme-provider.tsx` reads the `<html>` class
  via `useSyncExternalStore` (no provider, no context, no effect state).
  Same localStorage key ("theme") — existing users keep their choice.
  `color-scheme: light/dark` moved into `globals.css` (next-themes set it
  inline). `next-themes` uninstalled; `theme-toggle.tsx` imports the new
  hook. Behavior identical in both themes; no console error.
