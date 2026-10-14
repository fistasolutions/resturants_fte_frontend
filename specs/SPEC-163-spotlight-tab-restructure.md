# SPEC-163 — Spotlight tab restructure: drafts live in one place, dates scale

**Status:** complete (verified 2026-08-25)
**Repo:** `ecommerce-fte-frontend`
**Depends on:** SPEC-157 (Daily Picks tab), SPEC-161/162 (Inbound focus panel),
SPEC-109 (Spotlight tabs).

## Problem

Owner review of the live tabs. Three defects.

1. **The same draft list renders on two tabs.** Inbound Engine ships a `DraftsCard`
   beside the query bank, and the Approvals tab renders the same records. Inbound is
   meant to answer *"what should I write?"*; a list of what has already been written is
   a different question sharing the same screen, and it costs the tab a second API call
   on every load.
2. **The date history is a strip that grows forever.** `HistoryStrip` renders one pill
   per snapshot (`Today | Aug 24 | Aug 23 | Aug 22`). Snapshots accumulate daily and are
   never deleted, so within a month this is an unusable horizontal scroll.
3. **"Approvals" reads backwards.** The tab shows drafts with `status = in_review` —
   things *waiting for* a decision — but the label reads as *already approved*. The
   owner read it that way unprompted, which is very likely why the drafts list ended up
   duplicated onto Inbound in the first place: the tab that should have owned drafts did
   not look like it did.

## Design

### 1. Inbound Engine sheds drafts

`DraftsCard` is removed from the tab and the query bank goes full width. `InboundEngineData`
drops `drafts`, and `getInboundEngine` drops its `getDrafts()` call — one fewer request on
a tab that never needed it.

### 2. Daily Picks gains sub-views

Two client-side sub-views inside the tab: **Picks** and **Drafts**.

The distinction that decides the implementation: **a sub-view is a view change, a date is
a data change.** Switching Picks ↔ Drafts must be instant with no navigation, so it is
local `useState`. Choosing a different day genuinely needs a different snapshot from the
server, so it stays URL-driven (`?date=`) — the existing shareable/back-button behaviour
is preserved rather than traded away for a spinner.

The drafts list moves here whole (the component is lifted out of the inbound tab, not
duplicated), so drafts have exactly one browsing home.

### 3. Dates become a dropdown

`HistoryStrip` becomes a shadcn `Select`: "Today" plus every dated snapshot. Constant
height regardless of history length, keyboard-navigable, and it still navigates on
change so the data path is unchanged. Hidden when only one snapshot exists, as today.

### 4. "Approvals" → "Needs review"

Label only. `?tab=approvals` stays as-is — the URL is shareable and possibly bookmarked,
and renaming a route to fix a label would break links for a cosmetic gain. `SPOTLIGHT_TAB_IDS`
is unchanged; only the display string moves.

Result: drafts are **browsed** in Daily Picks and **acted on** in Needs review — one place
per job, no duplication.

## Tests

Vitest (`lib/` only — no component runner):
- `spotlightTabLabel("approvals")` → "Needs review"; every other tab keeps its label; the
  tab id set is unchanged (a rename must not silently break `?tab=` routing).
- `dailyPicksDateOptions(history, todayDate)` — pure: "Today" first, dated entries newest
  first, no duplicate when today already has a snapshot, and a stable value per option.

Manual checklist:
- [ ] Inbound Engine shows only the query bank, full width, no drafts.
- [ ] Daily Picks switches Picks ↔ Drafts with no page reload or flash.
- [ ] The date dropdown lists every day and loads that snapshot.
- [ ] Tab bar reads "Needs review"; `?tab=approvals` still resolves.
- [ ] Both themes; nothing animates in (root Rule 9).

## Acceptance criteria

- [ ] Drafts render on exactly one browsing surface.
- [ ] Inbound Engine makes one fewer API call.
- [ ] Sub-view switching is client-side; date switching still server-fetched and shareable.
- [ ] Date UI is constant-height for any history length.
- [ ] `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` green.

## Verification (2026-08-25)

| Acceptance criterion | Result |
| --- | --- |
| Drafts render on exactly one browsing surface | **done** — `DraftsCard` was **moved** out of `inbound-engine-tab.tsx` into `spotlight-drafts-card.tsx` (lifted, not copied), so there is no second copy to drift |
| Inbound makes one fewer API call | **done** — `getInboundEngine` dropped `getDrafts()`; `InboundEngineData` no longer carries `drafts` |
| Sub-view client-side; date still server-fetched | **done** — sub-views are `useState`; the date `Select` calls `router.push`, keeping `?date=` shareable |
| Date UI constant height for any history | **done** — `Select` replaces the per-day pill strip |
| test / tsc / lint / build green | **done** — 731 passed, tsc clean, 0 lint errors (2 pre-existing `<img>` warnings), build compiled |

**Tests:** `tests/spotlight-tab-restructure.test.ts` — 9 new tests, including an explicit
assertion that the **route id is unchanged** so shared `?tab=approvals` links keep working
after the rename.

### Found while testing

`dailyPicksDateOptions` did not dedupe. The DB guarantees one snapshot per store per day
so it cannot happen in practice, but a repeated value would mean duplicate React keys and
a `Select` unable to resolve its own selection. Deduped defensively rather than relying on
an invariant held in another layer.

### Cleanup

Removing the drafts card left nine now-unused imports and a dead `STATUS_CLASS` map in the
inbound tab; all removed, so lint is back to only the two pre-existing `<img>` warnings.

### Manual checklist — for a human

- [ ] Inbound Engine: query bank only, full width, no drafts
- [ ] Daily Picks: Picks ↔ Drafts switches with no reload or flash
- [ ] Date dropdown lists every day and loads that snapshot
- [ ] Tab bar reads "Needs review"; `?tab=approvals` still resolves
- [ ] Both themes

## Patches

### 2026-08-25 — the date dropdown rendered blank, and sat in the wrong place

Two defects in the shipped picker, both found by the owner on the running page.

**1. "Today" showed as an empty trigger.** `dailyPicksDateOptions` gave the Today option
`value: ""`. Radix `Select` treats an empty string as *"nothing is selected"*, so the
trigger rendered blank and the current day was invisible. Fixed with an explicit
`DAILY_PICKS_TODAY_VALUE = "today"` sentinel, mapped back to "no `?date=` param" when
navigating. A test now asserts the value is **not** `""`, so the same mistake cannot
return quietly.

This was my own convenience leaking into the data model: `""` was chosen because it
matched the absent URL param, which made the *caller* simpler at the cost of handing the
component a value its library reserves.

**2. The picker sat in the body.** Moved into the card header's right corner beside
"Refresh picks" — choosing a day is a control, not body content, and the two controls
belong together. `SelectContent` is `align="end"` so the menu opens flush with the corner
rather than overflowing the card.

Re-verified: 731 tests passing, tsc clean, 0 lint errors, build compiled.

### 2026-08-25 — a day change tore down the whole card

Changing the day replaced the entire Daily Picks card with a skeleton: the sub-tabs, the
day dropdown, and the refresh button all vanished and came back. The controls you were
using disappeared underneath you.

**Cause:** the page's Suspense boundary was keyed `${activeTab}:${pickDate}`. That was a
deliberate SPEC-157 choice — back when the card body *was* the whole tab, resetting the
boundary on a date change was the correct way to show a fresh load. Once the header
gained controls (sub-tabs, dropdown, refresh) the same key started throwing away UI the
user was interacting with. **The decision did not age with the component.**

**Fix, two parts:**
- The Suspense key drops the date and keys on the tab only, so a day change no longer
  resets the boundary.
- The day change runs inside `useTransition`. React keeps the current card mounted while
  the new snapshot streams, instead of falling back to the skeleton. The card body dims
  (`opacity-60`, `aria-busy`, pointer events off) so it is visibly working without
  anything moving or unmounting — no entrance animation, root Rule 9 intact.

The URL stays `?date=YYYY-MM-DD`, so the link is still shareable and the back button still
works — this changes only what is torn down while the fetch is in flight.

Re-verified: 731 tests passing, tsc clean, 0 lint errors, build compiled.
