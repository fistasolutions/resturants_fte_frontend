# SPEC-259 — From answer to action

**Date:** 2026-09-17 · **Repo:** frontend · **Status:** implemented
**Backend counterpart:** `SPEC-260-chat-answer-actions.md` (`sources.actions`)
**Builds on:** `SPEC-240-chat-answer-card.md`. Ideas document item 03.

## Behaviour

1. **An actions row** at the end of the answer card, after the source chips and above
   the footer, when `sources.actions` is non-empty: up to two buttons — a `send` action
   as the primary button, a `review` action as an outline button — each with a
   trailing `ArrowRight`, opening the page (`next/link`). Absent while streaming and on
   answers with no action.

2. **From the panel**, pressing an action closes the panel so the page is in view; the
   thread is kept (SPEC-235) — the owner can reopen it beside the review page.

3. Tokens only; no new motion.

## Implementation

- `types/chat.ts` — `AnswerAction`, `ChatSources.actions`.
- `features/chat/answer-card.tsx` — the row; `onNavigate` prop (the panel passes
  `() => setOpen(false)`).
- `features/chat/chat-drawer.tsx` — passes `onNavigate`.
- Docs: `lib/docs/content/chat.ts` "From answer to action" section.

## Acceptance criteria

- [x] "Which orders are overdue?" → the card ends with **Send overdue lists →** which opens `/orders/review`.
- [x] "Who are my best customers going quiet?" → **Start win-back →** opens `/customers/winback`.
- [x] "hi" → no row. In the panel the button closes the panel and navigates.
- [x] `npm test`, `tsc`, lint, `npm run build` green; docs updated.
