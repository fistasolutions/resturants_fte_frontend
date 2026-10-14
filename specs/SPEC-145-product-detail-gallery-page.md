# SPEC-145 — Product Analyst: product-detail page with image gallery

Status: implemented
Depends on: backend SPEC-146 (`GET /analysis/products/{id}`), SPEC-093 (catalog)

## Problem (Phase 2 of the product-image work)

The catalog listed products but nothing drilled in — cards/rows linked nowhere, and the
synced image gallery (backend SPEC-145) had no surface. Build the **product-detail page**:
click any catalog product → its own page with the full Shopify photo gallery, per-variant
images, and its backend-computed metrics.

## Design

Pure consumer of the new detail endpoint (Rule 8 — no calculations in the UI).

- `types/analysis.ts`: `ProductDetail`, `ProductGalleryImage`, `ProductVariantDetail`.
- `services/analysis.ts`: `getProductDetail(id, {from,to})` → `/analysis/products/{id}`
  (throws `ApiError`; 404 → `notFound()`).
- **`ProductGallery`** (client) — a large active image + a keyboard-navigable thumbnail
  strip over the full `images` set; active thumb ringed; falls back to the featured
  `image_url`, then to an explicit "no photos synced" state — never a broken image.
  `next/image unoptimized` off the Shopify CDN (`cdn.shopify.com` remotePattern), sized
  down per slot via `lib/shopify-image.ts` `shopifyImageWidth` (pure, unit-tested).
- **`ProductDetailView`** (server) — gallery + identity (status pill · category · vendor ·
  price range) + four backend metric tiles (revenue / units / stock / variants) + a
  **variants table** where every row shows that variant's own image (`image_src`),
  price, margin, markdown, stock.
- **Route** `app/(app)/products/[productId]/page.tsx` (+ `loading.tsx` skeleton) — owns
  its own header/breadcrumb; `ProductShell` already renders non-tab routes bare.
- **Drill-in wired**: catalog **grid** cards and **table** title cells now link to
  `/products/{id}` (hover + focus states).

HCI/perf: `next/image` sized thumbnails (small files, not full-res), `overflow-x-auto`
table, semantic tokens only, no entrance animation (Rule 9), keyboard-navigable gallery.

## Manual verification checklist

- Product Analyst → Catalog → click any product (grid card or table title) → its detail
  page opens with the gallery; clicking a thumbnail swaps the main image; the variants
  table shows a per-variant thumbnail.
- Product with no synced photos → "No photos synced" state (no broken image); featured
  `image_url` used when the gallery is empty.
- Unknown / non-numeric id → 404; skeleton on load; light + dark; mobile (gallery stacks
  above metrics).

## Acceptance Criteria

- [x] Detail page renders gallery + per-variant images + metrics from the endpoint.
- [x] Catalog grid + table drill into `/products/{id}`.
- [x] Empty-gallery + 404 + loading states handled.
- [x] `npm run lint`, `npx tsc --noEmit`, `npm test` (631, +3 shopify-image), `npm run build` green.
