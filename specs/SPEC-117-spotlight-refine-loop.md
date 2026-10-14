# SPEC-117 — Spotlight refine loop: editable prompt + streaming regenerate + writing UI

**Status:** frontend slice of backend SPEC-113. Extends frontend SPEC-109/SPEC-115
(Spotlight blog drafts, streamed generation, real blog images).

## Why

"Request changes" on a blog draft should let the owner **refine the brief and watch the
writer rewrite live**, not just bounce the draft to `changes_requested`. This is the
human-in-the-loop heart of Spotlight. The star of the slice is the **writing loader** —
the article area turns into a "someone is writing" animation while the agent works.

## Scope (frontend only; consumes backend SPEC-113)

1. **Type + adapter.** `BlogDraft` gains `prompt?: string | null`; `ApiBlogDraft` gains
   `prompt?: string | null`; `adaptBlogDraft` maps `prompt ?? null`.
2. **`regenerateDraftStream(id, prompt, onStatus)`** in `services/spotlight-actions.ts`:
   POST `/spotlight/drafts/{id}/regenerate` via `/api/proxy`, read the SSE stream exactly
   like `generateDraftStream` (fetch → `getReader()` → `TextDecoder` → split on `\n\n` →
   strip `data: ` → `JSON.parse`). Fire `onStatus` per `status` frame; resolve the new
   draft id on `draft_id`; throw on an `error` frame, a non-OK response, or a stream that
   ends with no id.
3. **Request-changes → refine modal.** On the blog-detail page the "Request changes"
   button opens a shadcn `Dialog` with a `Textarea` **prefilled with the draft's current
   `prompt`**, helper text "Tell the writer what to change", and Cancel / **Regenerate**.
   `DraftDecision` takes an optional `onRequestChanges` callback — when provided its
   "Request changes" button invokes it instead of the status-bounce API (Approvals tab is
   untouched: it passes no callback and keeps the original behaviour).
4. **The writing loader** (`features/spotlight/blog-writing-loader.tsx`, CSS-only, no
   framer-motion): while regenerating, the article body area is replaced by an
   article-shaped skeleton (heading bar, a faux subhead, paragraph lines of varied
   widths) whose lines **shimmer/sweep** with a staggered CSS keyframe, the **live status
   phrase** shown prominently above it, and a blinking caret at the writing position.
   Respects `prefers-reduced-motion` (sweep + caret stop; a gentle skeleton pulse
   remains). Tokens only, verified in both themes.
5. **Flow.** `BlogDetail` becomes a client component owning `{regenerating, status}`. On
   Regenerate: close the modal, show the writing loader in the article area, call
   `regenerateDraftStream` feeding `status`; on the resolved id `router.refresh()` (inside
   a transition) and drop the loader once the fresh draft has painted. Errors surface in
   the modal and leave the draft intact.

## Tests

- Unit (`tests/spotlight-regenerate.test.ts`, node env, mocked `fetch` SSE — mirrors
  `tests/chat-service.test.ts`): `regenerateDraftStream` fires `onStatus` per frame,
  resolves the `draft_id`, throws on an `error` frame, throws on a stream with no id, and
  POSTs the prompt in the body.
- Adapter (`tests/spotlight-adapter.test.ts`): `adaptBlogDraft` maps `prompt` and defaults
  it to `null` when absent.
- `npm run build` → `npx tsc --noEmit` → `npm run lint` → `npm test` all green.

## Manual verification checklist (no jsdom runner)

- [ ] Blog-detail "Request changes" opens a modal prefilled with the draft's prompt.
- [ ] Regenerate closes the modal and the article body becomes the writing loader with a
      live status phrase; on completion the refreshed draft renders and the loader clears.
- [ ] Loader shimmer + caret animate; with reduced motion they stop and a static pulse
      remains. Correct in light and dark.
- [ ] Approvals tab "Request changes" still bounces to `changes_requested` (unchanged).

## Acceptance criteria

- [ ] `prompt` on `BlogDraft` + adapter mapping (defaults null).
- [ ] `regenerateDraftStream` reads the SSE stream and resolves the id.
- [ ] Refine modal prefilled; Regenerate streams live into the writing loader.
- [ ] CSS-only writing loader with live status; reduced-motion safe; both themes.
- [ ] All green; isolated to the Spotlight blog feature.

## Patches

### 2026-09-12 — a rewrite that retitles no longer 404s its own page

Regenerating a draft can change its title, and the slug follows the title. The refine
flow then called `router.refresh()`, which re-fetched the page's **old** slug — and the
draft's own successful rewrite ended in *"This draft doesn't exist or has been
removed."* Observed live: round 1, SEO 98 · AEO 92 · GEO 97 · Quality 87, targets met,
then a 404.

The stream already returns the draft id. The flow now `router.replace`s to
`/spotlight/draft/{id}` — the same thing the new-draft surface does — so the backend
resolves the draft whatever it is now called (SPEC-165), the address bar lands on the
current draft silently, and Back never returns to a dead URL.
