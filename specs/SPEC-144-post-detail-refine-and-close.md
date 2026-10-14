# SPEC-144 — PostDetail: refine loop + dialog close/status-pill collision fix

Status: implemented
Depends on: SPEC-138 (reusable `PostDetail`/`PostCard`), SPEC-117 (Spotlight refine
dialog pattern), SPEC-143 (Calendar dialog surface), SPEC-142 (Approvals detail surface).

The reusable `PostDetailView` (`features/social/post-detail.tsx`) is rendered by four
surfaces: Content Studio (inline), the Weekly Plans panel (inline), Approvals (inline
with `onBack`), and the Calendar tab (inside a shadcn `Dialog`). Two issues, one spec.

## Problem

**Fix 1 — the dialog close (X) collides with the status pill.** In the Calendar dialog,
shadcn `DialogContent` renders an absolute-positioned close button at `top-2 right-2`
(`size-7` = 1.75rem). `PostDetailView`'s header row puts the `PostStatusChip` at its
top-right (`justify-between`). Inside the dialog those two overlap: the X sits on top of
the "Approved"/"Scheduled" pill, so neither is fully usable.

**Fix 2 — no way to ask the writer to change a post from prompt.** The detail exposes
"Edit caption" (manual) and "Generate image", but no way to tell the AI *what* to change
and have it rewrite the creative. Spotlight already has this pattern (SPEC-117
`RefineDraftDialog`); Social Growth's post detail should too.

## Goal

1. Reserve horizontal space on the right of the detail header so the status pill never
   sits under the dialog's absolute close button — correct both inline (no X) and in the
   dialog. `pr-10` (2.5rem) on the header row clears the `right-2`+`size-7` close button
   with a small gap, and is a harmless right pad when rendered inline.

2. Add a **Refine** button beside "Edit caption" that opens a prompt `Dialog` (mirroring
   `refine-draft-dialog.tsx`): a "What would you like to change?" textarea, a row of
   suggestion chips that pre-fill the textarea, and Cancel / Refine actions. Submitting
   calls a new backend endpoint and, on success, updates the detail **in place** with the
   returned post. Clicking Refine never auto-changes anything — it only opens the dialog.

## Backend contract (consumed, already built)

`POST /social/posts/{id}/refine` body `{ instruction: string }` → the full `PostDetail`
shape (same as `GET /social/posts/{id}`):
`{ postId, channel, productId, productName, imageUrl, creative, caption, hashtags,
hasImage, imageConcept, status, scheduledFor, plannedFor }`.
Errors via the shared envelope: `404 social_post_not_found`, `422
social_refine_instruction_invalid` (empty / too long), `409` when the post is already
published. All surface their `error.message` to the dialog.

## Services (`services/social-actions.ts`)

- `refinePost(postId: string, instruction: string): Promise<PostDetail>` — `POST
  /social/posts/{id}/refine` with `{ instruction }`. Typed, error-surfacing through the
  shared `post()` envelope.

## Pure logic (`lib/social-post.ts`, unit-tested, node-env)

- `REFINE_INSTRUCTION_MAX_LENGTH = 2000` — client guard mirroring the backend's 422.
- `REFINE_SUGGESTIONS` — the chip labels that pre-fill the textarea:
  `["Make it punchier", "Shorter", "Lean into the occasion", "Less salesy"]`.
- `refineInstructionError(instruction): string | null` — `null` when valid; a message
  when empty/whitespace-only or longer than the max (trimmed length). Drives both the
  disabled state and the pre-submit guard so there is one definition.
- `refinedPostSeed(post: PostDetail): RefinedPostSeed` — the view-model seed applied to
  `PostDetailView` state after a refine, mirroring the component's mount-time seeding
  (caption = first variant's body, else `post.caption`). Returns
  `{ creative, variantId, caption, status, hasImage, imageConcept, scheduledFor }`.

## UI (`features/social/post-detail.tsx` + `features/social/refine-post-dialog.tsx`)

- **Header (Fix 1):** the detail header row gets `pr-10` so the `PostStatusChip` clears
  the dialog's absolute close button. Verified inline + in-dialog, both themes, all
  breakpoints; the X stays clickable and the pill fully visible.
- **Refine button (Fix 2):** in the Caption panel, beside "Edit caption" (shown only when
  not mid-edit), an outline `Sparkles` **Refine** button opens `RefinePostDialog`. It does
  not mutate anything on click.
- **`RefinePostDialog`** (new, mirrors `RefineDraftDialog`): controlled shadcn `Dialog`
  with a labeled textarea, a wrapping row of suggestion chips (`REFINE_SUGGESTIONS`) that
  set the textarea value, an optional error line, and a footer of Cancel + Refine. Refine
  is disabled while `refineInstructionError(value) !== null` or while refining; refining
  shows a CSS-only `Loader2` spinner + "Refining…". Closing is blocked while refining.
- **On submit:** `refinePost(postId, instruction.trim())`; on success apply
  `refinedPostSeed(res)` to the component state (creative, active variant, caption/draft,
  status, scheduledFor, image concept, hasImage — bumping the image cache-buster only when
  the refined post has an image), close the dialog, clear the instruction, then
  `onChanged?.()` + `router.refresh()` (same as the existing caption/image/decision
  actions) so server-driven lists stay consistent. On error the dialog stays open with the
  message and the typed instruction intact.

Because `PostDetailView` is reusable, Refine now appears in all four surfaces.

Design (Rule 9): semantic tokens only; `Sparkles`/`Loader2` Lucide outline icons;
CSS-only loader (`animate-spin`), no framer-motion, no entrance animation; keyboard
operable (shadcn Dialog + Buttons); both themes.

## Acceptance criteria

1. In the Calendar dialog the close X no longer overlaps the status pill; both fully
   visible + usable, both themes, all breakpoints. — done
2. A **Refine** button sits beside "Edit caption" in every surface that renders
   `PostDetail`. — done
3. Clicking Refine opens the prompt dialog and changes nothing on its own. — done
4. Suggestion chips pre-fill the textarea; Refine is disabled on an empty instruction. — done
5. Submitting shows a CSS-only "Refining…" state, then on success closes the dialog and
   the detail's caption/creative/status update from the response. — done
6. `404` / `422` / `409` messages surface in the dialog; the instruction is preserved on
   error. — done
7. `refinePost` added to services (typed, no `any`); `refineInstructionError`,
   `refinedPostSeed`, `REFINE_SUGGESTIONS`, `REFINE_INSTRUCTION_MAX_LENGTH` are unit-tested
   pure logic. — done
8. `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` all green. — done

## Manual verification checklist

- [ ] Calendar → open a scheduled post in the dialog: the close X is clear of the
      "Scheduled"/"Approved" pill; both are fully visible and clickable. Repeat in dark
      theme and at mobile/tablet/desktop widths.
- [ ] Inline surfaces (Content Studio, Approvals, Weekly Plans): header pill unaffected;
      no stray dialog X.
- [ ] Refine: click Refine → dialog opens, nothing changed yet. Click each suggestion chip
      → textarea fills. Empty textarea → Refine disabled. Submit → "Refining…" spinner →
      on success dialog closes and the caption/angle/status update in place.
- [ ] Error paths: a 404/422/409 shows its message in the dialog and keeps the typed text.
- [ ] Light + dark theme; keyboard nav through chips/textarea/buttons; nothing animates in.

## Patches
(none yet)
