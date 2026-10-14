# SPEC-046 — Product Analyst: Money-Leak Table with AI Verdicts

**Repo:** `ecommerce-fte-frontend`
**Date:** 2026-07-24
**Depends on:** Backend SPEC-040

---

## 1. Problem

The Product Analyst page surfaces return-rate data in the catalog table but gives no
immediate action signal. The new backend endpoint (`GET /analysis/products/return-verdicts`,
SPEC-040) provides per-product AI verdicts. This spec wires those verdicts into a
dedicated "Money Leak" table between the verdict tiles and the AI commentary section,
making the highest-loss products immediately actionable without opening Chat.

---

## 2. Types (`types/analysis.ts`)

Add:

```typescript
export interface ReturnVerdict {
  product_id: number;
  title: string;
  verdict: string;       // 5-8 words, actionable
}

export interface ReturnVerdicts {
  verdicts: ReturnVerdict[];
  generated_at: string;
  stale: boolean;
}
```

Update `ProductAnalysis` to include:
```typescript
top_returns: ProductReturn[];
```

---

## 3. `MoneyLeakList` component (`features/analysis/money-leak-list.tsx`)

**Client component.** Props:
```typescript
interface MoneyLeakListProps {
  products: ProductReturn[];   // top_returns from server fetch
  query: string;               // e.g. "start=2026-06-01&end=2026-07-01"
}
```

On mount, fetches `/api/proxy/analysis/products/return-verdicts?${query}` and stores
the verdict map (keyed by `product_id`). While loading, the verdict cell shows a
skeleton pulse. If the AI call fails, verdict cell shows "—".

**Table layout:**
- Section label: "MONEY LEAK" in the section-label style (10px, uppercase, tracked)
- Columns: Product | Return rate | Lost to refunds | AI Verdict | (Ask why)
- Row: product name truncated to one line; return_rate_pct formatted "X%"; attributed_refund
  formatted as currency; verdict text or skeleton or "—"; "Ask why →" link
- `return_rate_pct ≥ 20` → rate cell uses `text-destructive`
- "Ask why →" link → `/chat?q=Why+is+[encodedTitle]+getting+so+many+returns%3F+What+should+I+do%3F`
- Refresh button (icon) forces `refresh=true` on the verdicts fetch

**Empty state:** if `products` is empty, show a green-tinted (use `text-muted-foreground`
with a checkmark icon) card: "No significant return spikes detected in this period."

No entrance animations; content renders instantly in final position.

---

## 4. `VerdictTiles` update (`features/analysis/verdict-tiles.tsx`)

Update the `highest_returns` tile:
- Primary **value**: `formatCurrency(verdicts.highest_returns.attributed_refund)`
  (was showing the product name)
- **Caption**: `${verdicts.highest_returns.title} · ${verdicts.highest_returns.return_rate_pct}% return rate (estimate)`
- Label stays "Highest returns"

---

## 5. Products page (`app/(app)/products/page.tsx`)

Insert `<MoneyLeakList>` between `<VerdictTiles>` and `<AiCommentary>`:

```tsx
<MoneyLeakList products={data.top_returns} query={analysisApiQuery(range)} />
```

`top_returns` comes from the server-fetched `data: ProductAnalysis` — no extra RSC
fetch. The client component fetches AI verdicts independently on mount.

---

## 6. No-new-routes rule

The verdicts are fetched client-side via the existing `/api/proxy/*` route. No new
Next.js route files are needed.

---

## 7. Acceptance Criteria

- [ ] `ProductAnalysis` type includes `top_returns: ProductReturn[]`.
- [ ] `ReturnVerdict` and `ReturnVerdicts` types exist in `types/analysis.ts`.
- [ ] `MoneyLeakList` renders the money-leak table with all columns.
- [ ] Return rate ≥ 20% shows `text-destructive` on that cell.
- [ ] Verdict column shows skeleton while loading, then verdict text.
- [ ] "Ask why →" link is correctly URL-encoded.
- [ ] Refresh button triggers `refresh=true` re-fetch.
- [ ] Empty state shows when `products` is empty.
- [ ] `VerdictTiles` highest_returns tile shows dollar amount as primary value.
- [ ] `npm test`, `npx tsc --noEmit`, `npm run build` all pass.

---

## 8. Files Touched

| File | Change |
|------|--------|
| `types/analysis.ts` | Add `ReturnVerdict`, `ReturnVerdicts`; update `ProductAnalysis` |
| `features/analysis/money-leak-list.tsx` | New client component |
| `features/analysis/verdict-tiles.tsx` | Update highest_returns tile display |
| `app/(app)/products/page.tsx` | Insert `<MoneyLeakList>` |

---

## 9. Manual Verification Checklist

- [ ] Load `/products` — no entrance animations; table renders instantly.
- [ ] Verdict column shows skeleton for ~1s, then text.
- [ ] High-return-rate rows (≥20%) have red rate text in both light and dark themes.
- [ ] "Ask why →" link opens Chat with the pre-filled question.
- [ ] Empty state shown when no top_returns data.
- [ ] Refresh button (icon) triggers a new verdict fetch.
- [ ] Highest returns tile shows currency value, not product name.
