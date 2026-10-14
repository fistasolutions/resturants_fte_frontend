# SPEC-370 — In-app docs: every screen recaptured, every "next capture run" kept

**Status:** Implemented
**Date:** 2026-10-09
**Repo:** ecommerce-fte-frontend (plus the root tool `tools/build_docs_screens.py`)
**Builds on:** `SPEC-229-in-app-docs.md` (root Rule 11)

## Problem

Owner: "check the /docs, is it updated or not?", then "please do that right now".

A check on 2026-10-09 found the prose mostly current, but the screenshots are not:
- **The screens are old.** Every one dates from Sep 23 or earlier. They show the old sidebar names
  (before the Oct 6 rename), Settings before the Sep 29 redesign, and Integrations before the Sep 30
  rebuild.
- **About 60 sections promise "its screen capture is added on the next capture run"** and have
  none: all of Customer Support and Email Marketing, nine Settings tabs, Accounts Payable,
  Customers → Health, Discounts → Decisions, Products → Fit and Brands, Returns → Bracketing,
  Results → Managers, Inventory → Cash Release and Allocation, Traffic → Staffing and a page's
  friction, Brand Brain → Review, Ads → Audit, and Integrations' four tabs.
- **Stale prose:**
  - System doesn't mention the First sync job (backend SPEC-316, Sep 26).
  - Morning Brief doesn't say it is prepared after the sync (Sep 30).
  - Dashboard and Integrations still apologise for screenshots that predate their redesign.
  - The overview says nothing about roles (Rule 13), sign-up and plans, or the "ftes for
    Commerce" name.

**The generator is missing.** Rule 11's generator, `tools/build_docs_screens.py`, isn't in this
checkout, and neither is `ref/screens/`. The source project has both.

## Decision

1. **The generator comes to this checkout.**
   - `tools/build_docs_screens.py` at the monorepo root, adapted from the source project:
     `ecommerce-fte-frontend` paths, and one capture run per folder (`ref/screens/docs-2026-10-09/<key>.png`).
   - A `KEEP` list carries screens that need a live conversation or the storefront to reproduce.
     Their earlier WebP is kept as it is. They are:
     - the ✦ Explain thread, voice dictation and the voice sphere;
     - an answer as a chart, with an action, with the watchlist and with the trust footer;
     - the storefront article, and Why this pick.
   - The registry is still only ever written by the tool.
2. **The capture run (2026-10-09).**
   - Taken from today's build running locally, signed in as the owner.
   - Settings: 1440×900 at 2×, light theme (`system-dark` in dark), whole page where the page is
     long. The generator crops at 4,200 px.
   - The floating Ask Glisp pill and nudge are hidden except on the screens about them. Every email
     address and phone number is blurred.
   - Actions only open a dialog, open a first item, select text or type into the composer. Nothing
     is submitted, sent or saved.
3. **The docs take their screens.**
   - Each section that promised a capture gets its key, and the promise is removed.
   - New keys are named after their screen (`support-inbox`, `email-plan`, `settings-roles`, …).
   - Every touched doc's `updated` becomes 2026-10-09.
4. **The stale prose is corrected.**
   - System gains the First sync job.
   - The Morning Brief says when it is prepared.
   - The overview gains roles, sign-up and plans, and the platform's name.

## FOC after this change

**What FOC sees: the same docs, with current screens.** The screens show the store's own pages,
with contact details blurred. No setting, row or behaviour changes.

## Acceptance criteria

1. `public/docs/` and `lib/docs/screens.ts` are written by `tools/build_docs_screens.py` only, and
   every key a doc names exists (`tests/docs.test.ts`).
2. No doc section says its capture comes "on the next capture run" or that its screenshot
   "predates" the page.
3. Each fresh screen shows the tab its section describes, with no floating UI over it (except the
   pill's own sections) and no readable email or phone number.
4. System, Morning Brief and the overview describe today's behaviour.
5. `npm run lint`, `npx tsc --noEmit`, `npm test` and `npm run build` are green.
