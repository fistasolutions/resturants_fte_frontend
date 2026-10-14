# SPEC-255 — Project colours, icons, and "you are in this project"

**Date:** 2026-09-16 · **Repo:** frontend · **Status:** implemented
**Backend counterpart:** `SPEC-258-chat-project-style.md`
**Extends:** `SPEC-249-chat-projects-and-pins.md`

## Problem

Projects all look the same (a grey folder), and starting a chat inside one takes a ⋯
menu: the owner opened "Return", pressed New chat, and the chat landed outside it. The
owner wants it the way Claude works — a colour and an icon per project, and once you
click a project you are *in* it: New chat, and anything you start, lands there.

## Behaviour

1. **Colour and icon.** The project dialog (create / rename) gains a colour row
   (eight swatches — `slate violet blue teal green amber rose orange`, tokens
   `--label-*` in `globals.css`, light and dark) and an icon grid (twelve Lucide icons —
   `folder tag bag truck users chart calendar flame star box receipt megaphone`).
   Defaults `slate` / `folder`. The project row shows its icon in its colour; every chat
   filed in it shows a small dot of that colour before its title — in Projects, in
   Pinned, and in the composer banner.

2. **The current project.** Clicking a project row (its name — the chevron folds
   independently) *enters* it: the row is highlighted, it unfolds, and the composer
   shows *"New chat in <Project>"* ready to type. While a project is current:
   - the top **New chat** button reads *"New chat · <Project>"* with the colour dot and
     starts the thread there;
   - a thread started any other way (a prompt, ✦ Explain from the panel while the
     workspace is open, dictation) lands there;
   - the composer banner offers **Leave project**, which returns to plain New chat.
   Selecting a chat makes *its* project current (or none, for an unfiled chat); the
   panel's own session is unaffected — the context is the workspace's.

3. Everything else — ⋯ New chat here, Move, Pin, Rename, Delete — as SPEC-249.

## Implementation

- `lib/project-style.ts` — `PROJECT_COLORS`, `PROJECT_ICONS` (pinned to the backend
  lists by a test), `colorClass(color)` (token classes), `projectIcon(icon)`.
- `app/globals.css` — `--label-slate … --label-orange` (light + dark) exposed as
  `bg-label-*` / `text-label-*` through `@theme inline`.
- `types/chat.ts` (`ChatProject.color/icon`), `services/chat.ts`
  (`createProject(name, style)`, `updateProject(id, patch)`), the store (optimistic
  style edits), `useChatSession` (`currentProjectId`, `enterProject`, `leaveProject`;
  `newChat()` with no argument uses the current project), `project-dialog.tsx`,
  `chat-history.tsx`, `chat-view.tsx` (banner with Leave), `chat-page.tsx`.
- Docs: Chat › History rail prose.

## Acceptance criteria

- [x] Create a project with a colour and an icon → row shows them; rename keeps them; change them from Rename.
- [x] Click a project → highlighted, composer says "New chat in X" → New chat / typing / a prompt → the chat is filed in X.
- [x] Leave project → New chat is plain again. Selecting an unfiled chat leaves the project.
- [x] Filed chats carry the project's colour dot in every section.
- [x] Both themes; `npm test`, `tsc`, lint, `npm run build` green; docs updated.

## Patches

- **2026-09-16 (owner review):** the "In project X" banner over an *open* thread is
  gone — the rail already shows where a chat lives; the banner stays only on a fresh
  thread ("New chat in X · Leave project"). Chat rows lost the native `title` tooltip
  (it sat over the next row) and gained `space-y-1`. The colour swatches and the
  6-across icon grid were correct in the build but the owner's dev server served a
  stale stylesheet (Tailwind's scan cache — the same thing that hid `fade-end`); the
  dev server was restarted with `.next/dev` cleared.

## Patches

- **2026-09-16 — the project you are in is the highlighted folder, nothing else.**
  Owner, on the first look: "remove this 'New chat in Return · Leave project' text —
  make it professional; instead of the green dot, colour the folder row." So: the
  banner over an empty conversation is gone; the New chat button reads "New chat" (its
  tooltip still names the project); chat rows no longer carry a project dot — a filed
  chat sits under its folder, and that is its label. The current project's row is
  tinted in the project's own colour (`colorTint` in `lib/project-style.ts` —
  `bg-label-*/15`, written out for Tailwind) with its name in the foreground; clicking
  the current project's name again leaves it, and its menu gains **Leave project**
  (`ChatHistoryActions.onLeaveProject`). `ChatView` lost `projectName` / `projectColor`
  / `onLeaveProject`.

