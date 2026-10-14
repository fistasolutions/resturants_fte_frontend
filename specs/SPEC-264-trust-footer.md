# SPEC-264 — The trust footer

**Date:** 2026-09-17 · **Repo:** frontend · **Status:** implemented
**Backend twin:** `SPEC-265-chat-trust-footer.md` (`sources.calls`, `sources.freshness`).
Ideas document item 11. Mockup: `ref/mockups/trust-footer.html`.

## Behaviour

- Under every grounded answer, above the copy / read-aloud row, one quiet line:
  `● Shopify synced 4 min ago · Loop Returns synced 12 min ago · 3 tools ran ⌄`.
  The dot is `--success` when every system read was synced within the last hour,
  `--warning` when any is older (the stale one's label reads "synced 3 h ago"), and
  muted when the system has no sync to show ("no sync"). An answer with no tools
  shows no line.
- Click (or Enter/Space — it is a button with `aria-expanded`) opens the receipt in
  place: a freshness row (system · last sync time · records), then one numbered row
  per tool call — the tool name (mono), "Asked: period 30d · query Katie Dress",
  "Returned:" with each figure as a chip, the system and the seconds on the right.
  Open/closed is per card, not remembered.
- Answers stored before this spec have no `calls` — their line shows the systems
  and the tool count with no disclosure.

## Implementation

- `types/chat.ts`: `AnswerCall`, `AnswerFreshness`, `ChatSources.calls` / `.freshness`.
- `lib/trust-footer.ts` — pure: `agoLabel`, `freshnessSegments`, `footerTone`,
  `toolsLabel`, `secondsLabel`. Tests in `tests/trust-footer.test.ts`.
- `features/chat/trust-footer.tsx` — the line and the disclosure; rendered by
  `answer-card.tsx` for both surfaces.
- Docs: `lib/docs/content/chat.ts` "The trust footer" section, capture `chat-trust`.

## Acceptance criteria

- [x] A fresh answer on the live store shows the line with real sync ages and a tool count; the receipt lists each tool with its ask, figures and seconds.
- [x] An old answer shows the line without a disclosure; an ungrounded answer shows nothing.
- [x] `npm test`, `tsc`, lint, `npm run build` green; docs updated.
