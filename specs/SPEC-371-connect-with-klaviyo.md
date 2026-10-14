# SPEC-371 — Connect with Klaviyo button

**Status:** implemented 2026-10-10 · **Repo:** frontend · **Backend:**
`SPEC-379-connect-with-klaviyo.md`

## What FOC sees after this change

Unchanged. FOC keeps its pasted key; the key form stays.

## Changes

1. **The callback route** `app/api/integrations/klaviyo/callback/route.ts` is a Route Handler,
   the QuickBooks pattern (SPEC-299):
   - it reads `code`, `state` and `error`;
   - it POSTs `{code, state}` server-side to `/api/v1/settings/integrations/klaviyo/oauth/exchange`
     with the session bearer, so no token ever reaches the browser;
   - it redirects to the page the connect started on (an allowlisted `klaviyo_return` cookie:
     `/integrations` or `/email-marketing?tab=settings`) with `?klaviyo=connected` or
     `?klaviyo_error=<sentence>`;
   - a cancelled consent (`error=access_denied`) is not an error.
2. **The button.** "Connect with Klaviyo" on:
   - the Integrations Klaviyo card;
   - Email Marketing → Settings → Connection.
   It is a `RoleButton need="integrations.manage"`. It gets the URL from `GET
   …/klaviyo/oauth/authorize-url`, sets the return cookie and navigates. It is shown only when
   the card's `oauth.available` is true.
   - When OAuth is connected, the card says "Connected with Klaviyo" and lists what it may do
     (the granted scopes, in words), with "Disconnect" (a `RoleButton`, `integrations.manage`,
     with a confirm).
   - The pasted-key form stays under "Use a private API key instead".
3. **Registry (Rule 13).** The new write functions (`startKlaviyoConnect`,
   `disconnectKlaviyoOAuth`) get their rows in `lib/action-permissions.ts` (`integrations.manage`).
4. **Pure helpers** in `lib/klaviyo-connect.ts`: the return-path allowlist, the
   result-to-message mapping and scope labels, all with tests.
5. **Docs (Rule 11).** `lib/docs/content/email-marketing.ts` describes connecting with one
   click, and that a pasted key still works. The Integrations doc file belongs to another
   session today; if it needs a line, it is added when that file is free. Bump `updated`.

## Acceptance criteria

1. The callback exchanges server-side and redirects with a message; access_denied is quiet; an
   unknown return path falls back to `/integrations`.
2. The button appears only when OAuth is available, follows the role and starts the round trip;
   connected state and disconnect work.
3. Registry rows added; `tests/role-gate-coverage.test.ts` green.
4. `npm test`, `npx tsc --noEmit`, lint on touched files and `npm run build` green.

## Implementation notes (2026-10-10)

- **Where a result lands.** The Integrations surfaces return to `/integrations` (the allowlisted
  hub); the hub's existing sign-in forward (`legacyReturn` in `integrations-view.tsx`) sends a
  `klaviyo` / `klaviyo_error` result on to `/integrations/klaviyo?tab=settings`, where the card
  shows it (`klaviyoHubForward`). Email Marketing returns to `/email-marketing?tab=settings`.
- **Integrations.** The button sits on Klaviyo's Settings tab (`features/integrations/klaviyo-settings.tsx`)
  and on the first step of the hub's connect dialog, beside "Use a private API key instead". A
  store with a key already saved finds the key form open, as before (FOC: unchanged).
- **Email Marketing.** The card reads `oauth` from the Integrations overview, only when the role
  may see integrations; otherwise the key form shows as before. A needs-attention connection
  offers "Reconnect with Klaviyo"; an employee disconnected while the sign-in remains offers
  "Connect with the Klaviyo sign-in".
- Shared UI: `features/integrations/klaviyo-oauth.tsx`. Pure rules: `lib/klaviyo-connect.ts`
  (`tests/klaviyo-connect.test.ts`). The card adapter (`toConnection`) adds `oauth` only when the
  backend sends it.

## Verification (2026-10-10)

| # | Criterion | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Callback | done | `app/api/integrations/klaviyo/callback/route.ts` over `lib/klaviyo-connect.ts`; `tests/klaviyo-connect.test.ts` (allowlist fallback, quiet access_denied, message mapping) |
| 2 | Button, connected state, disconnect | done | `features/integrations/klaviyo-oauth.tsx`, `klaviyo-settings.tsx`, the hub connect dialog, `features/email-marketing/settings/connection-card.tsx`; the key form stays under "Use a private API key instead" (open when a key is saved) |
| 3 | Registry | done | `startKlaviyoConnect`, `disconnectKlaviyoOAuth` → `integrations.manage`; `tests/role-gate-coverage.test.ts` green |
| 4 | test / tsc / lint / build | done | `npm test` **2,621 passed**; `npx tsc --noEmit` clean; `npm run lint` 0 errors; `npm run build` compiled |

## Patches

- **2026-10-10 — the connect dialog's footer.** `DialogContent` here has no padding, but shadcn's
  `DialogFooter` carries `-mx-4 -mb-4` for padded content, so the footer spilled past the dialog
  and was clipped at the bottom and sides. Both footers now cancel those margins (`mx-0 mb-0`).
  The third footer button, "Use a private API key instead", moved into the body as a link
  ("Prefer a key? Use a private API key instead"), so the bar holds Cancel and Connect with
  Klaviyo.
- **Klaviyo's catalog wording** (`lib/integration-catalog.ts`) said only "the winback list".
  Connecting now also powers the Email Marketing Manager, so the description, unlocks, reads,
  sends, powers and cadence say both. The dialog's line reads "What we change: …" instead of
  "We read only, except one thing: …" (Meta's sentence reads naturally under it too). `npm test`
  2,621 passed; build compiled.

## Amendment (2026-10-10): installing from Klaviyo's side

Klaviyo's listing asks for an **OAuth installation URL** that works "from both the Klaviyo side
and your app side". Ours is `https://ecommerce.ftes.ai/integrations/klaviyo?connect=klaviyo`.

- **Signed out:** `proxy.ts` already sends a signed-out visitor to `/login?next=<path+query>`,
  and sign-in returns them to it. A brand-new visitor signs up and onboards first, then starts
  the connect from Integrations.
- **On the Klaviyo page, `?connect=klaviyo`:**
  - it opens the Settings tab (`parseDetailTab` treats `connect`, `klaviyo` and
    `klaviyo_error` as return parameters);
  - the parameter is removed from the address before anything else, so a refresh or Back never
    starts it twice;
  - the pure `klaviyoAutoStart(...)` in `lib/klaviyo-connect.ts` then decides:

  | Decision | When | What happens |
  | --- | --- | --- |
  | `start` | OAuth available, not connected, the role holds `integrations.manage` | "Taking you to Klaviyo…" and the round trip starts (the same `startKlaviyoConnect`, return `/integrations`) |
  | `connected` | already connected | "Klaviyo is already connected" |
  | `not_allowed` | the role lacks `integrations.manage` | the role's reason |
  | `unavailable` | the platform has no Klaviyo app set up | nothing extra; the key form shows as usual |
  | wait | the overview or the access is still loading | nothing yet |

**Tests:** `tests/klaviyo-connect.test.ts` covers every decision and the tab choice.
- **2026-10-12 — Deny says what happened (Klaviyo's review checklist).** Klaviyo's checklist asks
  that the deny-permission flow "uses clear language and notifies the client how to proceed".
  `access_denied` was quiet, which left the merchant on Integrations with no word. It now returns
  with `KLAVIYO_DENIED_MESSAGE`: "You didn't allow ftes for Commerce to access Klaviyo, so Klaviyo
  isn't connected. To connect, click Connect with Klaviyo again and press Allow." The message
  shows where any connect result shows (`klaviyoNotice`).
