# SPEC-343 — Employees named for what they do; the Digital Employees list starts open

**Status:** implemented 2026-10-06 · **Repo:** frontend (backend SPEC-351 is the roster half) ·
**Builds on:** SPEC-290 (Digital Employees hub), SPEC-329 (the hub row's chevron in the
sidebar), SPEC-229-in-app-docs.md (Rule 11)

## Why

Owner (2026-10-06):

1. "Rename all the FTEs to their generic name … a simple name that tells the exact purpose of
   the FTE." Brand-style names (Spotlight, Performance Ads, Report FTE) do not say what the
   employee does.
2. "The Digital Employees navigation accordion is by default open." Today the sidebar list of
   employees opens only while the owner is already inside one of them, so on every other page
   the employees are hidden behind the chevron.

## What changes

### 1. Names (display only)

| Route (unchanged) | Was | Now |
| --- | --- | --- |
| `/spotlight` | Spotlight | **Search Visibility** |
| `/social` | Social Growth | **Social Media Manager** |
| `/ads` | Performance Ads | **Paid Ads Manager** |
| `/employees/finance` | Finance Oversight | **Accounts Payable** |
| `/report-fte` | Report FTE | **Report Builder** |

Renamed in every user-visible string: the sidebar (`lib/navigation.ts`), the page headers
(the five shells), breadcrumbs, cards, chat drawer prompts, toasts, empty states, Settings →
sidebar preferences, and the in-app docs (`lib/docs/` — each doc's `title` stays equal to the
sidebar title; `updated` bumped on every doc touched). The hub characters
(`lib/employee-character.ts`) follow the backend's new monograms.

**Not changed:** URLs, query keys, file and component names, code comments, the generated
build reports in `lib/ci/content.ts` (they are a dated record of what was shipped under the old
names — `tools/build_ci_content.py` regenerates that file, it is never hand-edited), and
historical specs.

### 2. The hub row starts open

`components/layout/app-sidebar.tsx` `NavRow`: a hub's sub-list is open by default on every
page (`toggled ?? true`, was `toggled ?? active`). The chevron still closes it for the rest of
the visit; clicking the hub row still opens it.

## Acceptance criteria

1. The sidebar shows Digital Employees expanded on first load of any page, listing the five
   employees under their new names; the chevron collapses and re-expands it.
2. Each employee's page header, breadcrumb and hub card use the new name.
3. No user-visible frontend string (outside `lib/ci/content.ts`) still names an employee by
   its old name.
4. `npm test` (incl. `tests/docs.test.ts` title ⇔ sidebar check), `npx tsc --noEmit`, lint on
   touched files and `npm run build` green.

## Manual verification checklist

- Open `/dashboard`: Digital Employees is expanded, five new names listed.
- Collapse with the chevron, navigate to `/orders`: stays collapsed for that visit.
- Open each employee: header, breadcrumb "Digital Employees › <new name>", hub card name.
- Settings → Sidebar: the employees are listed under their new names.
