# SPEC-050 — Inventory Analyst: Reorder Table + Dead Stock Section + Markdown Plan Drawer

## Scope
Frontend only. Replaces the generic `SectionCard` implementations for "Reorder now" and
"Dead stock" on the Inventory Analyst page with purpose-built components that surface
actionable data and connect to the new backend endpoints from SPEC-045.

## New components

### `features/analysis/reorder-table.tsx` (server component)
- Hero card: "N products about to stock out · $X/week at risk"
- Table: Product | Stock | Days cover (color-coded) | $/week at risk
- "Export restock proposal" — `<a href="/api/proxy/analysis/inventory/restock-export?{query}" download>` styled as a secondary button
- Empty state: ShieldCheck card "All products have ≥14 days of cover"
- Uses `revenue_at_risk` from the enriched `ReorderAlert` type (SPEC-045)

### `features/analysis/dead-stock-section.tsx` (server component)
- Hero: shows total frozen value (from existing `InventoryAnalysis.dead_stock`)
- Aged-bucket table: two rows — 90–180 days | Products | Frozen $; 180+ days | Products | Frozen $
- "Open markdown plan" button — triggers `MarkdownPlanDrawer` (client component)
- Empty state: no dead stock found
- Receives `agedData: DeadStockAged | null` and `query: string` props

### `features/analysis/markdown-plan-drawer.tsx` (`"use client"`)
- shadcn `Sheet` (slide from right)
- On open: `fetch(/api/proxy/analysis/inventory/dead-stock-plan?{query})` (lazy, once)
- Loading state: skeleton rows
- Content: headline, then per-product cards: Product | Discount % pill | $ recovery | Action label
- Refresh button: re-fetches with `refresh=true`
- No entrance animations; Sheet open transition is shadcn default

## Type additions (`types/analysis.ts`)
```typescript
// Enriched ReorderAlert (revenue_at_risk is new)
export interface ReorderAlert {
  product_id: number; title: string; units: number;
  stock: number; days_of_cover: number; revenue_at_risk: number;
}

export interface DeadStockAgeBucket { products: number; stock_value: number; }
export interface DeadStockAgedTopItem {
  product_id: number; title: string; stock: number;
  stock_value: number; days_since_last_sale: number | null;
}
export interface DeadStockAged {
  buckets: { d90_180: DeadStockAgeBucket; d180_plus: DeadStockAgeBucket; };
  top_by_value: DeadStockAgedTopItem[];
}

export interface DeadStockRecommendation {
  product_id: number; title: string;
  recommended_discount_pct: number; action: string;
  projected_recovery: number;
}
export interface DeadStockPlan {
  headline: string; total_projected_recovery: number;
  recommendations: DeadStockRecommendation[];
  generated_at: string; stale: boolean;
}
```

## Service additions (`services/analysis.ts`)
```typescript
export async function getDeadStockAged(query): Promise<DeadStockAged | null>
  // GET /analysis/inventory/dead-stock-aged?{query}
```

## Page changes (`app/(app)/inventory/page.tsx`)
- Add `getDeadStockAged` to `Promise.all` (4 concurrent fetches)
- Replace existing `<SectionCard title="⚠️ Reorder now">` with `<ReorderTable>`
- Replace existing `<SectionCard title="🧊 Dead stock">` with `<DeadStockSection>`

## Acceptance Criteria
- [ ] ReorderTable renders with hero stat + color-coded days cover (red <7d, orange <14d)
- [ ] "Export restock proposal" is an anchor with `download` attribute; clicking it downloads a CSV
- [ ] DeadStockSection shows both age-bucket rows with correct product counts and $ values
- [ ] "Open markdown plan" opens the Sheet slide-over
- [ ] Sheet fetches on first open; shows skeleton during fetch; renders plan on success
- [ ] Refresh button in Sheet re-fetches with `refresh=true`
- [ ] Both components show purposeful empty states when data is absent
- [ ] Zero hardcoded colors — semantic tokens only
- [ ] Zero entrance animations — content renders instantly
- [ ] `npm test` green, `npm run build` green, `npx tsc --noEmit` green
- [ ] Manual check: both themes (light/dark) render correctly

## Manual verification checklist
1. Navigate to /inventory → ReorderTable and DeadStockSection appear in correct positions
2. Click "Export restock proposal" → browser downloads a .csv file
3. Click "Open markdown plan" → Sheet opens, skeleton shows, plan renders
4. Click Refresh in Sheet → plan regenerates
5. Toggle light/dark mode → both components look correct in both themes
6. Test empty state: verify graceful render when no reorder alerts or no dead stock
