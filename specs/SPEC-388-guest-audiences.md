# SPEC-388 — Email Marketing for restaurants: the Guest audiences panel

**Status:** implemented 2026-10-16 · **Repo:** frontend · **Backend:** SPEC-405 · **Plan:** backend
SPEC-401 (W5)

## What

For a restaurant brand (the `restaurant` feature), the Email Marketing Manager's **Audiences** tab starts
with **Guest audiences** (`features/email-marketing/audiences/guest-audiences.tsx`):

- the lifecycle audiences (came once, lapsed 30/60/90+, regulars, top spenders) and, under **By
  branch**, one per branch — each with its guests, how many have an email, how many opted in, and the
  Klaviyo list's size and last sync;
- **Send to Klaviyo** / **Sync again** (`email_marketing.manage`, and the Klaviyo key's audience gate),
  disabled when nobody in the audience opted in; the answer is worded by `lib/guest-audiences.ts`
  `syncNotice`, including how many opted in on the site but are not subscribed in Klaviyo.
- Read `emailMarketingQueries.guestAudiences()`; write `syncGuestAudience` (registered in
  `lib/action-permissions.ts`). The Email Marketing doc's Audiences section describes both.

## What FOC sees (Rule 12)

Unchanged — the panel renders only with the `restaurant` feature.

## Acceptance criteria

1. The panel shows for a restaurant brand only, grouped lifecycle then branch.
2. A sync reports what it did; the button follows the role and the key.
3. Unit tests for `lib/guest-audiences.ts`.

## Verification (2026-10-16)

`tests/guest-audiences.test.ts` (2): AC 3 done; AC 1–2 by the role-gate coverage test, `tsc` and the
manual check on the demo.
