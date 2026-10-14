# SPEC-018 — Navigation Simplification (owner decision, 2026-07-15)

**Status:** Implemented
**Governing docs:** ../docs/prd.md → "Scope Revision — 2026-07-15" (updated first,
deliberately, per root Rule 2).

## Goal

The UI keeps only what Shopify admin cannot do. Nav shrinks to **Dashboard,
Chat with AI, Settings**; every other page is removed.

## Scope

1. `lib/navigation.ts` — nav reduced to the three kept items.
2. Routes deleted: `app/(app)/{reports,orders,products,customers,inventory,discounts,returns,analytics,coming-soon}/`.
3. Feature dirs deleted: `features/{reports,orders,products,customers,inventory,discounts,returns,coming-soon}/`.
4. Dead code removed with them (root Rule 6): services
   (`reports,orders,products,customers,inventory,discounts,returns`), types,
   `lib/roadmap.ts`, `lib/table.ts` if unreferenced, unused adapters + shared
   table components (`data-table`, `status-badge`, `view-link`, `coming-soon-button`)
   where no surviving page uses them, and their tests.
5. Dashboard cards lose their cross-links into deleted routes ("View all",
   alert "View details") — cards stay, links go.
6. Backend untouched — sync/analytics/AI/report APIs remain for the AI and for
   future reinstatement.

## Manual verification checklist

Sidebar shows exactly Dashboard / Chat with AI / Settings; deleted URLs 404;
dashboard renders with no dead links; chat + settings work; logout works.

## Acceptance Criteria

1. Nav = 3 items; deleted routes gone from the build output.
2. No orphaned imports/exports of removed modules (`tsc`, lint prove it).
3. `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` all green.

## Patches

- **2026-07-15 — dashboard AI side panel removed (owner request).** The embedded
  AI Business Analyst panel on the dashboard duplicated the dedicated Chat with
  AI page; `features/dashboard/ai-panel.tsx` deleted, dashboard reclaims the
  full width. The chat page is the single AI surface.

## Patches

- **2026-09-24 — one NEW badge, not twelve.** Every feature shipped this quarter kept its
  `badge: "NEW"`, so eleven of the sidebar's rows wore one and the word stopped meaning
  anything — the owner's screenshot was a column of grey pills. The badge now marks
  **Digital Employees** alone (the one destination that changed where things live); the
  other eleven lost it in `lib/navigation.ts`. A new item may take the badge, but it takes
  it *from* whoever holds it — the sidebar carries one at a time.
