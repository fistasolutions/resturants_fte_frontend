# SPEC-242 — "Explain this" on every KPI card and verdict

**Date:** 2026-09-15 · **Repo:** frontend · **Status:** implemented
**Backend counterpart:** `SPEC-249-chat-explain-focus.md` (`context.focus` — the card
the owner pressed, rendered into the analyst's page-context block)
**Builds on:** `SPEC-235-ask-ai-drawer.md`, `SPEC-236-ask-ai-page-context.md`,
`SPEC-240-chat-answer-card.md`

## Problem

Every page is full of numbers the backend computed — Revenue on the Dashboard, "Cash
sitting still", Resolution rate on Team Performance, a catalogue verdict on Products —
and every one of them raises the same question: *why?* Today the owner has to open the
Ask AI panel and type the card back to the analyst ("why is revenue $12,345, up 8%?").
Power BI ("Explain the increase"), Tableau ("Explain Data") and Amplitude put that
question one click away on the figure itself. Ours can do the same and — unlike theirs —
answer from the store's own analytics engine, not a statistical guess.

## Behaviour

1. **A ✦ button on each KPI card and verdict tile** the analyst can ground. Quiet by
   design: a `size-6` icon button (Lucide `Sparkles`, `text-muted-foreground/50`, `--ai`
   on hover/focus), top-right of the card, tooltip and accessible name
   *"Explain &lt;label&gt;"*. Tokens only; no motion beyond the hover colour.

2. **One click opens the Ask AI drawer with the question already sent.** The question
   is built from what the card shows — label, value, delta, caption — so the thread
   reads well on `/chat` later:

   > Explain the "Revenue" figure on this page — it reads $12,345, +8% vs previous
   > period. What is behind it, and what should I do about it?

   The message carries the usual page context (SPEC-236) **plus `focus`**: the card as
   printed (`"Revenue — $12,345, +8% vs previous period"`, ≤ 200 chars). The backend
   (SPEC-249) tells the analyst to fetch that figure again with the tool that computes
   it and explain the drivers — it never re-derives the number on the card.

3. **It joins the drawer's current thread.** Explaining three cards in a row is one
   conversation about the page, not three. If a reply is still streaming, the question
   lands in the composer instead of being dropped; the owner sends it when ready. On
   `/chat` (drawer suppressed) the button does not render.

4. **Only where the analyst has a tool.** The button is wired to cards whose figure a
   backend tool can recompute — Dashboard, Brief, Orders review, Products, Inventory,
   Customers-adjacent verdicts, Returns, Discounts, Team Performance, Store Traffic,
   Warehouse, Sales & Tax, Spotlight visibility, Reports and Foresight › Profit Lens.
   It is deliberately **absent** from AI Performance, System, Social, Ads and the
   Foresight forecast tiles — the analyst has no tool for those figures, and a button
   that yields "I can't verify this" is worse than none. Adding a tool later is what
   unlocks a page, not a frontend change.

## Implementation

- `types/chat.ts` — `ChatPageContext.focus?: string`.
- `lib/explain.ts` — pure: `ExplainTarget { metric, value, delta?, invertDelta?, detail? }`,
  `explainQuestion(target)`, `explainFocus(target)` (≤ 200 chars, one line),
  `withFocus(context, target)`. Vitest-covered.
- `features/chat/chat-drawer-provider.tsx` — `ask(question, context)`: opens the panel,
  sends into the current thread (or parks the text in the composer while busy);
  `useOptionalChatDrawer()` for components that may render outside the provider.
- `features/chat/explain-button.tsx` — the button. Reads the URL (`pageContextFor`),
  attaches `focus`, calls `ask`. `placement="corner"` (absolute, parent is `relative`)
  or `"inline"` (sits in a card's own header row next to its icon).
- Wired into: `components/shared/kpi-strip.tsx` (Dashboard KPIs, Brief strip — the
  button is a sibling of the tile link, never nested inside it),
  `components/shared/verdict-tile.tsx`, `features/dashboard/money-strip.tsx`,
  `features/brief/brief-kpis.tsx`, `features/orders/orders-review-view.tsx`,
  `features/products/product-detail-view.tsx`, `features/inventory/by-location-dashboard.tsx`,
  `features/returns/kpi-stat.tsx`, `features/returns/returns-hero-tile.tsx`,
  `features/discounts/overview-kpis.tsx`, `features/team-performance/overview-kpis.tsx`,
  `features/team-performance/voice-of-customer-view.tsx`,
  `features/traffic/store-traffic-view.tsx`, `features/traffic/store-detail-view.tsx`,
  `features/traffic/peak-hours-view.tsx`, `features/warehouse/warehouse-view.tsx`,
  `features/tax-reports/report-view.tsx`, `features/spotlight/kpi-tile.tsx`,
  `features/reports/report-viewer.tsx`, `features/reports/scoped-report-view.tsx`,
  `features/reports/report-v2-view.tsx`, `features/foresight/profit-lens-view.tsx`.
- Docs (Rule 11): `lib/docs/content/chat.ts` (Ask AI from any page → the ✦ button),
  `lib/docs/overview.ts` (a platform-wide convention), `lib/docs/content/dashboard.ts`;
  one new capture `chat-explain` via root `tools/build_docs_screens.py`.

## Acceptance criteria

- [x] ✦ appears on every card listed above, in both themes, keyboard-reachable, with an accessible name.
- [x] Click → drawer opens → the built question is sent with page context + `focus` → the answer card shows a grounded pill and source chips.
- [x] While a reply streams, a second ✦ parks its question in the composer rather than dropping it.
- [x] `/chat` renders no ✦ (drawer suppressed); pages without a tool render no ✦.
- [x] A tile that is a link (KpiStrip) keeps its link; the ✦ is not nested inside `<a>`.
- [x] `lib/explain.ts` unit-tested; `npm test`, `tsc`, lint and `npm run build` green.
- [x] Docs updated with a real capture.

## Manual verification checklist

1. Dashboard → ✦ on "Revenue" → drawer opens, question sent, reply grounded (Shopify chip + Dashboard page chip).
2. Dashboard → ✦ on "Cash sitting still" money card → same.
3. Products → ✦ on a verdict tile → same, reply names catalogue drivers.
4. Press ✦ twice quickly → second question waits in the composer.
5. Tab to a ✦ → Enter → drawer opens.
6. `/chat` → no ✦ anywhere.

## Tests

`npx vitest run tests/explain.test.ts` · `npm test` · `npx tsc --noEmit` · `npm run lint` · `npm run build`

## Patches

### 2026-09-18 — ✦ fills the box, the owner sends (owner: "as I click it, just fill the input, not automatically submitted")

- The ✦ on a card no longer sends. It opens the Ask Glisp panel with the question
  **in the composer**, ready to edit or send — `ChatDrawerProvider.draft(question,
  context)` (new) beside `ask`, which the nudge and select‑to‑ask keep.
- The card's `focus` still travels: the provider remembers the drafted question and
  its context; when the panel sends and the text is still that question, the send
  carries that context (so the analyst re‑fetches the exact figure); an edited or
  different question goes with the plain page context. `lib/explain.ts`
  `draftContextFor` is the pure rule, tested in `tests/explain.test.ts`.
- The press still plays the icon's "send" motion — it is the owner's cue that the
  panel opened with their question.
