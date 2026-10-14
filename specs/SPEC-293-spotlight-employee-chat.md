# SPEC-293 — Spotlight › Chat: talk to the employee, watch it write, open the draft

Status: implemented (2026-09-22)
Depends on: backend SPEC-287 (the contract), SPEC-224/216 (background generation and
its view model), SPEC-235/240 (the chat primitives — composer, bubbles, markdown),
SPEC-232 (the Spotlight shell)

## Problem

Owner, 2026-09-22: Brand Brain and Daily Picks *suggest*; there is no way to tell
Spotlight "write about this". He wants each employee to have its own chat — talk to it,
ask about it, tell it to write; the writing shows its progress in the thread; when
done, a card with an Open-full icon opens the draft exactly as today; history stored.
Spotlight first.

## The surface

- **A Chat tab on Spotlight** (`?tab=chat`, `SPOTLIGHT_TAB_IDS` + label "Chat";
  the tab bar reads the list, so the shell is untouched). Reading order in the bar:
  Overview · Chat · Brand Brain · … — the chat is how you *use* the employee, so it
  sits second.
- **Layout**: a thread rail (New chat, then the employee's threads newest first,
  each with its title and time; delete on hover) and the thread (the Spotlight
  identity at the top, the messages, the composer). Under `xl` the rail is a
  dropdown above the thread. The first visit shows an empty state: what Spotlight
  can do and four starter asks — *What should I write next?* · *Show me today's
  picks* · *Which topics sit on page two?* · *Write about …*.
- **Persistence**: threads are backend threads filed under `employee=spotlight`
  (`GET /chat/conversations?employee=spotlight`); the last-opened thread is
  remembered per employee in `localStorage` and reopened on return; a send on a new
  thread creates it and it appears in the rail at once.
- **Streaming**: the reply streams token by token with the backend's status
  phrases (SPEC-030) while its tools run; the composer is disabled until `done`.
- **The generation card** (`generation-card.tsx`): an assistant turn whose
  `sources.cards` carries `{kind: "generation", job_id}` renders the card under the
  reply — the keyword as its title, the SPEC-216 progress line (step · about N
  words so far · elapsed), polled every 3 s by job id while running (the pure
  `shouldKeepPolling`), then **Draft ready** with an **Open full** button →
  `/spotlight/draft/<id>` (the draft page as it exists today) and its title; a failed
  run says the backend's reason. After a reload the card re-reads the job by id, so
  a thread from yesterday still shows what became of the run.
- **Own hook, shared primitives**: `features/spotlight/employee-chat/use-employee-chat.ts`
  owns the threads and the active thread for ONE employee (TanStack Query for the
  list, `getAssistantReply(…, employee)` for the send — the same SSE reader the
  Glisp surfaces use); `lib/employee-chat.ts` is the pure half (the employee's
  meta and starters, `cardsFrom(sources)`, `lastThreadKey`, `withReply`,
  `withUserTurn`). The Glisp store, drawer and `/chat` page are untouched — an
  employee thread never appears in Glisp's rail because the backend list is scoped.

## Acceptance

1. `?tab=chat` renders the rail + thread; a send streams a reply and files the thread
   under Spotlight (visible in the rail, absent from Glisp's).
2. "Write about graduation dresses" shows the generation card with live progress;
   when the job finishes the card reads Draft ready with Open full → the draft page.
3. Reload: the thread reopens where it was; the card shows the job's final state.
4. Pure helpers Vitest-covered (`tests/employee-chat.test.ts`); `npm test`, `tsc`,
   lint, build green; the Spotlight doc gains the Chat section with a capture.

## Manual verification

- [ ] Ask "What should I write next?" → an answer from the picks with receipts.
- [ ] "Write about graduation dresses" → card → progress → Draft ready → Open full.
- [ ] New chat · switch threads · delete a thread · reload.
- [ ] 400px: the rail becomes the dropdown; the composer stays reachable.

## Verification (2026-09-22, live store)
- `tools/capture_spotlight_chat_0922.mjs` against :8100/:3100 — the tab bar reads
  Overview · **Chat** · Brand Brain · …; a question streamed in with its status
  phrases and answered from the picks in 27 s; "write about …" produced the card,
  which followed the run (*Reading what ranks for "graduation dresses"…* → *Writing
  section 6 of 9 · about 2,044 words* → **Draft ready**, 7 m 51 s) and opened
  `/spotlight/draft/how-to-choose-graduation-dresses-that-never-compromise-on-style`;
  a reload reopened the thread with the card live; the rail lists the employee's
  three threads and `/chat` lists none of them; the phone view shows the dropdown.
  No page errors in any of the three runs.
- Two defects fixed on the way (unprompted): the composer showed Glisp's placeholder
  ("Ask anything about your store") — `ChatComposer` now takes one and the tab passes
  the employee's; and the global "Writing your blog" toast reported the same job as
  the thread's card — it is hidden on `/spotlight?tab=chat`, where the card is.
- Tests: `tests/employee-chat.test.ts` 5 passed; `npm test` 1864 passed; tsc clean;
  lint 0 errors (3 pre-existing warnings elsewhere); `npm run build` green; the
  Spotlight doc has the Chat section with its capture.
- Acceptance 1–4: **done**.

## Patches

- **2026-09-22 — the column is a fixed height; only the messages scroll (owner).** The
  card was `min-h-[calc(100vh-18rem)]`, so every turn made it taller and the page
  scrolled: the composer walked off the bottom and the rail went with it. Now the tab
  is one fixed-height column — `h-[calc(100vh-13.5rem)] pb-16` on the row, `h-full
  min-h-0` on the card, `shrink-0` on the header and the composer, `min-h-0 flex-1
  overflow-y-auto` on the message list and on the rail's own list. The auto-scroll
  writes `log.scrollTop = log.scrollHeight` instead of `scrollIntoView`, which would
  also move the page behind a nested scroller. `pb-16` keeps the send button clear of
  the Ask Glisp pill, which floated over it. Measured at 1440×900: the page does not
  scroll, the list does, the composer's bottom is 813 of 900 and the header does not
  move when the list is scrolled to the top.
- **2026-09-22 — the thread reaches the viewport's edges (owner).** A card floating in
  the page's padding left a band of background under the composer. The column now
  breaks out of the shell's `p-4 md:p-6` (`-mr-4 -mb-4 md:-mr-6 md:-mb-6`) and is
  sized in `svh` per breakpoint, so it touches the bottom and the right edge; the Card
  keeps a radius on its **top-left corner only** and draws just its top and left edges
  (its default outline is a `ring`, which cannot be sided, so `ring-0` + `border-t
  border-l`). Measured: 1440×900 — right 1440, bottom 900, radii 18/0/0/0, borders
  top+left only, no page scroll; 400×860 — right 400, bottom 861.
