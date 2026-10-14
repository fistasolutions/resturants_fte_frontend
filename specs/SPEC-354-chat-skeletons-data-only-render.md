# SPEC-354 — Chat skeletons: the frame stays, only the data arrives

**Status:** Implemented
**Date:** 2026-10-08
**Repo:** ecommerce-fte-frontend
**Builds on:** SPEC-232 (persistent shells), SPEC-245 (pick up where you left off), SPEC-293 /
SPEC-301 (the employee chat panel), SPEC-352 (one answer renderer)

## Problem

Owner: "make sure proper skeleton loading to chat and all; the whole thing, just data renders,
not the UI."

Opening a chat today repaints the interface while its data arrives:

1. **Employee chats** (Search Visibility, Accounts Payable, Email Marketing Manager, Customer
   Support Agent: one panel, `EmployeeChatView`):
   - While the threads load, the rail says **"No chats yet."** (false), the thread says
     "Opening your chats…" in plain text, and the header says "New chat".
   - When the threads land, the hook picks the last-opened thread **one tick later**
     (`setTimeout(0)`). In between, the welcome screen ("Talk to Accounts Payable" with
     starters) paints for a frame, then the thread replaces it.
2. **Ask Glisp panel** (`restoreLast`): until history lands it shows the starter prompts,
   then swaps to the restored thread.
3. **Chat with AI › `/chat?c=<id>`** (the panel's hand-off): the welcome screen shows until
   history lands, then the thread replaces it.
4. `features/finance/finance-skeleton.tsx` `ChatSkeleton` (two grey blocks) is imported by
   nothing.

## Decision

**One skeleton, written once, everywhere a chat waits for its data.** The frame (rail, header,
composer) paints immediately and never changes shape. Only the data area shows the skeleton,
and then the data. A screen that is not the answer (the welcome state, "No chats yet")
is shown only once the data has said it is the answer.

- `features/chat/chat-skeletons.tsx`:
  - `ThreadSkeleton`: a user bubble on the right, then an answer-card-shaped block on the
    left (header strip, three text lines, a table-shaped block), twice.
  - `RailSkeleton`: thread rows.

  Both are tokens-only `Skeleton`s with `aria-busy` and a screen-reader label. They have no
  entrance animation, only the skeleton pulse (Rule 9).
- **Employee chats**:
  - `useEmployeeChat` decides the open thread **synchronously** once hydrated and the threads
    are known: `chosen ?? threadToOpen(threads, remembered)`. The deferred tick and its
    `opened` flag are removed. It exposes `settled`: the thread to show is known.
  - `EmployeeChatView` draws `RailSkeleton` while the threads are unknown, a header subtitle
    skeleton, and `ThreadSkeleton` until `settled`. Then it draws the thread or, for a real
    new chat, the welcome state.
  - Reading the remembered id waits for hydration (`useHydrated`), so the server render and
    the first client render match (no React #418).
- **Ask Glisp panel**: `useChatSession` exposes `restoring` (a `restoreLast` session whose
  history has not landed). The panel shows `ThreadSkeleton` instead of the starter prompts
  while restoring, unless a send has already started a thread. A failed history load
  settles `restoring` (the store emits an empty list and no active id), so the skeleton
  cannot stick.
- **`/chat?c=<id>`**: `ChatPage` keeps the hand-off pending until it has been applied or
  dismissed. `ChatView` takes `loading` and shows `ThreadSkeleton` in place of the welcome
  state meanwhile.
- The unused Finance `ChatSkeleton` is deleted.

## FOC after this change

**What FOC sees: the same chats, without the flashes.** No data, setting or behaviour changes.
What is shown while waiting is a skeleton instead of a wrong screen.

## Files

- `features/chat/chat-skeletons.tsx`: new.
- `features/spotlight/employee-chat/use-employee-chat.ts`: synchronous choice, `settled`.
- `features/employees/employee-chat-panel.tsx`: rail, header and thread skeletons.
- `features/chat/use-chat-session.ts`: `restoring`.
- `features/chat/chat-drawer.tsx`: skeleton while restoring.
- `features/chat/chat-page.tsx`, `features/chat/chat-view.tsx`: the pending hand-off and
  `loading`.
- `features/finance/finance-skeleton.tsx`: the unused `ChatSkeleton` goes.

## Acceptance criteria

1. No employee chat ever shows "No chats yet." before its threads have loaded, or the welcome
   state before the thread to open is known.
2. Reopening an employee chat with a remembered thread goes skeleton → that thread, with no
   intermediate screen.
3. The Ask Glisp panel goes skeleton → restored thread (or → the starters when there is none).
   A send while restoring shows the thread being written, not the skeleton.
4. `/chat?c=<id>` goes skeleton → that thread. `/chat` with no `c` shows the welcome state at
   once.
5. Frames never change shape: rail, header and composer are the same elements before and after.
6. `npm run lint`, `npx tsc --noEmit`, `npm test` and `npm run build` are green.

## Manual verification (no component runner, Rule 4)

Throttle the network to "Slow 4G" and:
1. Open each employee's Chat tab cold, and again after a reload.
2. Open the Ask Glisp panel after a reload.
3. Open `/chat?c=<a real id>`.

Each shows the skeleton in the data area only, then the data.

## Verification (2026-10-08)

| # | Criterion | Status |
|---|---|---|
| 1 | No "No chats yet" or welcome state before the data says so | done. The rail takes `null` → `RailSkeleton`; the thread shows `ThreadSkeleton` until `settled` |
| 2 | Remembered thread: skeleton → thread, no tick | done. The choice is derived in the render the list lands (`chosen ?? threadToOpen(threads, remembered)`); the `setTimeout(0)` and `opened` are gone. The remembered id is a `useSyncExternalStore` snapshot (server `null`) behind `useHydrated` |
| 3 | Ask Glisp: skeleton → restored thread or starters; a send while restoring shows the thread | done. `restoring` from `useChatSession`; the skeleton only while the thread is empty |
| 4 | `/chat?c=` skeleton → thread; `/chat` welcome at once | done. `handOffPending` starts `true` only with a `c`, and clears when the hand-off is applied or dismissed |
| 5 | Frames never change shape | done. Only the data areas switch; rail, header and composer are the same elements |
| 6 | Lint, types, tests, build | done. `npm run lint` 0 errors (3 old warnings), `tsc` clean, `npm test` 219 files / 2471 tests passed, `npm run build` 80/80 pages |

The slow-network checklist above was not run in a browser in this session.
