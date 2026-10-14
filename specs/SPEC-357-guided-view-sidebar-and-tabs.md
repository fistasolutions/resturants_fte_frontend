# SPEC-357 — The guided view: the sidebar, the tabs and the locked screens follow the rulebook (Phase 2)

**Status:** implemented 2026-10-08 · **Repo:** frontend · **Phase 2 of 6** · **Backend:** SPEC-366
(`GET /workspace` → `visibility`) · **Builds on:** SPEC-315 (`lib/disclosure.ts`, `AccessGate`),
SPEC-317/318 (the workspace read), SPEC-338 (sidebar preferences, `useVisibleTabs`), root Rule 12

## Why

Owner (2026-10-08): a new organization should see only what its data can fill, the way
enterprise products onboard (progressive disclosure). Backend SPEC-366 now answers, for every
page and tab, whether a guided organization sees it and what would unlock it. Nothing on screen
reads that answer yet. This phase makes the app follow it.

## What changes

### 1. The workspace carries `visibility` (`lib/guided-view.ts`, pure)

`toVisibility(api.visibility)` adapts the block: `disclosure`, `pages`, `tabs`, `employees`,
`todos`, `integrationsShown`. An older backend (no block) or a malformed one gives `null`, and
`null` changes nothing.

`toWorkspace` overlays `visibility.pages` onto `navigation`. For each navigation item it takes
`visible`, `reason` and `needs` from the matching page, and keeps `ready`. So the sidebar,
Settings → Sidebar and the access gate keep reading **one** list and follow the guided rules
without separate wiring. A key that `visibility` does not name keeps its navigation values.

`HiddenReason` gains the guided reasons: `inactive_employee`, `no_data`, `guided_hidden`,
`needs_locations`, `needs_pos`, `needs_history`, `needs_action`.

### 2. Tab bars drop the tabs with no data

`useVisibleTabs` (the hook every page's tab bar already calls) also drops the page's locked tabs
(`visibility.tabs[pageKey]`) before the member's own preferences are applied. So the "first tab
is always shown" rule of SPEC-338 means the first tab **with data**. The open tab is still always
drawn. Settings → Sidebar does not list locked tabs.

Results picks its tab in component state, so its bar needs nothing more: it shows only the tabs
of actions taken.

### 3. A page opens on its first tab with data

Some pages open on a tab that a guided store may not have:

| Page | Opens on | Example |
| --- | --- | --- |
| Returns Analytics | Overview | Loop only |
| Store Traffic | Overview | V-Count only |
| Paid Ads Manager | Overview | Meta Ads only |
| Email Marketing Manager | Overview | Klaviyo only |
| Customer Support Agent | Overview | Gorgias only |

For those pages, `landingHref(href, visibility)` gives the first tab with data. It keeps
`?tab=` pages on `?tab=<key>` and path pages on `/<page>/<key>`, the form each page's own tab bar
uses (`TAB_ROUTES`). The sidebar links (rows and the employees under Digital Employees) point
there, and the active-row highlight is unchanged because it reads the pathname.

Opening the bare page from anywhere else (a bookmark, a link) replaces the URL with the same
landing, with the other query parameters (date range) kept. Nothing renders in between, so the
locked tab never fetches.

### 4. A locked page or tab opened by link says why, with one action (Stripe style)

`AccessGate` already answers a hidden page with its reason. It now also answers:

- **guided reasons on pages**;
- **a locked tab named in the URL** (`/products/fit`, `/returns?tab=sizing`,
  `/inventory/transfers/review/...`), found through `TAB_ROUTES`.

Each answer is one title, one sentence and at most one primary action, plus "Back to <page>" for a
tab or "Go to your home page" for a page.

| Reason | Title | Action |
| --- | --- | --- |
| connection (`not_connected`, or `no_data` that needs one) | "Fit opens once Loop Returns is connected" | **Connect Loop Returns** → `/integrations/<key>` (Search Console is `gsc`; Meta Ads connects on Paid Ads → Audit). Shown only if the member can open Integrations |
| `needs_locations` | "… appears once your store has a second location" | — |
| `needs_pos` | "… appears once you sell in store with Shopify POS" | — |
| `needs_history` | "… needs three years of sales history" | — |
| `calendar` (Season Radar) | "… reads the Hebrew calendar" (not switched on for the organization) | — |
| `needs_action` / Results `no_data` | "Results appears after your first action" | **Open the Morning Brief** |
| `inactive_employee` | "<employee> isn't active" | **Open Digital Employees** (Phase 3 puts the switch on its card) |
| `guided_hidden` | "<page> is tucked away for now" | — (Phase 4's "Explore more" brings it in) |

The copy, the routes and the labels are pure (`lib/disclosure.ts`, `lib/guided-view.ts`) and
covered by Vitest. Page titles come from `lib/navigation.ts`, tab labels from the pages' own tab
lists, integration names from `lib/integration-catalog.ts`.

### 5. Freshness

The workspace is read by the app layout. As today, a newly met condition (Loop connected, a
first action sent) shows after the next full load or `router.refresh()`, exactly like the page
gates of SPEC-315. Phase 5's setup checklist refreshes the layout when a step completes.

### 6. In-app docs (Rule 11)

The overview's conventions say how the guided workspace works: pages and tabs appear as their
data arrives, and a locked one says what unlocks it.

## What FOC sees (Rule 12)

Unchanged. FOC is `full`. Its `visibility.pages` mirror `navigation` exactly and its `tabs` are
empty, so the overlay changes nothing, no tab is dropped, every landing is the page itself and
the gate answers exactly as before.

## Acceptance criteria

1. `toVisibility` adapts the block and gives `null` for a missing or malformed one; `toWorkspace`
   overlays pages onto navigation and keeps `ready`; a full organization's navigation is
   identical before and after.
2. A tab bar drops locked tabs and keeps the open one; the member's own preferences still apply,
   with the first tab *with data* locked on; Settings → Sidebar omits locked tabs.
3. The sidebar and the hub's employees link to the first tab with data, and a bare page URL whose
   opening tab is locked replaces itself with that landing, keeping the date range.
4. A locked tab in the URL, and a page hidden for a guided reason, answer with the copy and
   single action above; "Connect X" goes to that integration's page, and only when the member
   can open Integrations.
5. Vitest covers every pure helper (`tests/guided-view.test.ts`, `tests/disclosure.test.ts`);
   `npm test`, `npx tsc --noEmit` and `npm run build` pass on a clean copy.

## Verification (2026-10-08)

On a clean copy of the working tree (the dev server's `.next` types mask tsc errors in the
checkout):

| Criterion | Result |
| --- | --- |
| 1. Adapter and overlay | done (`tests/guided-view.test.ts`, "the visibility block", including a full organization unchanged) |
| 2. Tab bars and Settings → Sidebar | done |
| 3. Landing and bare-page redirect | done |
| 4. Locked screens | done (`tests/guided-view.test.ts`, "what a locked screen says") |
| 5. Checks | done. `npx tsc --noEmit` clean · `npm test` 223 files, 2504 tests passed · `npm run build` compiled, 80/80 pages |

**Performance (Rule 5).** No new request: `visibility` rides the layout's existing `/workspace`
read. The chunk every page loads grew from 50.8 KB to 51.5 KB gzip (+0.7 KB).

The first build imported the pages' own tab modules and the integration catalogue into that
chunk, which cost +13 KB gzip. The tab lists and connection names are now copied into
`lib/guided-view.ts` and `lib/disclosure.ts`, with `tests/guided-view.test.ts` ("the copied
lists") pinning them equal to the originals.

**Manual checklist (no component runner).** On a guided organization with Shopify only:

1. The sidebar has no Results, Store Traffic, AI Performance or System.
2. Digital Employees lists Search Visibility and Report Builder only.
3. Returns Analytics opens on Bracketing.
4. Product Analyst has no Fit tab.
5. `/products/fit` shows "Fit opens once Loop Returns is connected" with **Connect Loop
   Returns**.
6. `/results` shows "Results appears after your first action" with **Open the Morning Brief**.

On FOC (full), every page and tab is as before.
