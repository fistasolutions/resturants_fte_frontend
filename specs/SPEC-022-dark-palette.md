# SPEC-022 — the store Editorial Dark Palette

**Status:** Implemented
**Governing docs:** ../docs/Design.md §5.1 (Dark theme row, updated 2026-07-16
with the owner's agreement) — supersedes the original §5 BI palette for dark
mode. Root CLAUDE.md Rule 9 (tokens only, brand red identity-only).

## Problem

Light mode carries the full Ecommerce FTE editorial identity (SPEC-015
light-theme-default-toggle: warm neutrals, ink `#1A1B18` black buttons); dark
mode still used the pre-branding blue-slate BI palette (`#020617` navy,
`#3B82F6` blue primary). Toggling themes changed the product's personality.
Owner decision 2026-07-16: dark mode becomes the same brand, inverted.

## Design — token values (`app/globals.css` `.dark` block only)

Same identity as light, mirrored. All hues derive from the brand ink family
(warm, faintly green-shifted neutrals — NOT blue slate):

| Token | Value | Rationale |
| ----- | ----- | --------- |
| background | `#121310` | warm near-black below ink |
| card / muted-bg pair | card `#1B1C19`, popover `#222320`, secondary/muted `#242521`, accent `#2B2C27` | one warm ramp, cards lift off bg like white-on-gray in light |
| foreground(s) | `#F5F5F2`; muted-foreground `#A3A49E` | warm off-white / warm gray (≈17:1 and ≈7:1 on card) |
| primary | `#F5F5F2` on ink `#1A1B18` text | the white-button mirror of light's black button |
| border / input | `#33342E` | warm border, one step above accent |
| ring | `#F5F5F2` | mirrors light (ring = primary ink there) |
| destructive | `#EF4444` / white | unchanged — must stay distinct from `--brand` |
| success | `#00A87A` / `#052E21` | the store `#008060` brightened for dark (>5:1 as text) |
| warning | `#E88B2D` / `#3A2102` | the store `#C86800` brightened for dark (>6:1 as text) |
| info | `#06B6D4` / `#083344` | unchanged |
| ai | `#8B5CF6` / white | unchanged (Design.md AI accent) |
| brand | `#E42828` / white | identity-only, theme-invariant |
| scrim | `#000000` | theme-invariant |
| chart-1…5 | unchanged | same hue family both themes; out of scope |
| sidebar group | sidebar `#191A17`, fg `#C9CAC4`, primary `#F5F5F2` on ink, accent `#262722`, border `#262722`, ring `#F5F5F2` | mirrors light's lifted-sidebar hierarchy |

No component changes — Rule 9's token discipline makes this a one-block edit.

## Files

`app/globals.css` (`.dark` block), `../docs/Design.md` §5.1 (dark-theme row).

## Acceptance Criteria

1. `.dark` block contains no blue-slate values (`#020617`, `#1E293B`,
   `#334155`, `#3B82F6` gone); all neutrals from the warm ink ramp.
2. `--brand` unused for status/CTA in both themes (unchanged behavior).
3. `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` green.
4. Manual checklist (no jsdom runner): toggle dark on dashboard, chat,
   settings, a list page, and login — cards separate from background, primary
   buttons are white with ink text, status badges legible, logo swaps to the
   white wordmark, focus rings visible.
