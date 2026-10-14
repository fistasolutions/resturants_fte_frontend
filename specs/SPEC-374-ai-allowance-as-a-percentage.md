# SPEC-374 — AI allowance shown as a percentage, not a dollar amount

**Status:** implemented 2026-10-14 · **Repo:** frontend · **Builds on:** SPEC-320/324 (billing),
SPEC-331 (`GET /billing/ai-allowance`), root Rules 11 and 12

## Why

Owner (2026-10-14): the AI allowance panel shows "$0.09 of **$200** used · $199.91 left". The
dollar figure should not be shown. Like Claude Code, the owner sees **how much of this month's AI
they have used, as a percentage** (0 → 100%), and a gentle "running low" state as it fills — never
the underlying dollar budget.

## What changes (`lib/billing-settings.ts`, `features/settings/billing-view.tsx`)

1. **The panel reads as a percentage.** In place of "$0.09 of $200 used · $199.91 left", the AI
   allowance panel shows **"N% used"** of this month's AI, with the same bar beneath it. No dollar
   amount appears.
2. **"Running low" starts at 60%.** `toAllowance`'s tone becomes `warning` at **60%** (was 80%) and
   `destructive` at 100%. On a plan whose AI is \$200 that is the \$120 point — but the number is
   never shown, only the state.
3. **A short status line** appears with the bar:
   - 60–99%: "You're running low on this month's AI."
   - 100%: "You've used this month's AI — it resets on <date>."
   - under 60%: none.
4. **Unchanged:** the "AI is included in your agreement" line for an unmetered organization (FOC);
   the reset-date description; the "add your own AI key" footer; and the videos/images meters
   (those are counts, not dollars, and stay as they are).
5. **No backend change.** `GET /billing/ai-allowance` still returns the figures; the panel simply
   stops rendering the dollar ones and shows the percentage it already computes.

## Docs (Rule 11)

- **Settings → Billing & plan**: the AI allowance is shown as a percentage of this month's AI used,
  with a "running low" note as it fills — not a dollar figure.

## What FOC sees (Rule 12)

FOC is unmetered, so its panel keeps reading "AI is included in your agreement — nothing is counted
against an allowance." No dollar or percentage is shown for it either way. Unchanged.

## Acceptance criteria

1. The AI allowance panel shows "N% used" and the bar, and **no dollar amount** anywhere in it.
2. `toAllowance` tones `warning` at ≥ 60% and `destructive` at ≥ 100%; `success` below 60%.
3. The status line reads as in §3; an unmetered org shows the "included" line and no meter.
4. `npm test`, `npx tsc --noEmit` and `npm run build` pass on a clean copy.

## Verification (2026-10-14)

On a clean copy of the working tree:

| Criterion | Result |
| --- | --- |
| 1, 3 | done. `features/settings/billing-view.tsx` renders `{percent}% used` and the bar with no dollar amount; the status line follows the tone; unmetered keeps the "included" line. |
| 2 | done. `tests/billing-settings.test.ts` ("tones the allowance as it fills"): success at 20% and 59%, warning at 60% and 84%, destructive at 100%. |
| 4 | done. `npx tsc --noEmit` clean, `npm test` 235 files 2676 passed, `npm run build` 86/86 pages. |

**No backend change.** The panel uses the percentage it already computed from the existing
`GET /billing/ai-allowance`; the dollar figures are simply no longer rendered.
