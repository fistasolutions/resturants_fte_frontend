# SPEC-162 — Query bank: fix the focus panel, make it readable

**Status:** complete (verified 2026-08-25)
**Repo:** `ecommerce-fte-frontend`
**Depends on:** SPEC-161 (Today's focus), SPEC-159 (provenance chips), backend SPEC-164.

## Problem

Owner review of the shipped SPEC-161 panel. Three defects, visible in the screenshot:

1. **Every focus row appears twice.** The panel renders `todaysFocus`, but the list
   underneath still renders the *unfiltered* set, so the same four searches show once in
   the focus panel and again inside their category group.
2. **The counts contradict each other.** "4 of 300" sits directly above
   "300 of 300 searches". Two different denominators, no explanation of either — it reads
   like a bug even though both numbers are individually correct.
3. **The panel is an undifferentiated grey slab.** `bg-muted/30` with a bare heading gives
   the most important block on the page less visual weight than the plain rows below it.
   Nothing says *why* these four, or what to do with them.

## Design

### 1. The bank below shows the remainder

`splitTodaysFocus` already returns `{ focus, rest }` and SPEC-161 only consumed `focus`.
The grouped list now renders **`rest`** (intersected with the active filters), so each
search appears exactly once. Filters still apply to the bank; the focus panel is
deliberately unfiltered — it is a priority list, not a search result, and must not
silently shrink when someone types.

### 2. Honest, self-explaining counts

- Focus panel: **"4 searches"** with a one-line explanation of where they came from.
- Bank below: **"296 more searches"** when unfiltered, **"12 of 296"** when filtering.
  The two numbers now sum to the whole, so nothing looks lost.

### 3. Real visual hierarchy, tokens only

- Promote the panel with `border-primary/20 bg-primary/5` — it reads as *the* thing to
  act on without inventing a colour (root Rule 9: `--primary`, never `--brand`).
- A `Sparkles` icon + "Today's focus" heading, with the subtitle stating the actual
  reason: *"Behind today's picks — the searches worth writing for first."*
- Rows sit on `bg-card` so they lift off the tinted panel instead of blending into it.
- Empty state: when there are no picks yet the panel is hidden entirely (unchanged).

No entrance animation of any kind (root Rule 9) — the panel renders in place.

## Tests

- `splitTodaysFocus` already covered by SPEC-161; add: `rest` excludes every focus row,
  and `focus.length + rest.length === queries.length` for a realistic bank.
- A new `bankCountLabel(shown, total, filtering)` helper is pure and unit-tested, so the
  "296 more" / "12 of 296" wording has one definition.

Manual checklist:
- [ ] No search appears in both the focus panel and the list below.
- [ ] Counts sum to the bank total; filtering updates only the lower count.
- [ ] The panel is visually dominant but uses only semantic tokens.
- [ ] Both themes; nothing animates in.

## Acceptance criteria

- [ ] Zero duplicate rows between panel and list.
- [ ] Counts are self-explaining and consistent.
- [ ] Panel has clear hierarchy, tokens only, no `--brand` misuse.
- [ ] `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` green.

## Verification (2026-08-25)

| Acceptance criterion | Result |
| --- | --- |
| Zero duplicate rows between panel and list | **done** — the grouped list renders `rest`, filtered; the panel renders `focus` |
| Counts self-explaining and consistent | **done** — `bankCountLabel`: "296 more searches" / "12 of 296"; panel + bank sum to the whole |
| Clear hierarchy, tokens only | **done** — `border-primary/20 bg-primary/5`, `Sparkles`, rows on `bg-card`; `--brand` untouched |
| No entrance animation | **done** — renders in place (root Rule 9) |
| test / tsc / lint / build green | **done** — 722 passed, tsc clean, 0 lint errors, build compiled |

**Note:** filter *options* still come from the whole bank, so a dropdown value never
disappears merely because its row sits in the focus panel.

### Manual checklist — for a human

- [ ] No search appears twice
- [ ] Counts sum; filtering changes only the lower one
- [ ] Panel reads as the primary action area
- [ ] Both themes
