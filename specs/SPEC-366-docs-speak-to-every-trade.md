# SPEC-366 — The in-app docs speak to every trade

**Status:** implemented 2026-10-09 · **Repo:** frontend · **Backend:** SPEC-375 (one prompt per
agent; the Brand Brain says what the store is) · **Builds on:** SPEC-229 (in-app docs), root Rules 11 and 12

## Why

Backend SPEC-375 made every agent read one prompt written for any store, with the store's own
Brand Brain saying what it sells and who buys from it. The in-app docs still describe it as
a fashion product:

- the overview names "the systems a fashion retailer actually runs on";
- Product Analyst → Fit asks "which dresses run small?";
- Costs speaks of "a garment".

A shoe shop or an electronics store reading the docs should recognise its own business.

## What changes

The three phrases become trade-neutral. Every other word stays.

**Patch (2026-10-09, backend SPEC-375 reworked):** the overview's "The AI interprets" principle
gains one sentence: every agent is written for any store, and what the store sells, who buys from
it, its voice and its picture rules come from its Brand Brain.

| Doc | Before | After |
| --- | --- | --- |
| Overview | "the systems a fashion retailer actually runs on" | "the systems a retailer actually runs on" |
| Product Analyst → Fit | "'which dresses run small?'" | "'which styles run small?'" |
| Product Analyst → Costs | "what a garment really cost" | "what a product really cost" |

The Fit tab itself is a clothing tab, so "styles" stays accurate there. `updated` is bumped on both
docs.

## What FOC sees (Rule 12)

The same product, described in neutral words. No behaviour changes, and FOC's screens are
untouched.

## Acceptance criteria

1. The three phrases are replaced, and `tests/docs.test.ts` passes.
2. `npm test`, `npx tsc --noEmit` and `npm run build` pass on a clean copy.
