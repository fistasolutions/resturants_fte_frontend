# SPEC-003 — App Shell (Sidebar + Chrome)

**Status:** Implemented
**Phase:** 1 — Frontend Foundation (docs/Phases.md)
**Governing docs:** ../docs/Design.md §19/§21 (component-first, layout), approved
dashboard mockup, root CLAUDE.md Rule 9

## Goal

The persistent application chrome every authenticated page lives in: brand header,
primary navigation, connected-store status, and the current user — responsive
(desktop rail → mobile sheet), keyboard-navigable, token-styled.

## Scope

- **`lib/navigation.ts`** — single source of truth for nav: title, href, Lucide icon,
  `enabled` flag. Items (mockup order): Dashboard `/`, Chat with AI `/chat`,
  Reports `/reports`, Orders `/orders`, Products `/products`, Customers `/customers`,
  Inventory `/inventory`, Discounts `/discounts`, Returns `/returns`,
  Analytics `/analytics`, Settings `/settings`.
  - **Only routes that exist are enabled** (this spec: Dashboard). Disabled items
    render non-interactive with reduced opacity and a "Coming soon" tooltip — honest
    HCI, no dead links, no 404s. Each later page spec flips its flag.
- **`components/layout/app-sidebar.tsx`** (client — needs `usePathname` for the active
  state) composed from shadcn sidebar primitives:
  - Header: AI brand mark (Bot icon tile in `bg-primary`) + "Ecommerce FTE"
    wordmark.
  - Content: nav menu, active item highlighted via `isActive`.
  - "Connected Store" group: green status dot + store domain + Active badge
    (data via props from the server layout — `services/store.ts`).
  - Footer: user block — initials avatar, name, email.
- **`app/(app)/layout.tsx`** (server) — fetches store + user with `Promise.all`
  (Rule 5: parallel), renders `SidebarProvider` → `AppSidebar` → `SidebarInset`.
  A slim top bar with `SidebarTrigger` appears on mobile only; desktop matches the
  mockup (no global top bar).
- Dashboard route moves to `app/(app)/page.tsx` (still `/`).

## Out of scope

Page content (SPEC-004). The auth route group. Light-theme toggle.

## Accessibility

Sidebar primitives provide keyboard nav + mobile sheet + focus management; nav uses
real `<a>` links (Next `Link`); disabled items are `aria-disabled` and skipped in tab
order; status communicated with text ("Active"), not color alone.

## Acceptance Criteria

1. `/` renders inside the shell: brand, all 11 nav items (mockup order), connected
   store block, user footer.
2. Only existing routes are clickable; disabled items show a tooltip and are
   `aria-disabled`.
3. Active route is visually highlighted.
4. Sidebar collapses to a sheet on mobile via the trigger; desktop shows the fixed rail.
5. All colors/radii via tokens; no entrance animations.
6. `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` pass.

## Manual verification checklist

- [ ] Keyboard: Tab reaches brand link, Dashboard, then skips disabled items to user.
- [ ] Mobile viewport: trigger opens the sheet; Escape closes it.
- [ ] No layout shift or fly-in on load.

## Patches

- 2026-07-15 — Nav items had zero vertical gap (shadcn SidebarMenu default `gap-0`): adjacent active/hover backgrounds touched. Fixed with `gap-1` (4px, on the 8px half-step scale) at the usage site in `components/layout/app-sidebar.tsx`.
- 2026-07-15 — **Desktop collapse (owner request).** Sidebar switched to `collapsible="icon"`: a hamburger (Menu) toggle in the sidebar header collapses it to an icon-only rail (labels hidden, nav tooltips shown, footer stacks avatar/theme/logout vertically); expanded state shows the full the store logo + toggle. `SidebarRail` edge-click and the existing Cmd/Ctrl+B shortcut also toggle. Mobile sheet behavior unchanged.
- 2026-07-15 — **Toggle iconography v2 (owner request).** Expanded: PanelLeftClose icon (hamburger dropped). Collapsed: the the store favicon renders as the rail brand mark on a constant-white tile (`bg-sidebar-primary-foreground`) and doubles as the expand toggle — on hover it swaps to a PanelLeftOpen icon. Sidebar open/collapsed state now persists: the (app) layout reads the sidebar_state cookie into SidebarProvider defaultOpen.
- 2026-07-15 — Collapse toggle vertically centered against the logo block (was pinned to the header top).
- 2026-07-20 — **Collapsed brand tile visible in dark mode (owner request).**
  The collapsed rail's brand tile was `bg-sidebar-primary-foreground`, which
  resolves to brand ink in dark mode — the black favicon disappeared. The tile
  now adds `dark:bg-sidebar-primary` (white in dark mode, light theme
  unchanged) and the hover expand icon adds `dark:text-sidebar-primary-foreground`
  so it stays visible on the white tile.
- 2026-07-20 — **Mobile sidebar closes on navigation (owner report).** On
  mobile the sidebar is an overlay sheet, and tapping a nav item navigated
  behind the still-open sheet. The brand link and every enabled nav link now
  call `setOpenMobile(false)` on click (no-op on desktop; desktop collapse
  state untouched).


## Patches

### 2026-09-08 — `SidebarInset` could not shrink, so wide content scrolled the page

A wide table in an AI chat reply (the Gorgias agent leaderboard is 13 columns)
produced a horizontal scrollbar on the **body**, running the full window width
below the composer, instead of scrolling inside the table.

The table already had `overflow-x-auto`, and so did shadcn's `Table`. Neither
helped, because the cause was three levels up: `SidebarInset` renders
`<main className="relative flex w-full flex-1 flex-col …">` and is a flex item of
the row in `SidebarProvider`. A flex item defaults to `min-width: auto`, which
means it **refuses to shrink below its content's intrinsic width** — so the main
column grew to fit the table and took the page with it. `w-full` cannot override
that; only `min-width` can.

Fixed by adding `min-w-0` to `SidebarInset`. This is a shell fix, not a chat fix:
it applies to every page in the app that can render wide content (reports,
tables, code blocks). The redundant second scroll container in
`features/chat/chat-markdown.tsx` was collapsed into shadcn's own at the same
time.
