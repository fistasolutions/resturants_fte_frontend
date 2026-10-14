# SPEC-333 — Performance Ads: connect Meta, read the real account, the Audit tab

**Repo:** frontend · **Status:** implemented · **Date:** 2026-10-01
**Backend:** SPEC-342 · **Builds on:** SPEC-182/183 (Performance Ads), SPEC-179 (Meta sign-in)

## Why

Backend SPEC-342 reads a store's real Meta ad accounts (read-only) and audits them. This is the
page an owner uses instead of asking an agency "how are my ads doing and what is wasting money".

## The Audit tab

**Audit** is the second tab of Performance Ads, after Overview (`/ads?tab=audit`); Overview
stays the landing tab so existing links are unchanged.

1. **Not connected:** what connecting does and does not do ("reads your ads, changes nothing"),
   and **Connect Meta Ads**. Not configured on the server: says so instead of a dead button.
2. **Connected, no account chosen:** the ad accounts the token can see, each with its currency,
   ticked to include; **Save**.
3. **Connected:** a status line (accounts read, last read, **Sync now**, **Disconnect** behind a
   confirmation), then
   - the money strip: Spend · Purchases · Revenue (Meta) · ROAS · CPA · MER (with Shopify) ·
     CTR · CPM · Frequency — every figure from the backend, MER explained when it cannot be shown;
   - **Spend at risk** and the findings, highest money first: rule, severity chip, the campaign /
     ad it is about, the evidence in one line, the money, and the recommended action;
   - **Campaigns** table (status, spend, purchases, ROAS, CPA, CTR, frequency);
   - **Ads** table with the creative's thumbnail and copy, its figures and hook rate.
   A window picker: 7 · 30 · 90 days.

An empty findings list says "No problems found in the last N days" rather than nothing.

## Code

- `types/ad-platforms.ts`, `lib/ad-platforms-api.ts` (adapters), `lib/ad-platforms.ts` (pure:
  labels, severity order, window parsing, the account-selection diff) — unit-tested.
- `lib/queries/ad-platforms.ts` — `status()`, `performance(days)`, `audit(days)`.
- `services/ad-platforms-actions.ts` — authorize URL, choose accounts, sync, disconnect.
- `features/integrations/meta-callback-exchange.tsx` forwards Meta's `state`, so one callback
  serves Social and Ads.
- `features/ads/audit/*` — the tab, presentational.
- `lib/ads.ts` — `audit` second in `ADS_TAB_IDS`; the in-app doc gains the tab.

## Acceptance Criteria

1. Connect → choose accounts → figures and findings, with skeleton / empty / error states.
2. Disconnect asks first and clears the tab back to "not connected".
3. No figure is computed in the browser; every money value uses the store's formatter.
4. `npm test`, `npx tsc --noEmit`, lint and `npm run build` pass; the in-app doc is updated.

## Patches

### 2026-10-01 — the connect button is always there; Meta Ads on Integrations

- The Audit tab's connect card always renders **Connect Meta Ads**. When the server has no
  Meta app configured the button is disabled and one plain sentence says the platform
  owner must add the Meta app before any store can connect — never a bare "not available".
- Integrations gains a **Meta Ads** app (`lib/integration-catalog.ts`, area marketing,
  kind oauth). Its detail view is `features/integrations/meta-ads-card.tsx`: connect,
  choose accounts (the same `AccountPicker`), sync now, disconnect — over the same
  `/ads/platforms/*` endpoints and `adsQueries.platforms()` cache as the Audit tab, so the
  two screens can never disagree. The hub's connect for `meta_ads` uses the Ads authorize
  URL and the `ADS_CONNECT_FLAG`, so Meta's callback returns to the Audit tab.

### 2026-10-01 (later) — one Meta card, not two (owner request)

- Supersedes the separate Meta Ads app above: `meta_ads` leaves `INTEGRATION_KEYS`. **Meta**
  is one card whose copy, reads and pages cover both jobs (Social Growth posting and the
  Performance Ads audit). Its Settings tab has two parts: **Posting** (`MetaCard`) and
  **Ads audit** (`MetaAdsCard`), each with its own sign-in because Meta grants the two
  permissions separately. Sync now on the card is the ad-account read (`syncNow("meta")`).
- An Ads sign-in started in Integrations returns to `/integrations/meta?tab=settings&ads=<result>`
  (`ads=`, since `meta=` on that page is the posting sign-in's result).
