# SPEC-090 — Product Analyst persistent tab shell

## Context

The Product Analyst page (`/products`) is one long scroll: verdict tiles → AI money-leaks +
commentary → category chart → full catalog table. Every navigation re-runs the whole page (and
its slow LLM calls) as one unit. Inventory (SPEC-085) and Orders (SPEC-087) were already split
into a **persistent shell** (header + tab bar in a `layout.tsx` that stays mounted) with a
**content-only skeleton**, so switching tabs swaps only the content below, never the header/tabs.
Products is the last analyst page still on the old single-scroll model — inconsistent, and it
pays for the slow AI calls on every visit even when the user only wants the catalog.

## Goal

Split Product Analyst into **three tabs behind a persistent shell**, identical UX to
Inventory/Orders: the header + tab bar never blink on a switch, only the content area swaps with
a content-only skeleton, and each tab fetches **only the data it shows**.

## Tabs

| Tab | Route | Content | Data |
| --- | ----- | ------- | ---- |
| **Overview** | `/products` | Verdict tiles + AI commentary + category chart | `getProductAnalysis` (fast) + `getProductCommentary` (LLM, Suspense) |
| **Catalog** | `/products/catalog` | Full catalog table | `getProductAnalysis` (fast) |
| **Returns** | `/products/returns` | Money-leaks list (top returns + return verdicts) | `getProductAnalysis` (fast) + `getProductReturnVerdicts` (LLM, Suspense) |

All three are range-scoped (share the date-range picker; no compare, matching today). Every tab
carries the active range across a switch (`range`/`from`/`to`/`period`), like Inventory.

**Perf note (root Rule 5):** today the page fetches the *combined* `getProductAiPanel` (both
commentary AND return-verdicts) on every load. Splitting the two LLM pieces onto separate tabs
lets each tab fetch **only its own** AI call via the existing single-purpose endpoints
(`getProductCommentary`, `getProductReturnVerdicts`) — Overview no longer pays for return-verdicts,
Catalog pays for no LLM call at all. Each slow call stays in its own `<Suspense>` boundary so the
fast analytics render immediately.

## Non-goals

- **No new metrics/value features.** The Returns tab shows the *existing* money-leaks/return-verdict
  content, relocated. The deeper "return reasons by product / true profit after returns" (joining
  Loop return data to products) is a separate future spec — this one is the structural shell only.
- No backend changes. No change to what any endpoint returns.
- `getProductAiPanel` (the combined call) is left in the service for now (no other consumer to
  break); this page stops using it.

## Design (mirror SPEC-085 exactly)

- `lib/product-tabs.ts` — pure, framework-free: `ProductTabKey`, `PRODUCT_TABS`,
  `activeProductTab(pathname)` (exact-match → `null` on any nested/detail route),
  `isProductTabRoute`, `productTabHref(basePath, params)` (carries only range params). Unit-tested.
- `features/products/product-shell.tsx` — `"use client"` persistent shell: reads
  `usePathname`/`useSearchParams`, renders `PageHeader` (title "Product Analyst" + existing
  description) + `DateRangePicker` (basePath = pathname, `showCompare={false}`) + `<ProductTabs/>`
  + `{children}`. On a non-tab route it renders `{children}` bare.
- `features/products/product-tabs.tsx` — `"use client"` tab bar, identical markup to
  `InventoryTabs`, active state from `activeProductTab`.
- `features/products/product-page-content.tsx` — shared server component taking `tab` +
  `searchParams`: resolves the range, fetches `getProductAnalysis` once, and renders the active
  tab's sections; the two LLM pieces are fetched only for their tab and wrapped in `<Suspense>`.
- `app/(app)/products/layout.tsx` → `<ProductShell>{children}</ProductShell>`.
- `app/(app)/products/page.tsx` → `<ProductPageContent tab="overview" …/>` (thin).
- `app/(app)/products/catalog/page.tsx`, `app/(app)/products/returns/page.tsx` → thin, `tab=…`.
- `app/(app)/products/loading.tsx` → **content-only** skeleton (header/tabs live in the shell).

## Acceptance criteria

1. `/products`, `/products/catalog`, `/products/returns` each render their content; the header +
   tab bar are painted by the persistent shell and do **not** re-render on a tab switch.
2. Switching tabs shows a **content-only** skeleton (tab bar stays visible), never a full-page
   reload/flash — same behavior as Inventory/Orders.
3. The active date range is preserved across tab switches; the active tab underlines instantly.
4. Overview fetches commentary (not return-verdicts); Returns fetches return-verdicts (not
   commentary); Catalog fetches neither LLM call. Each LLM call is in its own `<Suspense>`.
5. `activeProductTab` returns `null` on unrelated/detail routes (so the shell hides there).
6. `lib/product-tabs.ts` unit tests pass; `npm test`, `npx tsc --noEmit`, `npm run lint`, and
   `npm run build` all green (root Rules 4 & 7).

## Manual verification checklist (no jsdom runner — root Rule 4)

- Click through Overview → Catalog → Returns: tab bar + header stay fixed, only content swaps.
- Set a custom range on Overview, switch to Catalog/Returns: range persists in the picker + URL.
- Deep-link each of the three routes directly: correct tab active, correct content.
- Verify in light **and** dark themes (root Rule 9).
