# SPEC-134 — Content Studio: commerce-signal categories, full-catalog search + draft persistence (frontend)

## Context / Why

Content Studio (SPEC-110 → SPEC-123 → SPEC-130 → SPEC-133) lists a small, fixed set of
"products worth posting" in a single **Product Picker** and generates per-platform drafts in
the right-hand **StudioWorkspace** (SPEC-133). Two problems:

1. **The left panel is one flat, recommendation-only list.** The backend now exposes the
   whole catalog sliced by **commerce signal** (`recommended` / `all` / `best_seller` /
   `new_arrival` / `dead_stock` / `trending` / `high_margin`) plus free-text search over the
   full catalog. The UI should let the user navigate those signals and search, not just see
   one pre-picked list.
2. **Generated drafts disappear when you switch products.** In SPEC-133 the generated
   Instagram/Facebook drafts live only in the workspace's local React state, so selecting
   another product and coming back loses them. The backend now persists the latest draft per
   channel and serves it at `GET /social/products/{id}/drafts` — the workspace must **hydrate
   from the server** on selection so drafts reappear.

This spec restructures the **product-selection surface** (left panel) and adds **draft
hydration/persistence** to the workspace. The per-platform generate/edit/preview workspace
from SPEC-133 (native preview cards, inline caption editing, angle switcher, per-card image
regenerate, grounded chips, "Saved to Approvals" link) is **kept intact** — only its data
seeding changes (hydrate existing drafts; merge newly generated ones by channel).

**In scope:** the left panel (category navigation + product list + full-catalog search) and
draft hydration in `StudioWorkspace`.
**Out of scope (unchanged):** SPEC-133's generation/edit/preview UI internals; the Overview /
Calendar / Approvals / Performance tabs.

Conforms to root Rule 8 (backend picks/slices products and generates creative; the UI only
displays), Rule 9 (semantic tokens only, no entrance animations, no framer-motion), Rule 6
(honest loading/empty/error states; no fabricated data), and Rule 5 (client fetch per
category; the SSR seed keeps first paint populated; no waterfall).

## Backend contract (authoritative, camelCase)

- `GET /social/products?category=<cat>&search=<q>&limit=<n>` →
  `{ products: [ { id: string, name: string, category: string, priceLabel: string,
  imageUrl: string|null, reason: string, reasonDetail: string|null, suggested: boolean } ] }`.
  `category` enum: `recommended` (default) | `all` | `best_seller` | `new_arrival` |
  `dead_stock` | `trending` | `high_margin`. `search` applies to `all` **only**. `limit`
  default 12.
- `GET /social/products/{productId}/drafts` →
  `{ posts: [ { postId: string, channel: "instagram"|"facebook", creative: {…ProductCreative…},
  hasImage: boolean, imageConcept: string|null } ] }` — the latest generated draft per channel
  (empty when none generated yet).
- Unchanged: `POST /social/generate`, `PATCH /social/posts/{id}`, `generatePostImage`,
  `postImageUrl` (SPEC-133).

## Scope of changes

### `types/social.ts` (additive — existing `SocialProduct`/`ContentStudioData` kept for mock/tests)
- `SocialCategory` union of the seven enum values.
- `StudioProduct { id; name; category; priceLabel; imageUrl: string|null; reason: string;
  reasonDetail: string|null; suggested: boolean }` — the lightweight `GET /social/products`
  row (no embedded `creative`; that arrives per-draft).
- `StudioProductsResult { products: StudioProduct[] }`.
- `ProductDraft extends GeneratedPost { hasImage: boolean; imageConcept: string|null }` — a
  hydrated draft (adds the persisted image state to SPEC-133's `GeneratedPost`).
- `ProductDraftsResult { posts: ProductDraft[] }`.

### `lib/social-catalog.ts` (new — pure, unit-tested)
- `SOCIAL_CATEGORIES: { id: SocialCategory; label: string }[]` — the tab order + labels
  (Recommended · All · Best-seller · New arrivals · Dead/slow stock · Trending · High-margin).
- `DEFAULT_CATEGORY = "recommended"`.
- `categoryLabel(category)` — label lookup with graceful title-cased fallback.
- `searchApplies(category)` — `true` only for `"all"` (the backend rule).
- `buildProductsQuery(category, search?, limit?)` — builds the `GET /social/products` query
  string: `category` always; `search` only when `searchApplies` **and** trimmed non-empty;
  `limit` only when a positive number. Deterministic key order (category, search, limit).
- `sortDrafts(drafts)` — stable Instagram → Facebook order.
- `mergeDraftsByChannel(existing, incoming)` — merge freshly generated drafts into the
  hydrated set keyed by channel (incoming replaces the same channel; other channels
  preserved), result ordered IG→FB. This is what keeps a Facebook draft alive when the user
  regenerates Instagram only.

### `services/social.ts`
- Add `getStudioProducts(category = "recommended"): Promise<StudioProductsResult>` via
  `serverApi("/social/products" + buildProductsQuery(category))` — the SSR seed for first
  paint. Remove `getContentStudio` (superseded by `getStudioProducts`; its sole caller
  `app/(app)/social/page.tsx` is migrated in this change).

### `services/social-actions.ts` (client, through `/api/proxy`)
- `fetchSocialProducts(category, search?, limit?): Promise<StudioProductsResult>` —
  `GET /social/products` + `buildProductsQuery`.
- `fetchProductDrafts(productId): Promise<ProductDraftsResult>` —
  `GET /social/products/{productId}/drafts`.
- Both typed, no `any`, using the existing `send` helper.

### `features/social/studio-product-panel.tsx` (new — replaces the old `ProductPicker`)
- Category selector (`role="tablist"`, roving buttons) over `SOCIAL_CATEGORIES`; the active
  category is `aria-selected`.
- Selecting a category client-fetches `fetchSocialProducts(category)` and lists the products
  (thumb + name + `category · priceLabel` + `ReasonChip` + the real `reasonDetail`); the
  `suggested` product is highlighted with a "Suggested" pill.
- **All** category shows a **debounced** (250 ms) search input → `fetchSocialProducts("all",
  q)`; the input is hidden for every other category.
- The `recommended` seed from SSR renders immediately with no fetch on first mount; switching
  categories (or back to recommended) fetches fresh.
- Per-category **loading skeletons**, an **empty state** ("No products in this signal right
  now"), and a recoverable **error** line.
- Responsive: fixed-width left rail on `lg+`, stacks full-width above the workspace on mobile.

### `features/social/content-studio-tab.tsx` (rework selection + hydration; SPEC-133 preview internals kept)
- `ContentStudioTab({ initial }: { initial: StudioProductsResult })` — owns the selected
  `StudioProduct` (persists across category browsing); auto-selects the suggested (else first)
  product from the seed so the workspace isn't empty on first paint.
- Left = `StudioProductPanel`; right = `StudioWorkspace` keyed on the selected product id.
- `StudioWorkspace({ product: StudioProduct })`:
  - On mount (keyed remount per product) **hydrates** via `fetchProductDrafts(product.id)`;
    shows loading skeletons while fetching.
  - Drafts present → render SPEC-133 preview cards immediately (existing images shown via
    `postImageUrl` when `hasImage`, else the product photo; `imageConcept` seeded).
  - No drafts → the SPEC-133 "Generate for: Instagram · Facebook · Both → Generate" entry.
  - After generate, `mergeDraftsByChannel` folds the new drafts into state; switching away and
    back re-hydrates from the server (drafts reappear — the bug fix).
  - Everything else (channel selector, inline caption edit via `updatePostCaption`, angle
    switcher, per-card regenerate image, grounded chips, "Saved to Approvals" link) unchanged.
- `PlatformPreviewCard` now takes a `StudioProduct` + a `ProductDraft` and seeds its image
  state from `draft.hasImage` / `draft.imageConcept`.

### `app/(app)/social/page.tsx`
- Seed the Content Studio tab with `getStudioProducts()` (default recommended) and pass
  `initial={studio}` to `ContentStudioTab`.

## Tests (Vitest, node env) — `tests/social-catalog.test.ts`
- `categoryLabel`: correct label for each enum; title-cased fallback for unknown.
- `searchApplies`: true only for `"all"`.
- `buildProductsQuery`: category always present; search included only for `all` + non-empty
  trimmed; dropped for other categories or blank/whitespace; limit only when positive;
  deterministic key order.
- `sortDrafts`: Instagram before Facebook regardless of input; no input mutation.
- `mergeDraftsByChannel`: incoming replaces same channel; other channels preserved; new
  channel added; result ordered IG→FB; inputs not mutated.

## Manual verification checklist (no component runner)
1. Content Studio loads with the Recommended list populated on first paint (SSR seed, no
   flash of empty).
2. Click each category tab → the product list swaps, showing a skeleton then that signal's
   products (or the empty state "No products in this signal right now").
3. On **All**, the search input appears; typing debounces then filters the full catalog;
   clearing it restores the full list; the input is absent on every other category.
4. Each product row shows thumb + name + `category · price` + reason chip + reasonDetail; the
   suggested product is highlighted with the Suggested pill.
5. Select a product that already has drafts → its Instagram/Facebook preview cards appear
   (with existing image if one was generated) after a brief loading state — no Generate step.
6. Select a product with no drafts → the Generate entry shows; generate → drafts render.
7. **Bug fix:** generate for a product → switch to another product → switch back → the drafts
   are still there (re-hydrated from the server), not lost.
8. Regenerate Instagram only while a Facebook draft exists → the Facebook draft is preserved
   (merge by channel).
9. Caption edit / angle switch / per-card image regenerate / "Saved to Approvals" link all
   still work (SPEC-133 unchanged).
10. Both light and dark themes: tokens only, no hardcoded colors, brand red identity-only.
11. Keyboard: category tabs, search input, product rows, and all workspace controls reachable
    and operable.
12. No element animates into view on load, category switch, or product switch.

## Acceptance Criteria — verification (done / partial / not done)
- [x] Types: `SocialCategory`, `StudioProduct`, `StudioProductsResult`, `ProductDraft`,
  `ProductDraftsResult` added. — **done**
- [x] `lib/social-catalog.ts` pure helpers added + unit-tested. — **done**
  (`tests/social-catalog.test.ts`, 14 cases)
- [x] `getStudioProducts` (SSR seed) + `fetchSocialProducts` / `fetchProductDrafts` client
  actions added; `getContentStudio` removed and its caller migrated. — **done**
- [x] Left panel = category navigation + per-category client fetch + full-catalog debounced
  search + loading/empty/error states. — **done** (`features/social/studio-product-panel.tsx`)
- [x] Workspace hydrates drafts on selection and after generate merges by channel; switching
  products and back reloads drafts from the server (bug fixed). — **done** (keyed remount +
  `fetchProductDrafts` hydration; `mergeDraftsByChannel` on generate)
- [x] SPEC-133 generation/edit/preview behavior unchanged. — **done** (only the workspace's
  data seeding changed: `StudioProduct` + hydrated `ProductDraft`; image state seeded from
  `hasImage`/`imageConcept`)
- [x] `npm run lint` (0 errors), `npx tsc --noEmit` (0 errors), `npm test` (530 passing),
  `npm run build` (compiled successfully) all green. — **done**
