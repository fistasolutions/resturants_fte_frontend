# SPEC-104 — "Needs Mordy's Attention" section on the Morning Brief

## Context / Why

Backend SPEC-102 adds `GET /brief/attention` — an exceptions-only rollup (unanswered
tickets > 24h, unfulfilled orders > 5d, packing mistakes today, returns waiting > 3d,
refunds not completed). This spec renders it as a prominent section on the Morning
Brief page, so Mordy sees "what's wrong today" in one place. Pure consumer of computed
data (root Rule 8 — no UI calculation).

## Scope

- Extend `types/brief.ts` with the attention contract.
- Add `getAttentionData()` to `services/brief.ts`.
- Fetch it in parallel with the existing brief fetches in `app/(app)/brief/page.tsx`
  (`Promise.allSettled` — a failed attention fetch degrades only this section).
- New component `features/brief/needs-mordy-attention.tsx` (server component), placed
  directly under the top bar, **above** "Today's Decisions" — it is the first thing
  Mordy should see.
- Hidden in archive view (`?date=` — the attention rollup is always live "right now",
  not a frozen snapshot; skip the fetch too, not just the render — Rule 5).

## Types (`types/brief.ts`)

```ts
export type AttentionSeverity = "warn" | "error";

export interface BriefAttentionItem {
  key: string;
  status: AttentionSeverity;
  title: string;
  count: number;
  detail: string;
  href?: string;
}

export interface BriefAttention {
  generated_at: string;
  total: number;
  items: BriefAttentionItem[];
}
```

## Component

`NeedsMordyAttention({ data }: { data: BriefAttention | null })`:
- Section heading: `Needs Attention` (uppercase muted label, matching `OvernightWatch`).
- **Empty / healthy state** (`data.total === 0`): a single reassuring tile — check icon,
  `text-success`, "Nothing needs attention right now — all clear." (mirrors the
  `NoDecisionsState` pattern; never an empty gap).
- **Firing state**: a grid of tiles (mirror `OvernightWatch`'s `WatchTile`), one per
  item, colored by severity (`error` → `border-destructive/30 bg-destructive/5`,
  `warn` → `border-warning/30 bg-warning/5`), Lucide outline icon, `count` shown as a
  bold figure, `detail` as muted subtext, wrapped in a `Link` to `item.href` when
  present (CSS-only hover, `focus-visible` ring — no entrance animation, Rule 9).
- If the fetch failed (`data === null`), render nothing (the rest of the brief still
  loads).

## Design compliance (Rule 9)

- Semantic tokens only (`bg-card`, `border-border`, `text-muted-foreground`,
  `text-destructive`, `text-warning`, `text-success`, `ring-ring`) — no hex, no
  `text-red-*`. Brand red is identity-only, never used for these status states.
- No Framer Motion, no entrance animation — tiles render in final position.
- shadcn/Lucide, 8px spacing, `rounded-xl` tiles, subtle borders not shadows.
- Keyboard-navigable links, semantic `<section>`, accessible contrast, responsive grid
  (`grid-cols-1 sm:grid-cols-2`).

## Tests (Rule 4)

`tests/brief.test.ts` — extend with type-contract assertions for `BriefAttention`:
factory `makeBriefAttention`, assert item `status` ∈ {`warn`,`error`}, `count` is a
number, `total` matches firing items. (No jsdom runner — the component itself is
verified via the manual checklist below.)

## Manual verification checklist

- [ ] `/brief` with firing exceptions: section shows at top, tiles colored by severity,
      counts correct, each links to the right page (`/team-performance`, `/orders`,
      `/warehouse`, `/returns`).
- [ ] Healthy store: single "all clear" tile, no empty gap.
- [ ] Archive view (`?date=…`): section hidden, no attention fetch fired.
- [ ] Both light and dark themes: tokens correct, contrast good.
- [ ] Mobile / tablet / desktop: grid reflows, no horizontal scroll.
- [ ] Attention fetch failure: rest of brief still renders.

## Acceptance Criteria

- [ ] Section renders `GET /brief/attention` data at the top of the Morning Brief.
- [ ] Empty/healthy, firing, and fetch-failure states all handled.
- [ ] Archive view skips the section and its fetch.
- [ ] `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` all green.

## Patches
(none yet)
