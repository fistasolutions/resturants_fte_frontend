# SPEC-016 — True Chat Streaming & Scroll Containment

**Status:** Implemented
**Builds on:** SPEC-010 (chat page), SPEC-015-live-api-integration (SSE agent
endpoint). Owner request 2026-07-15: replies must render progressively in chunks
(parsed as Markdown while streaming), and the conversation must be a fixed-height
region that scrolls internally — the page must never grow/move down as messages
arrive.

## 1. Streaming (both chat surfaces)

- `services/chat.getAssistantReply(prompt, onDelta?)` — new optional callback
  invoked with the **accumulated** reply text after every SSE frame; the promise
  still resolves the full text (same error semantics). Unit-tested with a stubbed
  `fetch` + `ReadableStream` emitting SSE frames: progressive callback values and
  final resolution both asserted.
- **Chat page** (`chat-page.tsx` → `chat-view.tsx`): a `streamingReply` state
  (NOT the persisted store — no localStorage writes per token). Flow: user bubble →
  typing dots until the **first chunk** → live assistant bubble that grows chunk by
  chunk, rendered through the existing `ChatMarkdown` (so formatting parses
  progressively) → on completion the final text is committed to the history store;
  on mid-stream error, the partial is discarded and an error bubble is committed.
- **Dashboard AI panel** (`ai-panel.tsx`): same pattern with its local message
  state (draft assistant message updated in place).

## 2. Scroll containment

- Chat page root becomes a hard-capped viewport region:
  `h-[calc(100svh-3.5rem)] md:h-svh` + `overflow-hidden`, with an unbroken
  `min-h-0` flex chain down to the message list — **only** the message list
  (`overflow-y-auto`) and history rail scroll; header + composer stay pinned.
- Auto-scroll targets the **scroll container** (`scrollTop = scrollHeight`), never
  `scrollIntoView` (which was able to scroll the document — the "moves down down"
  bug). **Smart follow:** during streaming, auto-follow only while the user is
  within 80px of the bottom — scrolling up to re-read is never hijacked.
- AI panel message list: same container-based scrolling (it is already
  independently scrollable; `scrollIntoView` replaced the same way).

## Acceptance Criteria

1. Sending a message shows dots → first chunk swaps in a live bubble that grows;
   Markdown (bold/lists/tables) renders correctly mid-stream and at completion.
2. Completed replies persist to history exactly once; errors produce an error
   bubble, never a lost conversation.
3. With many/long messages the page body NEVER scrolls on `/chat`; composer and
   header remain visible; inner list scrolls; user-scrolled-up position is
   respected during streaming.
4. Service streaming behavior unit-tested; all suites green.
5. `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` green.

## Manual verification checklist

- [ ] Ask a long question; watch chunks render with live markdown; no layout jump.
- [ ] Scroll up mid-stream — view stays put; scroll to bottom — following resumes.
- [ ] Fill the viewport with messages: composer never leaves the screen.
- [ ] Same behaviors in the dashboard panel.

## Patches

- 2026-07-15 — **Parser upgrade (owner request).** Streaming rendering moves from full re-parse-per-chunk to `lib/markdown-stream.ts` (pure, unit-tested): completed `\n\n`-terminated blocks are split out (fence-aware — an open ``` block is never split) and rendered via memoized `StableBlock`s so each block parses ONCE; only the growing tail re-parses per chunk (O(n) total, was O(n²)). The tail passes through `closeDanglingTokens` (auto-closes unbalanced `**`, `~~`, inline backticks, and open fences — high-confidence tokens only, single `*`/`_` deliberately skipped to protect list markers) so mid-stream text never flashes literal asterisks. A pulsing caret bar marks the live end of the reply (skeleton-pulse class — allowed motion). Used by both chat surfaces via `features/chat/streaming-markdown.tsx`; completed messages keep the single-parse `ChatMarkdown`.
- 2026-07-15 — **Renderer hardening (same owner feedback).** `remark-breaks` added to the CHAT renderer only (`chat-markdown.tsx`): single newlines render as line breaks (chat convention), so plain-text-ish agent output can never mash into one run-on paragraph. Reports keep strict Markdown semantics. Primary fix is the backend prompt's Markdown contract (backend SPEC-007 Patches).
