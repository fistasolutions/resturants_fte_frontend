# SPEC-001 — Foundation & Design System

**Status:** Implemented
**Phase:** 1 — Frontend Foundation (docs/Phases.md)
**Governing docs:** ../docs/Design.md (binding), ../docs/Architecture.md §9–10, root CLAUDE.md Rules 2/6/9

## Goal

Establish the project's design system foundation: shadcn/ui, semantic color tokens from
Design.md §5, Inter font, dark mode as default, radius/spacing tokens, and the base
folder structure — so every subsequent component consumes tokens and primitives, never
raw values.

## Scope

- shadcn/ui initialized (Tailwind 4, CSS variables, `components/ui/`).
- `app/globals.css` defines ALL design tokens:
  - **Dark palette (default)** from Design.md §5: background `#020617`, surface
    `#111827`, card `#1E293B`, border `#334155`, primary `#3B82F6`, success `#22C55E`,
    warning `#F59E0B`, error/destructive `#EF4444`, info `#06B6D4`, AI accent `#8B5CF6`.
  - Semantic mappings (shadcn contract): `--background`, `--foreground`, `--card`,
    `--popover`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`,
    `--border`, `--input`, `--ring`, sidebar tokens, chart tokens (`--chart-1…5`).
  - **Extended tokens** (project-specific): `--success`, `--warning`, `--info`, `--ai`
    (+ foregrounds), exposed as Tailwind utilities via `@theme inline`
    (e.g. `text-success`, `bg-ai/10`).
  - **Radius tokens** per Design.md §8: `--radius: 0.625rem` (10px — buttons/inputs),
    `--radius-card: 1rem` (16px — cards/dialogs), `--radius-table: 0.75rem` (12px).
  - A light `:root` palette exists (theme-ready per Design.md §3) but **dark is the
    default**: `.dark` class set on `<html>`.
- **Inter** via `next/font/google` (variable `--font-sans`), replacing Geist. Geist Mono
  stays as `--font-mono` for numeric/code use.
- Root layout: `lang="en"`, `class="dark"`, Inter applied, app metadata
  (title "Ecommerce FTE", template `%s · Ecommerce FTE`, description).
- Base shadcn components installed (button, card, badge, table, input, select,
  separator, tooltip, skeleton, avatar, scroll-area, sheet, sidebar, chart,
  dropdown-menu). Chart component brings **Recharts** (the charts library decision).
- Folder skeleton created only as files land in later specs (no empty dirs).

## Out of scope

Theme toggle UI (light mode ships later; components must simply be token-driven).
Any page/feature UI (SPEC-002+).

## Non-negotiables (from root Rule 9)

- No hardcoded colors anywhere — components use semantic utilities only.
- 🚫 No `framer-motion`. No entrance animations. CSS-only interaction motion 150–250ms.
- 8px spacing scale; no arbitrary spacing values.

## Acceptance Criteria

1. `npx shadcn` init + listed components present under `components/ui/`; Recharts installed.
2. `globals.css` contains the full Design.md §5 palette as CSS vars, dark default,
   extended tokens exposed as utilities, radius tokens per §8.
3. Root layout uses Inter (`next/font`), `class="dark"`, real metadata.
4. `framer-motion` absent from `package.json` (and stays absent).
5. `npm run lint`, `npx tsc --noEmit`, `npm run build` all pass.

## Manual verification checklist (no component test runner yet)

- [ ] Dev server renders with `#020617` page background and Inter font.
- [ ] A shadcn Button/Card renders with token colors, 10px/16px radii.
- [ ] Nothing animates on page load.

## Patches

- 2026-07-15 — **Store heading font adopted (owner decision).** examplestore.com uses Tenor Sans for headings; the app now does too: `Tenor_Sans` via next/font (single 400 weight) on `--font-tenor`, mapped to the `--font-heading`/`font-heading` token. Applied to card titles, page/auth/chat H1s, sidebar captions, and report/chat markdown headings — normal weight with wide tracking (no synthesized bold). Inter remains the body/data font (Design.md §6 updated).
