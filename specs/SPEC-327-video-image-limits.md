# SPEC-327 — Your package's videos and images: the meters and the limit message

**Repo:** frontend · **Status:** in progress · **Date:** 2026-09-30
**Backend:** SPEC-335 (the limits, enforced; `media` on `GET /billing/ai-allowance`;
`media_limit_reached`).

## Why

The package now limits videos and images a month (backend SPEC-335). A customer must see where
they stand before they hit the limit, and a clear sentence when they do — not "Image generation
failed — try again", which would send them retrying something that cannot work.

## What changes

1. **Settings → Organization → Billing & plan gains "Videos & images this month"**, beside the AI
   allowance. One row each: used, of how many (the package's limit plus any extra the platform
   granted, named "+N extra this month"), a bar (amber at 80 %, red at 100 %), and the reset date.
   A kind with no limit on the package reads "No limit on your package". When the platform
   carries the organization's AI (unmetered) the panel says nothing is counted. The panel is hidden
   when the backend sends no `media` (an older backend, or no store yet).
2. **Image generation says why it didn't happen.** When the backend returns a reason with a
   `detail` (the package limit, or the AI allowance), that sentence is shown as it is, on the post
   detail and on the Studio's shared-image action. `IMAGE_REASONS` gains `media_limit_reached` and
   `ai_allowance_exhausted` for when no detail is sent.
3. **Video** already shows the backend's message when a start is refused; unchanged.
4. **In-app docs** (root Rule 11): the Settings doc's Billing section describes the new meters.

Pure logic in `lib/`: `toMedia` (`lib/billing-settings.ts`) and `imageFailure`
(`lib/social-post.ts`), both unit-tested.

## Acceptance criteria

- [ ] Billing shows the videos and images meters with used, allowance, extra granted and reset date;
      "No limit on your package" for a kind without one; hidden when `media` is absent.
- [ ] A refused image shows the backend's sentence; a generic failure keeps the old text.
- [ ] The Settings doc describes the meters; `updated` bumped.
- [ ] `npm test`, `npx tsc --noEmit` and `npm run build` pass.
