# SPEC-030 — Dynamic Never-Ending Follow-up Chips

- **Status:** Implemented
- **Date:** 2026-07-17
- **Backend:** SPEC-021 (`{"suggestions": [...]}` SSE frame after each reply).
- **Bug being fixed:** chips were a static, depleting pool (click → gone →
  eventually none) with no relation to the conversation.

## Changes

1. `services/chat.ts` — `getAssistantReply` gains an `onSuggestions`
   callback; the SSE parser handles the new `suggestions` frame.
2. `features/chat/chat-page.tsx` — holds `dynamicPrompts` state: set from
   each reply's suggestions, cleared on new-chat / conversation switch
   (restored conversations fall back to the curated starters until the next
   exchange).
3. `features/chat/chat-view.tsx` — when a dynamic set exists it renders ALL
   four (no depletion filter — the next answer replaces the set, so chips
   are never consumed and never run out). The static starter behavior is
   unchanged for empty/new chats.

## Acceptance criteria

- [x] After every answer: exactly 4 chips, relevant to that answer.
- [x] Clicking a chip asks it; the following answer brings 4 new chips —
      indefinitely.
- [x] Starters still shown on a fresh chat; suggester failure shows defaults.
- [x] All four frontend gates green.
