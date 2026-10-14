# SPEC-027 — Integrations Page

- **Status:** Implemented
- **Date:** 2026-07-16
- **Owner reference design:** connected stores row → integrations grid →
  "built to extend" architecture note.
- **Scope guard (root Rule 2):** V1 displays the roadmap; nothing beyond
  Shopify is built. Only the Shopify card and the Ecommerce FTE store card
  are live — everything else is clearly labeled Coming soon / Planned.

## Changes

1. Nav: "Integrations" item (`/integrations`, Plug icon), after Inventory
   Analyst.
2. `lib/integrations.ts` — the typed roadmap (single source of truth):
   placeholder stores (the store Outlet, Adee — "Soon") and the integration
   entries (Klaviyo, Google Ads, Meta Ads → Coming soon; GA4, Triple Whale,
   Gorgias, Loop Returns, BigQuery, Slack → Planned) with category +
   description. Shipping a connector later = editing one entry.
3. `features/integrations/store-card.tsx` and `integration-card.tsx` —
   status badge tones: Connected/Active (success), Soon/Coming soon
   (warning), Planned (muted).
4. `app/(app)/integrations/page.tsx` (RSC): the Ecommerce FTE store card
   and the Shopify Admin API card are hydrated from `/settings/status`
   (live connection state + last sync — the badge is truth, not paint);
   grid + architecture note follow the reference copy.

## Acceptance criteria

- [ ] Shopify card shows live connected state + last sync; store card live.
- [ ] Roadmap entries all labeled Coming soon/Planned; nothing implies a
      connection that doesn't exist.
- [ ] All four frontend gates green.
