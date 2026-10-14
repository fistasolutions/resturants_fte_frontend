# SPEC-368 — Email Marketing screens for the per-person brain

**Status:** implemented 2026-10-09 · **Repo:** frontend · **Backend:**
`SPEC-378-email-brain-per-person.md`

## What FOC sees after this change

Unchanged. FOC has not connected this employee. The new options are opt-in.

## Contract (backend SPEC-378)

- **Two new segments** arrive through the existing audiences payload: `slipping` and
  `second-order-due`, each with its name and description. No client change is needed beyond
  showing them; check that no client list of segment keys hides them.
- **Strategy kind `best_time`**: `{ kind: "best_time", date: "YYYY-MM-DD" }`.
- **`GET …/campaigns/{id}/checks`** adds:
  - `bestTime: { hour: number, basis: "audience" | "store", customers: number } | null`;
  - `picks: { productId: number, title: string, customers: number }[]`.
- **Block kind `picked_for_you`**: `{ id, kind: "picked_for_you", title, body, productIds: [fallbackId] }`.
  The fallback product is required.

## Changes

1. **Builder → When.** A "Best time for this audience" choice (with a date):
   - it reads "Each customer at 7 pm their time — when most of this audience orders (from 1,240
     customers)", or "…when your store gets most orders" for the `store` basis;
   - it is disabled with the backend's reason when `bestTime` is null;
   - the strategy label (`strategyLabel`) names it.
   Pure formatting goes in `lib/` with tests.
2. **Blocks.** A "Picked for you" block in the block editor:
   - a title, a body and a required fallback product, chosen with the existing product picker;
   - the preview shows the fallback product with a "Each customer sees their own pick" note;
   - `lib/email-blocks.ts` gets its label and `newBlock` default.
3. **Review.** The pre-send panel shows "What customers will be shown" from `checks.picks` (the
   top five, with customer counts) when the campaign has a `picked_for_you` block.
4. **Audiences** show the two new segments with their descriptions (no special casing).
5. **Docs (Rule 11)**, `lib/docs/content/email-marketing.ts`:
   - the two segments;
   - "Best time for this audience";
   - "Picked for you": the pick rules (bought together, in stock, above your margin floor; a
     fallback otherwise; tests show the fallback).
   Bump `updated`.
6. **Rule 13.** No new write function: these ride the existing save, review and approve.
   `tests/role-gate-coverage.test.ts` stays green.

## Acceptance criteria

1. `best_time` is selectable when `bestTime` exists, disabled with a reason otherwise, and
   labelled correctly; unit tests cover the wording.
2. The Picked-for-you block can be added and saved with its fallback, and previews the fallback.
3. The review shows the top picks when the block is present.
4. The new segments show in Audiences and in the audience picker.
5. Docs updated; `npm test`, `npx tsc --noEmit`, lint on touched files and `npm run build` green.

## Verification (2026-10-09)

| # | Criterion | Status | Evidence |
| --- | --- | --- | --- |
| 1 | `best_time` choice | done | `features/email-marketing/campaigns/builder/step-schedule.tsx` over the pure `lib/email-brain.ts`; `strategyLabel` names it; `tests/email-brain.test.ts` (13 tests: audience/store wording, disabled reason, label) |
| 2 | Picked-for-you block | done | `lib/email-blocks.ts` (label, `newBlock`), `block-editor.tsx` (title, body, required fallback through the product picker), `email-preview.tsx` (fallback with "Each customer sees their own pick; this is the fallback.") |
| 3 | Review shows the top picks | done | `pre-send-panel.tsx` "What customers will be shown" from `checks.picks` |
| 4 | New segments shown | done | no client list hides them; Audiences and the picker show every non-protective segment the backend sends |
| 5 | Docs, test, tsc, lint, build | done | `lib/docs/content/email-marketing.ts`; `npm test` **2,595 passed**; `npx tsc --noEmit` clean; `npm run lint` 0 errors (3 old warnings); `npm run build` compiled |

Notes:
- The builder now saves the draft on reaching the schedule step (with `email_marketing.manage`,
  through the existing save), so the audience's best hour can be read from the saved campaign. A
  draft abandoned there stays in the Campaigns list.
- With `bestTime` null on a best-time send, approval is disabled with the backend's reason.
- The Plan labels the new `rhythm` reason "Reorder rhythm".
- `ProductPicker` ids are now unique per picker, so two pickers on one page don't tick each
  other.
