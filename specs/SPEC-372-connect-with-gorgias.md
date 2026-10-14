# SPEC-372 — Connect with Gorgias button

**Status:** implemented 2026-10-12 · **Repo:** frontend · **Backend:**
`SPEC-380-connect-with-gorgias.md` · **Pattern:** `SPEC-371-connect-with-klaviyo.md`

## Why

Owner (2026-10-12): Gorgias after Klaviyo — one click and Allow on Gorgias's screen, instead of
copying a subdomain, an email and an API key. Gorgias's App Store requires OAuth2, and its
listing opens our App URL with the store's subdomain:
`https://ecommerce.ftes.ai/integrations/gorgias?connect=gorgias&account=<subdomain>`.

## What FOC sees after this change

Unchanged. FOC keeps its pasted subdomain, email and API key; the key form stays and is open when
a key is saved.

## Changes

1. **The callback route** `app/api/integrations/gorgias/callback/route.ts`, the Klaviyo route's
   twin:
   - it reads `code`, `state` and `error`;
   - it POSTs `{code, state}` server-side to `/api/v1/settings/integrations/gorgias/oauth/exchange`
     with the session bearer, so no token ever reaches the browser;
   - it always redirects to Gorgias's own page, `/integrations/gorgias?tab=settings`, with
     `?gorgias=connected` or `?gorgias_error=<sentence>`.
   A denied consent (`access_denied`) says so plainly, with the way back: "You didn't allow ftes
   for Commerce to access Gorgias, so Gorgias isn't connected. To connect, click Connect with
   Gorgias again and press Allow."
2. **The subdomain.** Gorgias's consent page lives on the store's own subdomain, so the button
   needs one. The form has one input, "Your Gorgias subdomain":
   - it is prefilled with the saved subdomain, or the `account` Gorgias passed;
   - it accepts `acme`, `acme.gorgias.com` or a full Gorgias URL;
   - it is normalised and checked by `lib/gorgias-connect.ts` before the backend is asked, with
     the same rule as the backend.
3. **The button.** "Connect with Gorgias" is a `RoleButton need="integrations.manage"`. It gets
   the URL from `GET …/gorgias/oauth/authorize-url?account=<subdomain>` and navigates there. It
   appears only when the card's `oauth.available` is true:
   - on Gorgias's Settings tab in the Integrations hub (`features/integrations/gorgias-settings.tsx`);
   - in the hub's connect dialog, on step 1.
   The pasted-key form stays under "Use an API key instead", open when a key is saved.
4. **Connected.** "Connected with Gorgias" and what the sign-in may do, in words:
   - read tickets, agents and satisfaction scores;
   - reply and add notes only on your approval;
   - save approved replies as macros.
   It offers Disconnect (a `RoleButton`, `integrations.manage`, confirmed first; a key saved
   beside it stays in force). When the backend says `needs_reconnecting`, the block says
   "Gorgias needs reconnecting" and offers Reconnect with Gorgias.
5. **The install link.** `?connect=gorgias` (plus `account`) on Gorgias's page:
   - it opens the Settings tab, and the link is removed from the address before anything else,
     so a refresh or Back never starts it twice;
   - the pure `gorgiasAutoStart(...)` decides:

   | Decision | When | What happens |
   | --- | --- | --- |
   | `start` | OAuth available, not connected, the role holds `integrations.manage`, a subdomain is known | "Taking you to Gorgias…" and the round trip starts |
   | `need_subdomain` | as `start`, but no subdomain is known | the form, with "Enter your Gorgias subdomain to continue" |
   | `connected` | already connected | "Gorgias is already connected" |
   | `not_allowed` | the role lacks `integrations.manage` | the role's reason |
   | `unavailable` | the platform has no Gorgias app set up | nothing extra; the key form shows |
   | wait | the overview or the access is still loading | nothing yet |

   A signed-out visitor is sent to `/login?next=…` by `proxy.ts` and comes back to the same link.
6. **Hub plumbing.**
   - `RETURN_PARAMS` gains `gorgias`, `gorgias_error` and `account`.
   - `HubOAuth` gains `needsReconnecting`, which `toHubOAuth` reads from `needs_reconnecting`;
     an older backend means false.
7. **Registry (Rule 13).** `startGorgiasConnect` and `disconnectGorgiasOAuth`
   (`services/gorgias-connect-actions.ts`) get rows in `lib/action-permissions.ts`
   (`integrations.manage`).
8. **Docs (Rule 11).** The Integrations doc says that Klaviyo and Gorgias connect with one click
   (a key still works), and its `updated` date is bumped.

## Acceptance criteria

1. The callback exchanges server-side and redirects to Gorgias's page with a message. A denied
   consent says what happened and how to connect.
2. The subdomain is normalised and refused client-side with the backend's rule. The button
   appears only when OAuth is available, follows the role and starts the round trip. The
   connected state, reconnect and disconnect work.
3. `?connect=gorgias&account=…` starts the round trip once, with every decision in the table.
4. Registry rows added; `tests/role-gate-coverage.test.ts` green.
5. `npm test`, `npx tsc --noEmit`, lint on touched files and `npm run build` green.

## Verification (2026-10-12)

| # | Criterion | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Callback, server-side exchange, denied consent | done | `app/api/integrations/gorgias/callback/route.ts` over `lib/gorgias-connect.ts`; `tests/gorgias-connect.test.ts` "the callback" (return URL, denied message, other refusals, code hand-off, message cut) |
| 2 | Subdomain rule, button, connected / reconnect / disconnect | done | `gorgiasSubdomain` tested on the backend's own cases; `features/integrations/gorgias-oauth.tsx` (`GorgiasConnectForm`, `GorgiasOAuthConnected` with Reconnect, `GorgiasDisconnectButton`), `gorgias-settings.tsx`, the hub connect dialog; `canConnectWithGorgias` tested |
| 3 | Install link, every decision | done | `gorgiasAutoStart` / `installSubdomain` / `withoutGorgiasInstall` tests: wait, start on `account` then the saved subdomain, need_subdomain, connected, not_allowed, unavailable, reconnect, link dropped |
| 4 | Registry | done | `startGorgiasConnect`, `disconnectGorgiasOAuth` → `integrations.manage`; `tests/role-gate-coverage.test.ts` green |
| 5 | test / tsc / lint / build | done | `npm test` **2,657 passed** (234 files); `npx tsc --noEmit` clean; eslint on every touched file clean; `npm run build` compiled, `ƒ /api/integrations/gorgias/callback` listed |

Docs: `lib/docs/content/integrations.ts` gains the one-click sign-in paragraph (Klaviyo and
Gorgias), `updated` 2026-10-12; `tests/docs.test.ts` green.

Manual check still owed (needs the owner's Gorgias account): install from Gorgias's App URL signed
out and signed in, Allow, Deny, Disconnect, on a demo organization — never on FOC.
