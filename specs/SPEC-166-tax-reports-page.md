# SPEC-166 — Sales & Tax Reports pages (the store tax reporting, Phase 5 frontend)

**Status:** implemented
**Date:** 2026-08-25
**Backend counterpart:** backend `SPEC-171-tax-report-storage-and-automation`

## 1. Request

From the client's brief:

> "I would like a simple dashboard summary… The reconciliation status should
> clearly say either **RECONCILED** or **REVIEW REQUIRED**. The dashboard is
> secondary. The Excel accounting report is the primary deliverable."

and

> "Open dashboard → confirm RECONCILED → download/send Excel file."

That last line is the whole design brief. The page exists to answer one
question in one glance — *can I send this?* — and then get out of the way.

## 2. Pages

| Route | Purpose |
| --- | --- |
| `/tax-reports` | History: period, generated date, totals, status, download |
| `/tax-reports/[reportId]` | One report: summary, reconciliation detail, assumptions, the ten columns, download |

## 3. Design

- **Status is words, not colour alone.** `RECONCILED` / `REVIEW REQUIRED`
  rendered as text so it survives greyscale, screenshots and colour blindness —
  the client wrote the words himself and they carry the meaning.
- **`REVIEW REQUIRED` shows its cause inline** — expected, calculated,
  difference and area — because he asked to see *why*, not just *that*.
- **Download is the primary action** on both pages, since the Excel file is the
  actual deliverable and the dashboard is explicitly secondary.
- **The assumptions panel** renders the stored `TaxReportConfig`, so a figure
  read months later carries the definitions that produced it.
- Semantic tokens only; `--brand` is not used for status (Rule 9 — it would
  collide with `--destructive`). No entrance animation.

## 4. Acceptance criteria

1. `/tax-reports` lists history newest-first with period, totals and status. ✅
2. Status renders as literal `RECONCILED` / `REVIEW REQUIRED` text. ✅
3. Discrepancies show area, expected, calculated and difference. ✅
4. Download works from both pages and preserves the backend filename. ✅
5. Detail shows the ten columns in the client's exact order. ✅
6. The assumptions panel renders the stored config. ✅
7. Empty state when no report has been generated yet. ✅
8. Semantic tokens only; no entrance animation; nav entry added. ✅
9. `npm test` green and `npm run build` compiles. ✅

## 5. Manual verification checklist

No component runner exists (root Rule 4), so UI is verified by hand:

- [ ] `/tax-reports` lists generated reports, newest first.
- [ ] A `REVIEW REQUIRED` report shows its discrepancy rows with amounts.
- [ ] Download returns a valid `.xlsx` with the expected filename.
- [ ] Dark mode: status and table stay legible, no hardcoded colour.
- [ ] Mobile width: the ten-column table scrolls inside its own container,
      the page itself does not scroll horizontally.


## Patches

### 2026-08-25 — Manual generate control

The page shipped without a way to create a report: the backend endpoint existed
and was tested, but the only thing that could produce one was the daily
scheduler job, so the page sat on its empty state.

That missed the client's actual plan, which is explicitly manual-first —
generate, cross-verify against the existing Report Pundit output, and only
switch the schedule on once the numbers agree. Without a control there was no
way to start that.

Added `features/tax-reports/generate-form.tsx`: a period selector plus a
Generate button calling `POST /tax-reports/generate` — the same backend code
path as the scheduled run, so what is validated here is what automation will
later produce.

`generatablePeriods()` (in `lib/tax-report.ts`, unit-tested) offers a period
**only once it has actually finished**: offering "August 1-22" on August 10th
would produce a half-empty report that reads as a data problem rather than an
incomplete month. It also handles leap years and the year boundary, mirroring
the backend's period arithmetic so the manual list matches what the schedule
produces.

The result line states `RECONCILED` / `REVIEW REQUIRED` and the row count in a
polite live region — generation takes a few seconds, and the outcome is the one
thing worth knowing before downloading.

Acceptance:
1. Period selector lists only completed periods, newest first. ✅
2. Generate calls the same endpoint the scheduler uses. ✅
3. Busy state disables the control; failure shows the API message. ✅
4. Result announces status and row count; the list refreshes. ✅
5. Leap years and year boundaries handled. ✅


### 2026-08-25 — Delete a generated report

A report generated during validation could not be removed, so the history
accumulated test runs with no way to clear them.

Added `DELETE /tax-reports/{id}` (backend) and a confirm-gated trash control on
each history row.

Deliberately narrow, because this is in tension with the client's requirement to
*retain* a history of previously generated reports: it deletes a **generated
artefact only**. Orders, tax lines and refunds are untouched, so the same period
can be regenerated at any moment and reproduces identical figures — asserted by
a backend test that deletes, regenerates, and compares the totals. The dialog
says so in plain words rather than the usual "this cannot be undone", because
here it genuinely can be.

Acceptance:
1. Trash control on each row, gated by a confirm dialog. ✅
2. Dialog states that Shopify data is untouched and the period can be regenerated. ✅
3. Errors stay visible in the dialog; the row survives so it can be retried. ✅
4. Delete is scoped to the caller's store; unknown id 404s; unauthenticated 401s. ✅
5. Regenerating after a delete reproduces identical figures. ✅


### 2026-08-25 — Latest report opens on arrival; history demoted

The landing page was a list, so seeing anything took a click. That misses the
client's own description of the end state — *"Open dashboard → confirm
RECONCILED → download/send Excel file"* — which only works if the report is
already open when he arrives.

Restructured: the newest report now opens inline (status, totals,
discrepancies, the ten columns, assumptions, download), and older reports drop
into a **Previous reports** panel beneath it — a lookup, matching his
"retrieve prior reports easily without rerunning them", rather than the main
task.

`ReportView` is shared by the landing page and the per-report page, so the two
views cannot drift apart. Its row table scrolls within a fixed height with a
sticky header, so a 57-row report does not push the history panel off-screen.

The period selector is now the shadcn `Select` rather than a native
`<select>`, matching the rest of the UI. The redundant "Open a period for its
reconciliation detail…" line is removed — the detail is on the page now.

Acceptance:
1. Newest report renders open on arrival; no click needed. ✅
2. Older reports listed in a secondary history panel. ✅
3. Landing and detail pages share one component. ✅
4. Row table scrolls inside a fixed height with a sticky header. ✅
5. Selector uses the shared Select component. ✅
6. Redundant hint line removed. ✅


### 2026-08-25 — Calculation assumptions made readable

The panel dumped raw config values — `net_merchandise`, `taxable_flag`,
`refund_date`, `source`. Correct to store, unreadable to anyone checking the
report, and these are precisely the four definitions the client has not
confirmed: they have to be legible to be challenged.

`describeAssumptions()` (unit-tested, covering every value the backend can
emit) renders each as the question it answers plus what it means, e.g.

    What counts as Total Sales    Line revenue after discounts — excludes tax
                                  and shipping          net_merchandise

The raw value stays beside it so the panel remains honest about exactly what
produced the figures, and an unrecognised setting is passed through rather than
hidden — a config that gains an option must not silently vanish.

The section is retitled "How these figures were calculated" and states plainly
that Shopify cannot settle these rules, that the figures use these readings
until accounting confirms them, and that changing one recalculates the report
without a rebuild. The unconfirmed status is the most important fact about this
panel and was previously invisible.


### 2026-08-25 — Assumptions panel removed from the UI

Owner decision: the panel is not wanted on screen. Removed from `ReportView`,
along with `describeAssumptions()` and its tests rather than left as dead code.

The config itself is **still recorded** — stored on every `tax_reports` row and
written to the workbook's `Reconciliation` sheet — so a figure remains traceable
to the rules that produced it. Only the on-screen panel is gone.
