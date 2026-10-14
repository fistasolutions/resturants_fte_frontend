# SPEC-091 — Customers is the win-back home: relocate Winback, remove Draft email

## Context / Why
The **Customers** page (Money Finder) is where at-risk revenue is spotted, but two
things make it incoherent:

1. **"Draft email" is a dead-end.** Each segment (Category Lovers, Sale-only
   Shoppers, Due to reorder) has a "Draft email" button that AI-writes email copy
   you cannot send from the app — you'd copy-paste it into Klaviyo, which already
   does email better. It over-promises ("email from here") and distracts from the
   one action that matters: getting the right people into Klaviyo. **We are not
   sending email from the product** — only syncing segments to Klaviyo (SPEC-037
   carve-out). So Draft email is removed.
2. **Winback lives in the wrong section.** The winback *review + sync-to-Klaviyo*
   screen is at `/brief/winback` (under the Morning Brief), but the "Review & sync
   to Klaviyo" entry point is the **Drifting VIPs** card on Customers. The action
   and its home are in different sections — exactly the split SPEC-088 just fixed
   for transfers (moved under Inventory Analyst, Brief redirects in). Do the same:
   **Customers owns winback; the Brief points into it.**

Owner decision (2026-08-03): remove Draft email; relocate winback under Customers
with the Brief redirecting in — mirroring SPEC-088. (Extending Klaviyo sync to the
other three segments is a *separate* greenlight, deliberately NOT in this spec — it
would deepen the Klaviyo carve-out.)

## Scope (frontend only)

### Relocate winback (mirrors SPEC-088)
- Move the route `app/(app)/brief/winback/page.tsx` →
  `app/(app)/customers/winback/page.tsx`. Same page, same components
  (`WinbackReviewTable`, `WinbackSyncButton` stay in `features/brief`, same
  `services/brief` calls — only the **route** moves, per SPEC-088's precedent).
- Breadcrumb changes **Morning Brief → Winback List** to **Customers → Winback List**
  (crumb link `/brief` → `/customers`).
- `next.config.ts`: permanent redirects `/brief/winback` and `/brief/winback/:path*`
  → `/customers/winback`, so existing bookmarks/brief links never 404 (same shape as
  the SPEC-088 transfer redirects already there).
- Repoint every **page-route** link at the new path:
  - Customers "Drifting VIPs" card button → `/customers/winback`.
  - Brief `decision-card.tsx` `dormant_vips` → `/customers/winback` (the Brief now
    *points into* Customers).
  - `lib/winback-filters.ts` `winbackPageHref` → `/customers/winback`.
- **API proxy paths are unchanged** — `/api/proxy/brief/winback` and
  `/api/proxy/brief/winback/send` (and `services/brief.ts`'s `serverApi('/brief/winback')`)
  are backend URLs, not page routes; they stay exactly as-is (SPEC-088 precedent:
  only routes move, backend untouched).

### Remove Draft email
- `app/(app)/customers/page.tsx`: remove the `DraftEmailPanel` import and its three
  usages (Category Lovers, Sale-only Shoppers, Due to reorder). Export CSV stays on
  each as the escape hatch.
- Delete `features/customers/draft-email-panel.tsx`.
- Remove the now-unused `DraftEmailSegment` type and `DraftEmailResult` interface from
  `types/customers.ts`.

### Deliberately NOT in scope (documented, not oversight)
- The **backend** draft endpoint (`POST /customers/money-finder/draft`) and its
  agent/prompt become orphaned (no remaining caller). Left in place to keep this a
  single-repo, bounded change (same call SPEC-088 made for the transfer backend);
  flagged for a follow-up backend cleanup spec.
- Klaviyo sync for Category Lovers / Sale-only / Due-to-reorder is **not** added here —
  separate greenlight (deepens the SPEC-037 Klaviyo carve-out).

## Acceptance Criteria
- [x] `/customers/winback` renders the winback review + "Sync to Klaviyo" UI (same
      page/components, only relocated); breadcrumb reads **Customers → Winback List** —
      route present in `npm run build`.
- [x] Old `/brief/winback` (+ `/brief/winback/:path*`) permanently redirects to
      `/customers/winback` (`next.config.ts`); old page dir deleted (`/brief/winback`
      no longer in the build's route list).
- [x] Drifting VIPs card button (`/customers/page.tsx`) and the Brief's dormant-VIPs
      decision card (`decision-card.tsx`) both link to `/customers/winback`.
- [x] No "Draft email" anywhere on Customers; Export CSV still on all three segments;
      `draft-email-panel.tsx` deleted, `DraftEmail*` types removed (no stragglers found).
- [x] `lib/winback-filters.ts` → `/customers/winback`; `tests/winback-filters.test.ts`
      updated (10 tests pass).
- [x] `npm test` (**279 passed**), `npx tsc --noEmit` (clean), `npm run lint` (changed
      files clean), `npm run build` (✓ Compiled successfully) all green.

## Manual verification (no jsdom runner — root Rule 4)
`npm run dev`, both themes: Customers → Drifting VIPs "Review & sync to Klaviyo" opens
`/customers/winback` (breadcrumb: Customers → Winback List); the Sync-to-Klaviyo button
and review table work; paste `/brief/winback` in the address bar → redirects to
`/customers/winback`; Morning Brief dormant-VIPs decision opens the new page; no Draft
email button on any segment, Export CSV still downloads.

## Files
- `app/(app)/customers/winback/page.tsx` (moved from `app/(app)/brief/winback/page.tsx`)
- `app/(app)/brief/winback/page.tsx` (deleted)
- `next.config.ts` (winback redirects)
- `app/(app)/customers/page.tsx` (VIP link → new path; Draft email removed)
- `features/brief/decision-card.tsx` (`dormant_vips` → new path)
- `lib/winback-filters.ts` (+ `tests/winback-filters.test.ts`)
- `features/customers/draft-email-panel.tsx` (deleted)
- `types/customers.ts` (`DraftEmail*` removed)
