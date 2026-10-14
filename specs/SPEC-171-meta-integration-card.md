# SPEC-171 — Meta (Instagram + Facebook) integration card

## Context / Why

Backend `SPEC-179` builds the Meta connection; this is the surface the owner actually
uses to make it. Without it the connection exists only as an API and nobody can create
one. Milestone 2 of the Social Growth end-to-end plan (owner decision 2026-08-27:
finish the engineering in-code, then apply to Meta).

Deliberately modelled on `GoogleSearchConsoleCard` (backend SPEC-119) rather than
invented: same three states, same connect→redirect→callback→exchange flow, same
confirm-gated disconnect. Two integrations that behave identically should look and read
identically, and the Google one is already proven in production.

**One genuinely new state.** Google is connected or not. Meta has a third condition the
UI must express, because it is the difference between "publishing works" and "half of
publishing works": a Facebook Page can be connected while having **no linked Instagram
Business account**. The backend reports that as `instagramLinked: false` and refuses only
Instagram publishing. The card must say so plainly and tell the owner what to fix, rather
than showing a green "Connected" badge over a half-working integration.

**A second one, for later.** `expiringSoon` surfaces the 60-day token boundary. The daily
refresh job should make this invisible forever — but if the job ever fails, the alternative
is publishing stopping silently with nothing on screen, which is precisely the failure
mode SPEC-179 was written to avoid.

## Scope

### Types — `types/integrations.ts`

```ts
export interface MetaStatus {
  connected: boolean;
  configured: boolean;
  pageName: string | null;
  instagramUsername: string | null;
  instagramLinked: boolean;
  tokenExpiresAt: string | null;
  expiringSoon: boolean;
  connectedBy: string | null;
  connectedAt: string | null;
}
```

The backend already returns camelCase, so — like `post_detail` in SPEC-168 — there is no
adapter. (`adaptGoogleStatus` exists only because that endpoint returns snake_case.)

### Testable logic — `lib/meta-connection.ts` (new)

The card stays presentational; every rule that can be wrong lives here where Vitest
reaches it (`vitest.config.ts` pins `environment: "node"`; there is no component runner):

- `metaBadge(status)` → `{ label, tone }` over four states, in priority order:
  **not configured** → "Unavailable"/neutral; **not connected** → "Not connected"/warning;
  connected but **no Instagram** → "Facebook only"/warning; connected → "Connected"/success.
  Ordering is the whole point: a connected-but-IG-less integration must never read as a
  clean success.
- `metaCapability(status)` → the plain-language sentence about what can publish today
  ("Instagram and Facebook", "Facebook only — no Instagram account is linked", or null
  when not connected).
- `tokenWarning(status)` → the expiry sentence when `expiringSoon`, else null.
- `connectionSummary(status)` → the label/value rows (Page, Instagram, Authorised by,
  Connected) with nulls dropped, so the card renders no empty `<dt>`.

### Card — `features/integrations/meta-card.tsx`

Mirrors `GoogleSearchConsoleCard` exactly: `Card`, badge, description, and one of three
bodies — connected (summary rows + capability line + optional token warning +
confirm-gated `AlertDialog` disconnect), configured-not-connected (Connect button →
`getMetaAuthorizeUrl()` → `window.location.href`), or unconfigured (a quiet note, nothing
clickable). Errors render `role="alert"`; every control has a pending state.

Semantic tokens only; brand red unused; no Framer Motion; nothing animates in.

### Callback — `app/(app)/integrations/meta/callback/page.tsx`

Mirrors the existing Google callback: reads `?code`/`?error` from Meta's redirect, calls
`exchangeMetaCode(code)` through the proxy, then returns to `/integrations` with
`?meta=connected|error`. A user-denied consent (`error=access_denied`) is reported as a
cancellation, not a failure — it is the normal way to back out.

### Services

- `services/meta.ts` — `getMetaStatus()` via `serverApi` (server-only, like `google.ts`).
- `services/meta-actions.ts` — `getMetaAuthorizeUrl`, `exchangeMetaCode`,
  `disconnectMeta`, all through `/api/proxy` (client-safe, like `google-actions.ts`).

### Integrations page

Renders `<MetaCard status={...} />` beside the Google card, its status fetched **in the
same `Promise.all`** as the page's existing reads — never a new waterfall (root Rule 5).

## Performance (root Rule 5)

One extra field in an existing parallel fetch; no new page-load round trip. Connect and
disconnect are user-initiated. The card is a Server Component fed by the page; only the
interactive shell is `"use client"`.

## Tests (root Rule 4)

**Vitest** — `tests/meta-connection.test.ts` over `lib/meta-connection.ts`:

- `metaBadge` returns each of the four states, and specifically that
  `connected: true, instagramLinked: false` yields **"Facebook only"/warning**, never
  "Connected"/success — the regression that would hide a half-working integration.
- `metaCapability` names both channels when linked, says Facebook-only when not, null
  when disconnected.
- `tokenWarning` fires only on `expiringSoon`.
- `connectionSummary` drops null fields and keeps order.

**Manual verification checklist** (no component runner):

- [ ] Unconfigured server → "Unavailable", no Connect button, no crash.
- [ ] Connect redirects to Meta; cancelling consent returns a cancellation, not an error.
- [ ] A successful connect shows Page, Instagram handle, and who authorised it.
- [ ] A Page with no linked Instagram shows "Facebook only" and the fix-it sentence.
- [ ] Disconnect asks first, then clears the card.
- [ ] Keyboard-only reachable; verified in **both** light and dark themes.
- [ ] Nothing animates in on load (root Rule 9).

`npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` all green.

## Out of scope

Publishing, scheduling, insights, and the Coming Soon tiles — later specs. This card
connects and disconnects; it never posts.

## Acceptance Criteria

- [ ] Meta card on `/integrations` with all four states correct.
- [ ] A connected Page with no Instagram reads "Facebook only", never a clean success.
- [ ] Connect → Meta → callback → exchange → back to `/integrations` works end to end.
- [ ] Confirm-gated disconnect.
- [ ] Status fetched in the page's existing `Promise.all`, no new waterfall.
- [ ] Logic in `lib/meta-connection.ts`, Vitest-covered; card presentational.
- [ ] Tokens never reach the client (the backend never sends them).
- [ ] Tokens only, no brand red, no entrance animation; tests + build green.
