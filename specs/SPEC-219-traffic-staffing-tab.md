# SPEC-219 — Store Traffic → Staffing tab

Status: implemented
Backend: SPEC-228 (`GET /traffic/staffing-plan`)
Implements the client-facing half of idea #10.

## Problem

Peak Hours shows where conversion is lost. It stops one step short of the action:
which hour gives cover up, and which hour takes it.

## What this builds

A tab at `/traffic/staffing`, added to `TRAFFIC_TABS` after Peak Hours (it reads the
same data, one step further on).

### The default range is 90 days, not 7

Store Traffic defaults to a one-week window. On that range this tab has fewer than
four weeks of footfall and correctly refuses to plan — so **every user landed on
"not enough data"** and the tab looked broken unless they already knew to widen it.

`trafficDefaultDays()` gives Staffing a 90-day default. The shell's picker and the
page resolve the range through the **same helper**, so the label above the page and
the data inside it always describe the same window (SPEC-083's rule).

### Layout

Per location, a card containing:

- The location name and its total estimated gain.
- A **move list** rendered as explicit pairs: `Tue 3pm → Sat 11am`, with each
  cell's visitors and conversion rate, the estimated gain, and a confidence chip.
- A header line stating the store's own average conversion and AOV, because every
  number below is derived from those two.

`confidence: "low"` renders a muted chip reading *"< 4 weeks of data"* — the page
must not present a two-Saturday sample as a firm recommendation.

### The cost-neutral framing is explicit

A line under the location header reads *"Each move is one hour for one hour — total
hours are unchanged."* That constraint is the reason the recommendation is
actionable, so it is stated rather than left to be inferred.

### States

Loading skeleton, plus **four distinct empty states**, because saying the wrong one
is worse than saying nothing:

1. **No footfall synced** — "V-Count has not synced hours for this period."
2. **Fewer than four weeks in the window** — a rota change cannot rest on it, and
   the page says so and asks the user to widen the range. On the default one-week
   traffic range this is the state that fires; the old copy claimed "every busy hour
   is already converting at or above average", which reads as an all-clear when the
   truth is that there was not enough data to look.
3. **Hours were excluded and what survived is healthy** — names the excluded count
   so the all-clear is qualified by what could not be measured.
4. **Genuinely nothing to fix** — every busy hour already converts at or above its
   store's average. A good outcome, not an error.

## Design (Rule 9)

Tokens only. Weekday/hour formatting goes in `lib/` so it is Vitest-covered, not in
the component.

## Verification (manual)

1. `/traffic/staffing` renders with the tab active.
2. Every move shows both cells with their visitors and conversion.
3. Low-confidence moves carry the chip.
4. The "one hour for one hour" line is visible per location.
5. All four empty states reachable and correctly worded — in particular the
   default one-week range shows the "not enough data" state, never an all-clear.
6. Light/dark correct; date range carries across from Peak Hours.
