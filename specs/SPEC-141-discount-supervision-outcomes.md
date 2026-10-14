# SPEC-141 — Discounts: supervision outcomes panel ("did the email work?")

Status: implemented
Depends on: backend SPEC-144 (outcomes), SPEC-139 (Needs-attention tab)

## Problem

The supervision loop lets the owner detect a discount problem and email the location
manager (SPEC-139), but stops there — he never sees whether the nudge *worked*. Close
the loop: show, per emailed location, whether manual discounting actually dropped after
the email.

## Design

Backend computes everything (Rule 8: `GET /discounts/attention/outcomes` → per-location
manual $/day before vs since the first email, delta %, days-since, and a
`improved`/`worse`/`flat`/`too_early` status). Frontend only displays.

- `types/discounts.ts`: `DiscountOutcome` + `DiscountOutcomes`.
- `services/discounts.ts`: `getDiscountAttentionOutcomes()`.
- **`OutcomesPanel`** (server component, static, tokens-only) — a card "Since you
  emailed a manager", one row per location: name, "emailed N days ago", **before/day →
  after/day** with a signed delta (green when down, red when up), and a status pill
  (Improved / Still rising / Steady / Too early). `too_early` rows show "Watching —
  check back in a few days" instead of a misleading number. Renders **nothing** when no
  location has been emailed yet (`outcomes.length === 0`).
- **Attention page**: fetches queue + outcomes in **parallel** (`Promise.all`, Rule 5);
  `OutcomesPanel` sits above both the queue and the "All clear" state (outcomes are
  independent of whether anything is currently flagged). Skeleton gains an outcomes block.

HCI/perf: no new client JS (static server render), semantic tokens only, no entrance
animation (Rule 9), parallel fetch.

## Manual verification checklist

- Email a location's manager (Needs attention → send). Return to the tab → the "Since
  you emailed a manager" panel lists that location; within 3 days it shows "Too early",
  after that it shows the before→after manual $/day and Improved/Steady/Still rising.
- Panel is absent entirely when nothing has been emailed.
- Above both the queue and the "All clear" empty state; light + dark; mobile.

## Acceptance Criteria

- [x] Outcomes panel shows per-location before→after manual $/day, delta %, status.
- [x] Hidden when no manager has been emailed; "too early" states handled honestly.
- [x] Parallel fetch with the queue; above both queue and all-clear states.
- [x] `npm run lint`, `npx tsc --noEmit`, `npm test` (594), `npm run build` green.
