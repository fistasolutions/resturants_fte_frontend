# SPEC-369 — Continuous Innovation: the daily and weekly reports since Sep 26

**Status:** Implemented (revision 2: screens, time, Sep 25)
**Date:** 2026-10-09
**Repo:** ecommerce-fte-frontend
**Builds on:** SPEC-253 (Continuous Innovation)

## Problem

Owner: "the daily reports are not being updated after the 24th of September — get the commits we
did after it and create the daily reports like we already have, and the weekly reports too."

The last daily report on `/ci` is Thursday Sep 24, and the last weekly report is Sep 14 – 18.
The reports were produced by the source project's `tools/build_ci_content.py` from per-report
generators, and its screenshots by `tools/capture_*.mjs` against the live app. Neither tool is in
this checkout. This checkout's history starts on Sep 26 (the white-labelled platform's first
commit), and `docs/MEMORY.md` here covers each day from Sep 26.

## Decision

1. **A second data module, hand-written from the record:** `lib/ci/content-recent.ts` exports
   `CI_RECENT_REPORTS: CiReport[]`, in exactly the `CiReport` shape the generator writes. The
   generated `content.ts` is not touched.
   - **Daily:** one report per working day with commits: Sep 26, Sep 28, Sep 29, Sep 30, Oct 1,
     Oct 2, Oct 5, Oct 6, Oct 7, Oct 8 and Oct 9 (Oct 9 is the day so far).
   - **Weekly:**
     - `w0926` "Sep 21 – Sep 26", over the four existing dailies and Sep 26
     - `w1002` "Sep 28 – Oct 2"
     - `w1009` "Oct 5 – Oct 9"
2. **The source is the record, never memory:**
   - `docs/MEMORY.md` for that date (its PBI, Fix and Feature lines);
   - the day's commits in every repo;
   - the specs those name.

   Nothing is claimed that those don't say. No store figures are invented, and figures are
   quoted only where the record states them.
3. **Effort is `null`.** The source project measured each item's time from its session logs,
   which this checkout doesn't have. A guessed hour figure would break the reports' own promise
   ("measured, not estimated").
4. **No screenshots yet (`shots: []`).** The capture tools aren't here. Each report says so in a
   caution ("Screens to follow"), and the feed's screen count is unchanged.
5. **`lib/ci/reports.ts` merges** the two lists by id. A generated report with the same id wins,
   so re-running the source project's generator later can never show a day twice.

## FOC after this change

**What FOC sees: eleven more daily reports and three more weekly reports on Continuous
Innovation**, as the owner asked. Nothing else changes. `/ci` stays gated on the organization's
`ci` feature.

## Acceptance criteria

1. `/ci` lists the new reports, newest first, with the right kind, period and headline.
   `/ci/<id>` opens each one.
2. Every report validates as a `CiReport` (`tsc`), and the merge prefers a generated report on
   an id clash (Vitest).
3. Every section names what was asked, what was built, why it matters and the value, all from the
   record. Effort is null, and shots are empty with a caution saying screens will follow.
4. `npm run lint`, `npx tsc --noEmit`, `npm test` and `npm run build` are green.

## Verification (2026-10-09)

| # | Criterion | Status |
|---|---|---|
| 1 | The new reports appear on `/ci` newest first and open at `/ci/<id>` | done. 11 dailies (d0926, d0928, d0929, d0930, d1001, d1002, d1005, d1006, d1007, d1008, d1009) and 3 weeklies (w0926, w1002, w1009); merged by `lib/ci/reports.ts`, ordered by `orderReports`. The build lists `/ci` and `/ci/[id]`; not opened in a browser in this session |
| 2 | Every report a `CiReport`; a generated report wins an id clash | done. `tsc` clean; `tests/ci.test.ts` `mergeReports` |
| 3 | Asked, built, why and value from the record; effort null; no shots; the caution present | done. Every report was checked by the assembler (exact keys, effort null, empty shots, the "Screens to follow" caution, no name of the first client); only `<b>`, `<i>` and `<code>`, the tags the reader renders |
| 4 | Lint, types, tests, build | done. Lint 0 errors (3 old warnings), `tsc` clean, `npm test` 232 files / 2596 tests passed, `npm run build` compiled |

**Guards met:**
- `tests/client-neutral.test.ts`: five Oct 9 phrases naming the first client's niche were reworded neutrally rather than exempted.
- `tests/brand-name.test.ts`: `content-recent.ts` joins `content.ts` on the allowlist, because the reports describe days before the Oct 5 rename.

**How it was produced:** the reports were written from `docs/MEMORY.md`, each day's commits across the five app repos and the root, and the specs they cite, then assembled by a checking script. Sep 25 has no record in this checkout (its history starts Sep 26), so the week of Sep 21 lists Monday to Thursday and Saturday.

## Revision 2 (2026-10-09): screens, time, Sep 25, and the PDFs

Owner: "where are the images … I want very very detailed reports, properly capture the screens …
my old reports have the calculated time … like the reports in `ref/Reports/`." Then they gave the
live-app sign-in and said to capture the screens and update the reports.

### Decision

1. **Screens from the live app.**
   - 51 views were captured from `ecommerce.ftes.ai`, signed in as the store's owner. A scratchpad
     Playwright script only navigates and screenshots; it never clicks a write.
   - Settings: 1440×1000 at 2×, light theme.
   - The floating Ask Glisp pill and the "Worth a look" nudge are hidden.
   - Every email address and phone number on screen is blurred: team members, customers in the
     support inbox, and a phone number quoted inside a customer's message.
   - Each capture was checked to show the tab its section describes. `/system?tab=runs` did not
     switch tabs, so it was dropped.
   - Screens go to `public/ci/<id>/<view>.webp` (1400 px wide), the same place and size as the
     generated reports'.
2. **What a screen means.**
   - A section gets the screens of the surface it built.
   - Work with no screen gets none:
     - backend only (tenancy leaks, the database move, row-level security);
     - the operator console (it needs an operator sign-in);
     - the marketing site.
   - **Oct 9 has no screens:** its work is not deployed, so a capture would show Oct 8's app. Its
     caution "Screens follow the deploy" says so.
   - Every other report's "Screens to follow" caution is replaced by "How these screens were
     captured": captured Oct 9, on today's state of the screen, with contact details blurred.
3. **Time is an estimate per area**, set from the scope of the work, the way the source project's
   generators set each section's `mins`.
   - A daily's effort is the sum of its sections.
   - A weekly section is one day, so it carries that day's total.
   - Every report says the time is estimated. Revision 1's "effort null" is withdrawn at the
     owner's request.
4. **Sep 25 carried over.**
   - The source project already has `d0925` and `w0925` (Sep 21 – 25), generated with screens. Both
     are copied into `content-recent.ts` with their images.
   - One quoted pair of searches naming the store's niche is reworded ("two office-wear
     searches").
5. **Weeks no longer overlap.**
   - `w0926` is withdrawn, because `w0925` covers Sep 21 – 25.
   - Its Saturday section opens `w1002`, which now covers **Sep 26 – Oct 2** (six days).
6. **The PDFs.**
   - Thirteen PDFs are written to `ref/Reports/`, in the earlier reports' layout:
     - the earlier reports' CSS, verbatim;
     - a cover memo and meta strip, then "at a glance", contents, and before and after;
     - per section: the ask and status, what we built / why it matters / value, and what is
       inside it;
     - screen pages with the route and caption;
     - then next steps and cautions.
   - They are `Fame-Daily-Build-Report-<date>.pdf` (11) and `Fame-Weekly-Build-Report-<date>.pdf`
     (`2026-10-02`, `2026-10-09`).
   - Sep 25's PDFs were already there and are not rewritten.
   - The builder, the screen map with time per section, and the capture script live in the
     session scratchpad, like the source project's per-report generators. The signed-in session
     file was deleted after the run.

### FOC after this change

**What FOC sees: the same reports, now with screens and time, plus Sep 25's daily and weekly**,
as the owner asked. The overlapping Sep 21 – 26 weekly is replaced by Sep 21 – 25 and Sep 26 – Oct 2.
Nothing else changes.

### Verification (2026-10-09)

| # | Criterion | Status |
|---|---|---|
| 1 | Every screen is from the live app, on the tab its section names, with no floating UI and no visible contact details | done. All 51 captures checked on contact sheets |
| 2 | Every section has a time; every report's effort is the sum of its sections | done. For example `d1007` 25h, `w1002` 141h 30m |
| 3 | `d0925` and `w0925` appear with their images; `w0926` is gone; `w1002` is Sep 26 – Oct 2 | done. 15 reports in `content-recent.ts` |
| 4 | Every image a report names exists under `public/ci/` | done. Checked by the builder before it writes |
| 5 | Thirteen PDFs in the earlier layout | done. Pages read back for `d1007` and `w1002` |
| 6 | Lint, types, tests, build | done. Lint 0 errors (3 old warnings), `tsc` clean, `npm test` 232 files / 2596 tests passed, `npm run build` 82/82 pages |

**Found while capturing:** on Report Builder → History, the AI cost figure ("$0.00") is drawn over
the row's action icons. It is a real layout fault on the live app and is not fixed here.

**Patch (same day): Oct 9's screens.** The owner opened `/ci/d1009` and saw no images. Oct 9 isn't
deployed, so its 9 screens were captured from today's build running locally (`localhost:3000`),
signed in as the owner, with the same hiding and blurring:
- the Brand Brain's facts, review and competitors;
- Email Marketing and Customer Support settings and overview;
- Integrations, Digital Employees and the sidebar switches.

Setup (shown only to a company still onboarding) and the support-session banner are described,
not shown. The report's caution says how its screens were captured. `w1009`'s Friday carries two
of them.

Checked on the page: `/ci/d1009` renders 9 images, `/ci/d1008` 7, `/ci/d0926` 11.
