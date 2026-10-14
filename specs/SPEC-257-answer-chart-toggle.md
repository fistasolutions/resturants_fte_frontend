# SPEC-257 — Answers that show, not tell: a text ⇄ chart toggle on the answer card

**Date:** 2026-09-17 · **Repo:** frontend · **Status:** implemented
**Backend counterpart:** `SPEC-259-chat-answer-visual.md` (`sources.visual`)
**Builds on:** `SPEC-240-chat-answer-card.md`. Ideas document item 05; the owner's
design (2026-09-17): a toggle top-right of the card, text by default, chart on demand.

## Behaviour

1. **The toggle.** When an answer's `sources.visual` is present, the card's header strip
   gains a two-way segmented control on the right (Lucide `AlignLeft` / `BarChart3`,
   `aria-label` "Show as text" / "Show as chart", `aria-pressed`). It is absent on
   answers with nothing chartable and while a reply is streaming.

2. **Chart view.** The body becomes: the answer's **takeaway** (its first paragraph,
   Markdown, lead style) and then the chart — never a chart alone, so the number the
   owner asked for is always on screen. Below the chart, one line names the source:
   *"From get_top_products · top 8 by revenue"*.
   - `bar` → horizontal bars (Recharts `BarChart layout="vertical"`), labels at the
     left, values formatted by unit (compact currency, number, percent), `--chart-1`.
   - `line` → a line over the dates, `--chart-1`, dots off, tooltip.
   - `compare` → grouped bars per metric, "This period" `--chart-1` vs "Previous"
     `--chart-3`, legend.
   Height 220 px (180 in the panel's compact mode); tokens only through
   `components/ui/chart.tsx`; the chart library's own subtle draw is the only motion.

3. **Text view** is exactly today's card.

4. **Remembered.** The last choice is kept per browser (`localStorage`
   `ecommerce-fte.chat.answer-view`); text is the default. Copy, Read aloud, Regenerate, Pin and
   the ratings act on the full text whatever the view.

5. Works on the Chat page and in the Ask Glisp panel (compact).

## Implementation

- `types/chat.ts` — `AnswerVisual`, `ChatSources.visual`.
- `lib/answer-visual.ts` — pure: `takeaway(content)`, `formatValue(unit, v)`,
  `axisFormatter(unit)`, `chartRows(visual)` (Recharts rows), `readAnswerView /
  writeAnswerView`. Vitest-covered.
- `features/chat/answer-chart.tsx` — the three charts on `ChartContainer`.
- `features/chat/use-answer-view.ts` — the shared preference (external store).
- `features/chat/answer-card.tsx` — the toggle and the chart body.
- Docs: `lib/docs/content/chat.ts` "Answers that show" section with a capture.

## Acceptance criteria

- [x] Ask "what sold best this week?" → toggle appears → chart view shows the takeaway + horizontal bars of the same figures the text names.
- [x] Ask "how is revenue this week vs last?" → grouped bars; "revenue by day" → a line.
- [x] "hi" → no toggle. The choice survives a reload; copy still copies the full text.
- [x] Panel (compact) renders the same; both themes.
- [x] `npm test`, `tsc`, lint, `npm run build` green; docs updated.
