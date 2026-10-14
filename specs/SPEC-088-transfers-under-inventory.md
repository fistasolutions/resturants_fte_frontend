# SPEC-088 — Consolidate transfer actions under Inventory Analyst

## Context / Why

Transfer *actions* live in two different sections today, which is incoherent:

- **Store → Store** review → `/inventory/store-transfers/{locationId}` (under Inventory ✅)
- **Warehouse → Store** review + send → `/brief/transfers` (+ `/send-all`,
  `/send/{locationId}`) — under the **Morning Brief**, a different section ❌

Two screens doing the same job ("review a transfer, send it to the location manager")
in two different parts of the app. The new Transfer Plan (SPEC-086) makes it worse:
half its rows jump to the Brief, half stay in Inventory.

Client decision: **all transfer actions belong under Inventory Analyst**, and the
Morning Brief should *point into* Inventory rather than own its own transfer screen.

## Scope

**In scope (frontend only)**

- Relocate the warehouse-transfer review/send route subtree from
  `app/(app)/brief/transfers/**` to `app/(app)/inventory/transfers/review/**`:
  - `/brief/transfers` → `/inventory/transfers/review`
  - `/brief/transfers/send-all` → `/inventory/transfers/review/send-all`
  - `/brief/transfers/send/{locationId}` → `/inventory/transfers/review/send/{locationId}`
- Update every internal link/breadcrumb to the new paths (breadcrumb becomes
  Inventory Analyst → Transfers → Review).
- Add permanent redirects in `next.config.ts` for `/brief/transfers` and
  `/brief/transfers/:path*` → the new location, so existing bookmarks/links never 404.
- Repoint the Brief's transfer decision card (`decision-card.tsx`) and the Transfer
  Plan's warehouse-row action (`lib/transfer-plan.ts`) at the new route.

**Deliberately NOT in scope (kept to bound blast radius — documented, not oversight)**

- Backend endpoints stay `/brief/transfers/*` (draft/send/history) — no product-visible
  URL, no email references them (verified), and moving them adds risk with zero user
  benefit. The relocated pages still call `/api/proxy/brief/transfers/*`.
- The shared feature/service modules keep their `features/brief` / `services/brief`
  paths and names. Only the **routes** move.
- The send logic itself (SPEC-037/041 compose + persistence + idempotency) is untouched
  — same components, same proxy, same backend.

## Behavior

- Navigating to any old `/brief/transfers*` URL 301-redirects to the matching
  `/inventory/transfers/review*` URL.
- The relocated pages render under the Inventory layout; because `activeInventoryTab`
  is exact-match, a nested `/inventory/transfers/review*` route renders bare (its own
  breadcrumb + header), exactly like the existing `/inventory/store-transfers/*` detail
  pages — no double header.
- The Morning Brief's transfer decision now links into Inventory; the Brief no longer
  hosts a transfer screen of its own.

## Acceptance Criteria

1. `/inventory/transfers/review`, `/inventory/transfers/review/send-all`, and
   `/inventory/transfers/review/send/{locationId}` render the warehouse-transfer
   review + compose/send UI (same behavior as the old brief routes).
2. Breadcrumbs read Inventory Analyst → Transfers → Review (and → {location} / → Send
   All on the send pages); all crumb links resolve.
3. Old `/brief/transfers`, `/brief/transfers/send-all`, `/brief/transfers/send/{id}`
   permanently redirect to the new paths (no 404, no dead page files left behind).
4. The Transfer Plan warehouse row action and the Brief transfer decision card both
   link to `/inventory/transfers/review`.
5. `lib/transfer-plan.ts` unit tests updated to the new href and green.
6. Send/draft/history still work (same proxy → same backend endpoints, unchanged).
7. `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` all green.

## Manual verification checklist

- [ ] Transfer Plan → a warehouse row's "Review & send" opens
      `/inventory/transfers/review`.
- [ ] Old `/brief/transfers` in the address bar redirects to the new page.
- [ ] Morning Brief transfer decision card opens the new inventory review page.
- [ ] From the review page, "Send All Remaining" and a per-location "Compose" open the
      relocated send pages; a test draft loads (no real send needed to verify routing).
- [ ] Breadcrumbs navigate back to `/inventory/transfers` and `/inventory`.
