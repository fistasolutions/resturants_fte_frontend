# SPEC-019 — Server-Backed Chat History (+ one-time localStorage migration)

**Status:** Implemented
**Owner request (2026-07-15):** chat history must live in the database with
exactly all conversations made so far.
**Backend contract:** backend SPEC-010 — `GET/DELETE /chat/conversations`,
`POST /chat/conversations/import`, `POST /chat {message, conversation_id}`
(first SSE frame `{"conversation_id"}`); all via the `/api/proxy` route that
injects the httpOnly JWT.

## What changes

Chat history's source of truth moves from localStorage to the backend. The
`useChatHistory` hook keeps its exact API (`conversations`, `startConversation`,
`addMessage`, `removeConversation`) — only the adapter inside changes, per the
Phase-1 design note in `lib/chat-store.ts`.

- **Load:** on first mount, one `GET /chat/conversations` (conversations WITH
  messages — a single HTTP call, no per-conversation fan-out). Before that GET,
  the **one-time migration**: if `aias_chat_history_v2` exists in localStorage,
  POST it to `/chat/conversations/import` (ids, titles, roles, contents,
  timestamps preserved exactly; backend is idempotent by id) and remove the key
  only on success — a failed import keeps local data for the next attempt.
- **Send:** `getAssistantReply(prompt, conversationId, onDelta)` now passes
  `conversation_id`; the **server persists both turns** (user message before
  the stream, reply at stream end). The client keeps its optimistic in-memory
  updates — no extra write calls. Client-rendered error bubbles are local-only
  (the server stores the user's question; the error text is not a real reply).
- **New chat:** stays client-created (UUID) and appears on the server when its
  first message is sent — empty "New chat" threads are never persisted.
- **Delete:** optimistic local removal + `DELETE /chat/conversations/{id}`
  (404 ignored — already gone).
- **Degradation:** if the history GET fails, the sidebar shows empty and a
  `console.error` is logged; sending still works (server will hold the new
  conversation regardless).
- `getSeedConversations()` and the hook's `seeds` parameter are removed (dead
  since live mode); `lib/chat-store.ts` pure helpers stay (migration parsing,
  local merge logic, tests).

## Files

`services/chat.ts` (list/delete/import + adapters, `conversation_id` in send),
`features/chat/use-chat-history.ts` (server adapter + migration),
`features/chat/chat-page.tsx` (pass conversation id; drop seeds),
`app/(app)/chat/page.tsx` (drop seeds fetch), `tests/chat-service.test.ts`.

## Testing

Unit (Vitest, node): API↔UI adapters both directions (field mapping, message id
stringification, import payload shape incl. exact timestamps). Existing
chat-store tests unchanged. Manual checklist (no jsdom runner): existing
localStorage history appears after reload (migrated), key removed; new
conversation + follow-up (context respected) survive a hard reload and a
different browser; delete removes across reloads.

## Acceptance criteria

1. Every conversation and message survives reloads, restarts, other browsers.
2. Pre-existing localStorage history is imported exactly once, byte-for-byte.
3. Follow-up questions carry conversational context (server replays history).
4. `npm test`, `tsc`, lint, `npm run build` green.

## Patches

- **2026-09-16 — a leftover localStorage history that the server refuses no longer
  fails every page load.** The one-time migration posted whatever the old key held; a
  thread with an empty message, an over-long message, an empty title or a non-UUID id
  is refused by the backend's validation (422), the key stayed put because it is only
  removed on success, and the same 422 fired on every load. `toImportPayload` now
  drops what the server would refuse (empty or > 8000-char messages, empty titles,
  non-UUID ids, threads left with no messages) before sending, and `migrateLocalHistory`
  clears the key on any 4xx — a payload the server rejects will never succeed on a
  retry; a 5xx or a network failure still keeps it for the next load.

