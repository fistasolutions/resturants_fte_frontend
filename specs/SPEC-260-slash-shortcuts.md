# SPEC-260 — Slash shortcuts

**Date:** 2026-09-17 · **Repo:** frontend (no backend change) · **Status:** implemented
**Builds on:** `SPEC-238` Patches (the two-row composer), `SPEC-235-ask-ai-drawer.md`.
Ideas document item 09.

## Problem

The owner asks the same twelve things every day — revenue, orders, top products, stock,
quiet customers — and types each in full. A slash shortcut turns them into three
keystrokes and an argument: `/revenue 30d`, `/stock`, `/product Katie Dress`.

## Behaviour

1. **Type `/` as the first character of the message box** (chat page or Ask Glisp
   panel) and a menu opens above it listing the shortcuts, narrowed as you type
   (`/re` → `/revenue`, `/returns`). ↑ ↓ move, **Tab** or **Enter** picks (fills
   `/revenue ` and keeps typing), **Esc** closes. Click picks too. The menu shows each
   command, its argument (`[period]`, `<product>`, `<store>`) and what it will ask.

2. **Send expands the shortcut into the full question** the analyst has a tool for —
   the message in the thread is the expanded question, so history reads honestly and
   the analyst never sees a bare `/revenue`:

   | Shortcut | Argument | Asks |
   | --- | --- | --- |
   | `/revenue` | period | How is revenue for the {period}, and how does it compare to the period before? |
   | `/orders` | period | How many orders in the {period}, and how does that compare to the period before? |
   | `/top` | period | What were my top products by revenue in the {period}? |
   | `/worst` | period | Which products sold worst in the {period}? |
   | `/customers` | period | New vs returning customers in the {period}? |
   | `/vip` | — | Which of my best customers have gone quiet? |
   | `/stock` | — | Anything low on stock I should reorder? |
   | `/dead` | — | What is sitting as dead stock right now? |
   | `/returns` | period | Why are customers returning items in the {period}? |
   | `/discounts` | period | Where are discounts hurting margin in the {period}? |
   | `/support` | period | How is the support team performing in the {period}? |
   | `/warehouse` | — | How is warehouse packing going right now? |
   | `/traffic` | period | How is store footfall and conversion in the {period}? |
   | `/tax` | — | What is my sales tax position this month? |
   | `/compare` | — | Compare this week to last week — revenue, orders and AOV. |
   | `/product` | name | How is "{name}" selling — units, revenue, returns? |
   | `/store` | name | How is the {name} store doing — revenue, orders, footfall? |
   | `/help` | — | (opens the menu — never sent) |

   Periods: `today`, `yesterday`, `7d` (default), `30d`, `90d`; anything else is left
   in the question verbatim ("last quarter"). A shortcut that needs a name and has none
   asks for it in the menu instead of sending.

3. An unknown `/word` is sent as typed — the analyst is allowed to see it.

## Implementation

- `lib/slash-commands.ts` — pure: `SLASH_COMMANDS`, `parseSlash(text)`,
  `filterSlash(query)`, `expandSlash(text)` (null when not a shortcut / incomplete),
  `periodPhrase(arg)`. Vitest-covered.
- `features/chat/slash-menu.tsx` — the list above the textarea.
- `features/chat/chat-composer.tsx` — opens the menu on a leading `/`, keyboard
  handling, expands on send; `onSend(text)` now carries the text to send.
- `features/chat/chat-view.tsx`, `chat-drawer.tsx` — `onSend={(text) => send(text)}`.
- Docs: `lib/docs/content/chat.ts` "Slash shortcuts" section with a capture.

## Acceptance criteria

- [x] `/` opens the menu; `/re` narrows; Tab fills; Enter on `/revenue 30d` sends the expanded question and the thread shows it.
- [x] `/product` with no name does not send; `/help` never sends; `/unknown` sends as typed.
- [x] Works in the panel; `npm test`, `tsc`, lint, `npm run build` green; docs updated.
