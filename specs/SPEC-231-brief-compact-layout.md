# SPEC-231 — Morning Brief: the compact layout

Status: implemented (2026-09-12)
Depends on: SPEC-230 (the client cache the view reads from), SPEC-224 (dynamic
attention), SPEC-233-backend (detector registry), SPEC-116 (integration health),
SPEC-075/076 (range picker + compare verdicts)
Mockup: `ref/brief-compact-mockup.html` — tab **1 · Rail**, with the KPI strip from
tab **3 · Grid**. Chosen by the owner from five candidate structures on 2026-09-12.

## Problem

The live page is **2,198px tall** and most of it is padding. Every item on it is a
card, nested inside a section, inside the page — three layers of padding for every
line of information. Three decision cards alone take ~800px; each shows its full
evidence block whether or not anyone asked for it. The rail content — overnight watch,
predictions, integration health — sits 1,400px below the fold on a page opened every
morning.

The owner's words: the big cards waste too much space; make it professional.

## The one rule of this spec

**Presentation changes. Behaviour does not.** Every fetch, hook, state, action, href,
label, gate and empty state on the page today survives this change exactly:

- the three cached queries and the archive/live split (SPEC-230, SPEC-104)
- `DecisionCard`'s optimistic approve/skip with rollback, its review hrefs, its
  approved/skipped/read-only messages, its compare verdict (SPEC-076)
- attention's primary/extra split, expander, "n of m checks fired", both empty states
- the self-fetching predictions strip that never blocks the brief
- coverage's status config, "x ago" label and the `/system` link
- the trust line and the "data as of" stamp

`tests/brief-attention.test.ts` and every existing test pass unchanged. What moves is
where things sit and how much room they take.

## The layout

```
header row     greeting + date · [range picker] [archive picker]
archive notice (unchanged, archive only)
KPI STRIP      six small tiles — the yesterday_kpis the payload already carries
┌─ main (≈62%) ───────────────────────┐ ┌─ rail (≈38%) ─────────────┐
│ TODAY'S DECISIONS      prepared ·   │ │ OVERNIGHT WATCH           │
│  row · row · row                    │ │  row · row · row · row    │
│ NEEDS ATTENTION   n of m fired      │ │ PREDICTIONS   Forecast →  │
│  row · row · row · row · row        │ │  row · row                │
│  [show n lower-value alerts]        │ │ INTEGRATION HEALTH  6/6   │
└─────────────────────────────────────┘ │  row × 6                  │
                                        └───────────────────────────┘
trust line · data as of
```

Under ~1024px the rail stacks beneath the main column.

### The KPI strip

`BriefData.yesterday_kpis` — revenue, orders, AOV, new customers, refunds, each with a
delta — has been in every brief payload since SPEC-075 and is shown nowhere: the V4
brief removed the "Yesterday at a Glance" blocks as a Dashboard duplicate. The strip
brings the numbers back at a sixth of the height, as six tiles across one row:

| Tile | Source | Note |
| --- | --- | --- |
| Revenue | `yesterday_kpis.revenue` + delta | replaces the header's yesterday line, which moves here |
| Orders | `yesterday_kpis.orders` + delta | |
| AOV | `yesterday_kpis.aov` + delta | |
| Refunds | `yesterday_kpis.refunds_total` · % of revenue | |
| Checks fired | attention `checks_fired` / `checks_run` | **live only** — attention is not fetched in archive |
| Integrations | coverage live / total | |

The strip is built by `lib/brief-strip.ts` — pure, unit-tested — so a tile's label,
value, delta direction and tone are asserted rather than eyeballed. The tone rule is
the one `DeltaBadge` already uses: refunds invert (a rise is bad).

### Panels and rows

One `<section>` per group with a compact uppercase header, and **rows** inside divided
by hairlines. No card-in-card. `features/brief/brief-panel.tsx` holds the two
primitives (`BriefPanel`, `BriefRow`) so the five sections cannot drift apart.

### Decisions

A decision is one row block: title left, money right on the first line; the one-line
"why"; then the action row. **Evidence folds behind a disclosure**, closed by default —
the owner chose this on the mockup — and opens in place. Approved and skipped rows keep
their current colouring and messages. The serif is dropped from decision titles: it is
much of what made them read as editorial cards rather than a list of things to do.

### Attention

The card becomes a row: severity dot · title · source · one-line detail · delta chip,
count right-aligned. Same primary/extra split, same expander, same two empty states,
same `deltaToneClass` (SPEC-224 Patches).

### Rail

Overnight watch, predictions and coverage become rows in their own panels. Coverage
keeps its pulsing live dot and its `/system` link. Predictions moves off its
`useEffect`+`fetch` onto `useApiQuery(foresightQueries.forecast())` — the SPEC-230
path every other read on the page already uses — and shows two skeleton rows while the
forecast loads instead of nothing, so the health panel below it no longer jumps when
the forecast lands. It still renders nothing if the forecast fails.

### Order of the main column

Decisions first, attention second — the order the owner approved on the mockup. SPEC-104
placed attention at the top of the old single column; in two columns the decisions are
the actions and attention is the context for them, and both are above the fold.

## Design (root Rule 9)

Tokens only. `--destructive` / warning / `--success` for status; brand red stays
identity-only. 8px spacing scale; 16px panel radius; rows `px-4 py-3`. No entrance
animation — rows render in their final position; the only motion is the existing
skeleton pulse, the coverage dot's ping, and the disclosure chevron rotating on click.
Both themes verified.

## Scope

1. `lib/brief-strip.ts` — `buildBriefStrip(data, attention)` → tiles; Vitest-covered.
2. `features/brief/brief-strip.tsx`, `features/brief/brief-panel.tsx` — new.
3. `features/brief/brief-header.tsx` — greeting + date only (the yesterday line moves to the strip).
4. `features/brief/decision-card.tsx`, `needs-mordy-attention.tsx`, `overnight-watch.tsx`,
   `brief-predictions.tsx`, `brief-coverage.tsx`, `brief-trust-bar.tsx` — presentation
   only; every prop and every branch kept.
5. `features/brief/brief-view.tsx` — the two-column composition.
6. `features/brief/brief-skeleton.tsx` — mirrors the new layout so the first paint matches.

## Not changed

- No route, query, type, service or backend change.
- `lib/brief-attention.ts` untouched.
- `brief-kpis.tsx` untouched (`DeltaBadge` is shared with Returns).
- The review pages the decisions link to are untouched.

## Acceptance criteria

1. Every section, number, action and link on the live page today is still present. — done
2. Approve/skip still POSTs, still rolls back on failure, still shows its messages. — done
3. Archive view still hides attention, predictions and the range picker, and renders
   decisions read-only. — done
4. Attention's expander and both empty states still work. — done (expander logic
   unchanged; no lower-value alerts existed on 2026-09-12 to exercise it live)
5. The KPI strip shows six tiles live, five in archive, with correct delta tones. — done
   (`tests/brief-strip.test.ts`, 15 cases; both views captured)
6. Evidence is closed by default and opens per decision. — done (`aria-expanded` true
   after click, captured)
7. Page height on today's data is at most **55%** of the current 2,198px. — done:
   **1,172px (53%)** live, 950px archive, at 1440×900
8. Both themes correct; no entrance animation. — done (`ref/screens/brief-compact/`)
9. `npm test`, `npx tsc --noEmit`, `npm run build` pass; existing tests unchanged. — done
   (114 files / 1,356 tests; build compiled; lint's 3 warnings are pre-existing in
   social/spotlight)

## Manual verification (no jsdom runner — root Rule 4)

Captured by `tools/capture_brief_compact.mjs` → `ref/screens/brief-compact/`:

- [x] `/brief` live: six tiles, two columns, decisions with evidence closed (`light-live.png`).
- [x] Open evidence on one decision (`light-evidence-open.png`). Approve/skip not exercised
      live — the three decisions today are all review-page decisions, and the POST path
      is byte-for-byte the previous one.
- [x] `?date=<yesterday>`: five tiles, archive notice, read-only decisions, no attention,
      no predictions (`light-archive.png`).
- [ ] Expander shows/hides lower-value alerts — not reachable today (5 of 9 checks fired,
      all primary); logic unchanged from SPEC-224.
- [x] Dark theme (`dark-live.png`); 900px viewport — rail stacks under main (`light-900.png`).
- [x] Skeleton mirrors the layout (`light-skeleton.png`).

## Patches

### 2026-09-12 — the decisions fold, and undoing a skip (owner review of the build)

Two questions on the finished page, in the owner's words: *both panels are dynamic —
what happens when there are more than three or four?* and *if by mistake I press
skip, how do I get that item back? Think like the user.*

**Decisions fold.** Attention already showed the top five by money and folded the rest
behind "Show N lower-value alerts" (SPEC-224); Decisions had no cap, so eight decisions
would have made the panel eight rows tall. It now folds the same way: `lib/brief-
decisions.ts` `splitDecisions()` keeps the first `DECISION_PRIMARY_LIMIT` (5) in the
backend's ranked order and `features/brief/decision-list.tsx` renders the rest behind
"Show N more decisions". No scroll box inside the panel — a scrollable region inside a
page is where a decision gets missed, which is the opposite of the panel's job.

**Undo a skip.** Backend SPEC-240 adds `DELETE /brief/actions/{decision_type}`, which
deletes today's skip row (an approval answers 409 — it records a real send). The
skipped row keeps "Skipped for today — comes back tomorrow if still true" and gets a
real **Undo skip** button (secondary style, `Undo2` icon) at the head of its action
row; only the row's content dims, never its action row, so the button reads as one.
Undo is optimistic like approve/skip (the row returns to pending at once, rolls back
with "Could not undo — try again" on failure) and re-enables the action row. Read-only
archive rows have no Undo. `DecisionCard` gains one handler and one button; the
approve/skip path is untouched.

Verified: `tests/brief-decisions.test.ts`; live — skip a decision, Undo, the row is
pending again and `GET /brief` after a reload agrees.
