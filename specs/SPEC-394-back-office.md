# SPEC-394 — Back Office: time clock, schedule, inventory and food cost

**Status:** implemented 2026-10-16 · **Repo:** frontend · **Backend:** SPEC-414, SPEC-415 · **Plan:**
backend SPEC-391 (OS-6)

## What

A restaurant page **Back Office** (`/back-office`, nav item with Warehouse; `BACK_OFFICE_PAGE`; tabs by
`?tab=`), branch picker at the top:

- **Time clock** — Clock in or out with a PIN and the break (`clockPin`, `orders.take`); today's shifts
  with times, hours, cost, "Corrected", and a manager's break correction (`fixShift`, `network.manage`);
  the crew with role and rate, and Add (name, role, rate, PIN — `addCrewMember`, `network.manage`).
- **Schedule** — week of (any date → its Monday); seven day cards with planned shifts, hours, cost,
  expected sales, labor share and "Labor above 30%"; Plan a shift (who, day, start, end) and **Save the
  week** (`saveSchedule`).
- **Inventory & food cost** — actual vs theoretical vs variance (each also as a share of net sales)
  between the last two counts, count problems, and the ingredients driving it; Count the stock (every
  active ingredient, `recordCount`); A delivery came in (`recordDelivery`); head office's ingredient list
  and Add (`addIngredient`).

Pure half `lib/back-office.ts` (tabs, `mondayOf`, `addDays`, `pct`, `addPlanned`). Every write is in
`lib/action-permissions.ts`. Doc `back-office`. The page's tabs are not separately hideable in
Settings › Sidebar (`nav-tab-registry` lists none) so the preferences cookie stays under its limit.

## What FOC sees (Rule 12)

Nothing — restaurant brands only.

## Verification (2026-10-16)

`tests/back-office.test.ts` (2); registry, role-gate, navigation, docs and nav-prefs pins green. Full
suite 2779 passed, `tsc` clean, lint 0 errors, build lists `/back-office`. Backend behaviour:
`tests/test_restaurant_back_office.py`.
