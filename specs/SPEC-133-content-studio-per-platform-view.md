# SPEC-133 — Content Studio: per-platform generation view (Instagram + Facebook)

## Context / Why

Content Studio (SPEC-110 → SPEC-123 → SPEC-130) generated a single caption/creative per
product with no sense of *where* it lands. The backend now serves a real per-platform
generation contract (camelCase): one `POST /social/generate` call returns a persisted
`in_review` draft **per requested channel**, and `PATCH /social/posts/{id}` persists an
edited caption. This spec rebuilds the **generation experience** in the Content Studio tab
into a per-platform view — Instagram + Facebook only — with live native-style preview
cards, inline editable captions with per-platform character counters, angle switching, and
per-platform image generation.

**In scope:** the generation experience inside `StudioWorkspace` only.
**Out of scope (unchanged):** the best-seller **Product Picker** (kept exactly as-is), the
Overview / Calendar / Approvals / Performance tabs, and the product-selection contract.

Conforms to root Rule 8 (backend generates the creative/metrics; the UI only displays and
edits copy), Rule 9 (semantic tokens only — platform identity is conveyed with neutral
Lucide glyphs + `card`/`muted`/`border`/`foreground` chrome, **never** cloned brand colors;
the Facebook CTA uses `--primary`, never `--brand`), and Rule 6 (no fabricated metrics — the
native-preview "likes / View all comments" chrome is clearly non-numeric affordance, not
invented engagement data).

## Backend contract (authoritative, camelCase)

- `POST /social/generate` — request `{ productId: number, channels?: ("instagram"|"facebook")[] }`
  (subset allowed; omit → both). Response:
  ```
  { posts: [ { postId: string, channel: "instagram"|"facebook",
    creative: { persona, pillar,
      frames: [{ format:"feed"|"story"|"square", headline }],
      captionVariants: [{ id, angle, body }],
      hashtags: string[] } } ] }
  ```
  Persists one `in_review` post per requested channel (so generating already routes them to
  Approvals).
- `PATCH /social/posts/{id}` — request `{ caption: string, hashtags?: string[] }` →
  `{ postId, channel, caption, creative }`. Errors: 422 `social_caption_invalid`,
  404 `social_post_not_found`, 409 `social_post_not_editable` — surfaced verbatim via the
  proxy's `{error:{message}}` envelope.
- Images: `generatePostImage(postId)` (existing) — backend sizes IG=portrait, FB=landscape;
  served via `postImageUrl(postId, version)`.

## Scope of changes

### `types/social.ts` (additive)
- `GeneratedPost { postId: string; channel: string; creative: ProductCreative }`
  (`channel` free-form string, coerced for display like `CalendarPost.channel`).
- `GenerateResult { posts: GeneratedPost[] }`.

### `services/social-actions.ts`
- `generateSocialPost(productId: string, channels: string[]): Promise<GenerateResult>` —
  now sends camelCase `{ productId: Number(productId), channels }` and returns the `posts`
  array. (Breaking signature change; sole caller is `content-studio-tab.tsx`, migrated here.)
- `updatePostCaption(postId, caption, hashtags?)` — new `PATCH /social/posts/{id}` client
  action; surfaces the 422/404/409 messages through the shared error envelope.
- `generatePostImage` / `postImageUrl` unchanged.

### `lib/social-studio.ts` (new — pure, unit-tested)
- `ChannelSelection = "instagram" | "facebook" | "both"`; `StudioChannel = "instagram" | "facebook"`.
- `channelsForSelection(selection): StudioChannel[]` — `"both"` → both, else the single channel.
- `CAPTION_LIMITS` + `captionLimit(channel)` — Instagram 2,200 (soft), Facebook 63,206.
- `captionCount(channel, text): { count; limit; remaining; over }` — code-point (emoji-safe) count.
- `captionSaveBlocked(text)` — true only when empty/whitespace (over-limit is a *gentle*
  warning, not a hard block — the backend is the authority and its 422 is surfaced).
- `sortStudioPosts(posts)` — stable order Instagram → Facebook for side-by-side layout.
- `findVariant(creative, id)` — active caption variant lookup with first-variant fallback.

### `features/social/content-studio-tab.tsx` (rebuilt `StudioWorkspace`; `ProductPicker` + `ContentStudioTab` untouched)
- **Channel selector** — segmented control **Instagram · Facebook · Both** (default Both),
  `role="radiogroup"`, drives `channelsForSelection`.
- **Generate** → one draft per selected platform; `generating` shows skeleton preview
  cards; error shows a `role="alert"` line; `Regenerate` re-runs for the current selection.
- **Native-style preview cards**, side by side (stack < `lg`), one per returned post:
  - **Instagram** (`InstagramPreview`): avatar + handle row, portrait image frame,
    like/comment/share + save icon row (outline Lucide), caption (`handle` + text) with
    inline hashtags, "View all comments" affordance.
  - **Facebook** (`FacebookPreview`): page header (avatar + name + "Sponsored" + globe),
    caption **above** a landscape image, a "Shop now" CTA button (`--primary`),
    Like/Comment/Share bar.
  - Image via `postImageUrl(postId, version)`, falling back to the product photo before an
    image is generated.
- **Inline editable caption** — click "Edit" → textarea seeded from the shown caption, with
  a per-platform character counter (`captionCount`) and a `text-warning` over-limit state;
  Save → `updatePostCaption` (persists, adopts the returned caption/creative, shows a
  "Saved" state); Cancel reverts; errors in a `role="alert"` line.
- **Angle switcher** — chips over the returned `captionVariants`; switching sets the shown
  caption to that variant's body (the edited text is what Save persists).
- **Per-card Regenerate image** — `generatePostImage(postId)` at the platform's aspect;
  loading/failed reasons surfaced (existing `IMAGE_REASONS` map).
- **Grounded chips** — persona · pillar · why-this-product reason (`ReasonChip`).
- **"Saved to Approvals — review to schedule"** indicator with a link to `/social?tab=approvals`.
- Full loading / empty / error states; tokens only; keyboard-accessible; both themes; no
  entrance animations / no framer-motion.

## Tests (Vitest, node env) — `tests/social-studio.test.ts`
- `channelsForSelection` maps instagram/facebook/both → the right requested channels.
- `captionLimit` / `captionCount`: correct per-platform limits, remaining math, emoji-safe
  code-point counting, and the `over` flag boundary (== limit not over; +1 over).
- `captionSaveBlocked`: blocks empty/whitespace, allows normal + over-limit text.
- `sortStudioPosts`: Instagram before Facebook regardless of input order; stable.
- `findVariant`: returns the matching variant; falls back to the first for unknown/empty id.

## Manual verification checklist (no component runner)
1. Content Studio → pick a product → **Both** → Generate: two native cards (IG portrait, FB
   landscape) render side by side; stack on mobile.
2. Instagram-only / Facebook-only selections generate exactly one card.
3. Native chrome reads right in each feed (IG action row + caption/handle + View comments;
   FB caption-above-image + Shop-now CTA + Like/Comment/Share).
4. Angle chips switch the shown caption; Edit → counter updates live; over the IG 2,200
   limit shows the gentle warning; Save persists (reload/tab-switch keeps it); Cancel reverts.
5. Empty caption blocks Save; forcing a backend 422/404/409 surfaces the message in the alert row.
6. Per-card Regenerate image swaps the platform-aspect image; missing-key/no-photo reasons show.
7. "Saved to Approvals" link opens the Approvals tab with the new `in_review` drafts present.
8. Keyboard: segmented control, chips, Edit/Save/Cancel, Regenerate all reachable + operable.
9. Both light and dark themes: no hardcoded colors, brand red only as identity (never CTA/status).
10. No element animates into view on load/switch.

## Acceptance Criteria — verification (done / partial / not done)
- [x] `generateSocialPost(productId, channels)` sends camelCase + returns `GenerateResult`; `updatePostCaption` added. — **done**
- [x] `lib/social-studio.ts` pure helpers added and unit-tested. — **done** (`tests/social-studio.test.ts`, 15 cases)
- [x] Channel selector (IG · FB · Both, default Both) drives generation. — **done**
- [x] One native-style preview card per selected platform, side by side, correct per-feed chrome + aspect. — **done**
- [x] Inline editable caption with per-platform counter + over-limit warning; Save persists via PATCH; Cancel reverts. — **done**
- [x] Angle switcher, Regenerate, per-card Regenerate image all work; grounded chips + Approvals link present. — **done**
- [x] Loading / empty / error states; tokens only; both themes; keyboard-accessible; no entrance animations. — **done** (code-level; UI confirmed via the manual checklist above, no component runner exists)
- [x] `npm run lint` (0 errors), `npx tsc --noEmit`, `npm test` (516 passing), `npm run build` all green. — **done**

## Patches

- **2026-08-17 — neutral platform glyphs.** The installed `lucide-react` ships no brand
  icons (`Instagram`/`Facebook` are not exported), and Rule 9 bars brand colors anyway.
  Followed the repo's established convention (`social-pills.tsx`): `Camera` stands in for
  Instagram, `ThumbsUp` for Facebook, across the channel selector, the per-card platform
  label, and the native-card avatars.

## Patches

- **2026-08-17 — generate-card UI enhancement.** The pre-generation card was
  plain (name + price + toggle + a paragraph) with no product visual. Enhanced:
  (1) card header now leads with a **product image thumbnail** + name + reason chip
  + a highlighted **"why now" insight pill** (the real `reasonDetail`, e.g. "9× vs
  last week"); (2) the empty state is now a **"What you'll get" ghost preview** —
  dashed placeholder cards per selected channel showing the real product image in
  the platform's native frame ratio (IG 4:5 / FB 1.91:1) + skeleton caption/hashtag
  lines, so the pre-generate state anticipates the output instead of being a text
  block. New `GhostPreview` component; tokens only, both themes, no entrance
  animation. tsc/lint clean, 542 tests pass, build ✓.

- **2026-08-17 — regenerate-overwrite wiring (backend SPEC-136).** Generate no
  longer spawns duplicate drafts — it overwrites the single editable draft per
  (product, channel), preserving its image. Frontend: `GeneratedPost` now carries
  `hasImage`; `StudioWorkspace.generate()` seeds the draft's image state from the
  server flag instead of hardcoding `false`, so a preserved editorial image shows
  immediately after a caption regenerate. tsc/lint/build clean, 542 tests pass.
