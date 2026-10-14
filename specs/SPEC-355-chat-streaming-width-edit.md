# SPEC-355 — Chat: paced streaming, tables that stream, a wider thread, edit and resend

**Status:** Implemented
**Date:** 2026-10-08
**Repo:** ecommerce-fte-frontend
**Backend slice:** backend `SPEC-363-edit-a-question-and-resend.md`
**Builds on:** SPEC-016 (streaming markdown), SPEC-223 (edit a question), SPEC-352 (one answer
renderer), SPEC-354 (chat skeletons)

## Problem

From the owner's screenshot of Accounts Payable › Chat, 2026-10-08, and the console:

1. **A hydration error.** SPEC-354 put the header's `Skeleton` (a `div`) inside a `<p>`.
   React logs "In HTML, `<div>` cannot be a descendant of `<p>`", and the tree re-renders on
   the client.
2. **The answer does not stream; it lands.** The backend streams tokens, but the model sends
   them in large bursts and finishes in about a second, so the reply appears in two or three
   jumps. A table in flight shows as a line of pipes until its `|---|` row arrives.
3. **Too much space at the sides.** The thread and the composer are capped at `max-w-3xl`
   (768 px) in a column more than 1,300 px wide.
4. **No real edit.** The employee chats cannot edit a question. Glisp's edit (SPEC-223) re-asks
   as a new turn and keeps the old one.

## Decision

1. **Hydration**: the header subtitle is a `div`, so a skeleton may sit in it.
2. **Paced streaming, written once** (`lib/stream-pacer.ts`):
   - `revealStep(shown, target, dtMs, finishing)` is pure. It reveals at least
     `BASE_CPS` (90) characters a second, and speeds up so the backlog never takes longer
     than `CATCH_UP_S` (1.2 s), or `FINISH_S` (0.5 s) once the network has finished. It
     never ends mid-way through a multi-byte character.
   - `createStreamPacer(onFrame)` drives it on `requestAnimationFrame`: `push(full)` as
     deltas arrive, `finish()` resolves once everything is on screen, `cancel()` on error.
   - Both chat hooks use it: `useEmployeeChat` (every employee) and `useChatSession` (the
     Chat page and the Ask Glisp panel). The reply is committed only after `finish()`, so
     the streamed card hands over to the stored one with nothing jumping.
3. **Tables stream row by row**: `closeDanglingTokens` adds a header's delimiter row (or
   completes a partial one), so a table in flight renders as a table from its header line on.
4. **A wider thread, everywhere the employee chat is drawn**: one `CHAT_COLUMN_CLASS`
   (`lib/chat-layout.ts`, `max-w-6xl`) for the thread, the composer and the
   `ThreadSkeleton`. The user's bubble may take up to 80 % of it.
5. **Edit replaces, like ChatGPT** (backend SPEC-363):
   - `getAssistantReply` reads `user_message_id` from the first frame and sends
     `replace_from`.
   - Each hook swaps its local question id for the stored one as soon as it arrives.
   - `edit(messageId, text)` drops that question and everything after it from the local
     thread, then sends with `replace_from`.
   - `MessageBubble`'s edit (`onEdit`) says "Replaces this question and the answers after it"
     and appears only on a question the server has stored (`isStoredMessageId`).
   - The employee panel passes it.
   - The Chat page and the Ask Glisp panel switch from re-asking (SPEC-223) to replacing.

## FOC after this change

**What FOC sees: smoother answers, a wider thread, and edit that replaces**, as the owner
asked. No setting or stored row changes until the owner edits a question.

## Files

- `lib/stream-pacer.ts`, `lib/chat-layout.ts`, `lib/chat-edit.ts`: new.
- `lib/markdown-stream.ts`: the table delimiter.
- `services/chat.ts`: `user_message_id`, `replace_from`.
- `features/spotlight/employee-chat/use-employee-chat.ts`: pacer, stored ids, `edit`.
- `features/chat/use-chat-session.ts`, `features/chat/use-chat-history.ts`: pacer, stored ids,
  `edit`, `truncateConversation`.
- `features/chat/message-bubble.tsx`: `onEdit` replaces `onResend`.
- `features/employees/employee-chat-panel.tsx`: `div` subtitle, `CHAT_COLUMN_CLASS`, edit.
- `features/chat/chat-view.tsx`, `features/chat/chat-drawer.tsx`: pass `onEdit`.
- `features/chat/chat-skeletons.tsx`: `CHAT_COLUMN_CLASS`.
- Tests: `tests/stream-pacer.test.ts`, `tests/chat-edit.test.ts`, `tests/markdown-stream.test.ts`.

## Acceptance criteria

1. No `<div>` inside a `<p>` in the employee panel; the hydration error is gone.
2. `revealStep` keeps the backlog under 1.2 s while streaming and 0.5 s once finished, moves at
   least 90 cps, never overshoots the target, and never splits a surrogate pair.
3. A reply is committed only after the pacer has shown all of it.
4. A table header in the tail renders with a delimiter row; a partial delimiter is completed.
5. The thread, the composer and the skeleton share one width class (`max-w-6xl`).
6. Editing a stored question in any chat sends `replace_from`. The local thread keeps only the
   turns before it, then the new question and its reply. A question without a stored id shows
   no edit.
7. `npm run lint`, `npx tsc --noEmit`, `npm test` and `npm run build` are green.

## Manual verification

1. Accounts Payable › Chat: ask "What's late across all three companies?". The text and the
   table stream in at a steady pace.
2. Edit that question. The old question and answer are replaced by the new ones. Reload: the
   same.
3. The Chat page and the Ask Glisp panel: the same edit.
4. No console error on a hard reload of `/employees/finance?tab=chat`.

## Verification (2026-10-08)

| # | Criterion | Status |
|---|---|---|
| 1 | No `<div>` in a `<p>`; hydration error gone | done. The header subtitle is a `div` |
| 2 | `revealStep` pace, catch-up, no overshoot, no split pair | done. `tests/stream-pacer.test.ts` |
| 3 | Reply committed only after the pacer shows all of it | done. Both hooks `await pacer.finish()` before the commit; `createStreamPacer` tests cover finish, hidden-tab flush and cancel |
| 4 | Streaming table header gets its delimiter | done. `tests/markdown-stream.test.ts` |
| 5 | One width class | done. `CHAT_COLUMN_CLASS` (`max-w-6xl`) in the panel thread, the composer and `ThreadSkeleton`; questions take up to `max-w-[80%]` |
| 6 | Edit replaces, everywhere | done. `useEmployeeChat.edit` and `useChatSession.edit` (+ `truncateConversation`) send `replace_from`; `MessageBubble` shows Edit only on stored ids (`tests/chat-edit.test.ts`); the backend contract is in backend `tests/test_chat_edit.py` |
| 7 | Lint, types, tests, build | done. Lint 0 errors (3 old warnings), `tsc` clean, `npm test` 221 files / 2486 tests passed, build 80/80 pages |

The manual checklist was not run in a browser in this session.
