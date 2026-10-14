# SPEC-328 — The Integrations hub

**Repo:** frontend · **Status:** implemented · **Date:** 2026-09-30
**Pairs with:** backend `SPEC-337-integrations-hub-api.md`.
**Owner decision (2026-09-30):** build the approved clickable mockup "for real". Every app that is not
connected opens a proper connect dialog, and everything works end to end.
**Builds on:**

- SPEC-077, SPEC-302: integration cards and reveal.
- SPEC-230: the query registries.
- SPEC-232: the persistent shells.
- SPEC-300, SPEC-303: QuickBooks.
- SPEC-325: folder tabs.

## Why

The page was a wall of forms, and it contradicted itself:

- The header said "V1 connects Shopify; the sources below are on the roadmap".
- The roadmap listed Meta Ads right under a Meta connection.
- A "Built to extend" card sat at the bottom.

It never said whether a connection was working, what each app unlocks, or what went wrong, and it
labelled iPacky and V-Count sync times "(NY)" for every customer.

## Behaviour

### `/integrations`: the hub (`features/integrations/integrations-view.tsx`)

- **Header** (from the shell):
  - Title "Integrations".
  - Description: "Connect the apps your store runs on. We only read from them, and every figure
    in the app shows which one it came from."
  - Search box (`/` focuses it) and a "Connect an app" button (goes to Browse apps).
- **Health strip.**
  - The number of connected apps.
  - A segmented bar: healthy, syncing or pending, warning, attention.
  - Four tiles: All connected, Healthy, Syncing, Need you. Each is a link that opens the Connected
    tab with that filter.
- **Needs you.** One card per connection whose status is `attention` or `warning`, carrying:
  - the backend's reason;
  - its action button:
    - `reconnect` / `renew` → the provider's sign-in;
    - `choose_property` / `open_settings` → the app's Settings tab;
    - `retry` → Sync now.
- **Folder tabs** (SPEC-325), held in the URL as `?tab=` through `ShallowLink`:
  - **Connected** (default):
    - Status filter chips (All / Healthy / Syncing / Need you, `?filter=`).
    - Three layouts, `?view=`: **List** (default), **Cards**, and **By area**. List columns:
      - App
      - Status
      - Last sync
      - Last 24 syncs (bars)
      - Powers (page chips)
      - Menu
    - The menu offers:
      - Sync now (when `can_sync`);
      - Settings;
      - Sync history;
      - Disconnect… (key apps; opens that app's Settings with the confirm open).
    - A row opens the app's page.
  - **Browse apps:**
    - A category rail (All, Store, Marketing, Support & returns, Operations, Finance, Search &
      traffic, Coming soon).
    - Tiles with what the app unlocks, and a **Connect** button that opens the connect dialog.
    - Tiles already connected show their status and **Manage**.
    - An `unavailable` OAuth app shows "Not set up on this server" and no button.
    - Coming soon tiles are muted with no action. Meta Ads says the Meta posting connection is
      separate.
  - **Activity:** the SPEC-337 timeline:
    - Everything / Problems / Changes.
    - An app picker (a Radix Select).
    - Day headers, each row's time, app, message, result, rows and duration.
    - An error row expands to its technical detail.
  - **Included in your plan:**
    - **AI:** the month's allowance (`GET /billing/ai-allowance`; the meter is hidden when the
      member cannot read billing). A **Use your own AI key** switch opens the existing AI
      providers card.
    - **Email delivery:** a **Send from your own mail server** switch opens the SMTP settings,
      with Test.
    - **Shopify app:** its scopes, read-only.
    - **Google and Meta sign-in:** whether each platform app is set up.

### `/integrations/[key]`: one app's page (`features/integrations/integration-detail-view.tsx`)

- **Header:**
  - A back link, the logo, the name and the status pill.
  - Its description, and who connected it and when (if known).
  - Primary action: Sync now, or the Needs-you action.
  - Nested folder tabs in `?tab=`, as below.
- **Overview:**
  - Four stat tiles: last sync, status, last run's rows, problems in 7 days.
  - A bar chart of the last syncs' rows, with failed runs in `--destructive`.
  - "Powers these pages", as links to the real routes.
- **Settings:**
  - **Key apps** (`key-settings-panel.tsx`):
    - Non-secret fields.
    - Each secret shows "Saved", Reveal (SPEC-302) and Replace.
    - Sync time is a Select, and says "store time".
    - **Test connection** tries the unsaved values.
    - A sticky save bar appears when something changed.
    - A **Disconnect** danger zone: type the app's name to confirm.
    - Clarity keeps its sync panel.
  - **Search Console, Meta, QuickBooks:** their existing cards (connect, property, companies,
    disconnect) inside the panel.
  - **Shopify:** the store address and "connected through the app" note.
- **Sync history:** the timeline for this key.
- **Permissions:**
  - What it reads.
  - What we never do. For Klaviyo and Meta, the one thing we send is stated.
  - Who can manage it.
- Coming back from Google, Meta or Intuit lands on this page's Settings tab:
  - The callbacks now redirect to `/integrations/gsc?tab=settings&google=…` and
    `/integrations/meta?tab=settings&meta=…`.
  - QuickBooks' return allowlist gains `/integrations/quickbooks`.

### The connect dialog (`connect-dialog.tsx`)

- **Key apps**, three steps:
  1. What you get: unlocks, reads, read-only.
  2. The fields, with "Where do I find this?" steps.
  3. **Test and connect**, in order:
     - `POST /integrations/{key}/test` with the typed values.
     - On success, save through `PUT /settings/integrations/{provider}`.
     - Then `POST /integrations/{key}/sync` when the app can sync. Clarity starts its own first
       sync on save.

  Each step is drawn as it happens. A failed test shows the backend's sentence and keeps the
  values, so Back fixes them.
- **OAuth apps:** what we read, then "Continue to Google / Meta / Intuit", which redirects to the
  provider's own authorize URL.

### Copy and data

- `lib/integration-catalog.ts`: the pure copy for every key. It covers:
  - name, monogram, area, kind;
  - description, reads, sends, unlocks;
  - powers (label + href);
  - fields and secrets;
  - help steps.

  It replaces `lib/integrations.ts` (the roadmap list) and the component-local `PROVIDER_META`.
- `lib/integration-hub.ts`: pure logic.
  - Adapters for overview and activity.
  - Status meta: label and tone.
  - Filters, sort order (attention first), counts, "Needs you".
  - Relative time; activity grouped by day.
  - Tab parsing and hrefs.
- Queries in `lib/queries/integrations.ts`: `overview()` (polls every 5 s only while something is
  syncing) and `activity(key, kind)`. Writes in `services/integration-hub-actions.ts`.
- Removed:
  - `integration-card.tsx`
  - `configurable-integration-card.tsx`
  - `store-card.tsx`
  - `add-store-card.tsx`
  - `lib/integrations.ts` and its test

## Tests

- **`tests/integration-catalog.test.ts`:**
  - the keys are exactly the backend's ten listed keys, plus `smtp`;
  - every key app's fields match the backend's whitelist names;
  - every `powers` href is a real nav route.
- **`tests/integration-hub.test.ts`:**
  - adapters;
  - filters and counts;
  - Needs you;
  - sort order;
  - tab and filter parsing;
  - relative time;
  - day grouping;
  - action mapping.
- **`tests/quickbooks-connection.test.ts`:** the new return path.
- Full `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`.

## Manual verification

- Health tiles filter the list.
- Needs you actions go where they say.
- The three layouts render.
- Sync now shows the Syncing pill and then the result.
- Connecting a key app:
  - A bad key shows the reason and keeps the values.
  - A good key saves and syncs.
- Reveal and Replace on a secret.
- The save bar appears.
- Disconnect needs the name typed.
- Google, Meta and QuickBooks return to the app's Settings tab.
- Activity filters and error expand.
- Both themes, and 360 px.

## Acceptance criteria

- [x] The hub shows health, Needs you, and the four tabs, all from live data.
- [x] Every not-connected app opens a real connect dialog. Key apps are tested before they are saved.
- [x] Each app has its own page with Overview, Settings, Sync history and Permissions.
- [x] No "NY" and no store-specific names in any copy.
- [x] Docs updated (Rule 11).
- [x] Lint, types, tests and build are green.

## Patches

- **2026-09-30: Disconnect is a real button everywhere** (owner, from a screenshot of QuickBooks'
  plain-text "Disconnect"). QuickBooks lists each company as a bordered row with its own outline
  **Disconnect** button (trash icon, destructive text, `aria-label` naming the company). Google
  Search Console and Meta use the same button in place of their grey ghost/outline ones. All three
  confirm dialogs now end on a destructive **Disconnect** action, matching the key apps' danger
  zone.
- **2026-09-30: Included in your plan, laid out for what it holds** (owner, from two screenshots:
  empty space beside a cramped AI card).
  - The AI card and the Email card each take the full width; Shopify app and Sign-in sit side by
    side below them. A tall card no longer leaves a hole beside a short one.
  - The AI provider block chose its columns from the window width, so inside a half-width card it
    squeezed three columns into one. It now has the full width. `AiProvidersCard` and
    `KeySettingsPanel` take `embedded`, which drops their own border so there is no card inside a
    card. The mail-server form goes three fields across on wide screens.
  - The Veo card puts its model name under the title instead of beside it, so "Google Veo · video"
    never wraps word by word.
- **2026-09-30: every app shows its own logo** (owner: "use here the actual logo of these apps").
  The two-letter monograms are gone. Each app, and each Coming soon app, has its vendor's mark in
  `public/app-logos/`:
  - **Simple Icons' CC0 glyphs, filled with the vendor's brand colour from Simple Icons' own
    data:** Shopify, Google Search Console, Meta, QuickBooks, Google Ads, Google Analytics,
    BigQuery and Slack.
  - **The vendor's own site icon:** Gorgias, Klaviyo, Loop Returns, Microsoft Clarity and Triple
    Whale.
  - **Cropped from the vendor's logo** (their sites publish only 16–32 px icons): iPacky and
    V-Count.

  Nothing loads from another site at runtime. `AppLogo` draws the mark on the new `--logo-tile`
  token, white in the light theme and `#f5f5f2` in the dark one, so dark marks stay visible in
  both. Like `provider-marks.tsx`, a third-party mark keeps its owner's colours. The folder is
  `app-logos`, not `integrations`, so no file can collide with an `/integrations/[key]` page;
  `proxy.ts` already lets image files through without a session. `tests/integration-catalog.test.ts`
  fails if any app's logo file is missing.
- 2026-09-30 (owner request, main-ecommerce-fte-14): **Activity pages.** The Activity tab and each
  app's Sync history show 25 events a page with the app's `TablePager` ("1–25 of 312 events ·
  Prev · pages · Next"), from backend SPEC-337's `offset`/`total`. Changing Everything / Problems /
  Changes or the app picker returns to page 1; a page change scrolls back to the list's top.
