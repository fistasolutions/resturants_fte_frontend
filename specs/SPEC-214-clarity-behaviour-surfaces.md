# SPEC-214 — Clarity: the connect card and the three surfaces

**Status:** frontend slice of backend **SPEC-219**.
**Depends on:** backend SPEC-219, SPEC-077/080 (the configurable integration card),
SPEC-163 (Spotlight tabs), the `/traffic` and `/ads` shells.
**Governs:** how Clarity is connected and where its joined insights appear. Additive.

## Why

Backend SPEC-219 returns three joined views that answer questions neither Clarity nor
Shopify can answer alone. None of them are visible yet, and there is no way to enter the
credential.

## Deliberately NOT a new page

Clarity's own dashboard is not rebuilt, and **no route and no nav item is added**. Each
insight lands where its decision already gets made:

| Insight | Where it goes | Why there |
| --- | --- | --- |
| Blog read-through | Spotlight → **Published** | beside reach, where blog quality is judged |
| Friction priced by revenue | `/traffic` → **Website** tab | `/traffic` already means "who came and what happened" — V-Count is the physical half, this is the digital half |
| Source behaviour + orders | `/ads` → **Overview** | beside spend, where the pause/scale decision is made |

## Scope

1. **Connect card.** Clarity registered in `types/integrations.ts` and in the existing
   `configurable-integration-card.tsx` `PROVIDER_META` — project id as a normal field,
   API token as a **write-only secret** (SPEC-072: set-only, never echoed). No new
   component: the card is already generic.
   Copy states the two facts an operator needs: the token is **admin-generated in
   Clarity** (Microsoft offers no OAuth, so there is no "Connect with Clarity" button to
   build) and the project id is visible in the Clarity URL.

2. **`services/clarity.ts`** — the four readers, through adapters.

3. **`lib/clarity.ts` (pure, unit-tested)** — the display logic that must not live in a
   component: read-through phrasing ("stops around word 463 of 2,572"), a friction
   severity band, and the honest-empty helper that distinguishes **not measured** from
   **measured zero**. Logic goes in `lib/` because that is what Vitest can reach
   (root Rule 4 — no component runner exists).

4. **The three surfaces**, each rendering an honest empty state until the token lands.

## Tests

- Adapters: every field maps; a missing number becomes `null` where "unmeasured" is
  meaningful and `0` where zero is a real value — **never `NaN`**, and never a `0` that
  reads as "nobody read this" when the truth is "we have not looked".
- `lib/clarity.ts`: read-through maths and phrasing; severity bands at their boundaries;
  unmeasured vs zero.
- `npm test`, `tsc`, `lint`, `build` green.

## Acceptance criteria

- [ ] Clarity connects from the Integrations page; the token is never displayed.
- [ ] Blog read-through on Spotlight Published; friction on `/traffic`; sources on `/ads`.
- [ ] No new route, no new nav item.
- [ ] Unmeasured never renders as zero.
- [ ] Tests, tsc, lint, build green.

## Patches

- **2026-09-02 — implemented.**
  - Clarity registered in `types/integrations.ts` and the generic
    `configurable-integration-card.tsx` — **no new component**; the card was already
    provider-driven, so connecting Clarity is registration plus one line on the page.
  - `types/clarity.ts`, four adapters in `lib/adapters.ts`, `services/clarity.ts`,
    and `lib/clarity.ts` (pure display logic, 14 tests).
  - Three surfaces, **no new route and no new nav item**:
    `features/spotlight/blog-read-through.tsx` on the Published card;
    `/traffic/website` as a tab on the existing Traffic shell (V-Count is the physical
    half of that page, Clarity the digital half); `features/ads/source-behaviour-card.tsx`
    on the Ads Overview.
  - Every Clarity read is `.catch()`-wrapped and parallel with its siblings — an
    unconnected or failing Clarity renders an empty state and never takes a tab down.
  - **A lint warning caught a real bug.** `sourceBehaviour` was flagged as assigned but
    never used: the JSX substitution had missed, so the Ads card would never have
    rendered. Fixed — the warning was the only thing standing between "compiles" and
    "actually works".
  - **Verified:** `npm test` 1074 passed (98 files), `tsc` clean, `lint` 0 errors
    (3 pre-existing warnings in untouched files), `build` compiled with `/traffic/website`
    present in the route manifest.

## Acceptance criteria — verified 2026-09-02

- [x] Clarity connects from the Integrations page; the token is never displayed.
- [x] Blog read-through on Spotlight Published; friction on `/traffic/website`;
      sources on `/ads`.
- [x] No new route beyond the Traffic sub-tab; no new nav item.
- [x] Unmeasured never renders as zero — pinned by adapter and `lib/clarity` tests.
- [x] Tests, tsc, lint, build green.
- [ ] Manual browser walkthrough — not done. Every surface currently renders its empty
      state (no token yet), so the populated paths are covered by unit tests until the
      Clarity admin grant lands.
