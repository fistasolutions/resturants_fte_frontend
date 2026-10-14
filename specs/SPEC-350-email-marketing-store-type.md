# SPEC-350 — Email Marketing screens follow the store's trade and the new send checks

**Status:** implemented 2026-10-07 · **Repo:** frontend · **Backend:** SPEC-360
(`SPEC-360-email-marketing-fully-saas.md`) · **Builds on:** the Email Marketing Manager screens

## What FOC sees after this change

Unchanged: an apparel store receives today's labels and texts from the backend.

## What changes

- **The advice block** in the builder (`block-editor.tsx`): its label and starter text come from
  the backend's `content.adviceBlock` (apparel "Size advice", general "Product advice"); the static
  "Size advice" / "Find your size" text is only the fallback while content loads.
- **The guardrail mirror** (`lib/email-marketing.ts` `guardrailChecks`) matches the backend's
  `rules.evaluate`:
  - the protected-groups pass reason is built from the store's protective segment names;
  - the test-send check blocks with "Edited since the last test — send a new test." when the last
    test is for an older version;
  - a Klaviyo-list send blocks when a chosen list is past the weekly cap, and warns that it has no
    holdout.
- Types gain the optional fields; an older backend without them behaves as before.

## Acceptance criteria

1. The block editor shows the backend's label and starter text for the advice block.
2. `guardrailChecks` produces the same keys, statuses and reasons as the backend for the new cases.
3. `npm test`, `npx tsc --noEmit`, lint on touched files, `npm run build` green.

## Verification (2026-10-07)

| # | Criterion | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Advice block from the backend | done | `lib/email-blocks.ts` (`blockLabel`, `newBlock`), wired in `block-editor.tsx`, the content tab and the builder's content step; `tests/email-marketing-store-type.test.ts` |
| 2 | Mirror matches the backend | done | same file — protected phrase (today's text for clothing), stale test, per-list cap, no-holdout warn |
| 3 | test / tsc / lint / build | done | `npm test` **2,454 passed**; `npx tsc --noEmit` clean; ESLint clean on every touched file; `npm run build` compiled |

In-app docs (Rule 11): `lib/docs/content/email-marketing.ts` — store type, version-bound tests, list sends, honest flow approvals; `tests/docs.test.ts` 44/44.
