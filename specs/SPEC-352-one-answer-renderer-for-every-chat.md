# SPEC-352 — One answer renderer for every chat

**Status:** Implemented
**Date:** 2026-10-08
**Repo:** ecommerce-fte-frontend
**Backend slice:** backend `SPEC-361-one-answer-format-for-every-chat.md`
**Builds on:** SPEC-240 (answer card), SPEC-257 (answers that show), SPEC-259 (answer to
action), SPEC-264 (trust footer), SPEC-293 / SPEC-301 (one employee chat panel), SPEC-345 /
SPEC-346 (Email and Support chats)

## Problem

Glisp's answers render as an **answer card**: a runtime strip, a grounded pill, the Markdown,
a text ⇄ chart toggle, source chips, the page that acts on the answer, the trust receipt, and
copy · read aloud. The four employee chats (Search Visibility, Accounts Payable, Email
Marketing Manager, Customer Support Agent) render the **same backend payload** as a bare
Markdown bubble, so:

- the chart the backend derived (`sources.visual`) is never drawn;
- the receipt (`sources.calls`, `sources.freshness`) is never shown;
- the actions are drawn twice over by hand: Email with `answerActionsFrom` and its own
  buttons, Support with `linkCardsFrom` and other buttons. Accounts Payable and Search
  Visibility get none.

A Markdown link to an in-app page opens a new browser tab, and a list written as
`- name | bill | due | balance` stays a run of bullets. That is the screenshot the owner sent.

## Decision

**One renderer, used by every chat.** The answer card stops being Glisp's and becomes the
platform's.

1. **`AnswerCard` is the one assistant turn.** It gains:
   - `mark`: the identity in the grounded pill (Glisp's mark by default, the employee's
     icon in an employee chat).
   - `children`: what a turn carries beyond the shared blocks. Today that is Search
     Visibility's generation card.

   It already draws streaming, the chart toggle, chips, the watch card, actions, the trust
   footer and the footer actions. Regenerate, rate and pin show only when their handler is
   passed, so an employee turn shows copy and read aloud.
2. **Actions and link cards are one list.** `answerLinks(sources)` in `lib/answer-card.ts` merges
   `sources.actions` (SPEC-260) with `sources.cards` of kind `link` (SPEC-346). The list is
   in-app paths only, deduplicated by href, actions first. The card draws it with one
   button style per kind. `answerActionsFrom` and `linkCardsFrom` and the two hand-made
   button rows are deleted.
3. **`EmployeeChatView` renders every turn through `AnswerCard`**, for stored turns and the
   live stream alike, at the full width of the thread column (tables need it). The
   `extras` prop survives for a future employee's own block; nobody passes it today.
4. **The Markdown renderer gets smarter, for every surface that uses it.** That covers Glisp,
   the employees, daily reports and commentary.
   - **Tables look like the app's tables.** The table sits in a bordered, rounded frame with a
     muted header. A cell that holds a figure (currency, number, percentage) is
     right-aligned with tabular numerals (`lib/answer-markdown.ts` `looksNumeric`).
   - **In-app links stay in the app.** A link to a relative path is a Next `Link`
     (`prefetch={false}`) in the same tab. Only an external link opens a new tab.
   - **A pipe-bulleted list becomes a table.** `normalizeAnswerMarkdown` turns a run of two or
     more bullets that each split into the same number (three or more) of ` | ` cells into a
     GFM table. A column whose every cell starts `Label: value`, or with the same first
     word ("Due 2025-02-23"), takes that label as its header. This repairs answers already
     stored, like the screenshot, and any model that still slips.

### DRY

| Concern | Written once in | Used by |
|---|---|---|
| A turn's layout | `features/chat/answer-card.tsx` | Glisp page, Ask Glisp panel, every employee chat |
| Markdown elements, tables, links | `features/chat/chat-markdown.tsx` | every chat, reports, commentary |
| Table repair and figure detection | `lib/answer-markdown.ts` | `ChatMarkdown` |
| Actions and link cards | `lib/answer-card.ts` `answerLinks` | `AnswerCard` |
| The answer format the model follows | backend `prompts/answer_format.md` | every chat agent |

A new employee gets all of it by rendering `EmployeeChatPanel`.

## FOC after this change

**What FOC sees: its employee chats now draw the same answer card Glisp does.** That means
tables, charts, action buttons and the receipt. No setting, preference or stored row changes.
Glisp's own card looks the same, except that in-app links now open in the same tab and a
pipe-bulleted list is shown as a table.

## Files

- `lib/answer-markdown.ts`: new, `normalizeAnswerMarkdown`, `looksNumeric`, `isInAppHref`.
- `lib/answer-card.ts`: `answerLinks`.
- `features/chat/chat-markdown.tsx`: table frame, figure cells, in-app links, normalisation.
- `features/chat/answer-card.tsx`: `mark`, `children`, `answerLinks`.
- `features/employees/employee-chat-panel.tsx`: turns and stream through `AnswerCard`.
- `features/email-marketing/chat/email-chat-tab.tsx`, `features/customer-support/chat-tab.tsx`:
  the hand-made rows go.
- `lib/email-marketing.ts` (`answerActionsFrom`) and `lib/employee-chat.ts` (`linkCardsFrom`):
  removed with their tests.
- `tests/answer-markdown.test.ts`: new. `tests/answer-card.test.ts`: `answerLinks`.
- `lib/docs/content/*`: the chat-related docs mention the card (Rule 11).

## Acceptance criteria

1. Every employee chat's stored and streaming turns render through `AnswerCard`. No other
   component draws an assistant turn.
2. An answer with `sources.visual` shows the text ⇄ chart toggle in an employee chat.
3. `sources.actions` and `link` cards render as one row of buttons. Every href is an in-app
   path, with no duplicates and actions first.
4. `normalizeAnswerMarkdown` turns the screenshot's list into a four-column table with the
   headers inferred (`Bill`, `Due`, `Balance`). It leaves ordinary bullets, code fences and
   existing tables untouched.
5. A figure cell is right-aligned. A text cell is not.
6. A relative Markdown link navigates in the same tab. An external one opens a new tab.
7. `npm run lint`, `npx tsc --noEmit`, `npm test` and `npm run build` are green.

## Manual verification (no component runner, Rule 4)

1. Accounts Payable › Chat › "What should I pay this week, and in what order?": a table, a
   chart toggle, "Open the payment run", the receipt.
2. The stored Oct 7 thread from the screenshot now shows its bills as a table.
3. Email Marketing Manager and Customer Support Agent › Chat: their buttons appear once, under
   the answer.
4. Glisp's page and the Ask Glisp panel look as before.
5. Light and dark themes; a 390 px wide screen scrolls the table inside its frame, not the page.

## Verification (2026-10-08)

| # | Criterion | Status |
|---|---|---|
| 1 | Every employee turn and stream through `AnswerCard` | done. `EmployeeTurn` and the live stream render `AnswerCard`; Email and Support pass no `extras` |
| 2 | Chart toggle in an employee chat | done. The card's own toggle, fed by `sources.visual` (backend SPEC-361 makes it reach Finance and Spotlight rows) |
| 3 | One row of in-app buttons, no duplicates, actions first | done. `answerLinks`, `tests/answer-card.test.ts` |
| 4 | The screenshot's list becomes a table with `Bill`, `Due`, `Balance` | done. `tests/answer-markdown.test.ts`; also rendered through the real `ChatMarkdown` with `react-dom/server` |
| 5 | Figures right-aligned, text not | done. The rendered check shows `$5,505.00` right-aligned and the names left |
| 6 | Relative links in place, external in a new tab | done. The rendered check shows `the payment run` with no `target`, `Intuit` with `_blank` |
| 7 | Lint, types, tests, build | done. `npm run lint` 0 errors (3 old `<img>` warnings in untouched files), `npx tsc --noEmit` clean, `npm test` 218 files / 2463 tests passed, `npm run build` compiled, 80/80 pages |

The manual checklist above was **not** run in a browser. The local backend points at the
production database, so this session did not start the app. Run it on the deployed app after
release.
