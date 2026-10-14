# SPEC-030 — Integrations: live stores only, uniform Coming soon

**Status:** Implemented
**Governing docs:** root CLAUDE.md Rule 2 (V1 = one store; multi-store must
not be implied as existing) and Rule 9. Supersedes the placeholder-store rows
and the two-tier Coming soon/Planned badges of SPEC-027.

## Owner decision (2026-07-17)

1. Connected stores shows ONLY the real connected store — the hardcoded
   "the store Outlet"/"Adee" placeholder cards go away. The remaining card is
   fully dynamic (name, domain, status from `/settings/status`; the backend
   already serves `store.name` — the service just never mapped it).
2. In their place: an "Add store" button-card with a Plus icon and a
   **Coming soon** badge — non-interactive (`aria-disabled`), an honest
   affordance for the multi-store roadmap, not a dead flow.
3. The integrations grid keeps one live card (Shopify Admin API, dynamic
   sync detail) and every other entry is **Coming soon** — the "Planned"
   badge tier is removed entirely (type-level: `IntegrationStatus` loses
   `"planned"`).

## Files

- `types/store.ts` + `services/store.ts` — additive `name` on
  `StoreConnection`, mapped from the API.
- `lib/integrations.ts` — delete `PLACEHOLDER_STORES`/`PlaceholderStore`;
  `IntegrationStatus = "connected" | "coming_soon"`; all former "planned"
  entries become `coming_soon`.
- `features/integrations/store-card.tsx` — drop the now-unused "soon" badge.
- `features/integrations/integration-card.tsx` — drop the "planned" badge.
- `features/integrations/add-store-card.tsx` — NEW (+ icon, Coming soon).
- `app/(app)/integrations/page.tsx` — dynamic name, placeholders removed,
  AddStoreCard appended.
- `tests/integrations.test.ts` — NEW invariants: exactly one `connected`
  entry (Shopify Admin API); every other entry `coming_soon`.

## Acceptance Criteria

1. No hardcoded store names on the page; one real store card + Add store.
2. Zero "Planned"/"Soon" badges anywhere on the page; badges are only
   Active/Disconnected (store), Connected/Coming soon (integrations).
3. `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` green.
4. Manual: page renders in both themes; the Add store card is visibly
   non-interactive (no hover-pointer, aria-disabled).

## Patches

- 2026-07-17 (quick fix, owner request) — the "Built to extend" architecture
  paragraph was capped at `max-w-3xl`; cap removed so it spans the card's
  full width.
