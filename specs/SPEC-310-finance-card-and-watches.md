# SPEC-310 — Settings › Monday payable card

**Repo:** frontend · **Status:** implemented · **Date:** 2026-09-25
**Backend:** SPEC-307 (`PUT /settings/finance-card`, four finance watch metrics)

## Why

Finance Oversight answers everything about the payable, but only when someone opens it.
Backend SPEC-307 adds the two things a page cannot do — a weekly email, and watches on the
money. The watches need no frontend at all: Settings → Watching already lists whatever the
backend's catalogue offers, so the four new metrics appear there the moment the backend
ships them. This is the one switch the card needs.

## What it is

**Settings → Automatic sending → Monday Payable Card.** One switch, beneath the Monday
Report Card, in the same shape: the time is fixed (Monday 07:30 store-local, half an hour
after the manager card so two weekly emails never land together), so there is no time
field.

The description says what arrives, and the one thing an owner will wonder: **nothing is
sent when nothing is owed.** It links to Finance rather than explaining the figures twice.

## Files

| File | What |
| --- | --- |
| `types/store.ts` | `FinanceCardSchedule` |
| `lib/queries/store.ts` | `finance_card` on `ApiStatus`, `financeCard` on the overview |
| `services/finance-card.ts` | `updateFinanceCard` |
| `features/settings/finance-card-card.tsx` | the switch |
| `features/settings/settings-tab-views.tsx` | places it under the manager card |

## Acceptance Criteria

1. A switch in Settings → Automatic sending, off by default, that saves and reports its
   next run.
2. Absent `finance_card` on the status payload degrades to "off" rather than breaking the
   tab — the backend may predate it.
3. The four new watch metrics need no change here: Settings → Watching renders the
   backend's catalogue.
4. Tokens only; matches the manager card exactly; suite, build, lint and `tsc` green.

## Patches

- **2026-09-25 — renumbered `SPEC-309` → `SPEC-310`.** Another session took `SPEC-309`
  for the Bracketing tab the same day. No content changed.

## Verification

**Tests, 2026-09-25.** Full suite **2021 passed / 178 files**; `npm run build` green;
`npx tsc --noEmit` clean; lint clean (3 pre-existing `<img>` warnings elsewhere). The
optional-field degradation is the same device the manager card uses and is typed as
optional on `ApiStatus`, so `tsc` enforces the fallback.

**Settings → Watching, checked against the backend.** The four new keys —
`ap_past_due`, `ap_due_7`, `ap_outstanding`, `cash_short_companies` — are catalogue
entries, so the existing dialog offers them with their units, hints and `/employees/finance`
link with no frontend change. That is the design working, not an omission.

### Acceptance Criteria

1. **done** — `FinanceCardCard`, off by default, status line with the next run.
2. **done** — `finance_card?` optional on `ApiStatus`, defaults to off / "07:30".
3. **done** — no watch changes were needed.
4. **done**.
