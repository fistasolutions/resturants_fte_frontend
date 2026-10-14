# SPEC-243 — Select anything, ask about it

**Date:** 2026-09-15 · **Repo:** frontend · **Status:** implemented
**Backend counterpart:** `SPEC-250-chat-selection-context.md` (`context.selection`)
**Builds on:** `SPEC-235-ask-ai-drawer.md`, `SPEC-236-ask-ai-page-context.md`,
`SPEC-242-explain-this.md` (ideas document, item 07)

## Problem

Explain this (SPEC-242) covers the cards. A table row on Products, an alert line on the
Dashboard, a product name in a returns list, a sentence in a report — none of them has a
button, and the owner has to retype what they are looking at into the Ask AI panel.
Highlighting text is the universal "this one" gesture; it should be enough.

## Behaviour

1. **Highlight text on any page → a small "Ask AI ✦" bubble appears** just above the
   selection (below it when there is no room above), following the text, not the mouse.
   Tokens only (`bg-card`, `border`, `text-ai`), a 150 ms fade, no other motion.

2. **Click the bubble (or press ⌘J / Ctrl+J while text is selected)** → the drawer
   opens and the question is sent into its current thread, with page context
   (SPEC-236) **plus `selection`** — the highlighted text, whitespace collapsed,
   ≤ 500 characters. The question reads naturally in history:

   > I highlighted this on the page: "Andrea Jumper F6 · 100% return rate (30 days)".
   > What is it telling me, and what should I do about it?

   While a reply is streaming, the question waits in the composer (same rule as
   SPEC-242). The selection is cleared once the question is sent.

3. **When it does not appear.** Inside the Ask AI panel itself, inside any input,
   textarea or contenteditable, on `/chat` (the drawer is suppressed there), for
   selections shorter than 3 characters or of whitespace only, and for selections longer
   than 500 characters (the first 500 are sent, the rest cut with an ellipsis — the
   bubble still shows). Escape, clicking elsewhere, scrolling, or collapsing the
   selection hides it.

4. **Touch.** Long-press selection on a phone triggers the same `selectionchange`
   event; the bubble sits above the selection handles.

## Implementation

- `lib/selection-ask.ts` — pure, Vitest-covered: `normaliseSelection(raw)` (collapse,
  trim, 3..500 with ellipsis, null otherwise), `selectionQuestion(text)`,
  `withSelection(context, text)`, `bubblePosition(rect, viewport)` (above by default,
  below when clipped, clamped to the viewport with an 8 px gutter),
  `isIgnoredSelectionTarget(tagName, isContentEditable, insideDialog)`.
- `features/chat/selection-ask.tsx` — mounted once in `app/(app)/layout.tsx` inside
  `ChatDrawerProvider`; listens to `selectionchange` (debounced 120 ms), `scroll`,
  `keydown`; renders the bubble with `position: fixed`; calls `drawer.ask()`.
- `types/chat.ts` — `ChatPageContext.selection?: string`.
- `lib/docs/content/chat.ts` — a "Select anything, ask about it" section with a
  capture (`chat-select-ask`); `lib/docs/overview.ts` — extend the Explain convention.

## Acceptance criteria

- [x] Highlighting text on Dashboard / Products / Returns shows the bubble above the selection.
- [x] Click → drawer opens → question sent with `selection` → grounded reply about that text.
- [x] ⌘J with a selection does the same; ⌘J without one toggles the drawer as before.
- [x] No bubble inside the drawer, inputs, on `/chat`, or for < 3 chars.
- [x] `lib/selection-ask.ts` unit-tested; `npm test`, `tsc`, lint, `npm run build` green.
- [x] Docs updated with a real capture.

## Manual verification checklist

1. Products › Catalog → highlight a product name → bubble → click → answer names the product.
2. Dashboard → highlight "275 orders unshipped over 48h" → ⌘J → sent.
3. Open the drawer, highlight text inside an answer → no bubble.
4. Highlight one letter → no bubble. Press Escape with a bubble showing → gone.
5. `/chat` → highlight anything → no bubble.

## Patches

- **2026-09-22 — the bubble fills the composer; it never sends (owner).** "As anybody
  selects text and clicks Ask Glisp, it opens the side drawer and fills the input but
  does not submit." Behaviour 2 changes: click, or ⌘J with a selection, opens the
  drawer and **drafts** the question into the composer — the same `draft()` path the
  ✦ Explain button has used since SPEC-242 — with the page context plus `selection`
  carried as the pending draft, so the send the owner makes (Enter, or the send
  button) still reaches the backend with the highlighted text attached (SPEC-250);
  an edited question sends with the plain page context, as ✦ does. Nothing is sent
  until the owner sends. The selection is cleared once the draft is placed. The
  "while a reply is streaming, the question waits" rule is now moot: the question
  always waits. `features/chat/selection-ask.tsx` calls `drawer.draft` instead of
  `drawer.ask`; `lib/selection-ask.ts` is unchanged. Acceptance 2 and 3 and the
  manual checklist read "drafted, then sent by the owner" from today; the in-app
  doc (`lib/docs/content/chat.ts`) says so.
