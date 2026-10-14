# SPEC-226 — `/ai`: what the agents did, and whether it was worth it

Status: implemented
Depends on: backend SPEC-237 (KPIs from traces), SPEC-234, SPEC-236
Replaces: the Results › AI Value tab (SPEC-225)

## Problem

SPEC-225 built a cost accounting sheet. Three of its four headline tiles said a version
of "we cannot measure that yet" — `$5.47`, `$0.00 attributable value`, `0 of 20
coverage` — so the page read as dead, which was a fair verdict on the data behind it. Its
verdict column said "Core surface" and "No spend yet", which decide nothing. Its "worth a
second look" list showed four identical $0.13 carousel rows. And it opened with a
paragraph explaining the author's own methodology, which nobody opens a dashboard to read.

## The reframe

The page answers **"what did my AI employees do, and were they worth it?"** Work done
leads; cost supports.

This needs no new estimation — SPEC-236's traces made real KPIs available for the first
time. Every number below is measured: runs, model turns, tool calls, failures, median and
p95 duration, cost per run.

**The honesty rule is unchanged.** Value is still claimed only where genuinely traceable.
What changes is that the page stops *leading* with the one thing it cannot measure and
starts leading with the many things it now can.

## Placement — its own page, not a tab

Moved out of Results to `/ai`. Results answers "did the messages we sent work"; this
answers "how are the agents performing" — a different question, for a different moment.
It also now carries five sections and deep-linkable traces, which is a page, not a tab.
Results keeps a cross-link.

## Scope

### 1. Headline — four measured KPIs
Work done (runs, surfaces active) · Reliability (failure rate) · Speed (median, p95) ·
Cost per run. The prose callout is deleted; the honesty note survives as one line under
value, where it belongs.

### 2. Every AI surface, categorised and filterable
Filter chips — All · Analysis · Content · Social · Communication · Forecasting ·
Operations. Each surface appears exactly once. Columns become meaningful: runs, effort
(turns + tools per run), median time, cost per run, total, value, verdict.

### 3. Verdicts that decide something
Derived from measured KPIs, in priority order — failing, then slow, then earning, then
review, then a plain cost-per-run. `Core surface` and `No spend yet` are gone; a verdict
now names the thing to do.

### 4. What the agents actually did
The section the trace data unlocks and nothing has shown yet: top tools reached for, and
total model turns and tool calls.

### 5. Runs worth a second look → real anomalies
Backed by SPEC-237's per-surface outliers, each stating its reason ("failed", "4× its
usual time"), each linking to the full step-by-step trace.

### 6. Budget guard with real CRUD
Add a ceiling for any surface, edit the amount, pause/resume the kill switch, delete it.
Monthly and per-run periods. Optimistic UI is deliberately **not** used: a ceiling that
looks saved but is not is the failure mode this whole feature exists to prevent.

## Acceptance criteria

1. `/ai` exists in the sidebar; the Results tab is gone and Results links across.
2. Four measured KPIs lead; the methodology paragraph is deleted.
3. Category chips filter the table; every surface appears once.
4. Verdicts derive from KPIs and name an action.
5. Top tools and effort are shown.
6. Anomalies state their reason and open the trace.
7. Caps can be created, edited, paused, resumed and deleted from the page.
8. All derived logic is in `lib/` and Vitest-covered; `npm test`, `tsc` and `build` pass.

## Manual verification (no jsdom runner — root Rule 4)

- [ ] `/ai` renders in light and dark.
- [ ] Chips filter; "All" restores; counts stay correct.
- [ ] Creating, editing, pausing and deleting a cap each persist across a reload.
- [ ] An anomaly opens its trace and shows steps in order.
- [ ] Table scrolls horizontally on mobile without the page scrolling sideways.
