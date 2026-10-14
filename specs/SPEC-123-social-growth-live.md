# SPEC-123 — Social Growth: swap the mock seam to the live FTE

## Context / Why

Social Growth shipped frontend-only on mock (SPEC-110). Backend SPEC-127 now serves the
real Plan → Create → Approve engine. This swaps the data seam to live and wires the
Content Studio "Create" flow to real, on-demand, Brand-Brain-grounded generation.

## Scope
- **`services/social.ts`:** `getSocialOverview`, `getContentStudio`, `getSocialApprovals`
  now hit `serverApi` (backend returns the exact camelCase `types/social.ts` shapes — no
  adapter). `getSocialCalendar` + `getSocialPerformance` stay on mock (Publish/Measure need
  social APIs the platform doesn't have — honest coming-soon).
- **`services/social-actions.ts`** (new): client mutations via the proxy —
  `generateSocialPost(productId, channel)`, `approveSocialPost`, `requestChangesSocialPost`.
- **Content Studio (`content-studio-tab.tsx`):** products arrive with empty creative;
  each shows a **Generate content** CTA → real generation renders caption variants +
  hashtags + per-format headlines; **Regenerate** re-runs; loading/error states; empty
  catalog + empty creative guarded.
- **Approvals (`approvals-tab.tsx`):** Approve / Request changes call the real actions;
  `ApprovalsData.featured` is now nullable with an empty state; honest approved copy (no
  fake "scheduled to publish").
- **Types:** `ApprovalsData.featured: PendingPost | null`.

## Tests / verification
Existing Vitest social suite updated for the nullable `featured`; `tsc`/`lint`/`npm test`/
`npm run build` green. Manual: Content Studio generate produces real captions; Approvals
approve persists; Overview shows the live "post this next".

## Acceptance Criteria
- [ ] Overview / Content Studio / Approvals bind to live backend; Calendar/Performance mock.
- [ ] Content Studio generates + approves real, Brand-Brain-grounded posts end to end.
- [ ] `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` green.

## Patches

- **2026-08-13 — editorial image head-crop fix.** The generated editorial image is
  2:3 portrait; Feed (4:5) and Square (1:1) frames are wider, so `CreativePreview`'s
  default center `object-cover` crop was slicing the top of the model's head off.
  Switched the frame image to `object-cover object-top` so the vertical crop for the
  wider formats is anchored at the top and the head always survives (no effect on
  Story 9:16, which crops the sides). Paired with backend SPEC-128's prompt change
  that reserves croppable negative space at the bottom and keeps the head + garment in
  the top ~60% of the frame. Client-reported.

- **2026-08-13 — generated image vanished on tab switch.** Content Studio tabs navigate
  via `?tab=` (client navigation); after generating an image the component only bumped
  local `imgVersion`, and Next's client Router Cache kept serving the pre-generation
  RSC (`hasImage=false`, `postId` unchanged), so returning to the tab remounted
  `StudioWorkspace` from stale props and the frame fell back to the raw product photo
  (button reset to "Generate image"). Fix: `StudioWorkspace` now calls
  `router.refresh()` after a successful **Generate content** and **Generate image**, so
  the cache is invalidated and `hasImage`/`postId` are re-pulled — the saved image
  survives tab switches. Paired with backend `Cache-Control: no-store` on the image
  response (SPEC-128) so a regenerate is never masked by a browser-cached PNG.
  Client-reported.

- **2026-08-13 — product-aware, varied image scenes (backend SPEC-130).** Every
  regenerate used to look the same and wasn't chosen for the product. The backend now
  runs an "art director" agent first that picks a scene per product and diverges from
  recent regenerations. Frontend: `SocialProduct` gained `imageConcept: string | null`;
  `generatePostImage` returns `{generated, reason?, concept?}`; `StudioWorkspace` shows
  a small "Scene: {concept}" label by the Creative header (from the POST response, and
  from `imageConcept` on reload) so it's visible each generation produced a distinct,
  relevant scene. Mock products gained `imageConcept: null`. Client-reported.
