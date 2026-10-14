# SPEC-373 — Seats per plan: "X of N members · Y left", and invite gated when full

**Status:** implemented 2026-10-14 · **Repo:** frontend · **Backend:** SPEC-382
(`GET /organizations/current/seats`, `seats` on every plan) · **Builds on:** SPEC-316 (Team &
Roles), SPEC-320/324 (billing), root Rules 11, 12 and 13

## Why

A plan includes a set number of member seats (the $500 plan includes 10). The Team page must say
how many are used and how many are left, and the Invite action must be unavailable — shown with
the reason, not a dead end — once they are all in use. The enterprise way (Slack, Linear, Notion).

## What changes

### 1. The seat usage read (`lib/team.ts`, `lib/queries/team.ts`)

- **`ApiSeats` / `Seats`** mirror `{used, limit, remaining, unlimited}`; `toSeats` adapts them.
- **`teamQueries.seats()`** reads `GET /organizations/current/seats` (same `team.view` gate as the
  member list), registered in `tests/query-registries.test.ts`.
- **Pure helpers:**
  - **`seatLine(seats)`** — the header line:
    - unlimited: "7 members" (or "7 members · 2 invited" when some are pending);
    - limited: "**7 of 10 members · 3 seats left**", "0 seats left" when full.
  - **`seatsFull(seats)`** — true when the plan has a limit and nothing is left.

### 2. The Team page (`features/settings/team-view.tsx`, `app/(app)/settings/team/page.tsx`)

- **The header shows `seatLine`** in place of today's bare "{n} people".
- **The Invite button is gated by seats** on top of the existing role/grantable checks (Rule 13):
  - full → the button is **shown disabled** with the reason ("Your plan's 10 seats are all in use")
    and a link to **Billing** to upgrade; it never leads to an action that only fails.
  - the `seats` query joins the page's prefetch, so the header never flickers.
- A workspace whose seats are **unlimited** (FOC) shows the plain "N members" line and an invite
  button that is never seat-gated.

### 3. Plan cards show their seats (`lib/billing-settings.ts`, `features/settings/billing-view.tsx`)

- **Each plan option/card carries `seats`** ("10 seats", "Unlimited seats"), so the pricing and the
  billing page say what a plan includes. Additive; an older backend (no `seats`) shows nothing.

### 4. Docs (Rule 11)

- **Settings → Team** doc: the header shows seats used of the plan's total, and inviting is
  unavailable when the plan is full, with a link to upgrade.

## What FOC sees (Rule 12)

Unchanged. FOC is unlimited (its plan and its flag), so the Team page shows the plain member count
and the Invite button is never seat-gated — exactly today's behaviour.

## Acceptance criteria

1. `seatLine`: "7 of 10 members · 3 seats left" when limited; "7 members" (+ "· N invited") when
   unlimited; "0 seats left" at the limit. `seatsFull` true only when limited and remaining 0.
2. `toSeats` adapts the payload; an older backend (query 404/absent) leaves the page working with
   no seat line and no gating.
3. The Team header shows the line; the Invite button is disabled with a reason + Billing link when
   full, and normal otherwise; unlimited is never gated.
4. Plan cards show the seat count.
5. `npm test`, `npx tsc --noEmit` and `npm run build` pass on a clean copy; the query-registries
   and role-gate coverage tests pass.

## Verification (2026-10-14)

On a clean copy of the working tree:

| Criterion | Result |
| --- | --- |
| 1–2 | done. `tests/team.test.ts` ("seats per plan"): `seatLine` for limited/unlimited/absent, the "1 seat left" singular, `seatsFull`/`seatsFullReason`, and `toSeats`. |
| 3 | done. `team-view.tsx` shows `seatLine` and gates Invite (disabled + reason + Billing link when full); `app/(app)/settings/team/page.tsx` prefetches the seats query; `query-registries.test.ts` pins it. |
| 4 | done. `tests/billing-settings.test.ts` ("labels the seats a plan includes"): `seatsLabel` and `toPlanOptions`; the card renders it. |
| 5 | done. `npx tsc --noEmit` clean · `npm test` 235 files, 2676 tests passed (role-gate coverage and query-registries included) · `npm run build` compiled, 86/86 pages. |

**Performance.** No new waterfall: the seats read joins the Team page's existing prefetch and
streams into the client cache like the other four. The gating is pure.
