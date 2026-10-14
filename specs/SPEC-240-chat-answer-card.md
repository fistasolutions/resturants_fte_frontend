# SPEC-240 — The answer card

**Date:** 2026-09-14 · **Repo:** frontend · **Status:** implemented
**Backend counterpart:** `SPEC-247-chat-answer-provenance.md` (`sources` + `message_id`
on the `done` frame and on `MessageOut`; `POST /chat/messages/{id}/feedback`)

## Problem (HCI)

An assistant reply is a speech bubble with an avatar, a timestamp and a stale
"Analytics engine · preview data" caption. It says nothing about *what answered*,
*what it read*, or *what it is about*, and offers only Copy. The owner's reference
(2026-09-14) is a single card: a runtime strip and a grounded pill on top, the
answer, source chips underneath, and a footer with copy · read aloud · regenerate
on the left and 👍 👎 on the right.

## Behaviour

Every assistant turn — on the chat page and in the Ask AI panel — renders as one
bordered **answer card**:

1. **Header strip.** Left: `Runtime · <model that answered>` (the conversation's
   override, else the system default from `/chat/models`) with `· t 0.3` when a
   temperature was set. Right: a pill — **Grounded · Shopify, Loop Returns** (green,
   from `sources.systems`) when tools ran; **Conversational · no records read**
   (muted) when none did; **Reading records…** while the reply is still streaming.
2. **Body.** The reply, as Markdown, exactly as today.
3. **Source chips.** One chip per `sources.chips` entry — `Page · Inventory Analyst ›
   Dead stock`, `Product · E-Gift Card`, `Order · #FM612753`, `Store · Lawrence` —
   each a real link to its route. No chips when the backend found none.
4. **Footer.** Left: **Copy** (the Markdown), **Read aloud** (browser speech
   synthesis on the plain text of the reply — headings, emphasis, tables and links
   flattened; the button becomes **Stop** while speaking; disabled with a tooltip
   where the browser has no speech), **Regenerate** (re-asks the question that
   produced this reply as a new turn — the same rule as edit-and-resend). Right:
   **👍 👎** — one click stores it (`POST …/feedback`), a second click on the same
   clears it; the state survives a reload because history returns `feedback`.
5. **Streaming.** The card appears with the header and body as soon as the first
   token arrives; chips and the footer appear when the reply commits (the `done`
   frame carries `message_id` and `sources`, so rating works immediately).
6. **User turns are unchanged** (the dark bubble, copy/edit).

## Implementation

- `types/chat.ts`: `ChatSources`, `ChatSourceChip`; `ChatMessage.sources`,
  `.feedback`; `getAssistantReply` returns `{ reply, messageId, sources }` and the
  stored message takes the server's id.
- `services/chat.ts`: `done` frame parsing; `rateMessage`.
- `lib/markdown-plain.ts` (pure, Vitest): Markdown → speakable text.
- `lib/answer-card.ts` (pure, Vitest): `groundedPill(sources, streaming)`,
  `runtimeLabel(model, temperature, defaultModel)`, `chipPrefix(kind)`.
- `features/chat/answer-card.tsx`: the card (+ `use-read-aloud.ts`).
- `features/chat/use-chat-history.ts`: `patchMessage`; `use-chat-session.ts`:
  `rate`, `regenerate`; `chat-view.tsx` / `chat-drawer.tsx` render the card for
  assistant turns; `message-bubble.tsx` keeps only the user turn.
- Docs (Rule 11): chat doc "The conversation" section describes the card; the
  `chat` capture is refreshed.

## Acceptance criteria

- [x] A grounded reply shows `Runtime · <model>` and `Grounded · <systems>`; a
  greeting shows `Conversational · no records read`.
- [x] Chips link to real routes; a product chip opens the product page.
- [x] Copy copies the Markdown; Read aloud speaks and toggles to Stop; Regenerate
  re-asks; 👍 persists across reload and a second click clears it.
- [x] Streaming card shows header + body first; chips + footer on commit.
- [x] Light and dark; page and drawer.
- [x] `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` green.

## Verification (2026-09-14)

`npm test` 125 files / 1510 tests (new `tests/markdown-plain.test.ts`, `tests/answer-card.test.ts`; `chat-service` gained the done-frame cases), `npx tsc --noEmit`, `npm run lint` (0 errors), `npm run build` green. Live (Playwright, page + drawer, zero page errors): header "Runtime · Gemini Pro (latest) · Grounded · Shopify"; a product chip linking to `/products/9746740216038`; Copy → Copied; Read aloud called `speechSynthesis.speak` with the plain text (no `*`, `#` or `|` — a first run caught bold inside table cells and the converter was fixed), flipped to Stop and back; 👍 pressed, survived a reload, cleared on the second click; Regenerate added a new turn; in the Ask AI panel a greeting showed "Conversational · no records read". The `chat` docs capture is refreshed.
