# SPEC-336 — Connect failures say why

**Status:** implemented 2026-10-05 · **Repo:** frontend · **Backend:** SPEC-344
(`SPEC-344-integration-connect-state-binding.md`)

## Why

Backend SPEC-344 binds every integration connect to the user, organization and store that
started it, and refuses a QuickBooks company another organization holds. Each refusal has its
own code and an owner-readable message. Two of the three callbacks threw that away:

- **Google Search Console** did not pass Google's `state` back at all — after SPEC-344 every
  Google connect would fail — and on any failure showed only "The connection was cancelled or
  failed".
- **Meta** (Social and Ads) showed "The connection failed. Please try connecting again."
  whatever the reason.

QuickBooks already carries the backend's message to the page (SPEC-299/303); it needs no
change.

## What changes

1. **Google callback** (`app/(app)/integrations/google-search-console/callback/page.tsx`,
   `features/integrations/google-callback-exchange.tsx`) reads `state` and sends
   `{code, state}` (`services/google-actions.ts` `exchangeGoogleCode(code, state)`).
2. **Failure reasons travel as a code, never as text.** On a failed exchange the Meta and
   Google callbacks append `&reason=<code>` to the page they return to — only a code
   `lib/connect-reasons.ts` knows (`connect_link_invalid`, `connect_link_expired`,
   `connect_started_elsewhere`); anything else is dropped, so nothing a URL carries is ever
   rendered.
3. **`lib/connect-reasons.ts`** (pure, Vitest-covered): `connectReasonCode(error)` → a known
   code or `null` (reads `ApiError`/`GoogleActionError`/Meta action errors' `code`);
   `connectReason(code)` → `{ title, detail }` for a known code, else `null`;
   `withReason(href, code)` appends `reason` to a return href.
4. **Banners show the reason.** `GoogleConnectBanner`, `MetaConnectBanner` and the Ads
   audit's return line take an optional `reason`; with one they show its sentence instead of
   the generic line ("This connection link expired — links last 10 minutes. Start the
   connection again." / "This connection was started from a different account or workspace.
   Start it again here."). The detail page reads `reason` beside `google` / `meta` / `ads`.
5. `services/meta-actions.ts` throws an error carrying the backend `code`
   (`MetaActionError`), as Google's already does.

## Acceptance criteria

1. A Google connect sends `state`; with a valid state it completes as before.
2. A refused Meta or Google connect lands on its page with the reason's sentence; an unknown
   or missing reason shows the existing generic sentence.
3. A `reason` value that is not a known code renders nothing new.
4. `npm test`, `npx tsc --noEmit`, `npm run lint` (touched files), `npm run build` green.

## Manual verification checklist

- Integrations → Google Search Console → Connect → approve → returns connected.
- Same, but wait 11 minutes on Google's screen → banner: link expired.
- Integrations → Meta → Connect → cancel → neutral "cancelled" banner (unchanged).

## Verification (2026-10-05)

| # | Criterion | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Google sends `state`; a valid one completes | done | callback page reads `state`, `exchangeGoogleCode(code, state)`; backend `tests/test_gsc.py` completes with the real state |
| 2 | A refused Meta / Google connect shows the reason; unknown → generic | done | `withReason` on the callbacks' return links; `GoogleConnectBanner`, `MetaConnectBanner`, `MetaAdsReturnNotice` take `reason` |
| 3 | An unknown `reason` renders nothing new | done | `tests/connect-reasons.test.ts` — `constructor`, `__proto__`, `<script>`, other codes → null |
| 4 | test / tsc / lint / build | done | `npm test` 202 files, **2,271 passed**; `npx tsc --noEmit` clean; ESLint clean on every touched file; `npm run build` compiles every route |

In-app docs (root Rule 11): `lib/docs/content/integrations.ts` — the sign-in paragraph says a
connect completes only for whoever started it within 10 minutes, and Good to know gains the
one-company-one-organization rule; `updated` → 2026-10-05.
