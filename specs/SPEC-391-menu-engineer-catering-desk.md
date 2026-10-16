# SPEC-391 — Menu Engineer and Catering Desk screens

**Status:** implemented 2026-10-16 · **Repo:** frontend · **Backend:** SPEC-409, SPEC-410 · **Plan:**
backend SPEC-401 (W9)

## Menu Engineer (`/menu-engineer`)

Period 7/30/90 days; tiles (changes to decide, re-prices worth as an estimate, to retire, to push); the
suggestions filtered by kind (Re-price, Retire, Push, Add its cost) — dish, section, units, price, food
cost %, the new price and its worth; head office applies (`Apply the new price`, `Take it off the menu`,
`Mark as done`) or `Not now` (`decideMenuSuggestion`, `network.manage`); a franchise member reads only.
The decisions already made, with who and when. Pure half `lib/menu-engineer.ts`.

## Catering Desk (`/catering`)

Inquiries by status (New default, Quoted, Won, Lost, All), each with the event line, email/phone links,
address, notes, a Branch select, Won / Lost, and the quote builder: dishes from the assigned branch's menu
(`restaurantQueries.branchMenu`), quantities, a delivery fee and a note; **Price the quote** (the backend
prices and totals) and **Send the quote** (disabled without an email, with the reason). All writes
`network.manage` (`updateCateringInquiry`, `quoteCateringInquiry`, `sendCateringQuote`). Pure half
`lib/catering.ts`.

## The site

The brand's locations page (`/r/<brand>`) ends with a **Catering** section and form
(`features/storefront/catering-form.tsx`, `sendCateringInquiry`, public): name, guests, email, phone,
date, time, delivery/pickup (+ address), notes; thanks with the reference.

## Employees

`EmployeeKey` `menu_engineer` and `catering`; characters (a chef's toque with a menu card; curls with a
serving cloche); nav items within `/employees` (Scale, ConciergeBell); docs `menu-engineer` and `catering`.

## What FOC sees (Rule 12)

Nothing — restaurant brands only.

## Verification (2026-10-16)

`tests/menu-engineer-catering.test.ts` (3); pins updated (`navigation`, `employee-character`,
`query-registries`, `docs`, `role-gate-coverage`). Full suite 2772 passed, `tsc` clean, lint 0 errors,
build lists `/menu-engineer` and `/catering`. Backend behaviour: `tests/test_restaurant_menu_engineer.py`
and `tests/test_restaurant_catering.py`.
