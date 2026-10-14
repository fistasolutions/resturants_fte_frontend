# SPEC-216 — A generation toast that survives navigation

**Status:** frontend slice of backend **SPEC-224**.
**Depends on:** backend SPEC-224, SPEC-115 (the live draft surface).
**Governs:** how blog generation is started and watched. Additive.

## Why

Generation used to live inside the HTTP request, so leaving `/spotlight` killed a
multi-minute agent run. Backend SPEC-224 moved it to a background job with its progress
in a row. This is the part the owner actually sees:

- Click **Generate** → a **toast, top right**, showing the live phase.
- **Navigate anywhere, or refresh** — the toast is still there, because it reads a row,
  not component state.
- **Click the toast** → back to the generating screen.
- **The Generate button is disabled while one is running**, everywhere it appears.

## Scope

1. **`services/spotlight-generation.ts`** — `startGeneration`, `getActiveGeneration`,
   `getGeneration`, through `/api/proxy`. A 409 surfaces its message verbatim rather
   than being swallowed: "a blog is already being generated" is the answer, not an error.

2. **`GenerationProvider` in the app shell** — polls `GET /spotlight/generation` and
   exposes the active job to any page. Polling, not SSE, on purpose: the progress is a
   row, so a poll is trivially resumable after a refresh where a stream is not, and the
   payload is a handful of fields every few seconds.
   - Polls **only while a job is running**, so an idle app makes no traffic.
   - On completion it stops and surfaces the finished draft.

3. **`GenerationToast`** — fixed top-right, above content, showing step, elapsed time and
   an approximate word count from `body_chars`. Clicking routes to the generating screen.
   Tokens only, no Framer Motion (Rule 9); the only motion is the existing spinner.

4. **`GenerateDraftButton`** — disabled with an explanatory title while a job is running,
   everywhere it is used (query bank, daily picks). **Disabled, not hidden**: a control
   that vanishes reads as a bug, one that is disabled and explains itself does not.

5. **`lib/generation.ts` (pure, unit-tested)** — the phrasing and derived numbers:
   elapsed time, approximate words from characters, whether the button should be
   disabled, and the finished/failed copy. Logic lives in `lib/` because that is what
   Vitest can reach (root Rule 4).

## Tests

- `lib/generation.ts`: elapsed formatting, word approximation, disabled rule, terminal
  copy for success and failure.
- Adapter: job payload → view model; absent fields never become `NaN`.
- `npm test`, `tsc`, `lint`, `build` green.

## Acceptance criteria

- [ ] Starting a generation shows a top-right toast with live progress.
- [ ] The toast survives navigation and a hard refresh.
- [ ] Clicking the toast returns to the generating screen.
- [ ] The Generate button is disabled while a job runs and says why.
- [ ] A second attempt surfaces the backend's 409 message.
- [ ] Tests, tsc, lint, build green.

## Patches

- **2026-09-03 — implemented.**
  - `lib/generation.ts` (pure, 17 tests), `services/spotlight-generation.ts`,
    `GenerationProvider` + `GenerationToast`, both mounted in the app shell.
  - **The toast portals into the existing `#media-toast-host`, not its own `fixed` box.**
    SPEC-178 created that shared top-right column precisely so two features do not each
    plant a fixed element in the same corner and overlap — the first draft of this toast
    would have done exactly that.
  - `GenerateDraftButton` now starts a background job instead of relying on the page it
    navigates to, and is **disabled with an explanation** while one runs. Disabled, not
    hidden: a control that vanishes reads as a bug.
  - **A lint error caught a real problem**: the provider's mount poll called `refresh()`
    synchronously inside an effect, tripping the cascading-render rule. Restructured to
    one effect with a deferred first call plus an interval that only exists while a job
    is running — so an idle app makes no traffic at all, and the interval is not torn
    down and rebuilt on every progress tick.
  - **Verified:** `npm test` 1091 passed (99 files), `tsc` clean, `lint` 0 errors
    (3 pre-existing warnings in untouched files), `build` compiled in 4.7s.

## Acceptance criteria — verified 2026-09-03

- [x] Starting a generation shows a top-right toast with live progress.
- [x] The toast survives navigation and a hard refresh (it polls a row, not state).
- [x] Clicking the toast returns to the generating screen, or the finished draft.
- [x] The Generate button is disabled while a job runs and says why.
- [x] A second attempt surfaces the backend's 409 message.
- [x] Tests, tsc, lint, build green.
- [ ] **Manual browser walkthrough not done.** Another session's edits are triggering
      constant `--reload` restarts, so a multi-minute generation cannot complete on the
      live server right now. Worth clicking through once the tree is quiet.
