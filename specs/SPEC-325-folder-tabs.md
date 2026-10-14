# SPEC-325 — Folder tabs across the app

**Repo:** frontend · **Status:** implemented · **Date:** 2026-09-29
**Owner decision (2026-09-29):** from ten clickable tab-bar designs, the owner chose **#5 "Connected
folder"** and asked for it on every page that has a tab bar, working on phones as well.

## Why

Each of the 20 tab bars was written on its own: underlines in ink or in `--primary`, different padding,
some with focus rings and some without. After a mouse click, the keyboard focus outline also drew a
box around the tab. The owner wants one look everywhere: the active tab is the top of the content it
shows, so the tab and the page body read as one object.

## Behaviour

### The pattern (`components/shared/folder-tabs.tsx`, styles in `app/globals.css`)

- **`FolderTabBar`:**
  - A horizontal row of tabs sitting on the panel's top edge.
  - On a narrow screen it scrolls sideways, with no scrollbar and a fade on the side that has more
    tabs.
  - The open tab is scrolled into view when the page loads.
- **`folderTab(active)`:** the class set any tab link takes (`Link`, `ShallowLink`, a `button`).
  - An inactive tab is text on the page.
  - The active tab has a light panel fill, a hairline border on three sides and rounded top corners.
    It covers the panel's top border, so it opens into the panel.
  - Hover gives a faint fill.
  - Keyboard focus shows a ring; a mouse click shows none (`:focus-visible` only).
  - The active tab carries `data-active`.
- **`FolderPanel`:** the body the active tab joins.
  - The same light fill (`--tab-panel`, between the page and a card, so white cards inside still stand
    out) and a hairline border.
  - A 16 px radius, with a square top-left corner when the first tab is open.
  - Padding of 16 px on a phone and 24 px from `md` up.
  - Its children are spaced 24 px apart.
- **`--tab-panel`** is defined for both themes in `globals.css`: light `#f9fafb`, dark `#171815`.
- Badges, counts, "Soon" tabs and per-tab prefetching stay exactly as each bar had them.

### Where

Each tab bar keeps its links, its URL rules and its data behaviour. Only the styling changes, and the
shell wraps the tab's body (plus any filters row under the tabs) in a `FolderPanel` directly below it:

- Orders
- Products
- Customers
- Inventory
- Discounts
- Returns
- Foresight
- Store Traffic
- Team Performance
- System
- Performance Ads
- Social Growth
- Spotlight, and Brand Brain inside it as a nested bar and panel
- Finance
- Report FTE
- Results
- Continuous Innovation
- Docs
- Settings (the tab row; the Store · Organization · Account switch above it stays a segmented control)

Routes that pass through their shell bare (detail pages, review flows) are unchanged. In-page view
switches and filters (Facts, History, Daily Picks, Published, the style prompt) are not page tabs and
keep their own controls.

## Tests

- `tests/folder-tabs.test.ts`:
  - `folderTab` marks exactly the active tab;
  - the scroll-edge helper (at start, at end, both, neither).
- The existing tab tests keep passing: labels, hrefs and active-tab logic are untouched.
- Full `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`.

## Manual verification

- Open every page listed above:
  - the open tab joins the panel;
  - switching tabs keeps the bar in place;
  - no box appears after a click;
  - Tab and arrow keys show the ring.
- At 360 px: the bar scrolls sideways, the open tab is visible, the fade shows on the side with more
  tabs, and the panel stays joined.
- Both themes.

## Acceptance criteria

- [x] One tab style on every page tab bar in the app, from one component.
- [x] The active tab joins its content panel.
- [x] Phone: sideways scroll with edge fades; the open tab in view.
- [x] Focus ring for the keyboard only.
- [x] No change to any tab's links, URL or data behaviour.

## Patches

- **2026-09-29, owner picked "Binder stairs" (#5 of the ten folder redesigns).**
  - Every tab is a solid index tab (muted fill, hairline border) sunk 5 px into the binder. The row
    clips the bottom.
  - The open tab rises flush with its panel and carries a 3 px top edge in `--brand`, the same
    identity mark as the sidebar's active item, and it follows an organization's brand colour.
  - Hover lifts an idle tab 2 px. Reduced motion keeps colour changes only.
  - Tabs sit 4 px apart.
  - Styles only (`.folder-tab` in `globals.css`); no component or behaviour changed. The mockup's
    icons per tab are not yet added.
- **2026-09-30, the corner under the first tab is always square** (owner, from a screenshot of
  the Integrations app page with Settings open). The panel squared its top-left corner only when
  the *first* tab was open, so with any other tab open the idle first tab stood over the panel's
  16 px curve and looked misaligned. In Binder stairs every tab stands on the panel's top edge, so
  `.folder-tabbar + .folder-panel` now always has a square top-left corner. One CSS rule; every tab
  bar in the app gets it.
