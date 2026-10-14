# SPEC-036 — Live Agent Status in the Chat Thinking State

**Status:** Implemented
**Date:** 2026-07-20
**Backend counterpart:** backend `SPEC-030-chat-status-events.md` (the contract)
**Depends on:** SPEC-016 (streaming), SPEC-032 (spiral thinking indicator)
**Touches:** `services/chat.ts`, `features/chat/chat-page.tsx`,
`features/chat/chat-view.tsx`, `features/chat/typing-indicator.tsx`,
`tests/chat-service.test.ts`

## Problem (owner, 2026-07-20)

While the agent works (often 5–15 s before the first token), the user sees
only the spiral and can't tell if anything is happening. The backend now
streams real progress as `{"status": "<phrase>"}` SSE frames (backend
SPEC-030) — the UI must show them.

## Design

- `services/chat.ts`: `SseFrame` gains `status?: string`;
  `getAssistantReply(prompt, conversationId, onDelta?, onSuggestions?,
  onStatus?)` fires `onStatus` per status frame. Additive — existing callers
  unchanged.
- `chat-page.tsx`: new `thinkingStatus` state — set from `onStatus`, cleared
  when the first delta arrives (the answer replaces it) and in `finally`.
- `typing-indicator.tsx`: optional `label` prop — the phrase renders beside
  the spiral in muted text inside the same bubble, with `aria-live="polite"`
  (`role="status"` already announces updates); no label → spiral only (other
  callers unchanged).
- `chat-view.tsx`: passes `thinkingStatus` into `TypingIndicator` in the
  thinking block.

Real data only: phrases come from the backend's actual tool-call events —
nothing is simulated client-side.

## Acceptance Criteria

1. During a streamed reply the bubble shows the live phrases (e.g.
   "Understanding your question… → Crunching revenue numbers… → Analyzing
   the results…") and swaps to the streaming text at the first token.
2. Old-server compatibility: with no `status` frames the bubble shows the
   spiral alone, exactly as before.
3. `getAssistantReply` unit tests cover the `onStatus` callback and that
   status frames don't pollute the reply text.
4. `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` green.

## Manual verification checklist (no jsdom runner)

- [ ] Ask a heavy question: phrases change live before text streams;
      both themes look right.
- [ ] Screen reader announces phrase changes politely.
