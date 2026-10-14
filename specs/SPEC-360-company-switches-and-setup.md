# SPEC-360 — The company turns pages on in Settings → Sidebar, and Setup follows (Phase 4, frontend)

**Status:** implemented 2026-10-08 · **Repo:** frontend · **Phase 4 of 6** · **Backend:**
SPEC-368 (`PUT /workspace/pages/{unit}`, `visibility.setup`) · **Builds on:** SPEC-338 (sidebar
preferences), SPEC-357 (the guided view), SPEC-359 (the employee switch), SPEC-358 (role gates),
root Rules 11, 12 and 13

## Why

Owner (2026-10-08):

> In Settings → Sidebar, the owner or an admin turns on any page. If it needs an integration, a
> to-do appears at the top right with a progress bar, and its card appears on Integrations. They
> connect it and it is done. Once a page is active they can also toggle it on and off, as today.
> Turning one off gives two choices: hide this page for now, or turn it off for everyone with the
> integration cancelled. Other members keep doing their own settings, as today.

The owner chose to warn about anything else that reads an integration before disconnecting it,
and to let them go ahead.

## What changes

### 1. Two layers in Settings → Sidebar (`features/settings/sidebar-prefs-view.tsx`)

- **Personal (unchanged, every member):** the per-browser cookie of SPEC-338.
- **Company (new, guided organizations, `settings.manage`):** whether a page, a tab or an
  employee exists for everyone.

**In a guided organization the list holds every row the role may open, on or off**
(`listedItems`). Rows the role cannot open are not listed. A tab whose missing condition no switch
can create, such as locations, POS sales or history, is not listed either.

**Each row reads its company state** (`lib/company-switches.ts`: `pageUnit`, `tabUnit`,
`employeeUnit`): on, waiting for its connection, or off. An off row has one note:

- "Turned off for everyone."
- "Needs V-Count or Microsoft Clarity."
- "Tucked away in a new workspace."
- "Appears after your first action from the Morning Brief."

**Owner or admin:**

- **Switching an off row on** turns it on for everyone. Pages and tabs use
  `setPageEnabled(unit, true)` (`services/workspace-actions.ts`), and employees use
  `setEmployeeActive`.
  - The row is also shown for that person.
  - A notice says what to connect, if anything.
  - The layout refreshes, so the sidebar, the tab bars and Setup follow at once.
- **Switching an on row off** opens the **Turn off** dialog (`features/settings/turn-off-dialog.tsx`):
  - **Hide it for me only:** the personal cookie, as today.
  - **Turn it off for everyone:** the company switch, off. When what the row reads is connected
    and the role may disconnect it, the dialog offers **Also disconnect <app>** for each such app.
    When ticked, it names everything else that reads the same app ("Loop Returns is also used by
    Product Analyst → Fit. Disconnecting stops those too; what they already synced stays.").
  - The disconnect calls are the existing ones:
    - `disconnectIntegration` for the key apps;
    - `disconnectGoogle`;
    - `disconnectMeta`;
    - `disconnectAllQuickBooks`;
    - `disconnectMetaAds`.

    Nothing is deleted.
- An off row with no switch available shows its note and no switch.

**Other members:**

- A company-off row reads "Off for the company. Ask an owner or admin." and has no switch.
- Rows that are on keep their personal switch.

**The tab the page opens on** is its first company-on tab, which cannot be hidden personally. An
owner may still turn it off for everyone.

**A full organization (FOC)** sees exactly today's page.

### 2. Setup, at the top right of every page (`features/workspace/setup-checklist.tsx`)

The layout draws **Setup · n of m** with a small progress bar, right-aligned above the page,
whenever a guided organization has an unfinished step (`visibility.setup`, backend SPEC-368). It
opens a list with a full progress bar:

- **Unfinished steps:** "Connect V-Count or Microsoft Clarity", with "For Store Traffic" under it,
  linking to that app's page.
- **Done steps:** struck through with a check. Shopify is always done.

Setup disappears once every step is done. The pure half is `lib/setup-checklist.ts`.

**It refreshes itself.** When the Integrations hub reads a connection that the checklist doesn't
know about (`checklistIsStale`), it refreshes the layout. A step ticks off as soon as the app is
connected anywhere, with no reload and no change to the hub's code.

**It replaces SPEC-359's To do button** on Digital Employees: employees' steps are in Setup.

### 3. Waiting for a connection

- **A page or tab turned on but not connected** (`awaiting_connection`) is in the sidebar or tab
  bar.
- **Opening it shows the connect screen:** "Store Traffic opens once V-Count or Microsoft Clarity
  is connected", with **Connect V-Count**.
- **A page turned off for the company**, opened from a link, says "Orders is turned off for your
  company" and offers **Open sidebar settings**.

### 4. Integrations → Browse apps

- **A guided organization sees only the apps its workspace uses** (`browseKeys`, over
  `integrations_shown`). A line above them says how to add another: turn on the page or employee
  that needs it in Settings → Sidebar.
- **A full organization** sees every app, as today.

### 5. Registry (Rule 13) and docs (Rule 11)

- `lib/action-permissions.ts` gains `"workspace-actions:setPageEnabled": ["settings.manage"]`.
- The dialog gates each disconnect with that disconnect's own permissions.
- Docs:
  - Settings → Sidebar, Integrations → Browse apps, Digital Employees and the overview's
    convention describe the two layers and Setup.

## What FOC sees (Rule 12)

Unchanged. FOC is `full`: Settings → Sidebar is today's personal page, Setup is never drawn,
Browse lists every app, and no page or tab is waiting or turned off.

## Acceptance criteria

1. An owner in a guided organization switches Store Traffic on.
   - **It appears at once:** in the sidebar, opening on the V-Count / Clarity connect screen.
   - **Setup · 1 of 2** appears at the top right, and V-Count and Clarity appear in Browse apps.
   - Connecting Clarity ticks the step off and Setup goes away.
2. **Switching Store Traffic off asks** "Hide it for me only" or "Turn it off for everyone".
   - The second option offers to disconnect a connected app, and names whatever else reads it.
3. **A manager** sees no company switch, and sees "Off for the company. Ask an owner or admin." on
   company-off rows.
4. **A full organization** sees today's page, no Setup, and every app.
5. **Checks:**
   - Vitest covers `lib/company-switches.ts`, `lib/setup-checklist.ts` and the new lock copy.
   - The role-gate coverage test passes.
   - `npm test`, `npx tsc --noEmit` and `npm run build` pass on a clean copy.

## Verification (2026-10-08)

On a clean copy of the working tree:

| Criterion | Result |
| --- | --- |
| 1–4 | done (pure halves covered by `tests/company-switches.test.ts`, `tests/setup-checklist.test.ts` and `tests/guided-view.test.ts`, "the company's switches") |
| 5 | done. `npx tsc --noEmit` clean · `npm test` 228 files, 2538 tests passed · `npm run build` compiled, 80/80 pages |

**Performance (Rule 5).**

- **No new read.** Setup comes from the layout's existing `/workspace`.
- **No polling.** Setup refreshes only when the hub's overview read lands with a connection it
  doesn't know about.
- **+1.8 KB gzip** of its own code on every page (esbuild, with the libraries every page already
  loads left out).
- **A first cut cost about +6 KB gzip.** It imported `lib/queries/integrations` just to read one
  cache key. The key is now named in `lib/setup-checklist.ts` and pinned to the real one by a
  test.
- **Settings → Sidebar and the dialog** load only on that page.

**Manual checklist (no component runner).** On a guided organization, as the owner:

1. Settings → Sidebar lists Store Traffic as off, "Needs V-Count or Microsoft Clarity."
2. Switch it on:
   - the notice says what to connect;
   - **Setup · 1 of 2** appears at the top right;
   - Store Traffic is in the sidebar and opens on the connect screen;
   - Browse apps lists V-Count and Clarity.
3. Switch it off:
   - the dialog offers "Hide it for me only" and "Turn it off for everyone";
   - "Also disconnect" appears only for a connected app, and warns about other users.
4. As a manager: no company switches, and company-off rows read "Off for the company. Ask an
   owner or admin."
5. On FOC (full): the page is as before, with no Setup.

## Patches

- **2026-10-14: the Setup panel's UI — a progress ring, a next step and dots.** The badge's flat
  mini-bar became a small green progress ring beside "Setup · X of Y"; the panel header, which was
  a title over a flat bar, became a 64px ring (percentage and "X of Y" inside) next to a "Next
  step" card for the first app still to connect (its monogram, name and what it unlocks, the same
  navigation as its row) and a dot per step (done green, next primary, rest faint). The three
  sections (store, brand, apps) and every line below are unchanged. `SetupRing` reuses the
  token-only stroke pattern from Brand Brain's coverage ring. Build and the setup tests green.
