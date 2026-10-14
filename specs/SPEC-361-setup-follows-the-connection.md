# SPEC-361 — Setup opens itself, follows the first sync, and brings you back (Phase 4 follow-up)

**Status:** implemented 2026-10-09 · **Repo:** frontend · **Backend:** SPEC-369 (each tab asks
for its own app); the sync state is the existing `GET /integrations/overview` (backend SPEC-337) ·
**Builds on:** SPEC-360 (Setup, company switches), root Rules 5, 12 and 13

## Why

Owner (2026-10-08 → 10-09), after testing Phase 4:

1. **Setup should open by itself** when something is switched on, not sit closed in the corner.
2. **Connecting any integration runs its first sync on the spot.** Setup shows that sync's progress
   bar, and when the sync is done it takes you back to the page you switched on.
3. **Each tab asks for its own app.** No "V-Count or Clarity", and no tabs reading "off" under a
   page that is on.

Today a key app's connect already tests the login, saves it and starts the first sync. Search
Console starts its pull when a property is chosen, and QuickBooks starts its first sync in its
callback. Nothing follows that sync to the end, and nothing brings the person back.

## What changes

### 1. Setup knows each step's state (`lib/setup-checklist.ts`)

A step is in one of four states:

| State | When |
| --- | --- |
| **to do** | Not connected. |
| **syncing** | Connected, and the first good sync has not finished. |
| **done** | Connected and synced once. A step for an app with nothing to sync is done once connected: Shopify (always), Meta for posting, and Meta Ads, which the hub does not list. |
| **failed** | Connected, but its first sync failed. The line says so and links to the app's page to retry. |

The sync facts are the hub's own: `connected`, `status`, `last_success_at` and `can_sync` from
`GET /integrations/overview`. Setup reads them under its own small key (`["setup", "sync"]`, raw
fields only), so it never loads the hub's adapters on every page.

- **When it reads them:**
  - every 2.5 s while a step is syncing;
  - every 3 s while the person is away connecting an app from Setup (see 3);
  - otherwise never.
- **The count is of done steps.** Setup stays until every step is done, not merely connected.

### 2. Setup opens by itself, with the line that changed highlighted

The popover becomes controlled. It opens when:

- **a new step appears**, for example a page switched on in Settings → Sidebar. The new line is
  highlighted.
- **a step starts syncing.** Its line shows "Syncing <app>…" with a moving bar.
- **a step finishes syncing.** Its line shows "Synced" with a check.

Steps already seen are kept for the browser session (`sessionStorage`), so a reload or a page
change does not reopen it for old news. Closing it with a click outside, Escape or the button is
respected until the next change.

### 3. Connect from Setup, then come back

Clicking a line's **Connect <app>** remembers, for this browser tab
(`sessionStorage["fte.setup.return"]`), the app and the page the step is for:

- the first `for` item's own page: Store Traffic → `/traffic`;
- a tab → that tab's URL;
- an employee → the employee's page.

It then opens the app's page.

When that step becomes **done**, meaning connected *and* first-synced, Setup:

- takes the person back to that page (`router.push`);
- clears the memory;
- says "<App> is connected and synced. <Page> is ready." on the line.

If the first sync fails, nothing navigates. The line says what failed and links to the app.

This works for the dialog-based apps, which stay on the Integrations page, and for the sign-in apps
(Google, Intuit), which leave the tab and come back, because the memory lives in the tab's
`sessionStorage`.

Setup also refreshes the workspace when its own read sees a connection the workspace doesn't
know yet (SPEC-360's `checklistIsStale`, now fed by Setup's own read as well as the hub's cache).

### 4. Each tab asks for its own app (`lib/company-switches.ts`, `lib/disclosure.ts`)

- **Page notes name every app the page reads,** from backend `needs.apps`: "Needs V-Count and
  Microsoft Clarity." "Needs iPacky." "Needs an integration" is gone.
- **A waiting page names only what is still missing:** "Waiting for V-Count."
- **Tab rows under a turned-on page show their real state,** since SPEC-369 turns them on:
  "Waiting for V-Count" or "Waiting for Microsoft Clarity", never "off".
- **A page waiting for its data** says "Store Traffic is waiting for V-Count and Microsoft
  Clarity", explains which tabs read which, and offers **Connect V-Count**, plus **Connect
  Microsoft Clarity** as a second button.

### 5. Docs (Rule 11)

- **Settings → Sidebar and Integrations:** Setup follows the first sync and brings you back.
- **The overview's convention:** the same.

## What FOC sees (Rule 12)

Unchanged. FOC is `full`, so Setup is never drawn and never reads anything, nothing is
remembered, and nothing navigates.

## Acceptance criteria

1. Switching Store Traffic on opens Setup with two new highlighted lines:
   - "Connect V-Count", for Store Traffic → Overview, Store League, Lost-Sales, Peak Hours,
     Staffing;
   - "Connect Microsoft Clarity", for Store Traffic → Website.
2. **Connecting Clarity from Setup:**
   - while the dialog runs, the line turns to **Syncing** with a moving bar;
   - when the first sync finishes, it shows **Synced**, the person lands back on `/traffic`, and
     the Website tab has data.
3. **A failed first sync** shows on its line with a link to the app, and does not navigate.
4. **Setup doesn't reopen for steps already seen.** A page change or a reload leaves it closed.
5. **Notes name the exact app.** A turned-on page's tab rows read "Waiting for <app>".
6. **A full organization** gets no Setup and no reads.
7. **Checks:** Vitest covers the step states, the auto-open rule, the return memory and the notes.
   `npm test`, `npx tsc --noEmit` and `npm run build` pass on a clean copy, and the role-gate
   coverage test passes.

## Verification (2026-10-09)

On a clean copy of the working tree:

| Criterion | Result |
| --- | --- |
| 1–6 | done. Pure halves are in `tests/setup-checklist.test.ts`: step states, labels, auto-open, polling, the return memory and its decision. Copy is in `tests/company-switches.test.ts` and `tests/guided-view.test.ts`. |
| 7 | done. `npx tsc --noEmit` clean · `npm test` 228 files, 2546 tests passed · `npm run build` compiled, 80/80 pages · the role-gate coverage test passed (no new write) · `tests/query-registries.test.ts` pins the new `setup` registry |

**Performance (Rule 5).**

- **No read while nothing is happening.** Setup reads `GET /integrations/overview` only while a
  first sync runs (every 2.5 s) or while the person is away connecting an app from Setup (every
  3 s).
- **Setup's own code** is 3.9 KB gzip (esbuild, with the libraries every page already loads left
  out), +2.1 KB over SPEC-360 for the sync states and the return trip. It still does not load
  the hub's registry.

**Manual checklist.** On a guided organization, as the owner:

1. Switch Store Traffic on in Settings → Sidebar. Setup opens by itself with two highlighted
   lines, V-Count and Microsoft Clarity.
2. Click **Connect Microsoft Clarity** and connect it.
   - The line turns to **Syncing** with a moving bar.
   - When the sync finishes, the line shows **Synced** and you land back on Store Traffic →
     Website.
3. A reload with nothing changed leaves Setup closed.
4. On FOC: no Setup and no reads.
