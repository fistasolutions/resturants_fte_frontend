# SPEC-032 — Chat UI Polish: Avatar Visibility, Collapsible History, Grouped List

**Status:** Implemented
**Date:** 2026-07-20
**Depends on:** SPEC-010 (chat page), SPEC-016 (streaming), SPEC-019 (server history), SPEC-030 (follow-up chips)
**Touches:** `features/chat/bot-avatar.tsx`, `features/chat/chat-page.tsx`,
`features/chat/chat-history.tsx`, `features/chat/chat-empty-state.tsx`,
`features/chat/chat-view.tsx`, `features/chat/message-bubble.tsx`,
`lib/conversation-groups.ts` (new), `tests/conversation-groups.test.ts` (new)

## Problem (owner feedback, 2026-07-20)

1. The bot logo is washed out on the light theme — `/bot-icon.png` is an
   opaque landscape image with a baked-in pale-gray background, rendered
   `object-cover` in a small square on a 15% AI tint; on white it nearly
   disappears.
2. Icons are too small to read (header tile 36px, bubbles 32px).
3. The history sidebar is a fixed column — it cannot collapse like the main
   app sidebar.
4. Overall the page needs a more professional finish (repeated full dates on
   every history row, floating header with no separation).

## Design

### 1. `BotAvatar` — visible on white, unchanged character in dark

- **Zoom onto the robot:** the `Image` gets `scale-[1.75]` so the tile shows
  the robot + glow, not the empty gradient margins.
- **Theme-aware backing (owner request):** a `bg-ai/10 dark:bg-transparent`
  overlay darkens/tints the tile slightly on light theme only, plus
  `ring-1 ring-ai/25 dark:ring-ai/20` to define the edge on white. Dark theme
  keeps today's look. Tokens only (`--ai`), no hex.
- Default size becomes `size-9`.

### 2. Bigger icons (8px scale)

Header `size-9 → size-10`; message bubbles & typing row `size-8 → size-9`;
empty-state hero `size-12 → size-16`.

### 3. Collapsible desktop history rail

- `ChatPage` gains `historyCollapsed` state, persisted under
  `aias_chat_collapsed` (read in a mount effect — hydration-safe), toggled
  from a `PanelLeftClose` button in the history header and a `PanelLeftOpen`
  button in the collapsed rail.
- Collapsed: `w-68 → w-14` rail with icon-only **Expand** and **New chat**
  buttons (aria-labeled, tooltipped via `title`). CSS `transition-[width]
  duration-200` — allowed interaction motion, no entrance animation (Rule 9).
- The mobile Sheet variant is untouched (no collapse prop → no button).

### 4. Professional polish

- History list grouped **Today / Yesterday / "Jul 16, 2026"** via a new pure
  helper `groupConversationsByDay` (UTC-based like `utils/date.ts`, stable
  labels; malformed timestamps fall into "Earlier"). Per-row date line is
  dropped — the group header carries the date; rows are single-line truncated
  titles.
- Header gets `border-b`; the desktop rail gets `border-r` (structure without
  elevation, per Design.md).
- Empty state: `size-16` hero, `text-2xl` heading, suggestion cards with a
  small `Sparkles` accent icon and an `ai`-tinted hover border.

## Out of scope

Composer behavior, streaming, history data flow, mobile Sheet layout.

## Acceptance Criteria

1. Light theme: the bot tile reads clearly against white (tinted backing +
   ring + zoomed robot); dark theme visually unchanged apart from size.
2. All avatar sizes bumped as listed; nothing overflows at any breakpoint.
3. Desktop history collapses to an icon rail and back; the choice survives a
   reload; New chat works from the rail; keyboard/focus-visible works on all
   new buttons. No entrance animations anywhere.
4. History shows Today/Yesterday/date group headers, single-line rows,
   delete-on-hover still works; empty and loading states unchanged.
5. `groupConversationsByDay` unit-tested: today/yesterday/older boundaries,
   group ordering, malformed dates.
6. `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` all green.

## Manual verification checklist (no jsdom runner)

- [ ] Both themes: header, hello screen, bubbles — logo clearly visible.
- [ ] Collapse → reload → still collapsed; expand → reload → still expanded.
- [ ] Group labels correct around midnight boundaries (UTC-based).
- [ ] Mobile Sheet history unaffected; tablet/desktop widths clean.

## Patches

- 2026-07-20 — **Ink tile instead of purple (owner request).** The light-theme
  avatar backing is now **brand ink** (`bg-foreground`), not the ai-purple tint;
  dark theme keeps `bg-ai/15`. Because `bot-icon.png` is opaque (a backing
  color can never show through it), a new asset `public/bot-icon-badge.png`
  was generated (scripted circle mask + feathered alpha over the source icon)
  so the tile color is actually visible around the round badge; `BotAvatar`
  renders it `object-contain`. The ai-tint overlay + rings from the original
  spec are dropped.
- 2026-07-20 — **Neutral sparkle accents (owner request).** The composer's
  Sparkles icon and the empty-state suggestion-card Sparkles switch from the
  purple `text-ai` accent to `text-muted-foreground`; the card hover border
  goes from `border-ai/40` to `border-foreground/25`. The `--ai` token remains
  in use elsewhere (message tint) unless the owner asks further.
- 2026-07-20 — **Spiral thinking indicator (owner request).** The three
  pulsing dots in `TypingIndicator` are replaced with a brand-toned
  adaptation of the Uiverse spiral loader (narmesh_sah): 28 dots on a
  shrinking 3-turn spiral, colored solely by the `--ai` token with an
  opacity fade (the owner's rainbow reference was recolored to fit the
  design system). Geometry/keyframes live in `globals.css` (`.ai-spiral`);
  a loading indicator is allowed motion under Rule 9.
