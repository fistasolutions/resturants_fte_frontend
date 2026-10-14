# SPEC-100 — Markdown Plan: scrollable list + premium recommendation card

- **Status:** In progress
- **Date:** 2026-08-07
- **Owner request (2026-08-07):** on `/inventory/markdown-plan` — (1) the left
  "Dead stock products" list must be **vertically scrollable** (it currently grows
  off-screen with the whole list rendered), and (2) make the right-hand AI
  recommendation panel a **premium, eye-catching card** — the best card design on
  the app, not the current flat layout.
- **Constraints:** design system only (root Rule 9 / Design.md) — **semantic tokens,
  no hardcoded colors, subtle shadows, no Framer Motion, no entrance animation.**
  "Eye-catching" = Linear/Stripe-grade polish (gradient built from tokens, strong
  type hierarchy, a radial recovery gauge), not gaudy. All numbers stay
  backend-computed (Rule 8) — this is presentation only.

## 1. Scrollable dead-stock list (`features/analysis/markdown-plan-page.tsx`)

- The left column becomes a self-contained panel: a small sticky header ("Dead
  stock products" + item count) over a **vertically scrollable** list
  (`max-h-[calc(100vh-…)] overflow-y-auto`), so long lists scroll independently of
  the page and the right panel stays put. On `lg+` the column is `sticky top-…`.
- Keep the existing `ProductListItem` (selection, discount chip, meta). Add a thin
  themed scrollbar affordance and a `pr-1` gutter so the chip never clips.

## 2. Premium recommendation card (right panel)

Redesign the recommendation surface into one cohesive premium card:
- **Gradient hero header** (`bg-gradient-to-br from-ai/10 via-card to-card`,
  `--ai` = the design system's AI accent) with an AI sparkle glyph in an `ai/15`
  chip, the "AI Markdown Recommendation" label, the generated-at badge, and the
  refresh control. The AI headline sits here as a bold callout.
- **Product identity row:** large title, an urgency pill, and the units / frozen /
  idle meta rendered as subtle chips.
- **Rationale callout** with a left `--ai` accent border.
- **Two hero metrics side by side:**
  - *Recommended discount* — oversized number, tone-ramped
    (primary → warning → destructive) by depth, "start here".
  - *Projected recovery* — a **radial gauge** (`RecoveryRing`, inline SVG, `--success`
    stroke on a muted track) with the % of frozen value in its center and the dollar
    figure beside it.
- **Markdown ladder = "cost of waiting" timeline:** NOW → in 2 weeks → final, color
  escalating with depth, connected by arrows, each rung showing its discount and the
  shrinking recovery — so the cost of delay is visually obvious.
- **Action bar** with the AI accent.
- Footer keeps the total-projected-recovery line.

New pure sub-component `RecoveryRing` (inline SVG donut, tokens only) added in the
same feature file (keeps the markdown-plan feature cohesive).

## Tests (root Rule 4)
- Pure helper for the ring math (`lib/recovery-ring.ts`: `dashArray(pct, r)` and
  pct clamping) unit-tested in Vitest. UI ships with the manual checklist below
  (no jsdom runner).

## Manual verification checklist
- Left list scrolls on its own when items overflow; right panel stays in place;
  selection still works; discount chip not clipped.
- Recommendation card: gradient hero, ring gauge, escalating ladder all render in
  **both light and dark**; contrast holds; nothing animates on load; keyboard focus
  visible on the list buttons + refresh.
- Skeleton/empty/error states still render (cold generation, no-rec product, error).
- Responsive: single-column stack on mobile; no horizontal page scroll.

## Acceptance Criteria
1. Dead-stock list is independently vertically scrollable.
2. Recommendation panel redesigned per §2, tokens only, both themes verified.
3. Ring math unit-tested.
4. `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` all green.
