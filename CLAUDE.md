@AGENTS.md

# CLAUDE.md — ecommerce-fte-frontend

Guidance for Claude Code when working in this repo. **Read the monorepo root
`../CLAUDE.md` first** — its thirteen Absolute Rules (correct repo, docs-are-binding,
spec-before-code, mandatory tests, performance, production-ready only, regression
safety, backend-calculates/AI-interprets, design-system + NO Framer Motion, daily
memory log, **in-app docs ship with the feature**, **FOC stays as it is while every other
organization gets the SaaS — Rule 12**, **every action follows the member's role — Rule 13**) apply to every change here. Also read [../docs/prd.md](../docs/prd.md),
[../docs/Design.md](../docs/Design.md), and [../docs/Phases.md](../docs/Phases.md)
before UI work — Design.md is the binding design system.

## What This Repo Is

The UI of **Ecommerce FTE** — an AI Business Intelligence platform (NOT a support
chatbot, NOT a store-mutating agent). It renders the **Dashboard** (KPI cards, revenue
chart, product performance, inventory alerts, refund summary, recent orders, AI insight
card), **AI Chat**, **Executive/Daily Reports**, **Product & Inventory Analyst pages**,
**Integrations**, **Settings**, **Auth** (login only — signup UI removed per SPEC-020),
and a **Coming Soon** page. It is a pure consumer of the FastAPI backend
(`../ecommerce-fte-backend/`) — no business logic, no metric calculations, no secrets.

> **Phases 1 and 8 are ✅ complete (2026-07-15)** (see `../docs/Phases.md`): the
> full responsive UI now runs on the **live FastAPI backend** (SPEC-017). The
> service layer is the only data seam: `lib/api.ts` (serverApi) for RSC,
> `/api/proxy/*` for client code, `/api/session` for httpOnly JWT cookies.
> `lib/mock/` remains only as Vitest fixture data — no component or service
> imports it for rendering.

> **Current state: don't trust a snapshot here — check live sources.** This repo
> commits and adds specs daily, so any spec range, dirty-tree file list, or test
> pass count written into this doc goes stale within hours. Before relying on a
> feature list, a "next spec number," or "tests are green," run: `git log --oneline
> -5`, `git status --short`, `ls specs/ | sort`, and re-run `npm test` / `npx tsc
> --noEmit` / `npm run build` yourself. [../docs/MEMORY.md](../docs/MEMORY.md) is
> the maintained, dated log of what shipped each day (root Rule 10) — read it for
> "what changed recently" instead of reconstructing history from commit messages.
> Durable facts (re-verify if anything looks off): specs collide at `SPEC-015`,
> `SPEC-022`, `SPEC-030`, `SPEC-080`, `SPEC-081`, and `SPEC-141` (each has two distinct
> real files — cite by full filename; `SPEC-081` = store-transfer-opportunities +
> team-performance-page; `SPEC-141` = discount-review-results-tab +
> discount-supervision-outcomes). This list drifts — confirm with
> `ls specs/ | sed -E 's/(SPEC-[0-9]+).*/\1/' | sort | uniq -d`. The app is branded for
> **Ecommerce FTE** (examplestore.com,
> SPEC-007) with `--brand` red `#E42828` identity-only, never status/CTA; auth is
> **login-only** (signup UI removed per SPEC-020); mock data (`lib/mock/`) is Vitest
> fixture data only, not a rendering path. Verify a path exists on disk before
> building on it.

## Stack

- **Next.js 16.2.10** (App Router) — ⚠️ Next 16 has breaking changes vs your training
  data. Per `AGENTS.md`: **read the relevant guide in `node_modules/next/dist/docs/`
  before writing any Next-specific code**, and heed deprecation notices.
- **React 19.2.4**, **TypeScript 5** (strict — no `any`, never enable
  `ignoreBuildErrors`), **Tailwind CSS 4** (config-in-CSS via `app/globals.css`),
  **ESLint 9** (flat config).
- **shadcn/ui + Radix UI + Lucide React** (outline icons only) — initialized; primitives
  live in `components/ui/`, add more via `npx shadcn add <component>`; always
  prefer/extend shadcn components before writing custom ones. Charts: **Recharts**
  through the shadcn `chart.tsx` wrapper.
- **Inter** font. **Light mode is the default theme** (light palette, owner decision
  2026-07-15); dark mode via the next-themes toggle (`components/theme-provider.tsx`,
  `components/layout/theme-toggle.tsx`). Every component must be token-driven and
  verified in both themes.
- **🚫 NOT in the stack: `framer-motion` / `motion`.** Never install it (root Rule 9).
- Dev port: **3000**.

## Target layout (per docs/Architecture.md §9)

```
app/
  (auth)/              # login only (signup UI removed per SPEC-020)
  (app)/               # authenticated: dashboard (landing), chat, reports, analyst pages, integrations, settings, coming-soon
  api/proxy/            # server-side proxy → backend :8000 (the ONLY way to the API)
  api/session/          # httpOnly JWT cookie set/clear route
  globals.css          # ALL design tokens live here (colors, radius, fonts)
components/            # shared UI primitives (ui/ = shadcn) — small, single-responsibility
features/              # feature-scoped composites, one dir per surface: dashboard, chat,
                       #   reports, orders, products, inventory, customers, discounts, returns,
                       #   integrations, settings, team-performance, traffic, warehouse, brief,
                       #   analysis, results, auth — `ls features/` for the current set
hooks/
lib/                   # utils, mock data (lib/mock/), pure logic (unit-testable)
lib/docs/              # the in-app docs (root Rule 11, SPEC-229): content/<slug>.ts per sidebar
                       #   destination, overview.ts, screens.ts (GENERATED by ../tools/build_docs_screens.py),
                       #   index.ts registry — tests/docs.test.ts fails when a nav item has no doc
services/              # the data-access layer components call — mock now, real API in Phase 8
types/                 # shared TypeScript interfaces — mirror the future API contract
utils/                 # pure formatting/validation helpers (unit-tested)
proxy.ts               # Next 16's middleware file (replaces middleware.ts) — session-cookie route gate
specs/                 # SPEC-###-slug.md — source of truth (root Rule 3); ⚠️ collisions: two each of SPEC-015-*, SPEC-022-*, SPEC-030-*, SPEC-080-*, SPEC-081-*, and SPEC-141-* — ALWAYS `ls specs/` immediately before numbering; never trust a "next number" written down anywhere
tests/                 # Vitest, node env, tests/**/*.test.ts
```

## Non-negotiables specific to this repo

### Design system (root Rule 9, docs/Design.md — the ones violated most often)

- **Semantic tokens only.** Never `bg-[#0F172A]`, never `text-blue-500`, never inline
  color styles. Only `bg-background` / `bg-card` / `bg-primary` / `text-foreground` /
  `text-muted-foreground` / `border-border` / `ring-ring` / `destructive` etc., defined
  once in `globals.css` (palette in Design.md §5, incl. the `#8B5CF6` AI accent).
- **8px spacing scale** (4/8/12/16/24/32/40/48/64/80) — no arbitrary spacing. Global
  radius tokens (cards 16px, buttons/inputs 10px, tables 12px). Subtle shadows only —
  cards rely on contrast, not elevation.
- **Component-first:** one component = one responsibility; pages compose
  (`KPIGrid` → `RevenueCard`…) — never a 2000-line page file. Reuse before rebuilding.

### 🚫 NO Framer Motion, NO entrance animations (root Rule 9 — user decision)

- Never install or import `framer-motion`/`motion`.
- **No element may animate into view on page load, route change, or scroll.** No cards
  sliding in from top/bottom/sides, no fade-in-up, no staggered "one by one" reveals, no
  `whileInView`/intersection-observer reveal patterns. **Everything renders instantly in
  its final position.**
- Allowed motion, CSS-only, 150–250ms: hover/focus/active states, shadcn's default
  dialog/dropdown transitions, skeleton pulse, expand/collapse. Charts may keep their
  library's subtle built-in draw animation.
- Review check before "done": load every touched page — nothing moves except in response
  to a user interaction.

### Data & architecture

- **Mock data discipline (Phase 1):** all mock data lives in `lib/mock/`, typed with the
  interfaces in `types/` (the future API contract), consumed only through `services/`.
  Components never know whether data is mock or live — Phase 8 swaps the service
  implementation only.
- **No calculations in the UI.** Metrics arrive computed from the service layer (root
  Rule 8) — the frontend formats and displays, it never derives revenue/AOV/etc.
  (Formatting — currency, percentages, dates — is fine and lives in `utils/`.)
- **All API calls go through the proxy** (Phase 8+). The browser never calls `:8000`
  directly; client code uses `NEXT_PUBLIC_API_URL`, the proxy forwards to `API_URL`.
  Auth = short-lived JWT + httpOnly refresh cookie passed through the proxy.
- **Server Components by default;** `"use client"` only where interactivity requires it.
  Parallel fetches — never waterfall. Stream AI chat responses.
- **Data reads go through the client cache (SPEC-230).** A page's Server Component
  parses the URL, `prefetch()`es `QueryDef`s from `lib/queries/<domain>.ts` *without
  awaiting* (`lib/server-prefetch.ts`) and renders a client view inside
  `HydrationBoundary`; the view reads them with `hooks/use-api-query.ts`. Define each
  read once in its registry (`<domain>Paths` + `<domain>Queries`); `services/<domain>.ts`
  is only the `serverApi` face of that registry. Never `await` a service read in a page,
  never add a `useEffect`+`fetch` path, and never export a non-component value from a
  `"use client"` file for a server file to import (it becomes a client reference —
  see `lib/page-sizes.ts`). `tests/query-registries.test.ts` pins every registry.
- **Every view ships loading / empty / error states** — skeletons, purposeful empty
  states, recoverable errors. Tables get search, sorting, pagination, loading + empty
  states (Design.md §14). Forms get label/validation/error/disabled/loading/success
  states (§12). Keyboard-navigable, semantic HTML, accessible contrast.
- **Responsive: desktop-first**, but every page must work on desktop, laptop, tablet,
  and mobile.
- **No secrets here.** Only `API_URL` / `NEXT_PUBLIC_API_URL` in `.env.local`
  (gitignored); Shopify and LLM keys exist solely in the backend.

## Commands

```bash
npm install
npm run dev          # dev server on :3000
npm run build        # production build — must pass before any task is done (root Rule 7)
npm run lint         # ESLint 9
npm test             # Vitest, all tests — must be green before "done" (root Rules 4 & 7)
npm run test:watch   # Vitest watch mode
npx vitest run tests/format.test.ts   # a single test file
npx tsc --noEmit     # type-check — run it; a green build alone does not prove type-safety
```

> Vitest runs in **node env** on `tests/**/*.test.ts` — every `lib/`/`utils/`/`services/`
> module gets unit tests there. There is no component/jsdom runner yet, so UI changes
> ship with a manual verification checklist in their spec.

## Definition of done (root rules, applied here)

Spec saved (conforming to `docs/`) → implemented with zero placeholders (mock data only
in `lib/mock/`) → design tokens only, zero hardcoded colors → zero entrance animations →
**the feature's doc under `lib/docs/content/` updated (new tab ⇒ new `sections` entry,
new destination ⇒ new doc, `updated` bumped — root Rule 11)** →
`npm run lint`, `npx tsc --noEmit`, `npm test` and `npm run build` all green →
loading/empty/error states + responsive breakpoints verified → summary includes
command output.
