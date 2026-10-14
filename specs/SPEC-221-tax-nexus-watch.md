# SPEC-221 — Sales & Tax → Nexus Watch

Status: implemented
Backend: SPEC-230 (`GET /tax-reports/nexus`)
Implements the client-facing half of idea #20.

## Problem

Crossing a state's economic-nexus threshold unnoticed becomes back-tax plus
penalties. The warning is only useful weeks ahead of the crossing.

## What this builds

A page at `/tax-reports/nexus`, linked from the Sales & Tax header (that page has no
tab bar, so a header link is the honest pattern rather than inventing one).

### Coverage banner — first thing on the page, not a footnote

While `coverage.complete` is false the page opens with a banner stating how many
orders carry a destination (`4,127 of 111,482 — 3.7%`) and that **every figure below
is a floor: the true number can only be higher.** This is the SPEC-217/225
discipline and it is the most important element on the page — a threshold page that
looked complete while running on 3.7% of orders would be actively dangerous.

### Two tables, not one ranked list

Measured on production, **51 of 52 states read "registered"**, and a single ranked
list buried the one state that needed a decision under fifty rows of noise. Worse, a
registered state has **no threshold left to cross**, so its progress bar ("571%",
"999+%"), its order count ("17,296 / 100") and its projected crossing date were all
measuring against a line already behind it — the dates rendered were in the *past*.

So the page splits:

1. **Needs a decision** — `exceeded` / `approaching` / `watch`, with the bar,
   percentages and projection that actually mean something. Headed with a count
   ("1 of 52 states"). Its empty state is a genuine all-clear, qualified by coverage.
2. **Already collecting tax** — a quieter table of state, 12-month sales, orders and
   the registration rule as context. No bar, no percentage, no projection.
3. **Well below threshold** — a single line of state codes; nothing more is useful.

The backend suppresses `projected_crossing_date` for registered states at source
(SPEC-230), so the absence is a property of the data rather than of this view.

### The table

One row per state, ranked by risk (`exceeded` → `approaching` → `watch` →
`registered` → `clear`), showing: state, status chip, sales vs sales threshold with
a progress bar, transactions vs transaction threshold, the rule applied
(`$500k AND 100 txns · rolling 12m`), and the projected crossing date.

- `projected_crossing_date` renders as **"—"** when null. Never an invented date.
- A state with no configured rule renders the rule cell as *"No rule configured"*
  and is never given a status other than `clear`.

### Status colours

`exceeded` uses `--destructive`; `approaching` uses the amber warning token;
`watch`/`registered`/`clear` are muted. Brand red is not used for status (Rule 9).

### The disclaimer is structural, not fine print

A footer states the threshold table's `reviewed_on` date and that the figures are a
**monitoring aid, not tax advice** — registration decisions belong to the client and
their accountant. Rendered as a bordered note, not 10px grey text.

## Verification (manual)

1. `/tax-reports/nexus` renders and is reachable from the Sales & Tax header.
2. Coverage banner visible and accurate while coverage is incomplete.
3. Rows ranked by risk; chips match status.
4. Null projected dates render "—".
5. Unconfigured states show "No rule configured".
6. `reviewed_on` and the not-advice note both visible.
7. Light/dark correct.
