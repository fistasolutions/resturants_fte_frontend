# SPEC-135 — Content Studio: category-rail + product-browser layout restructure (frontend)

## Context / Why

SPEC-133/134 built the Content Studio as a two-column split where the **left card**
held the commerce-signal category chips **and** the product list, and the **right area
defaulted to the per-platform generate view** (`StudioWorkspace`) for an auto-selected
product. The owner confirmed this is the **wrong** information architecture.

The correct layout the owner wants:

```
LEFT (narrow nav rail)      RIGHT (main area)
─────────────────────      ──────────────────────────────────
CATEGORIES ONLY (vertical)  Default = the PRODUCTS of the selected category
  Recommended                 (a responsive product GRID, paginated when many)
  All                         Click a product → the GENERATE view opens for it
  Best-seller                 (the existing per-platform IG/FB generate/edit),
  New arrivals                with a "← Back to products" to return to the grid.
  Dead/slow stock
  Trending                  The generate/preview is NOT the default right content.
  High-margin
```

Rules from the owner:
- Left rail is **ONLY the category list** (vertical nav). Nothing else lives there.
- Clicking a category shows **that category's products in the right area**. Many
  products → **pagination**, and switching category / search / page must re-render
  **only the product-browser component via local React state + client fetch — never a
  full-page reload or navigation**.
- Clicking a product opens the **generate view** for it, with a clear
  **back-to-products** control.

This is a **restructure**, not a rebuild. The SPEC-133 per-platform generate/edit/preview
experience (`StudioWorkspace`, `PlatformPreviewCard`, native previews, inline caption
edit, angle switcher, per-card image regenerate, "Saved to Approvals" deep-link) and the
SPEC-134 draft hydration (`fetchProductDrafts` on open) are **kept intact** — only the
enclosing layout and the product-selection surface change.

Conforms to root Rule 8 (backend slices/paginates products, UI only displays), Rule 9
(semantic tokens only, no entrance animations, no framer-motion), Rule 6 (honest
loading/empty/error states, no fabricated data), and Rule 5 (client fetch per
category/page; SSR seed keeps first paint populated; no waterfall).

**In scope:** the enclosing `ContentStudioTab` layout, a new **category nav rail**, a new
**product browser** (responsive grid + full-catalog search + offset pagination), and the
offset-aware query/paging math.
**Out of scope (unchanged):** SPEC-133 generation/edit/preview internals, SPEC-134 draft
hydration/merge logic, the Overview / Calendar / Approvals / Performance tabs.

## Backend contract (authoritative, camelCase — updated for pagination)

- `GET /social/products?category=<cat>&search=<q>&limit=<n>&offset=<k>` →
  `{ products: [ { id, name, category, priceLabel, imageUrl, reason, reasonDetail,
  suggested } ], total: int, limit: int, offset: int }`.
  `category` enum: `recommended` (default) | `all` | `best_seller` | `new_arrival` |
  `dead_stock` | `trending` | `high_margin`. `search` applies to `all` **only**.
  `total` is the true full count (drives pagination).
- `GET /social/products/{productId}/drafts` → unchanged (SPEC-134).
- Unchanged: `POST /social/generate`, `PATCH /social/posts/{id}`, `generatePostImage`,
  `postImageUrl` (SPEC-133).

## Scope of changes

### `types/social.ts`
- Replace `StudioProductsResult` with `StudioProductsPage { products: StudioProduct[];
  total: number; limit: number; offset: number }` — the paginated `GET /social/products`
  response. (`StudioProduct`, `ProductDraft`, `ProductDraftsResult` unchanged.)

### `lib/social-catalog.ts` (pure, unit-tested)
- Extend `buildProductsQuery(category, search?, limit?, offset?)` to append `offset` only
  when a positive number; deterministic key order (category, search, limit, offset).
  Existing behavior (no offset arg) is byte-for-byte unchanged.
- `STUDIO_PAGE_SIZE = 12` — the client page window (matches the backend default limit).
- `pageInfo(total, limit, offset): PageInfo` — `{ page (1-based), pageCount (≥1),
  hasPrev, hasNext, from, to, total }`, tolerant of non-positive limit and out-of-range
  offset. `from`/`to` are the 1-based item bounds ("Showing from–to of total"), `from`=0
  when empty.
- `pageWindow(page, pageCount, max=5): number[]` — a windowed list of page numbers
  centered on `page`, clamped to `[1, pageCount]`, never longer than `min(max, pageCount)`.

### `services/social.ts`
- `getStudioProducts(category = "recommended"): Promise<StudioProductsPage>` (SSR seed —
  the default recommended first page).

### `services/social-actions.ts` (client, through `/api/proxy`)
- `fetchSocialProducts(category, search?, limit?, offset?): Promise<StudioProductsPage>` —
  passes `offset` through `buildProductsQuery`.
- `fetchProductDrafts` unchanged.

### `features/social/category-nav-rail.tsx` (new — left rail, categories only)
- `CategoryNavRail({ category, onSelect })` — a narrow vertical nav of the seven
  `SOCIAL_CATEGORIES` (labels via the catalog constants); the active one is highlighted
  and `aria-pressed`. Plain focusable `<button>`s (keyboard-navigable via Tab + Enter/
  Space). On `lg+` it is a fixed-width vertical column; below `lg` it collapses to a
  horizontally-scrolling segmented bar at the top. Nothing else in the rail.

### `features/social/studio-product-browser.tsx` (new — right default mode; replaces `studio-product-panel.tsx`)
- `StudioProductBrowser({ category, initial, onSelectProduct })` — a responsive product
  **grid** for the selected category. Card = thumb + name + `category · priceLabel` +
  `ReasonChip` (real `reasonDetail`, line-clamped) + a highlighted "Suggested" state.
- **All** category shows a **debounced (250 ms)** search input above the grid;
  hidden for every other category.
- **Offset pagination** driven by `total`/`STUDIO_PAGE_SIZE`/`offset` via `pageInfo` +
  `pageWindow`: Prev / numbered pages / Next, plus a "Showing from–to of total" line.
  Rendered only when `pageCount > 1`.
- Changing category, search, or page updates **local state + a client fetch only** — no
  navigation, no full-page reload. The component is keyed on `category` upstream so a
  category switch remounts just this subtree with fresh state; page/search changes are
  in-component.
- The default `recommended` first page is SSR-seeded (`initial`) and rendered with **no
  fetch on first mount**; any category/search/page change fetches fresh.
- Per-fetch **loading skeleton grid**, **empty state** ("No products in this signal right
  now" / search-specific), and a recoverable **error** line.

### `features/social/content-studio-tab.tsx` (rework the enclosing layout; SPEC-133/134 internals kept)
- `ContentStudioTab({ initial }: { initial: StudioProductsPage })` owns two pieces of
  state: the selected `category` (default `recommended`) and the selected
  `StudioProduct | null` (`null` = **browser mode**, the default; non-null = **generate
  mode**).
- Layout: `lg:grid-cols-[13rem_1fr]` — left `CategoryNavRail`, right area.
  - Right area default (`selected === null`) = `StudioProductBrowser`.
  - Clicking a product card sets `selected` → the right area shows a prominent
    **"← Back to products"** button followed by the existing `StudioWorkspace` (keyed on
    product id, so SPEC-134 draft hydration runs per product).
  - "Back to products" clears `selected`. The browser is kept mounted (hidden) behind the
    generate view so returning restores the **same category / page / scroll** with no
    refetch.
  - Clicking a category in the rail sets `category` **and** clears `selected` (returns to
    the browser for that category).
- Removed: the old default-generate-on-right, the `NoSelection` placeholder, and the
  in-card category chips (now the rail). `StudioProductPanel` is deleted.

### `app/(app)/social/page.tsx`
- `studio: StudioProductsPage | null`; still seeded via `getStudioProducts()` and passed
  as `initial` to `ContentStudioTab` (type update only).

## Tests (Vitest, node env) — `tests/social-catalog.test.ts` (extend)
- `buildProductsQuery` with `offset`: appended only when positive; dropped for 0/negative;
  deterministic order category→search→limit→offset; existing no-offset cases unchanged.
- `pageInfo`: page/pageCount/hasPrev/hasNext/from/to across empty, single-page, multi-page,
  first/middle/last page, exact-multiple totals, and a non-positive limit fallback.
- `pageWindow`: centers on the current page, clamps to `[1, pageCount]`, never exceeds
  `min(max, pageCount)`, handles `pageCount ≤ 1`.

## Manual verification checklist (no component runner)
1. Content Studio loads in **browser mode**: the recommended product **grid** is populated
   on first paint (SSR seed, no empty flash); the left rail lists the seven categories with
   Recommended active.
2. Click each category in the rail → the **right grid** swaps to that signal's products
   (skeleton → grid, or the empty state); the URL does **not** change and the page does not
   reload.
3. On **All**, a search input appears above the grid; typing debounces then filters the full
   catalog and resets to page 1; clearing restores the full list; the input is absent on
   every other category.
4. When a category has many products, pagination appears (Prev / page numbers / Next +
   "Showing x–y of N"); changing page re-renders **only the grid** (client fetch, no
   navigation); Prev disabled on page 1, Next disabled on the last page.
5. Each card shows thumb + name + `category · price` + reason chip + reasonDetail; the
   suggested product is visibly highlighted.
6. Click a product card → the right area switches to the **generate view** for it with a
   "← Back to products" control; the left rail stays put.
7. Generate view = SPEC-133/134 intact: draft hydration on open, channel select, generate,
   inline caption edit, angle switch, per-card image regenerate, "Saved to Approvals".
8. "← Back to products" returns to the grid at the **same category and page** with no
   refetch flash.
9. Clicking a different category while in the generate view returns to the browser for that
   category.
10. Both light and dark themes: tokens only, no hardcoded colors, brand red identity-only.
11. Keyboard: rail categories, search input, product cards, pagination controls, and all
    workspace controls reachable and operable.
12. No element animates into view on load, category switch, page change, or product switch.

## Acceptance Criteria — verification (done / partial / not done)
- [x] Left rail is categories-only (vertical on lg+, horizontal segmented on mobile). —
  **done** (`features/social/category-nav-rail.tsx`)
- [x] Right default = product grid for the selected category (SSR-seeded recommended). —
  **done** (`StudioProductBrowser`, `selected === null` is the default browser mode)
- [x] All-category debounced search + offset pagination re-render only the browser
  (no navigation / full reload). — **done** (client `fetchSocialProducts` + local state;
  browser keyed on category, page/search in-component; no router navigation)
- [x] Clicking a product opens the generate view with a back-to-products control; SPEC-133/
  134 behavior unchanged. — **done** (`StudioWorkspace` kept intact, keyed on product id;
  "← Back to products" clears `selected`; browser kept mounted-hidden to restore state)
- [x] `StudioProductsPage` type + offset-aware `buildProductsQuery` + `pageInfo`/`pageWindow`
  added and unit-tested. — **done** (`tests/social-catalog.test.ts`, 26 cases)
- [x] `npm run lint` (0 errors), `npx tsc --noEmit` (0 errors), `npm test` (542 passing),
  `npm run build` (compiled successfully in 4.0s) all green. — **done**
