# SPEC-338 — Choose what your sidebar shows

**Status:** implemented 2026-10-05 · **Repo:** frontend · **Backend:** none

## Why

The sidebar lists every destination the workspace allows, and each page carries up to eleven
tabs. Most people use a handful. The owner asked for a Settings tab where each sidebar page, and
each sub-screen inside it, can be switched off and on: off means it is not drawn until it is
switched back on. Everything starts on.

## Decisions

- **Name and place:** Settings → Account → **Sidebar** (`/settings/sidebar`). It is a personal
  choice, like Profile and Security, so it sits in Account and every member sees it.
- **What can be switched:**
  1. every sidebar row the member can see (`visibleItems(sidebarItems, workspace.navigation)`);
  2. a hub's sub-pages: the five employees under Digital Employees (`hubChildren`);
  3. the tabs inside each page: the page tab bars listed under *Tab registry*.
- **Always shown (locked on):** the Settings row, so the switch is never out of reach, and the
  first tab of every page, because the sidebar link opens on it.
- **Hidden is not blocked.** A hidden page or tab still opens from a link, a bookmark or a deep
  link elsewhere in the app. This is a display choice, not a permission (the backend's role and
  workspace rules are untouched, and still decide what can be seen at all).
- **The open tab is always drawn**, even when hidden, so a deep link never lands on a page whose
  highlighted tab is missing.
- **A hidden page's sub-pages and tabs keep their own switches**; they are greyed while the page
  is off and come back as they were.
- **Storage: a cookie, per account, per browser.** `nav_hidden_<hash of the email>`, a
  comma-separated list of hidden ids, one year, `SameSite=Lax`. The app layout reads it on the
  server and hands it to a client provider, so the first paint is already correct and a switch
  repaints the sidebar instantly without a request. Keying by account means two people sharing a
  browser keep separate sidebars. No backend change, no migration. Ids use only `[a-z0-9.:-]`, so
  the value needs no encoding and stays far below the 4 KB cookie limit with everything hidden.

## Ids

- Page: the route without its leading slash, `/` → `.`: `products`, `employees.finance`.
- Tab: `<page id>:<tab key>`: `products:catalog`, `spotlight:money-pages`.

## Tab registry

Products, Inventory, Orders, Customers, Returns Analytics, Results, Team Performance, Store
Traffic, Foresight, Discounts, System, Continuous Innovation, and the employees Spotlight, Social
Growth, Performance Ads, Report FTE and Finance Oversight. Out on purpose: Settings (role-gated
already), Integrations (its tabs filter one list), Docs (reference areas), and Brand Brain's
sub-tabs (a third level). Ads, Social and Returns labels move from their components into `lib/`,
and the Results tab list moves to `lib/results-tabs.ts`, so the registry and the bars read one
list.

## What changes

1. **`lib/nav-prefs.ts`** (pure): ids, `parseHidden` / `serializeHidden`, `navPrefsCookie(email)`,
   `PAGE_TABS`, `LOCKED_PAGES`, `isLockedTab`, `visibleTabs(page, tabs, keyOf, hidden, active)`,
   `visibleNavItems(items, hidden)`, `navPrefsTree(items, children)`.
2. **`features/navigation/nav-prefs-provider.tsx`**: context `{ hidden, isShown, setShown,
   showAll }`; writes the cookie; `useVisibleTabs(page, tabs, keyOf, active)`.
3. **`app/(app)/layout.tsx`** reads the cookie beside the sidebar cookie and mounts the provider.
4. **Sidebar** drops hidden rows and hidden sub-pages.
5. **Each tab bar** in the registry filters through `useVisibleTabs`. Server tab bars (Spotlight,
   Social, Ads, Returns, CI) become client components; their props are already serialisable.
6. **Settings → Account → Sidebar** (`features/settings/sidebar-prefs-view.tsx`): one panel, a
   row per page with its switch, sub-pages indented beneath, and each page's tabs behind an
   "N tabs" disclosure with a count of hidden ones; "Show everything" resets.
7. **In-app docs**: Settings doc gains the Account → Sidebar section; the group overview names it.
8. Rebrand follow-up (SPEC-337 Patches): the sidebar's "AI Business Analyst" line reads
   `PRODUCT.descriptor`.

## Acceptance criteria

1. With no cookie, the sidebar and every tab bar are exactly as before.
2. Switching a page off removes it from the sidebar at once and after a reload; on brings it back.
3. Switching an employee off removes it under Digital Employees; switching a tab off removes it
   from its page's bar.
4. Settings and every first tab cannot be switched off.
5. A hidden page or tab still opens by URL, and its tab is drawn while open.
6. Two accounts in one browser keep separate choices.
7. `tests/nav-prefs.test.ts` covers parsing, ids, locking, filtering and the registry matching
   the real tab lists; full Vitest, `tsc`, lint and build green.

## Manual verification checklist

- Settings → Account → Sidebar: switch off Orders → gone from the sidebar; reload → still gone.
- Switch off Inventory's Dead Stock tab → gone from `/inventory`; open `/inventory/dead-stock`
  by URL → the page opens with its tab drawn.
- Switch off Spotlight → gone under Digital Employees; Digital Employees stays.
- Show everything → all back.
- Light and dark themes; phone width (the panel stacks).

## Verification (2026-10-05)

| # | Criterion | Status | Evidence |
| --- | --- | --- | --- |
| 1 | No cookie → unchanged | done | `visibleTabs` / `visibleNavItems` return the input when nothing is hidden (`tests/nav-prefs.test.ts`) |
| 2 | Page off → gone now and after reload | done (code) / not seen | provider state repaints the sidebar; the layout reads the same cookie on the server; not clicked through, no session here |
| 3 | Employee / tab off → gone | done (code) / not seen | sidebar filters `hubChildren`; 17 tab bars filter through `useVisibleTabs` |
| 4 | Settings and first tabs locked | done | `LOCKED_PAGES`, `visibleTabs` keeps index 0; switches disabled in the view; tests |
| 5 | Hidden still opens; open tab drawn | done | nothing gates routes; `visibleTabs` keeps `activeKey`; test |
| 6 | Separate per account | done | `navPrefsCookie(email)` hashed per account; test |
| 7 | Tests, tsc, lint, build | done | 205 files, **2,300 passed**; `tsc` clean; ESLint 0 errors (3 earlier warnings); build 74 pages incl. `/settings/sidebar` |

Lint caught one real defect before it shipped: `CustomerTabs` returned early before the hook;
the hook now runs first.
