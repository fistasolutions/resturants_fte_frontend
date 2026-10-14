# SPEC-115 — Spotlight: live agent status while writing + real blog images/links

**Status:** Frontend wiring for the Spotlight Slice 1.5 backend (streamed draft
generation + grounded product images/links). Frontend-only; isolated to the
Spotlight feature.
**Depends on:** SPEC-109 (Spotlight MVP frontend), backend Spotlight Slice 1.5.
**Caller reference:** the task labelled this "SPEC-110 (Spotlight Slice 1.5)", but
frontend `SPEC-110` is `social-growth-mvp-frontend` — this is filed at the next free
number (115) per root Rule 3 (never reuse a colliding number).

## What & why
The backend can now (a) **stream** the blog-writer agent's progress as SSE while it
writes a draft, and (b) return real store-product **images, handles and storefront
URLs** in each draft's grounding. This spec wires both into the existing Spotlight UI:
- **Live status** on the "Generate draft" action (mirrors the AI-chat SSE client
  pattern) instead of a static "Writing…".
- **Real product images + correct `/products/{handle}` links** on the blog detail
  (a hero image + a "Featured in this post" strip).

## Backend contract (already live)
- `POST /spotlight/drafts/stream` `{query_id}` | `{keyword}` → `text/event-stream`.
  Frames (SSE `data: <json>`): `{"status": "…"}` (several, in order:
  "Reading your Brand Brain…", "Pulling your best-sellers…", "Reviewing your
  categories…", "Writing the article…", "Scoring for SEO…"), then
  `{"draft_id": <id>}`, then `{"done": true}`. Errors → `{"error":…, "detail":…}`.
- `GET /spotlight/drafts/{id}` → `grounding.products[]` items now carry
  `{product_id, title, handle, image_url, url}` (`url` = full
  `https://…/products/{handle}`). The list is pre-cleaned by the backend: any product
  lacking a handle/image is omitted, so entries generally have all fields — the UI is
  still defensive (renders nothing broken if a field is absent).

## Scope (in)
1. **`types/spotlight.ts`** — extend `BlogDraftProduct` with `handle: string | null`,
   `imageUrl: string | null`, `url: string | null`.
2. **`lib/adapters.ts`** — map the new snake_case fields (`handle`, `image_url`, `url`)
   in `ApiBlogDraftGrounding.products` / `adaptGrounding`. Absent → `null` (never faked).
3. **`lib/spotlight.ts`** — add pure, unit-tested `shopifyImageUrl(url, width)` helper
   (adds Shopify CDN `width` query param; passes non-parseable URLs through) so the
   browser fetches right-sized images (Rule 5).
4. **`services/spotlight-actions.ts`** — add `generateDraftStream(input, onStatus)`:
   POSTs to `/spotlight/drafts/stream` through `/api/proxy`, reads the SSE stream with
   `fetch` + `response.body.getReader()` + `TextDecoder` (identical technique to
   `services/chat.ts` `getAssistantReply`), invokes `onStatus` per `status` frame,
   resolves the `draft_id`, throws on `error`/no-draft. No new dependencies.
5. **`features/spotlight/generate-draft-button.tsx`** — call `generateDraftStream`,
   show the live status phrase on the button (replacing static "Writing…"), navigate to
   `/spotlight/draft/{id}` on `draft_id`, show an inline error on failure.
6. **`features/spotlight/blog-detail.tsx`** — render a **hero image** (first grounding
   product with an image) in an aspect-ratio box, and a **"Featured in this post"** grid
   of the grounding products (image + title + link to the storefront `url`,
   `target="_blank" rel="noopener noreferrer"`). Empty-safe: hide both when there are no
   products/images.

## Scope (out)
- No changes to social/ads or Brand Brain wiring.
- No `next.config` change: `cdn.shopify.com` is already an allowlisted remote pattern;
  images use `next/image` with `unoptimized` exactly like `features/dashboard/top-products.tsx`.
- No new npm dependencies; no Framer Motion; tokens only.

## Design / compliance
- Semantic tokens only (`border-border`, `bg-muted`, `text-foreground`,
  `text-muted-foreground`, `text-primary`); `font-heading` for the section title;
  `rounded-card`/`rounded-lg` radius tokens. No hardcoded colors; `--brand` untouched.
- No entrance animations; only CSS hover transitions. Verified in light + dark.
- Images: `next/image` `fill` + `unoptimized` in a `relative` aspect box, `object-cover`,
  token border, `alt` text; lazy by default (hero uses `priority`).

## Acceptance criteria
1. Clicking "Generate draft" opens the SSE stream and the button text cycles through the
   backend status phrases, ending by navigating to the new draft's detail page.
2. A stream `error` frame (or non-OK response) shows a small inline error and re-enables
   the button.
3. `adaptBlogDraft` maps `handle`/`image_url`/`url` into `BlogDraftProduct`; absent
   fields become `null`.
4. `shopifyImageUrl` adds/overwrites the `width` param for a Shopify URL and returns a
   non-URL string unchanged. (unit-tested)
5. Blog detail shows a hero image from the first grounding product and a "Featured in
   this post" grid linking each product to its `/products/{handle}` storefront URL in a
   new tab; both hidden when grounding has no products.
6. `npm run build`, `npx tsc --noEmit`, `npm run lint`, `npm test` all green.

## Manual verification checklist (no jsdom runner)
- [ ] Generate a draft from the Inbound Engine → status phrases animate on the button →
      lands on `/spotlight/draft/{id}`.
- [ ] Draft detail shows a hero image and a Featured strip; product links open the
      correct storefront URL in a new tab.
- [ ] A draft whose grounding has no products renders with no hero/strip and no layout gaps.
- [ ] Both themes: images have a token border, text uses tokens, nothing animates in.

## Patches

### 2026-08-13 — Generation shows harness PROGRESS + reveals the final; refine keeps live typing
The 2026-08-12 patch below streamed the token body live on the first-generation
surface. Generation now runs the multi-round quality harness (backend SPEC-121):
it writes, critiques, and REWRITES the article up to 5 rounds. Streaming the
token body therefore showed the owner intermediate drafts that get discarded
between rounds — confusing. So the split is now:

- **Generate (`/spotlight/draft/new`, `blog-draft-streaming.tsx`) = progress + reveal.**
  The surface no longer renders a live `BlogStreamingBody`; it opens the SSE
  stream and consumes **only `onStatus`** (the `onDelta` body callback is passed
  `undefined`). It renders the taller `BlogWritingLoader` skeleton fronted by a
  new **`blog-generation-progress.tsx`** timeline: each distinct `{status}` frame
  becomes a step ("Researching the topic… → Writing the article… → Scoring — SEO
  88 · AEO 79 · GEO 74 · revising… → … → Final — SEO 94 · AEO 91 · GEO 90").
  Completed steps carry a checkmark (`--success`); the latest step pulses
  (`--ai`, Tailwind `animate-pulse`). Consecutive duplicate frames are collapsed
  so a phrase never repeats a row. On `{"draft_id"}` it still
  `router.replace('/spotlight/draft/{id}')` to reveal the FINAL rich blog (hero +
  scorecard + FAQ + shop-the-look). On an `error` frame / failure it shows the
  same inline error + Back-to-Inbound-Engine link. The provisional banner and the
  "Designing your article…" framing are kept.
- **Refine/regenerate (`blog-detail.tsx` + `refine-draft-dialog.tsx`) = unchanged
  live typing.** The refine loop has one article on screen and discards nothing,
  so it keeps the token-by-token `BlogStreamingBody` typing exactly as-is. Not
  touched by this patch.
- **`blog-writing-loader.tsx`** gained an optional `header?: React.ReactNode`
  prop rendered in place of its single status line; the generate surface passes
  the progress timeline through it. Backward compatible — refine and the route
  `loading.tsx` still pass only `status` and render the original single line.

Frontend-only, isolated to the Spotlight generate surface. Tokens only, both
themes, no framer-motion, reduced-motion safe (pulse degrades to a static dot).
`npm run build`, `npx tsc --noEmit`, `npm run lint`, `npm test` all green.

### 2026-08-12 — First-generation streams live on an article surface (`/spotlight/draft/new`)
First-generation previously streamed the agent's status *on the "Generate draft"
button* and only navigated to the draft once `draft_id` arrived — so the owner
watched a button spin, never the article being written. It now behaves exactly
like the refine/regenerate loop (`blog-detail.tsx`): the body streams live into a
full article view.

- **New route `app/(app)/spotlight/draft/new/page.tsx`** — a thin `force-dynamic`
  server page. It reads the generation input from the URL (`?query_id=<id>` or
  `?keyword=<text>`) via the `searchParams` server prop (no client
  `useSearchParams()`), validates it (missing/invalid → an inline "nothing to
  write" state with a Back-to-Inbound-Engine link), and renders the client
  streaming component inside `<Suspense>` (Next 16). A sibling
  `loading.tsx` shows the taller writing loader inside the article card shell so
  the first navigation never flashes blank.
- **New `features/spotlight/blog-draft-streaming.tsx`** (client) — on mount it
  opens the SSE stream via `generateDraftStream(input, onStatus, onDelta, signal)`
  and renders an article-shaped view matching `blog-detail.tsx`: a provisional
  `BlogBanner` (branded gradient fallback, eyebrow "Writing…", provisional title =
  the typed keyword or "Composing your article…", "Drafting live" byline), the
  prominent live status phrase, and a body that shows `BlogWritingLoader` until the
  first `{"delta"}` then swaps to `BlogStreamingBody` (live markdown + caret) —
  the exact renderers the refine loop uses. Provisional "Written by / Grounded on /
  SEO & publish" side panels mirror the saved-draft aside so nothing jumps on
  landing. On `{"draft_id"}` it `router.replace('/spotlight/draft/{id}')` (replace,
  not push, so Back skips this ephemeral surface). On an `error` frame / failure it
  shows an inline error + a Back-to-Inbound-Engine link.
- **`features/spotlight/blog-banner.tsx`** — the editorial `BlogBanner` was
  extracted out of `blog-detail.tsx` (unchanged markup) into a shared component so
  the streaming surface and the saved draft render one identical banner shape; the
  read-time/persona line moved into a `byline` slot.
- **`features/spotlight/generate-draft-button.tsx`** — no longer streams on the
  button; it now `router.push`es straight to
  `/spotlight/draft/new?query_id={id}` with a brief disabled "Starting…" state, so
  the live typing happens on the article surface.
- **`services/spotlight-actions.ts`** — `generateDraftStream` gained an optional
  4th arg `signal?: AbortSignal`, forwarded to `fetch`, so the streaming surface
  aborts the in-flight generation on unmount (route change / dev StrictMode
  double-mount) and never orphans a draft in the shared store. Backward compatible.

Tokens only, both themes, no framer-motion, reduced-motion safe (reuses the
existing caret/shimmer components). `npm run build`, `npx tsc --noEmit`,
`npm run lint`, `npm test` all green.
