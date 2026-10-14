# SPEC-246 — A nudge on the button

**Date:** 2026-09-15 · **Repo:** frontend · **Status:** implemented
**Backend counterpart:** `SPEC-254-page-nudge.md` (`GET /nudge?route=`)
**Builds on:** `SPEC-235-ask-ai-drawer.md`, `SPEC-242-explain-this.md` (ideas document,
item 04; mockup approved 2026-09-15 — `ref/screens/mockups-2026-09-15/`)

## Problem

The analyst only speaks when asked. The owner has to notice the problem first, and what
they never notice they never ask. The page already knows its one number worth a look;
the Ask AI button should say it.

## Behaviour

1. **A dot on the Ask AI pill** (desktop) and on the phone-header icon when the page has
   a nudge the owner has not dismissed. `--ai` accent, `size-3`, ringed with the
   background. No dot, no card when the backend returns `null`.

2. **A card above the pill** (desktop only — the pill is): eyebrow *"Worth a look ·
   <Page>"* with a Sparkles icon, the line with its figure in bold, **Explain** and
   **Not now**, a ✕, and the footnote *"from the analytics engine"*. `w-[340px]`,
   `bg-card`, `border`, `rounded-card`, a subtle shadow; no motion beyond the hover
   colours. Hidden while the panel is open (the panel covers that corner) and on `/chat`.

3. **Explain** opens the panel and sends the backend's `question` into the current
   thread with page context + `focus` (the same path as ✦ Explain, SPEC-242). **Not now**
   and ✕ dismiss it. Both remember the nudge `id` in `localStorage`; a nudge with the same
   id never shows again on any page, one whose figure moved (new id) does.

4. **The panel's first row.** While a nudge is live, the drawer's empty state shows it
   as a highlighted first row above the four suggested prompts — *"Worth a look"* — and
   clicking it sends the same question. The phone gets the nudge this way.

5. **One request per page family, cached.** `nudgeQueries.forRoute("/inventory")`
   (route's first segment) through the client cache — a revisit is instant; the request
   is skipped entirely on routes the backend has no rule for (`NUDGE_ROUTES`, pinned by a
   test so it mirrors the backend table).

## Implementation

- `types/nudge.ts`, `lib/queries/nudge.ts`, `services/nudge.ts` (registry pattern,
  SPEC-230; `tests/query-registries.test.ts` pins it).
- `lib/nudge.ts` — pure: `nudgeRouteFor(pathname)` (first segment, or null when the
  route has no rule), `readDismissed / dismissNudge` (localStorage, try/catch),
  `nudgeContext(context, nudge)` (attaches `focus`). Vitest-covered.
- `features/chat/use-nudge.ts` — the query + dismissal state for the current route.
- `features/chat/chat-nudge.tsx` — the card; `chat-launcher.tsx` renders it and the dot;
  `chat-drawer.tsx` empty state renders the first row.
- Docs: `lib/docs/content/chat.ts` "A nudge on the button" section with the
  `chat-nudge` capture; overview convention.

## Acceptance criteria

- [x] Dashboard with a ≥ 25 % revenue swing → dot + card with the real figure; Explain → panel opens, grounded reply.
- [x] Not now → card and dot gone; reload → still gone; a page whose figure changed → back.
- [x] Panel opened fresh on a nudged page → the nudge is the first row; click → sent.
- [x] `/chat`, pages without a rule, and pages below threshold → nothing, and no request on rule-less routes.
- [x] Both themes; `npm test`, `tsc`, lint, `npm run build` green.

## Manual verification checklist

1. Dashboard → card bottom-right → Explain → answer streams.
2. Reload → card is back (not dismissed) → Not now → reload → gone.
3. Inventory → card names best-sellers about to run out → ✕.
4. Open the panel on Orders → first row "Worth a look" → click → sent.
