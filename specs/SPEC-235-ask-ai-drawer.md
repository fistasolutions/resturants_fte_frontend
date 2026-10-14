# SPEC-235 — Ask AI drawer: the analyst on every page

**Date:** 2026-09-14 · **Repo:** frontend · **Status:** implemented
**Backend counterpart:** none — reuses `POST /chat` (SSE) and
`GET/DELETE /chat/conversations*` exactly as `/chat` does today. No backend change.

## Problem (HCI)

The analyst lives on one page. From Inventory, Orders, Returns or the Brief, a
question the reader has *right now* ("why is this location's AOV down?") costs a
navigation away from the thing they were looking at, an answer, and a navigation
back — so the question is usually not asked. Owner request 2026-09-14: keep the
`/chat` page exactly as it is, and add a persistent trigger in the app shell that
opens the same analyst in a panel that slides in from the right, over the page,
on every route.

The persistent shell on desktop is the **sidebar** — there is no top bar (SPEC-232
gave each route its own `PageHeader`, whose right edge already carries the store
switcher and date-range picker). A trigger fixed to the top-right of the viewport
would sit on top of those controls on every page. The mobile shell *does* have a
header (`app/(app)/layout.tsx`, `md:hidden`).

## Behaviour

1. **One trigger per form factor, both in the persistent layout.**
   - **Desktop (`md+`)**: a floating launcher pill fixed to the bottom-right of the
     viewport — bot avatar + "Ask AI" + a `⌘J` hint — `bg-foreground text-background`
     (the same ink tile the bot avatar uses), subtle shadow, 150 ms hover lift.
     It sits *below* the media-toast host (`z-40` vs `z-50`) and never covers a page
     header.
   - **Mobile**: an icon button at the right end of the existing mobile header.
   - Both are hidden on `/chat` itself (the full workspace is already open), and the
     desktop pill is hidden while the drawer is open (the panel covers that corner).
2. **The drawer.** A shadcn `Sheet` on the right: full width on mobile, `max-w-md`
   (28 rem) from `sm`. Enter = 100 % slide from the right, 250 ms ease-out; exit =
   slide back out; the overlay is the existing light dim + blur. Escape, click
   outside, and the ✕ all close it. Focus moves into the panel on open (Radix) and
   the composer is focused, so the reader can type immediately.
3. **Same analyst, same history.** The drawer reads and writes the same chat history
   store `/chat` uses (`features/chat/use-chat-history.ts`) and streams through the
   same `getAssistantReply` (`services/chat.ts`) — the server persists every turn.
   A conversation started in the drawer therefore appears in the `/chat` history
   rail, with its follow-up chips, and vice-versa.
4. **The conversation survives navigation and close/re-open.** The drawer's session
   (active conversation, draft input, in-flight stream) lives in a provider mounted
   in `app/(app)/layout.tsx`, which Next never unmounts on client navigation. Close
   the panel, move to another page, re-open it: the thread is still there and a
   reply that was streaming is still streaming. A fresh browser load starts empty.
5. **Grounded prompts that follow the page.** On an empty thread the panel shows a
   one-line intro and four prompt rows. The set is chosen from the current route's
   first segment and every prompt names something the analyst has a backend tool
   for (`app/services/ai/tools.py` + `integration_tools.py`): Inventory asks about
   cover and reorders, Returns about reasons and backlog, Warehouse about packing and
   unfulfilled orders, Store Traffic about footfall and peak hours, Spotlight about
   search visibility, Sales & Tax about the tax summary, Team Performance about
   support agents — and routes with no analyst tool (Social, Ads, Results, AI,
   System, Integrations, Settings, Docs) fall back to the four `/chat` starters.
6. **Hand-off to the full workspace.** "Open full workspace" in the panel header
   links to `/chat?c=<conversationId>` (bare `/chat` when the thread is empty); the
   chat page opens that conversation, so nothing is lost in the move.
7. **Keyboard.** `⌘J` / `Ctrl+J` toggles the drawer anywhere except `/chat` and
   inside editable fields; `Esc` closes it. `⌘B` (sidebar) is untouched.
8. **Motion budget (Rule 9).** The only animation is the sheet's own open/close
   transition and the launcher's hover state. Nothing animates on load or route
   change; the launcher renders in place.

## Implementation

- `lib/chat-drawer-prompts.ts` (new, pure, Vitest-covered): `DrawerPrompt`
  (`id`, `label`, `icon` key), `DRAWER_PROMPTS_BY_ROUTE`, `DEFAULT_DRAWER_PROMPTS`,
  `promptsForPath(pathname)` (first-segment match, `/` → dashboard, unknown → default),
  `isChatWorkspace(pathname)`, `chatWorkspaceHref(conversationId)`,
  `CHAT_DRAWER_SHORTCUT_KEY = "j"`, `isChatDrawerShortcut(event-like)`,
  `isEditableTarget(tagName, isContentEditable)`.
- `features/chat/use-chat-session.ts` (new): the send/select/new/delete orchestration
  lifted out of `chat-page.tsx` — `activeId`, `input`, `isThinking`, `streamingReply`,
  `thinkingStatus`, `dynamicPrompts`, `send`, `selectConversation`, `newChat`,
  `deleteConversation`. One hook, two consumers; behaviour on `/chat` is unchanged.
- `features/chat/chat-page.tsx`: consumes `useChatSession`; new optional
  `initialConversationId` prop selects that thread once history has loaded.
- `app/(app)/chat/page.tsx`: reads `?c=` and passes it through.
- `features/chat/chat-drawer-provider.tsx` (new, `"use client"`): context holding
  `open`, `setOpen`, `toggle`, plus the `useChatSession` instance so the thread
  outlives the sheet; installs the `⌘J` listener; forces closed on `/chat`.
- `features/chat/chat-drawer.tsx` (new): the `Sheet` — header (avatar, title, online
  dot, New chat, Open full workspace, ✕), scrolling body (empty state with route
  prompts, or the message list with `MessageBubble` compact variant, typing
  indicator, streaming markdown and follow-up chips), pinned `ChatComposer`.
- `features/chat/chat-launcher.tsx` (new): `ChatLauncher` (desktop pill) and
  `ChatDrawerTrigger` (mobile header icon).
- `app/(app)/layout.tsx`: wraps `SidebarInset` children in `ChatDrawerProvider`;
  adds the mobile trigger to the header and `<ChatLauncher />` + `<ChatDrawer />`
  after `{children}`.
- Docs (Rule 11): `lib/docs/content/chat.ts` gains an "Ask AI from any page"
  section and updated how-to/good-to-know; `lib/docs/overview.ts` conventions gain
  "Ask AI anywhere". `updated` bumped.

## Acceptance criteria

- [x] Every `(app)` route except `/chat` shows the desktop pill (bottom-right) and,
  below `md`, the header icon; `/chat` shows neither.
- [x] Click / `⌘J` opens the panel with a 250 ms slide from the right; `Esc`, the
  overlay, and ✕ close it with the reverse slide. No other element moves.
- [x] A question sent from the drawer streams live, shows the analyst's status
  phrase while tools run, and — after the reply — its follow-up chips.
- [x] That conversation appears in `/chat`'s history rail with the same messages.
- [x] Close the drawer, navigate to another page, re-open: same thread, same draft.
- [x] Prompt rows change per route (e.g. `/inventory` vs `/returns`) and fall back
  to the starters on `/social`.
- [x] "Open full workspace" lands on `/chat?c=<id>` with that thread selected.
- [x] `⌘J` pressed inside a textarea/input does nothing.
- [x] Light and dark themes: the pill, panel, bubbles and chips use tokens only.
- [x] `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` green.

## Tests

`tests/chat-drawer-prompts.test.ts` — route resolution (segment match, nested
routes, root, unknown → default), every prompt set is exactly four unique labels,
`isChatWorkspace`, `chatWorkspaceHref` encoding, shortcut matching (meta/ctrl,
case, editable targets ignored).

## Verification (2026-09-14, live app on localhost, Playwright)

17/17 driven checks passed, zero page errors: launcher on `/inventory`, open
→ painted 463 ms, composer focused, launcher hidden while open, Inventory
prompts; a real question streamed (first token 14.7 s / full reply 20.1 s on one
run, 50 s on another — backend agent time on the same `/chat` endpoint the page
uses) and committed with follow-up chips; Escape closed; client-side navigation
to `/orders` + `⌘J` reopened the same thread; `/chat?c=<id>` opened with the
thread selected and no launcher; `⌘J` inert on `/chat` and inside an input;
`/returns` prompts differ; dark theme; phone header icon + 390 px full-width
panel. `npm test` 119 files / 1447 tests, `npx tsc --noEmit`, `npm run lint`
(0 errors), `npm run build` all green.

## Manual checklist (no component runner)

- Desktop 1440 / laptop 1280 / tablet 820 / phone 390: trigger placement, panel
  width, composer reachable above the keyboard on phone.
- Open the panel, switch theme: no hard-coded colour anywhere.
- Start a reply, close the panel mid-stream, re-open: the stream is still going and
  completes; the `/chat` rail shows the finished reply.
- Tab order: launcher → panel header actions → prompts → composer → close.

## Patches

- **2026-09-15 (SPEC-243):** a send on a cold panel no longer waits for the history
  fetch. `useChatSession.send` starts the thread at once and `loadChatHistory` folds
  the server list in behind whatever is on screen (`lib/chat-store.ts`
  `mergeConversations` — local threads kept as they are, unseen server threads added;
  a `loaded` flag replaces the "snapshot is non-null" check). Measured: the first turn
  appeared 7 s after a cold ✦ press before (87 conversations, 380 KB history); now at
  once. The launcher's hover warm-up is unchanged.
- **2026-09-16:** (1) follow-up chips no longer overflow the panel — the base button
  is `shrink-0 whitespace-nowrap`, so a long chip kept its max-content width; chips are
  now `shrink min-w-0 max-w-full whitespace-normal` and wrap. (2) A full-width hand-off
  line sits above the composer — *"Open the full workspace — projects, pinned chats,
  history and model choice ↗"* — the header's expand icon stays.
- **2026-09-16 — the panel opens at the latest message.** Since SPEC-245 the panel
  reopens on the last thread, but it scrolled to the bottom once, at the moment `open`
  flipped — before the sheet had slid in and before the restored thread's cards,
  tables and images had their height, so a long thread opened at the top. The
  bottom-follow now runs on open and on every content resize while the reader is at
  the bottom (a `ResizeObserver` on the thread wrapper, a frame after open, and once
  more after the slide-in), so the latest message is on screen whatever arrives late;
  a reader who scrolled up is left where they are, as before.
- **2026-09-16 — a reopened panel opens on the latest message.** The first open
  landed at the bottom (history arriving re-ran the snap) but every reopen sat at
  the top: the sheet mounts its content a tick after `open` flips, so the snap
  effect ran before the scroll box existed. The box now attaches through a memoised
  callback ref that bumps a mount counter the effect keys on. Measured: 0 px from
  the bottom on open #1, #2 and #3.
