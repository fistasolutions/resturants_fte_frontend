# SPEC-249 — Chat projects, pinned chats, pinned answers

**Date:** 2026-09-16 · **Repo:** frontend · **Status:** implemented
**Backend counterpart:** `SPEC-255-chat-projects-and-pins.md`
**Builds on:** `SPEC-032-chat-history-rail.md` (the rail), `SPEC-240-chat-answer-card.md`
(the answer footer), `SPEC-245-pick-up-where-you-left-off.md`

## Problem

The history rail is one flat list, grouped by day. The owner asked for the way Claude's
sidebar works: **Projects** to group chats (and to start a chat inside), a **Pinned**
section for the chats that matter, and a **pin on an answer** so the one reply worth
keeping in a long thread stays at the top of it. Every section with its own height,
its own scrollbar, a real empty state, and proper create / rename / delete.

## Behaviour

### The rail (desktop `aside`, phone sheet — same component)

Top: **New chat** (unfiled) and the collapse control, as today. Below, three sections,
each a labelled region with a header row, a count, its own `max-height` and the
`scrollbar-subtle` scrollbar, and an empty state that explains what the section is for:

1. **Projects** — header with a **+** (New project). Each project is a row with a folder
   icon, the name, its chat count and a ⋯ menu (**New chat here**, **Rename**,
   **Delete**). Click the row to expand it and list its chats (newest first); the
   active chat's project is expanded on load. Empty: *"No projects yet. Group the chats
   about one supplier, one season or one problem."* with a **New project** button.
   Max height `40svh`.
2. **Pinned** — pinned chats, newest-pinned first, a pin icon on each. Empty: *"Pin a
   chat to keep it here."* Max height `28svh`.
3. **Chats** — every unfiled, unpinned chat grouped by day as today. Empty: *"No
   conversations yet. Start a new chat to ask about your store."* Takes the remaining
   height.

Every chat row (in any section) has a ⋯ menu on hover/focus: **Pin** / **Unpin**,
**Move to project ▸** (each project, plus **No project**), **Delete**. The delete stays
one click, as today (SPEC-032); projects delete behind an `AlertDialog` because they
group other things.

### Projects CRUD

- **New project** opens a `Dialog` with one field (name, 1–60 chars, trimmed; the button
  disabled until valid; Enter submits; a duplicate name shows the server's message
  inline). It is created optimistically, then reconciled with the server's id — a
  failure removes it and shows the error in the dialog.
- **Rename** reuses the dialog, prefilled. **Delete** asks, then unfiles the chats
  (they reappear under Chats), never deletes them.
- **New chat here** starts a thread inside the project: the composer's empty state
  shows *"New chat in <Project>"*; the first send carries `project_id`, so a reload
  mid-stream keeps the filing.

### Pinned answers

- The answer card's footer gains **Pin** / **Unpin** (Lucide `Pin` / `PinOff`) next to
  regenerate; optimistic, reverted on failure; works in the panel too.
- A conversation with pinned answers shows a **Pinned answers** strip under the header:
  one row per pinned answer (its first sentence, ≤ 120 chars), click scrolls to the
  message and highlights it for a moment; each row has its own unpin. Max height
  `9rem`, own scrollbar; collapsible; hidden when nothing is pinned.

### Details

- Pure logic in `lib/chat-rail.ts` (section building, name validation, first-sentence
  excerpt) — Vitest-covered. `lib/conversation-groups.ts` keeps day grouping.
- The store (`use-chat-history.ts`) holds `projects` beside `conversations`; every
  mutation is optimistic and reconciled; a failed server write reverts and logs.
- `useChatSession` gains `newChat(projectId?)`, `pinConversation`, `moveConversation`,
  `pinMessage`, `createProject`, `renameProject`, `deleteProject`.
- Tokens only; the pin icon uses `text-ai` when active; no motion beyond hover and the
  shadcn dialog/menu transitions.

## Acceptance criteria

- [x] Three sections with headers, counts, heights, scrollbars and empty states, desktop and phone.
- [x] Create / rename / delete a project; delete unfiles; a chat can be started inside a project and stays filed after a reload.
- [x] Pin / unpin a chat from the ⋯ menu; move between projects and to "No project".
- [x] Pin / unpin an answer from its footer; the strip lists it, click jumps to it.
- [x] Everything survives a reload (server-backed) and shows in the panel where relevant.
- [x] `npm test`, `tsc`, lint, `npm run build` green; docs updated with a capture.

## Manual verification checklist

1. New project "Supplier X" → appears under Projects (1 → count 0) → ⋯ New chat here → ask → reload → the chat is inside the project.
2. ⋯ Pin on a chat → Pinned section → Unpin → back under Chats.
3. Move a chat to a project and back to No project.
4. Pin an answer → strip appears → click → scrolls; Unpin from the strip.
5. Delete the project → its chats are back under Chats.
6. Empty states: fresh account shows all three.

## Patches

- **2026-09-16 — one ellipsis, not two.** A title cut at 40 characters already ends in
  "…" (backend `conversation_title_from`, `lib/chat-store.ts`), and a rail row's own
  `truncate` added a second one on narrow rails. `lib/chat-rail.ts` `railTitle` strips
  the stored ellipsis for the row (the full title is on hover via `title=`); the CSS
  cut is the only one the reader sees.
- **2026-09-16 — the row menu is a chevron, not ⋯.** Next to a truncated title the
  ⋯ trigger read as a second ellipsis ("…⋯"); chat and project rows now open their
  menu from a `ChevronDown`, so a row shows one set of dots at most.
- **2026-09-16 — long titles fade, never "…".** The owner wanted one mark per row.
  `.fade-end` (globals.css) masks the last 1.5rem of a chat or project title to
  transparent instead of `truncate`'s ellipsis, so the chevron menu is the only thing
  after the text; the full title stays on hover.
