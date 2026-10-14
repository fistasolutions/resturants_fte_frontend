# SPEC-376 — Add AI credit: buy extra AI for the month from the Billing tab

**Status:** implemented 2026-10-14 · **Repo:** frontend · **Backend:** SPEC-384
(`GET /billing/ai-topup/packs`, `POST /billing/ai-topup`, `topup_cents` on the allowance) ·
**Builds on:** SPEC-374 (the AI allowance as a percentage), SPEC-324 (billing), root Rules 12 and 13

## Why

When a customer uses up this month's AI before the month ends, they should be able to **buy extra
AI** right from the Billing tab, for this month only, without changing their plan. The price is 3×
what the AI costs us (the backend sets the multiple); the UI shows the price, never our cost.

## What changes

### 1. The reads (`lib/billing-settings.ts`, `lib/queries/billing.ts`)

- **`ApiAllowance` gains `topup_cents`;** `AllowanceView` gains `topupCents` and `topup` (the
  formatted amount). The percentage already accounts for it (the backend adds the credit to
  `allowance_cents`), so buying credit lowers the bar.
- **`billingQueries.topupPacks()`** reads `GET /billing/ai-topup/packs` → `{packs, markup}`; each
  pack is `{creditCents, price}` (the 3× price, formatted). Registered in the query-registries test.

### 2. The action (`services/settings-actions.ts`)

- **`buyAiCredit(creditCents)`** posts `POST /billing/ai-topup` and returns the response:
  `{provider: "stripe", checkout_url}` or `{provider: "dummy", granted: true}`.

### 3. The AI panel (`features/settings/billing-view.tsx`)

- **An "Add AI credit" button** sits on the AI allowance panel (not shown for an unmetered
  organization, and gated by `billing.manage` via the existing access query — Rule 13).
- **A dialog** lists the packs: "$25 of AI — $75" etc., one click each.
  - **Stripe:** the browser is sent to `checkout_url`.
  - **Dummy/preview:** the credit is granted at once; the dialog closes, the allowance refetches,
    and a short note confirms it.
- **When credit has been added this month,** the panel shows a small line: "Includes {topup} of
  extra AI added this month."
- `?topup=ok` on return from Stripe refetches the allowance and shows a confirmation; `?topup=cancelled`
  is ignored.

### 4. Docs (Rule 11)

- **Settings → Billing & plan:** you can add AI credit for the current month; the price is shown,
  it is added to this month's allowance, and it resets next month.

## What FOC sees (Rule 12)

FOC is unmetered, so the AI panel shows "included" and **no "Add AI credit" button** — unchanged.

## Acceptance criteria

1. `toAllowance` carries `topupCents`/`topup`; `toTopupPacks` formats each pack's 3× price.
2. The AI panel shows "Add AI credit" (hidden when unmetered); the dialog lists the packs with
   their price; a dummy grant closes the dialog and refetches; a Stripe response redirects.
3. The "includes … extra this month" line shows only when `topupCents > 0`.
4. `npm test`, `npx tsc --noEmit` and `npm run build` pass on a clean copy; query-registries and
   role-gate coverage pass.

## Verification (2026-10-14)

On a clean copy of the working tree:

| Criterion | Result |
| --- | --- |
| 1 | done. `tests/billing-settings.test.ts`: `toTopupPacks` formats each pack at its 3x price; `toAllowance` carries `topupCents`/`topup`, and an older backend (no field) reads 0. |
| 2–3 | done. `features/settings/billing-view.tsx`: "Add AI credit" on the AI panel (hidden when unmetered, gated by `billing.manage`); `AddCreditDialog` lists the packs; a dummy grant closes + refetches, a Stripe response redirects; the "includes … extra this month" line shows when `topupCents > 0`. `buyAiCredit` registered in `lib/action-permissions.ts`. |
| 4 | done. `npx tsc --noEmit` clean, `npm test` 235 files 2681 passed (query-registries, role-gate coverage, docs included), `npm run build` 86/86 pages. |
