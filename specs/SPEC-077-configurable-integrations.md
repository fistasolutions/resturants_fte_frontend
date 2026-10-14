# SPEC-077 — Configurable Integrations (SMTP / Klaviyo / Gorgias)

## Problem

The Integrations page shows Shopify live and everything else as a
static "Coming soon" placeholder. Backend SPEC-070 adds
`GET/PUT /settings/integrations` for SMTP/Klaviyo/Gorgias's non-secret
config (host/port/from-email, winback list ID, subdomain), resolved
from the database with an `.env` fallback. This spec makes those three
real, editable cards on the Integrations page instead of static
roadmap entries.

## Design

- `ConfigurableIntegrationCard` (new, client component) — one
  component drives all 3 providers off a small static field-metadata
  table (name/category/description/field labels), rendered with:
  - Status badge: **Connected** (success token) when the provider's
    real credential is configured server-side, **Needs setup**
    (warning token) otherwise — same visual language as the existing
    `IntegrationCard` roadmap badges.
  - One input per editable field, prefilled from the resolved value.
    A field sourced from `.env` (not yet saved to the database) shows
    a small "Using the server's default value" hint underneath —
    this is the one place in the UI that has to be honest that
    editing here doesn't necessarily mean nothing was configured
    before.
  - A plain sentence about the secret, never an input for it: "API
    key configured on the server" / "API key not configured — add it
    to the server's environment." No credential is ever fetched,
    typed, or displayed here.
  - Save button + loading/saved/error states, same pattern as
    `BriefAutoSendCard`/`ReportScheduleCard` (this session's earlier
    work) — one shared visual language across every Settings/
    Integrations form in the app.
- Placed in a new "Configure" section on `/integrations`, **above**
  the static roadmap grid — real, actionable cards read before
  aspirational "Coming soon" ones.
- `lib/integrations.ts`'s static `INTEGRATIONS` list drops the Klaviyo
  and Gorgias entries (they're no longer placeholders) — everything
  else (Google Ads, Meta, GA4, Triple Whale, Loop Returns, BigQuery,
  Slack) stays as-is.

## Data flow

- `types/integrations.ts` (new) — `IntegrationFieldSource`,
  `IntegrationField`, `ProviderSettings`, `IntegrationSettings`,
  `IntegrationProvider`.
- `services/integration-settings.ts` (new) — `getIntegrationSettings()`
  (server-side, `serverApi`, used by the page) and
  `updateIntegrationSettings(provider, fields)` (client-side, proxy
  fetch, used by the card's Save button), both through one snake_case
  ↔ camelCase adapter.
- `app/(app)/integrations/page.tsx` — fetches `getStoreConnection()`
  and `getIntegrationSettings()` in parallel (`Promise.all`, never a
  waterfall), renders the 3 new cards.

## Acceptance Criteria

- [x] All 3 provider cards render with the correct badge, prefilled
      field(s), and the `.env`-fallback hint when a field's source is
      `"env"`. Live-verified against the real backend:
      `GET /settings/integrations` correctly resolves SMTP
      host/port/from-email and the Klaviyo winback list ID from
      `.env` (`source: "env"`), and reports Gorgias's subdomain as
      `unset`/`secret_configured: false` since it's never been
      configured — exactly the expected day-one state.
- [x] Save calls `PUT /settings/integrations/{provider}` with the
      edited fields and updates the card from the response — loading/
      saved/error states present.
- [x] No component ever renders, fetches, or submits a secret field —
      only the whitelisted non-secret fields the backend also
      whitelists (enforced server-side per SPEC-070's tests).
- [x] Klaviyo and Gorgias no longer appear in the static roadmap grid
      (no duplicate cards for the same provider).
- [x] `npx tsc --noEmit` clean, `npm run lint` clean on every file
      this spec touched (4 pre-existing errors remain elsewhere,
      unrelated), `npm test` 234/234 green, `npm run build` green —
      `/integrations` and every other route compiles. Note: the
      server-side getter (`services/integration-settings.ts`, via
      `serverApi`) and the client-side updater
      (`services/integration-config.ts`, via proxy fetch) were kept
      in separate files on purpose — `lib/api.ts` has `import
      "server-only"`, so combining them would break the client
      bundle; the clean build confirms the split works.
