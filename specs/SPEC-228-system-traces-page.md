# SPEC-228 — `/system`: did the platform actually run?

Status: implemented
Depends on: backend SPEC-238 (the job-run ledger), SPEC-119 (instant header, skeleton
below), SPEC-227 (the error boundaries this page inherits)

## Problem

Twenty-three jobs run this platform and, until backend SPEC-238, twenty-one of them
left no record at all. Now that they do, there is nowhere to see it.

The question worth answering is narrow and operational: **did last night actually
run?** Not "how fast is the AI" (that is `/ai`) and not "did the messages work" (that
is `/results`) — did the scheduled work happen, and if not, which piece.

## Placement

Its own page at `/system`, reached from a health card on the Morning Brief. The brief
already carries an integration-coverage panel for the five sync integrations
(SPEC-116); this is the same question asked of the other eighteen jobs, so the brief
links to it rather than growing a second panel of its own.

## The page

### Headline — four counts, worst first
Jobs watched · failing · stale · runs in the last 24h. A count of zero failures is a
real answer and renders as such, not as an empty state.

### The job grid — a card per job, grouped
One card per job: title, what it is for, its cadence, its health, when it last
succeeded, and what its last run produced. Grouped by purpose (Data, Reporting,
Foresight, Growth, Money, Housekeeping) because twenty-three flat cards is a list, not
a dashboard.

**Cards are sorted worst-first by the backend and the UI does not re-sort them.** A
page whose problems are below the fold is a page nobody reads.

### Health, and what each state means to a reader

| State | Reads as | Why it is its own state |
| --- | --- | --- |
| `failing` | destructive | its last run raised |
| `never_run` | destructive | **the loudest finding here** — a job that has never run cannot fail, so without this it looks exactly like a healthy one |
| `stale` | warning | no success within its own cadence × 2.5 |
| `running` | info | in flight right now |
| `ok` | success | ran, on time |
| `idle` | muted | off until configured (ads, social) — silence is a product decision, not a fault |

`idle` matters as much as `never_run`: marking an unconfigured integration red would
put a permanent false alarm on the page, and a page with a permanent alarm is a page
whose alarms are ignored.

### Clicking a card → its run history
A card opens `/system/[jobId]`: the job's own header, then its runs — status,
started, duration, what it produced, and the error where there is one. Filters
(status, window), pagination, and a row expands to the full error.

### `/system/runs` — everything, filtered
The same table across all jobs, for "what failed last night" rather than "how is this
one job". Filters: job, status, window. Server-paginated.

### An AI trace is a link, not the record
A handful of jobs run agents. Where a run carries a `traceId`, the row links to
`/ai/traces` — the step-by-step record lives there and is not duplicated here.

## What the UI must not do

- **Never invent a status.** Health is computed by the backend against each job's own
  cadence; the UI renders it.
- **Never show a stack trace.** The API returns the message only (root Rule 6); the UI
  shows that and nothing more.
- **No re-run button.** Triggering a job is a mutation with real consequences —
  `social_publish` posts to Meta — and is out of scope in the backend too.

## Loading, empty and error states (root Rule 6)

- `loading.tsx` renders the real header instantly with skeleton cards below
  (SPEC-119). The route is dynamic; without it the page hangs blank on the fetch.
- A job with no runs shows "No runs recorded" inside its card, not a blank space.
- A filter that matches nothing says so, and says which filter to clear.
- Failures land on the SPEC-227 boundaries already in place.

## Design (root Rule 9)

Semantic tokens only; `--destructive` / warning / `--success` for health, never
`--brand`, which is identity. 8px spacing, 16px card radius, consistent page padding
(`p-4 md:p-6`) matching every other route. No entrance animation — cards render in
their final position. Tables scroll inside their own container so the page never
scrolls sideways.

## Scope

1. `types/system.ts` — view-model mirrors of the payload.
2. `lib/system-trace.ts` — all derived logic, Vitest-covered: `adaptJobs`,
   `adaptRuns`, `healthTone`, `formatDuration`, `formatOutcome`, `relativeTime`,
   `groupJobs`, `WINDOWS`/`STATUSES`.
3. `services/system.ts` — `getSystemJobs`, `getSystemRuns`, `getSystemRun`.
4. `features/system/` — `health-summary`, `job-card`, `job-grid`, `run-table`,
   `run-filters`, `run-detail`.
5. `app/(app)/system/page.tsx` + `loading.tsx`, `app/(app)/system/[jobId]/page.tsx`,
   `app/(app)/system/runs/page.tsx`.
6. A link from the Morning Brief's coverage panel, and a sidebar entry.

## Acceptance criteria

1. Every job appears, including ones that have never run. — done
2. Health tone matches the backend's state; the UI never recomputes it. — done
3. Problems appear above healthy jobs. — done
4. A card opens that job's run history. — done
5. Run history filters by status and window, and pages. — done
6. A failed run shows its message; never a stack trace. — done
7. A run with a trace links to `/ai/traces`. — done
8. Skeleton loading on both routes; empty states everywhere. — done
9. Both themes correct; no entrance animation. — done
10. All `lib/system-trace.ts` logic is Vitest-covered. — done
11. `npm test`, `npx tsc --noEmit`, `npm run build` pass. — done

## Manual verification (no jsdom runner — root Rule 4)

- [ ] `/system` renders every job grouped, worst first, in both themes.
- [ ] A failing job is visibly first.
- [ ] A card click lands on that job's history.
- [ ] Filters and pagination change the rows, and the empty state is reachable.
- [ ] Mobile: cards stack, the table scrolls inside itself.
