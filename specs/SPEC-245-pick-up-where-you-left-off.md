# SPEC-245 — Pick up where you left off

**Date:** 2026-09-15 · **Repo:** frontend · **Status:** implemented
**Backend counterpart:** `SPEC-252-chat-last-active-conversation.md`
(`users.last_conversation_id`, `PUT /chat/active`, `active_id` on the history list)
**Builds on:** `SPEC-235-ask-ai-drawer.md` (ideas document, item 13)

## Problem

The Ask AI panel keeps its thread while the owner moves between pages, but a browser
reload, a new tab or the phone opens it empty — the thread is still in history, one
click away in the full workspace, but the panel does not know it was the one in use.
Idea 13: "the panel simply opens on the right thread."

## Behaviour

1. **The account remembers the thread.** Whenever a conversation becomes the active
   one — a thread is selected in the rail, a reply arrives in a new thread, New chat is
   pressed (→ none), the active thread is deleted (→ none) — the client records it with
   `PUT /chat/active`. Fire-and-forget, skipped when unchanged; a failure is logged and
   never blocks the UI. Both surfaces write: the `/chat` workspace and the panel share
   one history and one pointer.

2. **The panel reopens on it.** The first time the panel's history loads in a page life
   (first open, hover warm-up, or a ✦ / selection press), if the panel has no thread of
   its own yet and the history carries an `active_id` that is in the list, the panel
   selects that thread — its messages, its follow-up chips (SPEC-223) — instead of the
   empty state. Only once: a thread the owner starts before history lands (a cold ✦
   press, SPEC-242) is never replaced by the remembered one.

3. **The `/chat` workspace is unchanged.** It still opens on New chat with the rail
   beside it (or on `?c=` from the panel's hand-off); it only *writes* the pointer.

4. **Nothing else moves.** `?c=` hand-off, ⌘J, the launcher warm-up, follow-up chips
   and the drawer's close/reopen behaviour are as SPEC-235 describes.

## Implementation

- `services/chat.ts` — `listConversations()` returns `{ conversations, activeId }`;
  `setActiveConversation(id | null)` → `PUT /chat/active`.
- `features/chat/use-chat-history.ts` — the store keeps `lastActive`
  (`undefined` = not loaded yet, then the server's value); `rememberActive(id)` updates
  it and writes to the server when it changes.
- `features/chat/use-chat-session.ts` — `useChatSession(loadHistory, { restoreLast })`;
  the drawer's provider passes `restoreLast: true`; select / new / delete / first reply
  call `rememberActive`.
- `lib/docs/content/chat.ts` — "Ask AI from any page" prose.

## Acceptance criteria

- [x] Ask in the panel, reload the page, open the panel → the same thread is showing.
- [x] Open the panel in a second browser context (fresh cookies = another device) → the same thread.
- [x] New chat in the panel, reload → the panel opens empty.
- [x] Press ✦ on a cold panel with a remembered thread → the new question's thread wins, not the remembered one.
- [x] `/chat` still opens on New chat; selecting a thread there and reloading the Dashboard opens the panel on it.
- [x] Vitest: `listConversations` parses `active_id`; `setActiveConversation` sends the body and tolerates failure; `npm test`, `tsc`, lint, `npm run build` green.

## Manual verification checklist

1. Dashboard → ✦ on Revenue → wait for the reply → reload → open the panel: the Revenue thread is there.
2. Close the panel, New chat, reload → panel empty.
3. `/chat` → pick an old thread → go to Dashboard → open the panel: that thread.
