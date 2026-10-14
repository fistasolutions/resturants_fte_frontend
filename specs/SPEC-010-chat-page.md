# SPEC-010 — Chat with AI Page

**Status:** Implemented
**Phase:** 1 — Frontend Foundation (Phases.md: AI Chat page; PRD §3 AI Chat)
**Governing docs:** ../docs/Design.md §21 (AI Chat layout: History → Conversation →
Suggested Prompts), root CLAUDE.md Rules 6/8/9

## Goal

The dedicated `/chat` page: a full AI Business Analyst conversation surface with
**persistent chat history**, professional ChatGPT-grade UX, composed from small
single-responsibility components. Mock replies via `services/chat` (Phase 8 swaps to
the backend agent, streamed, same service seam).

## Layout

- **Desktop (`md+`):** two columns inside the app shell — History rail (~272px:
  New chat button + conversation list) · Conversation column (messages, composer,
  disclaimer).
- **Mobile:** conversation full-width; History opens in a left `Sheet` via a
  "History" button. Composer sticky at bottom.
- Page fills the viewport height; only the message list scrolls.

## Chat history (client-persisted, Phase 1)

- Stored in `localStorage` (`aias_chat_history_v1`) — survives reload; Phase 8
  replaces the storage adapter with backend agent sessions (per backend CLAUDE.md,
  Agents SDK sessions), same component API.
- Pure, unit-tested logic in `lib/chat-store.ts`: create conversation, append message
  (bumps `updatedAt`), auto-title from the first user message (40-char ellipsis),
  sort by recency, safe (de)serialization that rejects malformed stored data.
- First visit is seeded with 2 example conversations (`lib/mock/chat.ts`) so the
  history rail demonstrates itself; deletable like any conversation.
- `types/chat.ts` gains `ChatConversation { id, title, createdAt, updatedAt,
  messages }`.

## Components (`features/chat/`, each single-responsibility)

- `message-bubble.tsx` — role-aligned bubble + timestamp (**shared**: the dashboard
  `ai-panel` is refactored to reuse it — reuse before rebuild).
- `typing-indicator.tsx` — pulsing dots, `role="status"` (**shared** with the panel).
- `use-chat-history.ts` — hook wrapping `lib/chat-store` + localStorage (loading
  state until hydrated; never a hydration mismatch).
- `chat-history.tsx` — New chat button; conversation list (title + relative date),
  active highlight, per-item delete (accessible labels).
- `chat-empty-state.tsx` — purposeful empty state: AI mark, intro, suggested-prompt
  grid (from `services/chat.getSuggestedPrompts`).
- `chat-composer.tsx` — textarea-style input (Enter sends, Shift+Enter newline),
  send button with disabled/thinking states, disclaimer line.
- `chat-view.tsx` — message list + auto-scroll + typing indicator + composer.
- `chat-page.tsx` — client orchestrator: active conversation state, send flow
  (create-on-first-message), mobile history Sheet.
- `app/(app)/chat/page.tsx` — server: `Promise.all` prompts + user, metadata
  title "Chat with AI".

## Behavior

- Sending: optimistic user bubble → typing indicator → mock analyst reply
  (`getAssistantReply`); errors render as an assistant-style error bubble; input
  refocuses after send.
- "New chat" shows the empty state; the conversation is created on first message.
- Deleting the active conversation returns to the empty state.
- Nav: `Chat with AI` flips to `enabled: true` in `lib/navigation.ts`.

## Non-negotiables honored

Tokens only (globals.css), no entrance animations (typing pulse + hover only),
semantic HTML (one `h1`, `<ol>` history, labeled controls), keyboard-first.

## Acceptance Criteria

1. `/chat` renders history rail + conversation + composer (desktop) and the Sheet
   flow (mobile); nav item enabled and active-highlighted.
2. Full loop: new chat → prompt click or typed message → user bubble → typing →
   analyst reply; history auto-titles, re-sorts, persists across reload.
3. Delete works (incl. active conversation → empty state).
4. `lib/chat-store.ts` fully unit-tested; all suites green.
5. `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` green.

## Manual verification checklist

- [ ] Enter sends; Shift+Enter makes a newline; Escape closes mobile Sheet.
- [ ] Reload persists conversations; clearing one removes it everywhere.
- [ ] Long messages wrap; list auto-scrolls to newest; nothing animates on load.
- [ ] 375px: history via Sheet; composer reachable above keyboard.

## Patches

- 2026-07-15 — **v2 visual redesign (owner feedback: v1 looked sparse/anonymous).** Assistant messages become avatar-led flat blocks (AI mark + "AI Business Analyst" + markdown-rendered content via react-markdown); user messages stay right-aligned primary bubbles; mock replies rewritten as proper Markdown; conversation column re-weighted (wider spacing, anchored composer). MessageBubble API unchanged for the dashboard panel.
- 2026-07-15 — **v3 enhancement (owner feedback: too generic, not full width).** Conversation and composer go full-width (px-8 rhythm, no centered max-w column); user messages get an initials avatar; assistant blocks gain a footer with copy-to-clipboard + "Analytics engine · preview data" provenance; smart follow-up prompt chips appear after the last analyst reply; day separator chips between dates; composer polished (pill container, inline send, Enter-hint line).

## Patches

- **2026-07-15 — composer hint line removed (owner request).** The
  "Enter to send · Shift+Enter for a new line · AI can make mistakes" caption
  under the chat input is gone; the keyboard behavior itself is unchanged.
- **2026-07-15 — wider user bubbles (owner request).** User message max-width
  raised from 85%/60% (mobile/desktop) to 90%/75%.
- **2026-07-15 — user bubble width raised again (owner request):** 95%/90%
  (mobile/desktop).

## Patches

- **2026-07-16 — structural divider lines removed (owner decision).** The
  header `border-b`, history-rail `border-r`, and composer `border-t` are
  gone — separation now comes from spacing and the shared `bg-card` surfaces.
  Interactive borders (composer box, suggestion chips, bubbles) unchanged.
- **2026-07-16 — composer strip background removed (owner decision).** The
  full-width `bg-card` band behind the input is gone; the composer box floats
  directly on the page background.
- **2026-07-16 — custom subtle scrollbar (owner decision).** New
  `scrollbar-subtle` utility in `globals.css` (6px rounded thumb in
  `--border`, transparent track, hover deepens; Firefox `scrollbar-width`
  covered) applied to the chat history rail, the message list, and the
  reports history dropdown.
- **2026-07-17 — brand bot avatar (owner decision).** New shared
  `features/chat/bot-avatar.tsx` renders `public/bot-icon.png` (next/image,
  object-cover, ai-tint behind transparency) in place of the Sparkles glyph
  at all four bot-persona spots: chat header, message bubbles, the
  typing/streaming mark, and the empty-state hello. The composer's sparkle
  input accent and "AI analysis" badges elsewhere are unchanged.
