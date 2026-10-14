# SPEC-367 — Brand research, step by step and live

**Status:** implemented 2026-10-09 · **Repo:** frontend · **Backend:** SPEC-376 (nine steps in
waves, live step lines, `started_at`/`finished_at`, the look read from photos) · **Builds on:**
SPEC-341 (the research toast and review), SPEC-362 (the research in Setup), root Rules 9, 11, 12
and 13

## Why

Owner (2026-10-09): Setup must show exactly what the Brand Brain research is doing, as it does it.

**Today:**

- Setup shows the research as one line: the current step's detail.
- The toast numbers the steps "Step 3 of 6", which no longer means anything now that several
  steps run at once.
- A finished step's result is hidden, and nothing says how long a step took.

## What changes

### 1. Every step, live (`lib/brand-research.ts`)

- **The adapter reads `started_at` and `finished_at`** on each step. An older backend sends
  neither, so both are null.
- **`researchLines(run)`** gives one line per step, in the backend's order. Each line has:
  - the label and the state;
  - the step's line:
    - **running:** what it is doing now ("Reading your Shipping policy", "Looking at 8 photos");
    - **done:** its result ("12 customers · 17% came back");
    - **skipped or failed:** why;
    - **waiting:** nothing.
- **`stepClock(step, now)`:**
  - a running step shows how long it has been going: "0:12";
  - a finished one shows how long it took: "12s" or "1m 05s";
  - otherwise empty.
- **`stepPosition(run)`** becomes "4 of 9 done · 3 working". It counts finished steps, and every
  step running at once.
- **While running, the summary line reads:**
  - the running steps' live lines joined, when two or more steps run ("Reading your reviews ·
    Looking at 8 photos");
  - the one step's line, when only one runs.

### 2. Setup (`lib/setup-sections.ts`, `features/workspace/setup-checklist.tsx`)

- **`BrandSection` gains `lines` and `position`.**
- **While the research runs:**
  - the brand block shows the bar, then every step as a line: icon, label, live line and clock;
  - a running line's clock ticks once a second, and only while something runs.
- **When it has finished or stopped:** the summary and Review stay on top, and the steps fold into
  "What it did (9 steps)", a native disclosure with no animation.

### 3. The toast (`features/brand-brain/brand-research-toast.tsx`, for a full organization)

- **The header reads** "4 of 9 done · 3 working · 0:42".
- **Every step shows its line and its clock,** results included, not only the running one.

### 4. The review (`features/brand-brain/research-review-view.tsx`)

- **"Your look" says where each row came from:** "From your Shopify brand settings" for the brand
  colours, "From your store's photos" for the rest.
- **A safety row is subtitled** "How people are shown".
- **The group's blurb** becomes "Colours, light, framing and how people are shown, from your store
  and its photos."
- The pure halves are `lookSource` and `lookSubtitle` in `lib/brand-research.ts`.

### 5. Docs (Rule 11)

- **The Spotlight doc's Brand Brain research paragraph** names the nine steps and what each
  reads. It also says that they run together and that Setup shows each one live.
- **The overview's "A workspace that grows with your data"** names the steps.

## What FOC sees (Rule 12)

**Unchanged.**

- FOC's Brand Brain is full, so no research starts by itself.
- If its owner chooses "Research again", the toast shows the new step list. The findings still
  wait for review, as before.

## Acceptance criteria

1. **`researchLines`:**
   - a running line carries its live text;
   - a done line its result;
   - a skipped or failed line its reason;
   - a waiting line nothing.
2. **`stepClock`:**
   - "0:12" running, "12s" or "1m 05s" finished;
   - "" with no `started_at` (an older backend).
3. **`stepPosition`:**
   - "4 of 9 done · 3 working";
   - the summary joins two or more running lines.
4. **Setup:**
   - `researchSection` carries `lines` and `position`;
   - running, it lists the steps;
   - finished, they sit in the disclosure.
5. **Review:** `lookSource` and `lookSubtitle` as in §4.
6. **Checks:**
   - `npm test`, `npx tsc --noEmit` and `npm run build` pass on a clean copy;
   - the docs coverage and role-gate tests pass.

## Verification (2026-10-09)

On a clean copy of the working tree:

| Criterion | Result |
| --- | --- |
| 1–3, 5 | done. `tests/brand-research.test.ts` ("every step, live"): lines, clocks (0:42, 12s, 1s, 1m 05s, "" for an older backend), the position, the joined summary and the look labels |
| 4 | done. `tests/setup-sections.test.ts`: lines and position while running, lines kept and position null once done |
| 6 | done. `npx tsc --noEmit` clean · `npm test` 231 files, 2582 tests passed (docs coverage and role-gate tests included) · `npm run build` compiled, 82/82 pages |

**Performance.** No new request: the lines come from the run the stream already sends. The clock
ticks once a second, and only while a step runs.

**Manual checklist** (on a new company):

1. Setup's brand block lists every step, with a spinner and a ticking clock on each running one.
2. Two steps running at once both show their live line.
3. Once it ends, "What it did (9 steps)" opens the results with their times.
4. The toast (full organization) shows the same.
5. On the review, the photo rows read "From your store's photos" and the safety row "How people
   are shown".
