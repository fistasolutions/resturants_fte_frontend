# SPEC-138 — Social Growth: unified PostDetail/PostCard + Weekly Plan history

Status: implemented
Depends on / supersedes surfaces from: SPEC-110, SPEC-123, SPEC-131, SPEC-132,
SPEC-133, SPEC-134, SPEC-135, SPEC-136, SPEC-137.

## Problem

Social Growth renders "a post" three inconsistent ways:

1. **Content Studio** (`PlatformPreviewCard`) — the richest single-post UI (native
   IG/FB preview, editable caption, angle switcher, regenerate-image, grounded
   chips) but with **no approve/request-changes actions**.
2. **Weekly Plan** (`SlotCard`) — a slot that, once generated, shows only a static
   "Generated ✓" chip and a link out to Approvals; no way to open/see the post.
3. **Approvals** (`FeaturedCard` / `QueueCard`) — a different card again, with **no
   product images** and **no click-through** to a real post view.

There is no shared "one post" component, the Weekly Plan disappears from view once
you navigate away, and there is no way to browse previously generated plans.

## Goal

Unify every "post" around two reusable components, then fix four issues, as one
coherent refactor. The backend contract (camelCase, already built) is authoritative:

- `GET /social/posts/{id}` → `PostDetail` (see Types).
- Approvals items carry `imageUrl`/`hasImage`.
- `GET /social/weekly-plans` → `{ plans: WeeklyPlanSummary[] }` (newest first).
- `GET /social/weekly-plans/{id}` → `{ plan: WeeklyPlan }` (404 `weekly_plan_not_found`).

## Stage 1 — reusable components (the backbone)

### `features/social/preview-image.tsx` → `PreviewImage`
Extracted verbatim from Content Studio (single responsibility). The native-frame
image tile (real photo or a labeled placeholder). Consumed by `PostDetail`, the
Content Studio ghost preview, and anywhere a framed product image is needed.

### `features/social/post-detail.tsx` → `PostDetail`
The canonical single-post view. Props:
`{ postId: string; initial?: PostDetail; onBack?: () => void; onChanged?: () => void }`.

- Given a full `initial` object → renders instantly (Content Studio drafts, freshly
  generated plan slots). Given only `postId` → loads via `getPostDetail(postId)` with
  a loading skeleton + an error state with retry (Approvals, already-generated slots).
- Renders the native platform preview (Instagram portrait 4:5 / Facebook landscape
  1.91:1) with the editorial image (`postImageUrl` when `hasImage`/just regenerated,
  else the product `imageUrl`), the editable caption (`updatePostCaption`, per-platform
  char count via `lib/social-studio`), the angle switcher (`captionVariants`),
  regenerate-image (`generatePostImage`), grounded chips (persona/pillar), the status
  chip, and the schedule state.
- **Actions:** when editable (`in_review`/`changes_requested`) → **Approve**
  (`approveSocialPost`) + **Request changes** (`requestChangesSocialPost`). Shows the
  schedule state (`scheduledFor`/`plannedFor`) and, when a `plannedFor` exists on an
  editable post, the "approve → auto-schedules for {plannedFor}" note. After a
  successful action it flips its local status, calls `onChanged?.()`, and
  `router.refresh()` (so server-driven lists re-pull).
- No manual date-picker here — approved-but-undated posts are scheduled on the
  Calendar tab (SPEC-132, unchanged). Planned posts auto-schedule on approve (backend).

### `features/social/post-card.tsx` → `PostCard`
A compact, clickable card (whole card is one button, keyboard-operable): product
thumbnail (`postImageUrl` when `hasImage`, else `imageUrl`, via `ProductThumb`),
product name, `ChannelBadge`, a status chip, optional subtitle. `onClick` opens the
detail. Used for the Approvals queue + featured item.

### Content Studio
`StudioWorkspace` renders its generated drafts through `PostDetail` (mapped from the
`ProductDraft` + selected product via `draftToPostDetail`), keeping the existing
generate / hydrate / per-channel-merge / edit / regenerate-image behavior
(SPEC-133/134/136 — no regression). `PreviewImage` now comes from `preview-image.tsx`.

## Stage 2 — the four fixes

1. **Weekly-plan building loader → a "calendar being built" animation.** The small
   pulse list is replaced by a **full-width 7-day calendar skeleton** (a 7-column grid
   of shimmering placeholder slot cards) with the staged status lines above it
   ("Reading your Brand Brain → Scanning best-sellers, new drops, slow movers →
   Matching products to occasions → Naming campaigns & writing the rationale"). CSS-only
   (`.plan-building-bar` + `Skeleton` pulse), stilled under `prefers-reduced-motion`
   (Rule 9). It reads as "building your week's calendar," not a plain spinner.

2. **Weekly-plan slot Generate → professional loading, then auto-open the detail.** A
   slot's Generate ties to the real `generatePlanSlot` call; on success it **auto-opens
   `PostDetail`** for the generated post (built from the `SlotGenerateResult` via
   `plannedDraftToPostDetail`, so no extra round trip), with a back control to the
   board. Already-generated slots (postId set) are clickable and open their detail by
   id (`getPostDetail`).

3. **Approvals — images + click-through.** The pending queue and the featured item
   render as `PostCard` (now with real `imageUrl`/`hasImage` thumbnails). Clicking any
   card opens `PostDetail` for that post (loaded by id) with Approve / Request changes
   working there; on change it returns to the list and refreshes. The "N more posts
   awaiting review" copy is preserved.

4. **Weekly Plans history + breadcrumbs (persist across navigation).** Weekly Plans is
   a navigable area **inside** the Content Studio tab (not a separate route):
   `WeeklyPlansPanel` owns a **breadcrumb** trail (Social Growth › Weekly Plans › {plan
   title}), a **history list** from `GET /social/weekly-plans` (rows: title, week,
   slotCount/generatedCount, status, createdAt) — clicking a row loads that plan's board
   via `GET /social/weekly-plans/{id}`; the **"Generate Weekly Plan"** button generates
   a new plan, shows its board, and re-pulls history so it appears in the list. A
   secondary **"Weekly plans"** entry point opens the history list. The panel is kept
   mounted (hidden) by the tab, so the plan/board does not disappear on navigating away
   and back; a full reload rehydrates history from the server.

## Types (`types/social.ts`)

- `PendingPost` gains `imageUrl: string | null` and `hasImage: boolean`.
- `PostDetail` — the `GET /social/posts/{id}` shape.
- `WeeklyPlanSummary` — one `GET /social/weekly-plans` row.
- `WeeklyPlansResult` = `{ plans: WeeklyPlanSummary[] }`.
- `WeeklyPlanByIdResult` = `{ plan: WeeklyPlan }`.
No `any`.

## Services (`services/social-actions.ts`)

- `getPostDetail(id): Promise<PostDetail>` — `GET /social/posts/{id}`.
- `fetchWeeklyPlans(): Promise<WeeklyPlansResult>` — `GET /social/weekly-plans`.
- `fetchWeeklyPlanById(id): Promise<WeeklyPlan>` — `GET /social/weekly-plans/{id}`,
  unwrapping `{ plan }`. All typed + error-surfacing through the shared envelope.

## Pure logic (unit-tested, node-env Vitest)

`lib/social-post.ts` (new):
- `postIsEditable(status)`, `postActions(status)` (`{ canApprove, canRequestChanges }`).
- `statusMeta(status)` → `{ label, tone }` (tokens only; brand red never used).
- `hasServerImage(hasImage, version)`.
- `scheduleKind({ status, scheduledFor, plannedFor })` → `"scheduled" | "planned" |
  "approved-undated" | "none"`.
- `draftToPostDetail(draft, product)` — Content Studio `ProductDraft` → `PostDetail`.
- `plannedDraftToPostDetail(result, slot)` — `SlotGenerateResult` → `PostDetail`.

`lib/social-plan.ts` (additions):
- `sortPlanSummaries(plans)` — newest-first by `createdAt`, stable.
- `planSummaryProgress(summary)` → `"3 / 7 drafts"`.
- `buildWeeklyPlanCrumbs({ planTitle, postName })` → breadcrumb trail with click targets.

## Acceptance criteria

1. `PostDetail` is the single post view reused by Content Studio, Weekly Plan slot
   generate, already-generated slots, and Approvals. — done
2. `PostCard` renders the Approvals featured + queue with real thumbnails; clicking
   opens `PostDetail`. — done
3. Weekly-plan build shows a full-width 7-day calendar skeleton + staged lines,
   CSS-only, reduced-motion safe. — done
4. Slot Generate shows real loading and auto-opens `PostDetail`; generated slots open
   their detail on click. — done
5. Weekly Plans history list + breadcrumbs; Generate adds to history; plan persists
   across navigation and rehydrates on reload. — done
6. Types/services added, no `any`; pure logic unit-tested. — done
7. `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` all green. — done
8. Tokens only, no framer-motion, no entrance animations; both themes; keyboard. — done

## Manual verification checklist

- [ ] Content Studio: pick a product → Generate (IG+FB) → two `PostDetail` cards; edit
      caption saves; angle switch; regenerate image; Approve/Request-changes present.
- [ ] Weekly Plan: Generate Weekly Plan → 7-day calendar skeleton while building →
      board. Slot Generate → loading → auto-opens `PostDetail` → Back returns to board.
      Click an already-generated slot → its detail opens.
- [ ] Approvals: featured + queue show product thumbnails; click a card → `PostDetail`;
      Approve → returns to list, count updates; "N more posts awaiting review" intact.
- [ ] Weekly Plans: "Weekly plans" opens history; a row loads its board;
      breadcrumbs navigate (Social Growth › Weekly Plans › {title}); leave the tab and
      return — the board is still there; reload — history rehydrates.
- [ ] Light + dark theme; keyboard nav on all cards/buttons; reduced-motion stills the
      loaders.

## Patches
(none yet)
