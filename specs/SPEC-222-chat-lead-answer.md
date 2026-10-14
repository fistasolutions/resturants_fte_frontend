# SPEC-222 — The answer leads

Status: implemented
Backend: SPEC-231 (chat tools beyond Shopify) and its patches

## Problem

The analyst prompt has always required a reply to open with a one-sentence direct
answer. The UI then rendered that sentence at exactly the same size and weight as
everything under it, so the answer to the question sat flush against the
supporting detail:

> Customer Care Team (bot) resolves tickets fastest with an average resolution time of 16h 3m.
> **Agent performance (30d)**
> *(a 13-column table)*

The reader has to find the answer inside the evidence. Every other assistant
surfaces the conclusion first and visibly; ours buried it.

## Design

An **opt-in** `lead` prop on `ChatMarkdown` that promotes the first paragraph:
`text-base` against the body's `text-sm`, `font-medium`, `text-foreground`, and a
little more space beneath it before the evidence begins.

**Opt-in matters.** `ChatMarkdown` is shared by 8 surfaces — daily reports, the
report v2/scoped views, returns action plans, inventory commentary. Promoting the
first paragraph everywhere would restyle a report's opening line, which is not an
answer to anything. Only assistant chat replies pass `lead`.

Implemented as `[&>p:first-child]:…` on a wrapper rather than a conditional `p`
renderer, because react-markdown gives a component no reliable notion of its own
index.

### Streaming

`StreamingMarkdown` splits a reply into completed blocks plus a live tail, and
each block renders its own `ChatMarkdown`. `lead` therefore goes to the **first
block only** — or to the tail while no block has completed yet, so the very first
sentence is promoted the moment it streams in and never demotes when the second
block arrives.

## Non-goals

- No colour, background or border on the lead line. It is the same voice, said
  first — not a callout box. Brand red stays identity-only (root Rule 9).
- No change to the prompt's structure rules; this is presentation of what the
  agent already produces.

## Verification checklist (no component runner in this repo — root Rule 4)

- [x] `/chat` — the opening sentence is visibly larger than the detail beneath it.
- [x] The promotion appears while streaming and does not shift when the answer
      completes.
- [x] Reports, returns action plans and inventory commentary are unchanged.
- [x] Tokens only; verified in light and dark.
- [x] No entrance animation (root Rule 9).
- [x] `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` green.

## Acceptance Criteria

- [x] `ChatMarkdown` takes an optional `lead` and defaults to today's rendering.
- [x] Assistant chat replies (full and compact) pass `lead`; nothing else does.
- [x] Streaming promotes only the first block.
- [x] The lead-class logic is a pure function, unit-tested in `lib/`.
