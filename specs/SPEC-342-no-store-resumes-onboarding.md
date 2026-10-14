# SPEC-342 — A company without a store resumes onboarding, never an error page

**Status:** implemented 2026-10-06 · **Repo:** frontend only · **Builds on:** SPEC-313/314
(onboarding: organization → plan → connect store → syncing → ready), SPEC-317 (the workspace
read in the app layout), SPEC-227 (error boundaries)

## Why

Owner (2026-10-06), on a new account: signed in, had not connected the Shopify store, opened
Integrations and got **"Something went wrong"**. The route gate (`proxy.ts`) only sends a user to
onboarding while they have **no company**. Once the company exists, the whole app opens, and
every page that reads store data gets the backend's `409 store_not_connected`, which the error
boundary shows as an unknown failure. A professional SaaS takes the user back to the step they
stopped at.

## What changes

1. **Gate — `app/(app)/layout.tsx`.** The layout already reads `/workspace` (beside the user, one
   round trip). The backend states `store: null` when the company has no store. `lib/workspace.ts`
   adds `needsStore` — `true` **only** when the payload says `store: null` explicitly — and the
   layout redirects to `/onboarding`, which opens on the real step (plan or connect store). No new
   request.
   - **Only the store decides.** Not the subscription, not the first sync: a company whose store
     is still syncing stays in the app (the sync step's "Open your dashboard" lets it in early by
     design, SPEC-316), and a company with a store is never sent back whatever its billing says.
     Every existing company — Fame on Central included — has a store, so none is affected.
   - A workspace read that fails (`EMPTY_WORKSPACE`) or an older backend without the `store` key
     never redirects: a blip must not lock anyone out.
2. **Safety net — `lib/error-boundary.ts`.** A new kind **`store`**: an error carrying
   `store_not_connected` or the backend's "No Shopify store is connected" message is shown as
   **"Connect your store first"** with a **Connect your store** button to `/onboarding`, no Try
   again (it would fail the same way). `ApiError.code` joins the text the classifier reads.
   `components/shared/error-state.tsx` draws this kind calm (card tokens, a store icon,
   `role="status"`), not red — nothing went wrong. Every page boundary and every inline query
   error uses the same classifier, so both are covered.

## Acceptance criteria

1. A company without a store opening any app page lands on `/onboarding` at its current step.
2. A company with a store — syncing or done, with or without a subscription — is never
   redirected; a failed workspace read never redirects.
3. A `store_not_connected` error anywhere shows "Connect your store first" → `/onboarding`, calm,
   without Try again; other errors are classified as before.
4. `npm test`, `npx tsc --noEmit`, lint on touched files, `npm run build` green.

## Manual verification checklist

- New account, company created, no store: open `/integrations`, `/brief`, `/dashboard` → each
  goes to `/onboarding` on the plan or connect step.
- A connected store's account: every page opens as before.
