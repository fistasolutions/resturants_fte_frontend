# SPEC-101 — Contextual cross-links: Orders ↔ Returns / Discounts

- **Status:** In progress
- **Date:** 2026-08-07
- **Owner request (2026-08-07):** the Orders tabs (Returns, Discounted) list the
  *transactions*, while the analytics for those live on separate pages
  (`/returns`, `/discounts`). Add a top-right button that bridges the related
  views, and mirror it on the Discounts page.
- **Rationale:** the tab is the *list* (which orders); the linked page is the
  *meaning* (margin, sizing, discount policy/abuse). A manager looking at returned
  or discounted orders currently has to hunt for the analytics in the sidebar —
  this closes that gap at the moment of curiosity. Presentation/navigation only;
  no data or backend change (Rule 8 untouched).

## Behaviour

**Orders shell (`features/orders/orders-shell.tsx`)** — the bridge is
**tab-contextual**, placed in the header `actions` row before "Export CSV":
- active tab `returns` → link **"Returns Intelligence"** → `/returns`
- active tab `discounted` → link **"Discount Monitoring"** → `/discounts`
- active tab `all` / `cancelled` → **no bridge** (nothing to bridge to)

**Discounts shell (`features/discounts/discounts-shell.tsx`)** — a single reverse
bridge in the header `actions` (beside the date picker):
- → link **"Discounted Orders"** → `/orders/discounted`

## Visual (Rule 9 — restraint)

A **subtle secondary** control, not a loud CTA: shadcn `Button variant="outline"
size="sm"` with the destination label and a trailing `ArrowUpRight` (Lucide) to
signal "opens another view." Semantic tokens only, no new color, no animation.
Keyboard-focusable (it's a real `<Link>`), works in both themes.

## Tests / verification

Pure mapping is trivial and inline; no new `lib/` logic worth a unit test. UI ships
with the manual checklist below (no jsdom runner).

### Manual checklist
- Orders → Returns tab shows "Returns Intelligence →"; clicking lands on `/returns`.
- Orders → Discounted tab shows "Discount Monitoring →"; lands on `/discounts`.
- Orders → All / Cancelled show **no** bridge button.
- Discounts page shows "Discounted Orders →"; lands on `/orders/discounted`.
- Both themes; focus ring visible; no layout shift on the header row; existing
  "Send to manager" (All tab) and "Export CSV" still present and correct.

## Acceptance Criteria
1. Tab-contextual bridge on Orders (returns/discounted only).
2. Reverse bridge on Discounts → discounted orders.
3. Tokens only, subtle secondary styling, both themes.
4. `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` all green.
