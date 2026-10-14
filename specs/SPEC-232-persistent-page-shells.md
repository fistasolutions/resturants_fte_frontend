# SPEC-232 — Every page gets a persistent shell

Status: implemented
Depends on: SPEC-085/087/090/097 (the persistent tab shells this generalises), SPEC-119
(instant headers), SPEC-230 (the client data cache — the view pattern this corrects)

## Problem

Three different page architectures were living side by side, and the owner could feel
the seams: "the Tax Report header loads every time instead of coming instantly."

An audit of all 23 routes on 2026-09-12 found:

- **14 pages done right** — header and tab bar in a `*-shell` rendered by `layout.tsx`.
  Next never unmounts a layout when its child routes change, so the header is painted
  once and only the content below swaps. *(The audit's first pass mis-counted three of
  these — orders, settings, ads — because their chain runs `layout → section → shell`,
  two levels deep. They were already correct.)*
- **5 pages with the header inside the data view** — customers, integrations, reports,
  results, warehouse. The view is a `"use client"` component that early-returns a
  skeleton while its query is pending, so the real header paints only after the data
  arrives. Each has a `loading.tsx` that paints a header instantly… which the view then
  **replaces** — the same header rendered twice, with a flicker between.
- **3 pages worse than that** — tax-reports (no `loading.tsx` at all, a raw `<h1>`
  behind five data hooks: blank until the report list lands), dashboard and brief
  (header inside a view that early-returns a skeleton carrying its own copy of the
  title).
- **1 deliberate exception — chat.** Its top bar is not a page header: it is the chat
  frame (avatar, live status, and the mobile history-sheet trigger bound to the
  conversation state inside the component). It has no data gating, so it already paints
  instantly, and its `loading.tsx` draws the identical bar. Moving it into a layout
  would mean restructuring the chat surface for no visible change — a redesign, which
  is a non-goal here. Left as is, on purpose.

## The one pattern

Every route follows what the 14 good ones already do:

```
app/(app)/<route>/layout.tsx   → <XShell>{children}</XShell>      (server, trivial)
features/<x>/<x>-shell.tsx     → <main> + PageHeader + tabs + {children}   ("use client")
app/(app)/<route>/page.tsx     → content only — no <main>, no header
app/(app)/<route>/loading.tsx  → content-only skeleton — never a second header
```

The shell checks `usePathname()` and passes sub-routes that own their own header
(a detail page, a review flow) through bare — the Returns shell established this.

Where a header needs something dynamic, it is computed in the **layout** (a Server
Component) and passed as a prop, never fetched: the dashboard and brief greetings are
time-of-day, and the brief's date is yesterday — none of that needs a query.

## Non-goals

- Tab bars whose labels carry **data-derived counts** (Results) stay in the view: a count
  that must wait for data cannot be painted before it. The header still moves.
- Detail and review sub-routes keep their own headers, as they do today.
- No visual redesign. Each page looks the same; it stops re-painting its own top.

## Acceptance criteria

1. Each of the 8 converted routes (tax-reports, customers, integrations, reports,
   results, warehouse, dashboard, brief) has a `layout.tsx` rendering a shell that
   paints the header without waiting on data.
2. No `page.tsx` or data view among them renders a `PageHeader` or top-level `<h1>`.
3. Every `loading.tsx` among them renders a content-only skeleton; none paints a header.
4. `tax-reports` gains a `loading.tsx`.
5. Sub-routes that own their own header are passed through bare by their shell.
6. `npm test`, `tsc --noEmit` and `npm run build` pass.

## Manual verification (no jsdom runner — root Rule 4)

- [ ] Each of the 8 pages: header paints instantly, before any data; no flicker or
      double header when the data arrives.
- [ ] Switching tabs on customers / warehouse / results leaves the header untouched.
- [ ] tax-reports no longer shows a blank page before the list loads.
- [ ] Detail routes (order, draft, packer, tax report) still show their own header.
- [ ] Light and dark themes.
