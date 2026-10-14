# SPEC-223 — Editable questions, and chips that stay put

Status: implemented
Backend: SPEC-232 (reply survives disconnect; `done` before suggestions)

## Problem

Three faults from live use:

1. **A question cannot be corrected.** User messages render as plain text with no
   controls. A typo means retyping the whole thing; there is not even a copy
   button, which assistant replies have had since SPEC-016.
2. **The composer stays locked long after the answer is finished.** The reader
   loop only returns when the SSE stream closes, and the backend used to send
   follow-up chips — a second LLM round trip — before `{"done": true}`. The
   answer was complete on screen while the UI still said it was working.
3. **Chips vanish on navigation.** `selectConversation` and `newChat` both call
   `setDynamicPrompts(null)`, and leaving `/chat` unmounts the page entirely.
   Coming back to a conversation silently replaces its real follow-ups with the
   generic starters, which read as if the assistant had forgotten the exchange.

## Design

### Question controls

User bubbles gain hover/focus actions: **Copy** and **Edit**. Edit swaps the
bubble for a textarea seeded with the question; Save re-sends it as a new turn
(Escape or Cancel restores). Re-sending rather than rewriting history keeps the
transcript honest — the original question and its answer stay in the record.

Actions are keyboard reachable and always rendered (opacity-only on hover), so
they are not lost to a touch device with no hover state.

### Completion before chips

`getAssistantReply` resolves on the `{"done": true}` frame instead of at stream
close, and keeps draining the still-open stream for `{"suggestions": …}` in the
background. The answer commits and the composer unlocks the moment the answer is
finished; chips land a moment later.

### Chips survive the round trip

Follow-ups are cached per conversation in `localStorage`
(`aias_chat_followups`), written when they arrive and read when a conversation is
selected or the page remounts. A per-viewer convenience, so `localStorage` is the
right home — every access is wrapped, and a miss simply falls back to the curated
starters, which is today's behaviour.

## Verification checklist (no component runner — root Rule 4)

- [x] Copy on a user message puts the question on the clipboard.
- [x] Edit → change → Save re-asks; Escape/Cancel restores the original.
- [x] Composer unlocks as soon as the answer finishes, before the chips appear.
- [x] Leave `/chat` mid-answer and return: the full reply is in the conversation.
- [x] Switch conversation and back: that conversation's own chips return.
- [x] Tokens only; light and dark; no entrance animation (root Rule 9).
- [x] `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` green.

## Acceptance Criteria

- [x] User messages carry Copy and Edit; assistant messages are unchanged.
- [x] Editing re-sends as a new turn and never rewrites the transcript.
- [x] `getAssistantReply` resolves on `done`, not at stream close.
- [x] Suggestions arriving after `done` still reach the caller.
- [x] Follow-ups are cached per conversation and restored on selection.
- [x] Every storage access is guarded; a failure degrades to the starters.
- [x] Cache logic is pure and unit-tested in `lib/`.
