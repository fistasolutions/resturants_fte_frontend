# SPEC-315 — Progressive disclosure: only what is permitted, connected and enabled

**Repo:** frontend · **Status:** implemented · **Date:** 2026-09-28
**Programme:** `SPEC-311-saas-platform-master.md`, slice **F5**
**Backend contract:** backend SPEC-319 — `GET /workspace` → `navigation[]`: every sidebar
destination with `{key, visible, ready, reason}` (`reason`: `permission` · `feature` ·
`calendar` · `not_connected`)

## Why

The owner (D12): "a user sees only what their organization has connected and what their role
allows — not the whole product." The backend already refuses every call a role may not make
(SPEC-317); the app still shows every page in the sidebar.

## Behaviour

- **The sidebar** shows a destination only when the workspace says it is `visible`. A
  destination the workspace does not name stays as it is (the backend's list is the 28 known
  routes; an unknown key is never hidden on a guess).
- **A typed URL for a hidden page** is answered, in place of the page, by what the workspace
  says:
  - `permission` — "Your role doesn't include {page}. An owner or admin can give you access."
  - `not_connected` — "{page} opens once its data source is connected" with **Open Integrations**
    when the member can see Integrations.
  - `feature` / `calendar` — "This page isn't part of your workspace."
- **One read, in parallel:** the app layout reads `/workspace` alongside the user it already
  reads — no added wait. If the workspace cannot be read (an older backend, a blip), nothing is
  hidden: the backend still enforces every permission.
- The Employees hub, the Ask Glisp prompts and the docs are reached through the sidebar; a page
  the member cannot open answers as above.

## How

- `lib/disclosure.ts` (pure): a destination's key from its href (`lib/first-sync` `pageKey`);
  the visible sidebar items; the answer for a path (allowed, or the reason and the message).
- `services/workspace.ts`: `getWorkspaceNavigation()` (server, tolerant).
- `features/workspace/access-gate.tsx`: wraps the page content in the app layout, outside the
  first-sync gate.
- `components/layout/app-sidebar.tsx` takes the navigation and filters `sidebarItems`.

## Tests

Vitest: keys from hrefs; visible items (hidden, unknown kept, null workspace keeps all); the
answer for a path — allowed, each reason and its message, Integrations offered only when visible,
a nested path. `npm test`, `npx tsc --noEmit`, `npm run build` green. Manual: a Viewer sees five
destinations and gets the permission answer on `/orders`; an owner without Gorgias gets the
connect answer on `/team-performance`; `/ci` answers "not part of your workspace" without the
feature.

## Acceptance criteria

- [x] The sidebar shows only what the member may open, what is connected and what is enabled.
- [x] A hidden page's URL answers with the reason, never an error or an empty page.
- [x] No added round trip; nothing is hidden when the workspace cannot be read.
- [x] Tests, type-check and build green.

## Verification (2026-09-28)

`npm test` 2,064 passed (183 files); `npx tsc --noEmit` clean; `npm run build` green. All four
criteria done (the Viewer / missing-integration manual pass runs against the new deployment).
