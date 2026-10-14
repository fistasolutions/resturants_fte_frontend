# SPEC-365 — Health on short history, reports that can run, Returns sub-pages gated (Phase 6, frontend)

**Status:** implemented 2026-10-09 · **Repo:** frontend · **Phase 6 of 6** · **Backend:** SPEC-374
(`covered_days`/`covered_since`, `sectionApps`, `allTemplates`) · **Builds on:** SPEC-247 (Customers
→ Health), SPEC-285/286 (Report FTE desk and templates), SPEC-357 (the guided view), root Rules 12
and 13

## Why

The Phase 6 audit (2026-10-09) found three gaps the guided view left:

1. **Customers → Health speaks as if every store had a year of orders and every app connected.**
   - A 30-day store's tile reads "$X in 12 months" and "$Y a year at stake".
   - The basis line names Loop and Gorgias whether or not they are connected.
   - The Returns and Tickets columns show "—" for both "none" and "not connected".
2. **Report Builder offers every template**, so a company with nothing but Shopify is offered
   Support Week (Gorgias), Store League (V-Count), Warehouse Week (iPacky) and Website Behaviour
   (Clarity or Search Console).
3. **Two Returns sub-pages skip the connect screen** when opened by URL or from history:
   `/returns/style/[id]` and `/returns/backlog/send`. Without Loop they render empty or post to the
   Loop API.

## What changes

### 1. Customers → Health (`lib/customer-health.ts`, `features/customers/health-table.tsx`)

- **The adapter reads the covered window:** `coveredDays` and `coveredSince`. Without them, as from
  an older backend, it falls back to the full year.
- **The words around the figures follow the covered window:**

  | | A full year | A newer store |
  | --- | --- | --- |
  | Reviewed tile | "in 12 months" | "since 9 Sep" |
  | Going-quiet tile | "a year at stake" | "at stake since 9 Sep" |
  | Basis line | "Top spenders of the last 12 months" | "Top spenders since 9 Sep" |

  The figures do not change (Rule 8).
- **The basis line names only the sources a guided organization has connected.** "Refunds are
  Shopify's ledger" is always there, and Loop and Gorgias are named only when connected.
- **Returns and Tickets columns:** a guided organization sees each only when Loop or Gorgias is
  connected. When neither is, the line says the table adds them once they are.
- **A full organization (FOC)** keeps both columns and today's wording, word for word.

### 2. Report Builder offers what can run (`lib/report-fte.ts`)

- **`canRun(template, connected)`:** at least one data section reads Shopify alone (`[]`) or an app
  that is connected.
- **Custom templates** and templates from an older backend (no `sectionApps`) always can.
- **For a guided organization:**
  - **the Desk** shows the first six runnable templates from `allTemplates` (its "see all" count is
    the runnable count);
  - **Templates** lists only runnable ones.
- **A full organization** sees exactly today's lists.

### 3. Returns sub-pages go through the gate (`lib/guided-view.ts`)

- **`TAB_ROUTES.returns` gains `subRoutes`:** `style` maps to `by-style` and `backlog` to
  `overview`.
- **`tabInUrl`** treats `/returns/style/…` and `/returns/backlog/…` as those tabs, named
  explicitly.
- **Without Loop, the access gate answers them with Loop's connect screen.** With Loop, or for a
  full organization, they open as today.

### 4. Docs (Rule 11)

- **Customers → Health:** the window follows the store's own history, and the Returns and Tickets
  columns appear with their apps.
- **Report Builder → Templates:** a new workspace sees the templates its connected data can run.

## What FOC sees (Rule 12)

Unchanged:

- **Health:** FOC's history is longer than a year, so it keeps "12 months" and "a year", and as a
  full organization it keeps both columns and the full basis line.
- **Report Builder:** it lists every template, as today.
- **Returns:** the sub-page gate never applies to a full organization.

## Acceptance criteria

1. **Health covers the store's own history.**
   - A store with 30 days of orders reads "since <d Mon>" on both tiles and the basis line. A
     store with a year or more reads exactly as before.
   - A guided store without Loop or Gorgias has no Returns or Tickets column, and its basis line
     names neither.
2. **Report Builder offers only what can run.**
   - A guided store with only Shopify is not offered Support Week, Store League, Warehouse Week or
     Website Behaviour. Connecting V-Count brings Store League back.
   - A full store is offered everything.
3. **Returns sub-pages show Loop's connect screen** for a guided store without Loop:
   `/returns/style/123` and `/returns/backlog/send`.
4. **Checks:**
   - Vitest covers `lib/customer-health.ts`, `canRun` and offering, and `tabInUrl` sub-routes.
   - The role-gate coverage test passes.
   - `npm test`, `npx tsc --noEmit` and `npm run build` pass on a clean copy.

## Verification (2026-10-09)

On a clean copy of the working tree:

| Criterion | Result |
| --- | --- |
| 1 | done. `tests/customer-health.test.ts` ("short history and connected sources"): the span words, the full-year line kept word for word, only connected sources named, and the adapter's fallback. The columns follow `sources` in `health-table.tsx`. |
| 2 | done. `tests/report-fte.test.ts` ("templates a workspace can run"): `canRun`, offering, and the Desk's six. |
| 3 | done. `tests/guided-view.test.ts` ("Returns sub-pages") |
| 4 | done. `npx tsc --noEmit` clean · `npm test` 231 files, 2577 tests passed · `npm run build` compiled, 82/82 pages · the role-gate coverage test passed (no new write) |

**Performance.** No new request: Health reads one more field from its existing call, Report Builder
filters what it already loaded, and the gate is pure.

**Manual checklist.** On a guided store with Shopify only:

1. Customers → Health reads "since <d Mon>" with no Returns or Tickets column.
2. Report Builder's Desk and Templates don't offer Support Week, Store League, Warehouse Week or
   Website Behaviour.
3. `/returns/style/<id>` shows Loop's connect screen.
4. On FOC, all three look as before.
