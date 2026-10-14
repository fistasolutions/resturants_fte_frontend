# SPEC-092 — Markdown Plan: instant cached render, proper skeleton, rich detail

## Context / Why

The Markdown Plan page (`/inventory/markdown-plan`, the Dead Stock tab's CTA) had three
client-raised issues:

1. **Skeleton on every visit** — the AI plan is DB-cached (60-min TTL, backend SPEC-045)
   but fetched **client-side on mount**, so the loading state shows even when the answer
   is already stored.
2. **Weak skeleton** — two gray bars.
3. **Thin detail** — the right panel showed only discount %, projected recovery, and a
   one-line action.

Backend SPEC-085 now (a) enriches each recommendation (`rationale`, `urgency`,
`discount_ladder`) and (b) adds a `cache_only` read that returns the stored plan (or
null) with **no LLM call**. This spec is the frontend half.

## Scope (frontend only)

1. **Types**: add `DiscountTier`; add optional `rationale`, `urgency`, `discount_ladder`
   to `DeadStockRecommendation` (optional — old cached plans omit them).
2. **Service**: `getDeadStockPlan({ cacheOnly })` — server-side fetch (null on
   miss/failure).
3. **Page** (`markdown-plan/page.tsx`): server-fetch the plan with `cacheOnly: true` in
   parallel with the aged data and pass it as `initialPlan`. Cached → renders instantly,
   **no skeleton**. Nothing cached → `initialPlan` is null and the client generates once.
4. **Component** (`markdown-plan-page.tsx`):
   - Seed state from `initialPlan`; only client-fetch on mount when it's null (cold
     generate) or on explicit refresh. So a cached plan never shows a skeleton.
   - **Proper skeleton** mirroring the real detail layout (metric cards + ladder + action).
   - **Rich detail panel**: urgency badge, one-line rationale, the two metric cards, a
     **recovery bar** (% of frozen value recovered), a **discount ladder** (Now → In 2
     weeks → Final, each with its %, projected recovery, and escalation), and the action
     as a styled callout.
   - **Header stat strip** computed from the aged data already on the page: total cash
     frozen, product count, a 90–180d vs 180d+ aging split bar, and total projected
     recovery from the plan.

All semantic tokens; brand red untouched; no entrance animation (RULE 9). Degrades:
missing enriched fields (old cached plans) simply hide those sub-sections.

## Acceptance Criteria

1. A cached plan renders on first paint with **no skeleton** (server-fetched via
   `cache_only`).
2. With nothing cached, the component generates once client-side and shows the **new**
   skeleton (not two bars) meanwhile.
3. The refresh button still forces regeneration.
4. Detail panel shows: urgency badge, rationale, discount + recovery cards, recovery bar,
   discount ladder, and a styled action — when those fields are present.
5. A header strip shows total frozen, product count, aging split, and total projected
   recovery.
6. Old cached plans (no enriched fields) render without error (sub-sections hidden).
7. `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` all green.

## Manual verification checklist

- [ ] Load the Dead Stock tab → "Build markdown plan": cached loads render instantly.
- [ ] Cold (after data change) shows the new skeleton, then the plan.
- [ ] Detail panel shows rationale, urgency, ladder, recovery bar; refresh regenerates.
- [ ] Dark/light + mobile hold; nothing animates in.
