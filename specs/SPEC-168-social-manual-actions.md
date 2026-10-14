# SPEC-168 — Social Growth manual actions (download, copy, upload, mark as posted)

## Context / Why

The Social Growth post detail (SPEC-138 / SPEC-140) lets the owner pick an angle, edit
the caption, refine it with AI, and art-direct an image — and then offers no way to
**use** any of it. There is no download, no copy-caption, no way to supply his own
photo, and no way to say "I posted this." The one clipboard action in the whole feature
copies the UTM link (`schedule-popover.tsx`), not the caption.

This is the frontend half of Milestone 1 (backend `SPEC-175`), built so the owner can
run the posting routine **by hand** while the Meta publishing path is engineered. Per
the owner's 2026-08-27 decision, the engineering is completed in-code first; this slice
is the part that is useful on day one and depends on nothing external.

## Scope

### Types — `types/social.ts`

`PostDetail` gains, matching the live contract exactly (additive, no rename):

```ts
/** Public URL of the live post once published, else null. */
permalink: string | null;
/** ISO-8601 timestamp the post went live, else null. */
publishedAt: string | null;
/** True when the owner posted it by hand (SPEC-175) rather than via the API. */
postedManually: boolean;
```

### Testable logic — `lib/social-manual.ts` (new)

Per the repo's testing constraint (no jsdom/component runner — `vitest.config.ts` pins
`environment: "node"`), all branching logic lives in `lib/` so Vitest covers it and the
component stays presentational:

- `validateUploadFile(file)` — mirrors the backend's boundary rules client-side for an
  instant error instead of a round trip: allowed types `image/png|jpeg|webp`, max
  10 MB. Returns `{ ok: true } | { ok: false, message }` with a human message
  ("That file is 14.2 MB — the limit is 10 MB."). The backend re-validates regardless;
  this is UX, never trust.
- `normalizePermalink(value)` — trims, returns `null` for empty, and rejects anything
  that isn't a parseable `http`/`https` URL, so the 422 is avoided before it happens.
- `publishedLabel(publishedAt)` — "Posted 20 Aug 2026", or null.
- `canMarkPosted(status)` / `canUnmarkPosted(status, postedManually)` — the two
  visibility gates, mirroring the backend's 409s so a control is never offered for an
  action the API will refuse.

`downloadImageUrl(postId, version)` stays in `services/social-actions.ts` beside the
existing `postImageUrl` it extends — it needs that module's `base` const, and a string
concat carries no rule worth a test. The *rules* live in `lib/` where Vitest reaches them.

### Post detail — `features/social/post-detail.tsx`

Four additions, all inside the existing panel structure, all shadcn (root Rule 9), no
new layout and **no entrance animation**:

1. **Copy caption** — an outline `Button` beside `Refine` in the Caption panel. Copies
   the *active* caption variant plus the hashtag line (what actually gets pasted into
   Instagram), via `navigator.clipboard` with the same try/catch the schedule popover
   uses — clipboard is unavailable in insecure contexts, and a thrown promise must not
   break the page. Shows a 2s "Copied" state, then reverts.
2. **Download image** — an anchor styled as an outline `Button` (`asChild`), `download`
   attribute, pointing at `downloadImageUrl(...)`. Same-origin through `/api/proxy`, so
   the httpOnly bearer is injected server-side and the browser saves the file directly —
   no blob juggling, and it works on mobile Safari. Rendered only when an image exists.
3. **Upload your own** — a hidden `<input type="file" accept="image/png,image/jpeg,
   image/webp">` driven by an outline `Button`. On pick: `validateUploadFile` →
   `uploadPostImage` → bump the image `version` so the `<img>` refetches. Disabled while
   uploading, with a spinner and an inline `role="alert"` on failure, matching the
   existing image-generation states exactly.
4. **Mark as posted** — a primary `Button` shown only when `status` is `approved` or
   `scheduled`. Opens a small shadcn `Dialog`: one optional "Link to the post" input
   (validated by `normalizePermalink`) and a Confirm. On success the status chip flips
   to **Published**, `publishedLabel` renders beneath it, and — when a permalink was
   given — a **View post** link (`target="_blank" rel="noopener noreferrer"`) appears.
   A published post that was posted manually also shows a quiet ghost **Un-mark**
   action; an API-published post (`postedManually: false`, arriving with SPEC-179) does
   not, matching the backend guard.

Existing Approve / Request changes / Refine / Regenerate behaviour is untouched.

### Actions — `services/social-actions.ts`

Additive; the JSON `send`/`post` helpers are reused for everything except the upload,
which needs `multipart/form-data` (the shared `send` hardcodes a JSON content type, and
letting the browser set the multipart boundary is required):

- `uploadPostImage(postId, file)` → `PUT /social/posts/{id}/image`, `FormData`, **no**
  explicit `Content-Type`. Same error-envelope unwrapping as `send`.
- `markPostPosted(postId, permalink)` → `POST /social/posts/{id}/mark-posted`.
- `unmarkPostPosted(postId)` → `POST /social/posts/{id}/unmark-posted`.

### Status chip

`PostStatusChip` learns `published` — neutral/positive token styling, **never** the
brand red (root Rule 9: `--brand` is identity-only). Semantic tokens throughout; no
hardcoded colors.

## Accessibility & states (root Rule 6)

Every control is keyboard reachable with a visible focus ring and an `aria-label` where
the icon carries the meaning. The file input is labelled and triggered by a real button,
never a bare icon. Copy/upload/mark each have explicit idle, pending, success, and error
states — the error is an `role="alert"` string from the backend envelope, never a
swallowed failure. The dialog traps focus and closes on Escape (shadcn default).

## Performance (root Rule 5)

No new page-load fetches — every action is user-initiated. The download is a direct
browser GET (no JS buffering the bytes). After an upload, only the image `version`
changes, so the `<img>` refetches and the post payload is **not** re-fetched. Mark/
un-mark update local state from the response rather than re-loading the detail.

## Tests (root Rule 4)

**Vitest** — `tests/social-manual.test.ts`, covering `lib/social-manual.ts`:
`downloadImageUrl` shape and `v` passthrough; `validateUploadFile` accepts each allowed
type, rejects `image/gif` and `application/pdf`, rejects >10 MB with the size in the
message, accepts exactly 10 MB; `normalizePermalink` trims, nulls empty, accepts
`http`/`https`, rejects `javascript:`, `ftp://`, and bare text; `publishedLabel`
formats and returns null for null.

**Manual verification checklist** (no component runner exists — same convention as every
other UI spec here):

- [ ] Copy caption puts the active variant **and** hashtags on the clipboard; the button
      shows "Copied" for ~2s.
- [ ] Switching angle then copying copies the **newly** selected variant.
- [ ] Download saves a `post-<product>-<channel>-<id>.png`, not `image.png`.
- [ ] Download after a regenerate saves the **new** image, not a cached one.
- [ ] Uploading a phone photo replaces the AI image in place; Regenerate afterwards still works.
- [ ] A >10 MB file is rejected instantly with a readable message and no request fired.
- [ ] Mark as posted flips the chip to Published and renders View post when a link was given.
- [ ] Un-mark returns the post to Approved (or Scheduled when it had a date).
- [ ] Mark as posted is absent on an `in_review` post.
- [ ] Keyboard-only: every control reachable, focus visible, dialog escapable.
- [ ] Verified in **both** light and dark themes.
- [ ] No entrance animation anywhere in the panel (root Rule 9).

`npm test` and `npm run build` green (root Rule 7), output pasted in the summary.

## Out of scope

Publishing to Meta, the Publish button, scheduling times, live insights, carousels,
video — frontend SPEC-169 → SPEC-173.

## Acceptance Criteria

- [ ] Copy caption copies active variant + hashtags, with a clipboard-unavailable fallback.
- [ ] Download image saves a product-named PNG via the proxy, cache-bust respected.
- [ ] Upload accepts PNG/JPEG/WebP ≤10 MB, validates before sending, replaces in place.
- [ ] Mark as posted / Un-mark work and are correctly gated by status and `postedManually`.
- [ ] `PostDetail` carries `permalink` / `publishedAt` / `postedManually`; no field renamed.
- [ ] Logic lives in `lib/social-manual.ts` and is Vitest-covered; component stays presentational.
- [ ] Semantic tokens only; brand red unused; no Framer Motion; no entrance animation.
- [ ] `npm test` + `npm run build` green; manual checklist completed in both themes.
