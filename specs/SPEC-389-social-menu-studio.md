# SPEC-389 — Social Media for restaurants: the menu in Content Studio

**Status:** implemented 2026-10-16 · **Repo:** frontend · **Backend:** SPEC-406 · **Plan:** backend
SPEC-401 (W6)

## What

For a restaurant brand, Content Studio's browser is the **menu** (`features/social/menu-browser.tsx`):
the dishes backend SPEC-406 picks — Best seller, Worth pushing, New on the menu — with price, section
and the reason, filtered by reason; the first best seller is "Suggested next". The category rail
(Shopify signals) is hidden. Picking a dish opens the same workspace as a product
(`StudioWorkspace menu`), which reads and writes through `fetchMenuDrafts` / `generateMenuPost`
(`social.manage`, registered). The page header says "your menu"; the Social doc describes it.

Pure half: `lib/social-menu.ts` (`menuItemsToStudio`, `menuByReason`, `MENU_REASON_LABELS`); query
`socialQueries.menuItems()`.

## What FOC sees (Rule 12)

Unchanged — only with the `restaurant` feature.

## Acceptance criteria

1. A restaurant brand's Content Studio lists dishes with reasons; a shop's is unchanged.
2. Generating from a dish creates its drafts; returning to the dish reloads them.
3. Unit tests for `lib/social-menu.ts`.

## Verification (2026-10-16)

`tests/social-menu.test.ts` (1): AC 3 done. AC 1–2: `tsc`, the role-gate coverage test and the backend's
`tests/test_restaurant_social.py` (drafts keyed by the dish, regenerate in place).
