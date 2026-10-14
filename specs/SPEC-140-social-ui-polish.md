# SPEC-140 — Social Growth UI polish

**Status:** implemented
**Repo:** `ecommerce-fte-frontend`
**Depends on / touches:** SPEC-110, SPEC-123, SPEC-133, SPEC-134, SPEC-135,
SPEC-137, SPEC-138 (Content Studio, Weekly Plan board, Weekly Plans panel,
`PostDetail`, `PostCard`, `PreviewImage`, `social-pills`).
**Author:** musman@greenshades.com — 2026-08-18

## Context

Six UI issues on the Social Growth surface were reported after the weekly-plan
work (SPEC-137/138) landed. All are presentation/interaction polish — no backend
contract change, no new metric, no new route. Reuse the existing components.

The generated post-image endpoint (`GET /social/posts/{id}/image`) now serves a
generated editorial image whenever one exists — even for a product with no
product photo — so slot/post thumbnails should prefer it over the raw product
photo (backend 2026-08-18 change).

## Goal

1. **Slot / post thumbnails show the generated editorial image.** In the Weekly
   Plan board slot cards, and in `PostCard`, a generated slot/post (`postId` set)
   renders its editorial image via `postImageUrl(postId)`; on image load error
   (or when there is no `postId`) it falls back to the product `imageUrl`, then to
   the neutral placeholder tile.
2. **Custom, token-based scrollbar** on the plan board's horizontal scroll
   container (and the other Social Growth horizontal-scroll regions). Reuse the
   existing token-based `.scrollbar-subtle` utility in `app/globals.css`
   (`--border` / `--muted-foreground` thumb, thin, rounded, transparent track;
   Firefox `scrollbar-width`/`scrollbar-color` + WebKit `::-webkit-scrollbar*`;
   both themes via tokens).
3. **`PostDetail` two-column layout.** Redesign `PostDetailView` into a
   responsive 2-column layout on wide screens: LEFT = the native post preview
   (`article`, ~`max-w-md`, caption rendered read-only); RIGHT = a details/actions
   panel that fills the space — product name + status, channel · format,
   persona/pillar chips, the angle switcher, Edit caption (editable in the panel),
   Regenerate image, hashtags, the schedule / auto-schedule note, and
   Approve / Request changes. Stacks to one column on narrow screens. All existing
   behavior preserved (edit/save via `updatePostCaption`, approve /
   request-changes, regenerate image, hydrate-by-id).
5. **Remove the duplicate "Generate Weekly Plan" button.** The Weekly Plans area
   showed two — the Content Studio tab-header row AND the plans-panel header. Keep
   exactly one: the plans-panel header owns it (fix 7 designs that header around
   it); the tab-header `Generate Weekly Plan` button is removed, leaving the
   tab-header `Plan history` toggle as the entry point. The now-unused
   `generateNonce` plumbing is removed.
6. **Rename + green "Active" pill.** The Content Studio history toggle button is
   renamed from "Weekly plans" to **"Plan history"** (the panel section heading
   stays "Weekly plans"). In the plans list, the currently-active plan (the newest
   one) gets a prominent green **Active** pill (`bg-success/10 text-success`, the
   app's success-status convention); non-active plans keep their muted status chip.
7. **Weekly Plans list-page layout polish.** `weekly-plans-panel.tsx` history view
   gets a clean header (breadcrumb + "Weekly plans" title + subtitle + the single
   Generate button aligned right), tidy list rows (icon, title, "Week of {date} ·
   {generatedCount}/{slotCount} drafts", the green Active pill / muted status),
   8px spacing, loading / empty / error states, responsive, both themes, no
   overflow.

(Item 4 is handled by another agent — out of scope here.)

## Non-goals / constraints

- Semantic tokens only; no hardcoded colors; brand red never used for status
  (Rule 9).
- No framer-motion, no entrance animations (Rule 9). Allowed: CSS hover/focus,
  skeleton pulse only.
- No new backend calls; no metric calculation in the UI (Rule 8).
- Reuse existing components (`PreviewImage`, `ProductThumb`, `social-pills`,
  `.scrollbar-subtle`) before writing new ones.

## Design / implementation

### Pure logic (`lib/social-plan.ts`) — unit-tested

- `slotThumbnailSrcs(postId, imageUrl, toPostImageUrl)` → ordered candidate src
  list: the generated-image URL first when `postId` is present (non-empty), then
  the product `imageUrl` when present. Empty list ⇒ the caller renders the
  placeholder. Keeps the "`postId` → `postImageUrl`, else `imageUrl`" decision
  pure (the URL builder is injected so it is testable without env/services).
- `activePlanId(plans)` → the id of the active (newest) plan, or `null` for an
  empty list. Reuses `sortPlanSummaries` so "newest = active" is one definition.

### Components

- **`features/social/editorial-thumb.tsx` (new, client).** Renders the first
  candidate from `slotThumbnailSrcs`, advancing to the next on `<img>` `onError`,
  falling back to the same neutral placeholder tile `ProductThumb` uses when the
  list is exhausted. Used by the board slot cards and `PostCard`.
- **`weekly-plan-board.tsx`.** Slot card thumbnail → `EditorialThumb`
  (`postId={slot.postId}`, `imageUrl={slot.imageUrl}`). Scroll container gets
  `scrollbar-subtle`.
- **`post-card.tsx`.** Thumbnail → `EditorialThumb`
  (`postId={post.hasImage ? post.postId : null}`, `imageUrl={post.imageUrl}`).
- **`post-detail.tsx`.** `PostDetailView` → 2-column grid (`lg:grid-cols-[...]`);
  left native preview with a read-only caption; right details/actions panel with
  the editable caption control, angle switcher, regenerate, hashtags, schedule
  note, approve / request-changes.
- **`weekly-plans-panel.tsx`.** Remove the `generateNonce` prop + effect; history
  header polished; `HistoryRow` shows the green Active pill when its id ===
  `activePlanId(plans)`, else the muted `PostStatusChip`.
- **`content-studio-tab.tsx`.** Remove the tab-header `Generate Weekly Plan`
  button + the `generateWeeklyPlan`/`planNonce` plumbing; rename the `Weekly plans`
  toggle to `Plan history`; `WeeklyPlansPanel` rendered without `generateNonce`.
- **`app/globals.css`.** Reuse existing `.scrollbar-subtle` (already token-based
  and both-theme). No new utility needed; applied to the Social Growth
  horizontal-scroll regions (plan board, calendar table, performance table).

## Acceptance criteria

1. A generated slot card and a `PostCard` with `hasImage` render the editorial
   image (`postImageUrl`); on load error they fall back to the product photo, then
   the placeholder. An ungenerated slot with a product photo shows the photo; with
   none, the placeholder. — **done**
2. The plan board horizontal scroll (and calendar/performance tables) use the
   token-based `.scrollbar-subtle` thumb in both themes. — **done**
3. `PostDetail` renders two columns on `lg+` (preview left, details/actions
   right, no large empty gap) and one column below; edit caption, angle switch,
   regenerate image, approve, request-changes, and hydrate-by-id all still work.
   — **done**
5. Only one "Generate Weekly Plan" button is visible in the Weekly Plans area at
   any time. — **done**
6. The tab toggle reads "Plan history"; the active (newest) plan shows a green
   "Active" pill; others show a muted status chip. — **done**
7. The Weekly Plans list header/rows are clean, spaced on the 8px scale, with
   loading / empty / error states, responsive, both themes, no horizontal
   overflow. — **done**

## Tests

`tests/social-plan.test.ts` — `slotThumbnailSrcs` (postId→generated first,
fallback ordering, null/empty handling, injected builder) and `activePlanId`
(empty→null, newest-by-createdAt, id tie-break). `npm test`, `npx tsc --noEmit`,
`npm run lint`, `npm run build` all green.

## Manual verification checklist

- [ ] Board: generated slot shows the editorial image; deleting/blocking the
      image falls back to the product photo then the placeholder.
- [ ] Board horizontal scroll shows the thin rounded token scrollbar (light +
      dark).
- [ ] `PostDetail` fills the width in two columns on desktop; stacks on mobile;
      all actions (edit/save caption, angle switch, regenerate, approve, request
      changes) work; keyboard-navigable.
- [ ] Exactly one Generate Weekly Plan button visible.
- [ ] Toggle says "Plan history"; newest plan has a green Active pill; others
      muted.
- [ ] Weekly Plans list header + rows are clean and spaced; loading / empty /
      error states render; no overflow; both themes.
</content>
</invoke>
