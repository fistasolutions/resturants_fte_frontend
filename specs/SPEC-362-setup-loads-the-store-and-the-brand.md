# SPEC-362 — Setup loads the store and the brand, live (Phase 5, frontend)

**Status:** implemented 2026-10-09 · **Repo:** frontend · **Phase 5 of 6** · **Backend:** SPEC-370
(lean bootstrap and `detail`); the Brand Brain run is backend SPEC-347's · **Builds on:** SPEC-314
(first-sync gate and provider), SPEC-341 (Brand Research provider and toast), SPEC-360/361
(Setup), root Rules 9, 12 and 13

## Why

Owner (2026-10-09):

- A new company's first sync should be **the first thing in Setup**, step by step, saying what each
  step is doing.
- When the sync completes, **the Brand Brain research should show in the same place**, with what it
  is working on live. When it finishes, Setup should **say so and offer a Review button**.
- One checklist at the top right for everything: the store, the brand, then the apps.

Today, guided companies have three separate things at the top right: a first-sync toast, a
research toast and Setup.

## What changes

### 1. Setup has three sections, one progress bar

| Section | Shown | Lines |
| --- | --- | --- |
| **Your store** | while the first sync runs or has failed, and once finished in this session | One line per bootstrap step (5, backend SPEC-370): done, running or waiting, or failed. |
| **Your brand** | while the store loads (waiting: "Starts when your store has loaded"), while research runs, and after it ends until reviewed | One line: running, ready to review, or failed. |
| **Your apps** | as SPEC-360/361 | Each integration step. |

**The running store step names what it is doing,** from backend `detail`:

- "Loading orders · Customers 1,240 ✓";
- "Predicting stock-outs";
- a failed resource reads "Products failed".

Labels for every resource and job are in `lib/setup-sections.ts`.

**A failed store sync** shows the backend's reason and a **Try again** button, which uses the first
sync's own retry (SPEC-314; any member).

**The brand line, from the Brand Research run** (`useBrandResearch`, already live over SSE):

- **While running:** the step it is on and what it is reading, with its % as a bar.
- **When finished:** "Your brand is ready to review", with what it found and a **Review** button
  to the research review. Opening it marks the run seen through the provider (SPEC-341, gated on
  `brand_brain.manage`), and the line goes.
- **Finished with nothing found:** the line just says so.
- **Failed:** the reason, plus Review when it found anything.

**The bar:** `n of m` counts done lines across all three sections. Store steps are done when
finished, the brand line once reviewed, and apps once synced (SPEC-361). The checklist goes away
when nothing is left.

### 2. It opens by itself for the milestones, not every tick

Setup opens on the first render after the store connects while its sync runs, on the sync
finishing or failing, on the research finishing, and on SPEC-361's app events. A step moving from
"inventory" to "enrich" updates the open list without reopening a list the person closed.

### 3. One place, not three

For a **guided** organization the first-sync toast (SPEC-314) and the research toast (SPEC-341)
are not drawn: Setup carries both. The research toast's role gate (`RoleGate` around Try again)
stays as it is for everyone who still sees it. A **full** organization (FOC) keeps both toasts
exactly as today.

### 4. Pure halves

`lib/setup-sections.ts` holds:

- `storeSection` and `researchSection`, the lines with their states and words;
- `setupProgress`, the combined counts;
- `milestones`, the auto-open signature.

The bootstrap payload type gains `detail` (`lib/onboarding.ts`, `lib/first-sync.ts` `parseFrame`).

### 5. Docs (Rule 11)

The overview's convention covers Setup: the store's first sync and the brand research live there
for a new workspace.

## What FOC sees (Rule 12)

Unchanged. FOC is `full`: Setup is never drawn, and both toasts behave exactly as before. Its store
finished its first sync long ago, so the provider never follows one.

## Acceptance criteria

1. **A new guided store's Setup** shows "Your store" with five steps. The running one names what
   it is loading, with counts.
2. **The brand line waits** until the store has loaded, then shows the research live. When the
   research ends, Setup opens with "Your brand is ready to review" and **Review**. Review opens the
   review and the line goes.
3. **A failed first sync** shows its reason and Try again.
4. **No toast:** a guided organization sees neither the first-sync toast nor the research toast. A
   full organization sees both, as today.
5. **The bar counts** every section. Setup goes away when nothing is left.
6. **Checks:**
   - Vitest covers `lib/setup-sections.ts` and `parseFrame`'s `detail`.
   - The role-gate coverage test passes.
   - `npm test`, `npx tsc --noEmit` and `npm run build` pass on a clean copy.

## Verification (2026-10-09)

On a clean copy of the working tree:

| Criterion | Result |
| --- | --- |
| 1–5 | done. Pure halves are in `tests/setup-sections.test.ts`: the detail words, `parseFrame`'s `detail`, Your store, Your brand, the combined bar and the milestones. Auto-open on milestones is in `tests/setup-checklist.test.ts`. |
| 6 | done. `npx tsc --noEmit` clean · `npm test` 229 files, 2556 tests passed · `npm run build` compiled, 80/80 pages · the role-gate coverage test passed (no new write: retry and mark-seen go through their providers) |

**Performance (Rule 5).**

- **No new read.** Your store comes from the first-sync provider's existing SSE, and Your brand
  from the research provider's existing SSE.
- **Setup's own code** is 6.1 KB gzip (esbuild, with the libraries every page already loads left
  out), +2.2 KB over SPEC-361.

**Manual checklist.** On a new guided store, right after connecting Shopify:

1. Setup opens with Your store, step 1 of 5, reading "Loading orders · Customers N ✓". Your brand
   reads "Starts when your store has loaded".
2. The steps tick through and the store reads "Your store is loaded". The brand line goes live
   with its percentage and what it is reading.
3. When research ends, Setup opens with "Your brand is ready to review" and **Review**. Review
   opens the review tab and the line goes.
4. No first-sync or research toast appears for this organization. On FOC both toasts behave as
   before.
