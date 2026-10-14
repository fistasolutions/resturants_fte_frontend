# SPEC-284 — Clarity, read for the CEO: the Brief panel, the source verdicts, ✦ on the page

**Date:** 2026-09-21 · **Repo:** frontend · **Status:** implemented
Backend: SPEC-281. Mockup: `ref/mockups/clarity-usecases.html` — "do that end to end
right now… compact and denser, no space".

## Behaviour

1. **Morning Brief → "Website · what broke yesterday"** (`features/brief/brief-website.tsx`)
   — a `BriefPanel` in the main column under Needs Attention, live-only, fetched on
   its own (`clarityQueries.brokeYesterday()`) so it never blocks the Brief. Compact
   rows: status dot · title + Severe/Notable chip + `new yesterday` / `up N×` chip ·
   one line of issues in proper English ("3 script errors on 7 sessions — started
   Sep 20; none the week before") · revenue and units right-aligned · Watch in
   Clarity. A closing muted row: "Everything else is quiet — N other pages had
   friction, none new and none above $X." Empty Clarity → the panel is not shown.
2. **The watch** — the catalog comes from the API; the Watching form and the fired
   nudge need no change. Verified the metric appears in the form.
3. **✦ Explain on the page's tiles** (`website-page-view.tsx`): the four tiles carry
   the ✦ (they were `explain={false}`); the analyst now has `get_website_friction`,
   and the page route names the product.
4. **Paid traffic quality** — a second card on the Website tab: one row per source
   (Clarity sessions · scroll · quick-backs · Shopify orders · revenue) with a verdict
   chip and its reason from `lib/clarity.ts` `sourceVerdictLine` (pure, tested):
   *Converting* · *Good audience, broken page* · *Wrong audience* · *Too few to judge*
   (under 50 sessions) · *No orders yet*. Sorted by sessions. Prefetched with the tab.
5. **Compact.** Panel rows `py-2`, 13 px body, no extra margins — the owner's ask.

## Implementation

- `types/clarity.ts` `ClarityBrokeYesterday`; `lib/adapters.ts` `adaptClarityBrokeYesterday`;
  `lib/queries/clarity.ts` `brokeYesterday()`; `services/clarity.ts`.
- `lib/clarity.ts` — `sourceVerdictLine`; `lib/clarity-friction.ts` — `brokeReason`.
- `features/brief/brief-website.tsx`, `features/brief/brief-view.tsx`;
  `features/traffic/website-sources-view.tsx`, `website-tab.tsx`, `app/(app)/traffic/website/page.tsx`;
  `features/traffic/website-page-view.tsx`.
- Docs: `lib/docs/content/brief.ts`, `traffic.ts`, `settings.ts` (the metric).

## Acceptance criteria

- [x] The Brief shows the panel with rows and the quiet line; hidden when Clarity has nothing.
- [x] The sources card renders every source with a verdict and reason; revenue from Shopify.
- [x] ✦ on the page tiles opens Ask Glisp with the figure.
- [x] `npm test`, `tsc`, lint, build green; docs updated; captured live.

## Patches

### 2026-10-01 — channels, not spellings (backend SPEC-219 patch)

- `ClaritySource` gains `label` and `rawSources` (adapter defaults: `label` = `source`,
  `rawSources` = `[]`). The Ads card and the Traffic sources table show `label`, with the
  merged names as a small "includes …" line when more than one was merged.
- `features/ads/source-behaviour-card.tsx` drops `internal` rows (the store's own site,
  direct) and renders nothing when no campaign row is left.
