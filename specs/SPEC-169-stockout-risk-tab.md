# SPEC-169 — Foresight → Stockout Risk tab

**Status:** implemented
**Repo:** `ecommerce-fte-frontend`. Consumes backend **SPEC-176**.
**Replaces:** SPEC-167 (Size Curve tab) — withdrawn, see that spec's header.

## 1. What this tab answers

> **Which products run out, where, when — and what is it worth?**

Not a report of what sold. A forward claim with a date attached, reviewed by an
adversarial critic before it is shown, and scored against reality afterwards.

## 2. Layout — decision first, evidence second

**Row 1 — the three things worth knowing at a glance:**

- **Risk donut** — critical / warning / healthy split of the catalogue. One shape
  answers "how bad is it right now".
- **Revenue at risk** — the money behind the critical + warning bands, so the tab
  leads with stakes rather than counts.
- **Prediction fulfilment** — a radial gauge of the hit rate, with `acted_upon`
  reported *beside* it, never inside it (backend §5.1).

**Row 2 — the at-risk table.** One row per (variant, location), ordered by days of
cover ascending. Each row carries a **cover bar** (days of cover against the reorder
lead time, so "will this survive a reorder?" is readable without arithmetic), the
predicted run-out date, revenue at risk, and — where the agents spoke — the driver and
the critic's objection.

**Row 3 — the ledger.** Past calls with predicted vs actual date, error in days, and
verdict.

## 3. The one number that must not be misread

`acted_upon` — the merchant reordered because of the warning, so the run-out never
happened — is **excluded from the hit rate** and shown as its own figure labelled
"warnings acted on". Folding it into the rate either way would be dishonest: counted as
a hit it inflates the score for an outcome that never occurred; counted as a miss it
punishes the system for working. The UI must state which it is.

## 4. Design compliance (root Rule 9)

Semantic tokens and `--chart-*` only; no hardcoded colours. **Brand red is not used for
risk** — `--destructive` carries critical, `--warning` carries warning, `--success`
carries healthy, and `--brand` stays identity-only. Charts use Recharts' built-in draw
only; **no Framer Motion, no entrance animation** — bars and gauges render at final value.
Bars are CSS width; the donut and gauge are Recharts.

## 5. Acceptance criteria

1. Tab registered as **"Stockout Risk"** at `/foresight/stockout`; the Size Curve tab and
   route are gone. ✅
2. Risk donut renders the three bands from backend counts. ✅
3. Revenue at risk shown for critical + warning only. ✅
4. Prediction-fulfilment gauge shows the hit rate, with `acted_upon` beside it and
   explicitly excluded from the rate. ✅
5. At-risk table ordered by days of cover, with a cover bar scaled against reorder lead
   time. ✅
6. Agent driver and critic objection surface where present, and their absence degrades
   silently (the arithmetic stands alone). ✅
7. Empty and pre-scored states say so plainly; no fabricated rate. ✅
8. `lib/stockout.ts` holds the formatting/banding logic and is unit-tested. ✅
9. `npm test`, `npx tsc --noEmit`, `npm run build` green. ✅
