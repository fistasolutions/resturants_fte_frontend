# SPEC-283 — Brand Brain › Competitors tab: Find competitors, the live toast, review, add by hand

**Status:** implemented 2026-09-21 · **Backend:** SPEC-280 (`/brand-brain/competitors*`).
Mockup `ref/mockups/brand-brain-competitors.html` approved 2026-09-21 ("do it right now,
end to end"). Owner's three concerns: a Find button with a proper top-right progress toast
(SSE) that ends in a review; manual add; and every tab with a real URL.

## What ships
- **A seventh Brand Brain tab, `competitors`**, with its own URL:
  `/spotlight/brand-brain/competitors` (list), `?view=review|rejected` (the segment is
  URL state — `router.replace`, back/forward work), `?add=1` (the Add dialog open), and a
  profile page `/spotlight/brand-brain/competitors/[id]` with the site's breadcrumb (the
  shells pass it bare like the other detail pages).
- **Tiles:** Competitors tracked · Waiting for your review (warning rail when > 0) ·
  Topics they cover that you don't · Last researched. **Buttons:** Find competitors
  (primary; "Researching…" and disabled while a run is live) · Add manually.
  **Segments:** Approved · To review · Rejected, with counts. A line names the evidence
  and says plainly when web search is not connected (overlap will be unmeasured).
- **The toast** (`features/brand-brain/competitor-run-provider.tsx` +
  `competitor-run-toast.tsx`, mounted in `app/(app)/layout.tsx`, portalled into the
  shared `media-toast-host` like the generation toast): opens the run's SSE stream
  (`services/brand-brain-actions.ts` `streamCompetitorRun`), shows every step as it
  lands with a tick, the elapsed time and a progress bar, "Runs in the background — you
  can leave this page"; on `done` it reads "N competitors found — waiting for your
  review" with **Review →** (to `?view=review`), on `failed` the reason. On mount it asks
  `find/active` so a reload (or another page) picks the run back up. One dismiss.
- **Competitor card** (`competitor-card.tsx`): name, origin chip (Found by the agent /
  Added by you), status chip, domain · categories · price band, the *why* line, the
  four axes (price · shipping · returns · content) with the brand's own side where the
  profile says it, the content-gap chips with a link to the Inbound Engine, the pages
  read; actions by state — pending: Approve · Reject; approved: Open · Re-read;
  rejected: Restore (approve). Approve/Reject are optimistic and invalidate
  `["brand-brain"]`.
- **Add manually** (`add-competitor-dialog.tsx`): name · website · why (optional) →
  "Read the site" → the row lands in To review with its own run in the toast.
- **Profile page** (`competitor-page-view.tsx`): the card's content at full width, the
  evidence, every page read as a link, the run history for that competitor.
- Coverage's Competitors row now says "Find competitors" and links here (backend).

## Pure half (`lib/competitors.ts`, Vitest)
Adapters (`adaptCompetitor`, `adaptCompetitorRun`, `adaptCompetitorSummary`),
`COMPETITOR_VIEWS`, `viewFromParam`, `originLabel`, `statusLabel`, `priceBand`,
`overlapLine`, `axisRows` (only rows with something read), `runTitle`/`runProgress`
(steps → 0–1), `competitorHref`.

## Files
`types/brand-brain.ts`, `lib/brand-brain.ts` (section list, label, detail path),
`lib/competitors.ts`, `lib/queries/brand-brain.ts`, `services/brand-brain-actions.ts`,
`features/brand-brain/{competitors-view,competitor-card,add-competitor-dialog,
competitor-page-view,competitor-run-provider,competitor-run-toast}.tsx`,
`brand-brain-section.tsx`, `brand-brain-shell.tsx` / `spotlight-shell.tsx` (detail path),
`app/(app)/spotlight/brand-brain/[section]/page.tsx`,
`app/(app)/spotlight/brand-brain/competitors/[id]/{page,loading}.tsx`,
`app/(app)/layout.tsx`, `tests/competitors.test.ts`, `tests/brand-brain.test.ts`,
`tests/query-registries.test.ts`, `lib/docs/content/spotlight.ts`, screens.

## Acceptance
1. Seven tabs; `?view=` and `?add=1` round-trip through the URL; a profile page with
   breadcrumb (live check).
2. Find competitors → toast with live steps → Review → approve one → it moves to
   Approved and Coverage's Competitors section fills (live check, with the run's real
   steps).
3. Add manually lands in To review with its run in the toast (live check).
4. tsc · lint · `npm test` · `npm run build` green; registries pinned; doc + screens.

## Verification (2026-09-21, `tools/capture_competitors_0921.mjs` on the live app)
- Seven tabs: Coverage · Knowledge Base · Facts · Voice · Guardrails · Personas ·
  Competitors. `?view=review` and `?add=1` round-trip through the URL; Back from a
  profile page returns to `?view=review`; the profile page carries the breadcrumb
  "Spotlight › Brand Brain › Competitors › <name>".
- **Find competitors** → the toast appeared in 4 s ("Finding competitors 0:04 · Runs in
  the background"), was still there on /dashboard, and ended "5 competitors found …
  Waiting for your review · Review 5 →"; the review list showed the 5 profiles with
  categories, price bands, the four axes, "Where you win" and the gap chips.
- **Approve** moved a row to Approved (tiles 1 · 5 · 0); **Add manually** (Mimu Maxi)
  showed "Reading the site" in the toast at once, then "Profile written … Review →",
  and the row landed in To review with $28–$98 and its terms. Zero console errors.
- Gates: tsc clean · lint 0 errors · `npm test` 158 files / 1,811 passed (5 new in
  `competitors.test.ts`, registries and sections re-pinned) · `npm run build` exit 0
  (`/spotlight/brand-brain/competitors/[id]` compiled). Doc section + screen added.
- Acceptance 1–4: **done**.

## Patches

- **2026-09-21 — the tab opens on the review queue when that is where the work is.**
  After a Find run the tab landed on Approved (empty until the first approval) while
  eleven finds sat one segment over — the owner asked "it ran and found, but where?".
  `viewFromParam` now returns `null` for a missing `?view=` and `defaultView(counts)`
  picks `review` when something waits and nothing is approved, else `approved`; a
  clicked segment is always written to the URL (`?view=approved` included) so a click
  beats the default, and a shared/bare link still resolves the same way for everyone.
  Doc sentence updated. Verified on the live app (`:3100` production build against
  `:8100`): bare URL → "To review 11" pressed, 11 pending cards, 5.5 s cold on the remote
  DB; click Approved → `?view=approved`, 0 cards. `competitors.test.ts` 6 passed
  (`defaultView` pinned), `npm test` 159 files / 1,823, tsc clean, lint 0 errors,
  `npm run build` exit 0.
