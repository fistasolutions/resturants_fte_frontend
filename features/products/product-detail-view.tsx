import Image from "next/image";
import { ImageOff } from "lucide-react";

import { Card } from "@/components/ui/card";
import { ExplainButton } from "@/features/chat/explain-button";
import { ProductGallery } from "@/features/products/product-gallery";
import { buildLocationSalesRows } from "@/lib/location-sales";
import { shopifyImageWidth } from "@/lib/shopify-image";
import type {
  ProductDetail,
  ProductLocationSales,
  ProductVariantDetail,
} from "@/types/analysis";
import { formatCurrency, formatNumber } from "@/utils/format";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-success/15 text-success",
  draft: "bg-warning/15 text-warning",
  archived: "bg-muted text-muted-foreground",
};

function pct(value: number | null): string {
  return value === null ? "—" : `${value}%`;
}

function priceRange(min: number, max: number): string {
  return min === max ? formatCurrency(min) : `${formatCurrency(min)} – ${formatCurrency(max)}`;
}

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="relative gap-1 p-4">
      <span className="pr-6 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      <ExplainButton target={{ metric: label, value, detail: sub }} />
      <span className="font-heading text-xl tracking-tight tabular-nums">{value}</span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </Card>
  );
}

function SoldPerLocation({ rows }: { rows: ProductLocationSales[] }) {
  const withShare = buildLocationSalesRows(rows);
  return (
    <Card className="col-span-2 gap-2 p-4">
      <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        Sold per location
      </span>
      {withShare.length === 0 ? (
        <span className="text-xs text-muted-foreground">No sales in this period</span>
      ) : (
        <ul className="mt-0.5 space-y-2">
          {withShare.map((row) => (
            <li key={row.location_id ?? "unattributed"} className="space-y-1">
              <div className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate text-sm">{row.location_name}</span>
                <span className="shrink-0 text-sm font-medium tabular-nums">
                  {formatNumber(row.units)}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {formatCurrency(row.revenue)}
                  </span>
                </span>
              </div>
              {/* Decorative: the numbers above carry the meaning. No entrance
                  animation — renders in its final position (Rule 9). */}
              <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                <div className="h-full rounded-full bg-primary" style={{ width: `${row.share}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function VariantThumb({ src, alt }: { src: string | null; alt: string }) {
  if (!src) {
    return (
      <span className="flex size-11 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40 text-muted-foreground">
        <ImageOff className="size-4" aria-hidden />
      </span>
    );
  }
  return (
    <span className="relative size-11 shrink-0 overflow-hidden rounded-md border border-border bg-muted/40">
      <Image src={shopifyImageWidth(src, 96)} alt={alt} fill sizes="44px" unoptimized className="object-cover object-top" />
    </span>
  );
}

function VariantRow({ v }: { v: ProductVariantDetail }) {
  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/40">
      <td className="py-2.5 pr-3 pl-4">
        <div className="flex items-center gap-3">
          <VariantThumb src={v.image_src} alt={v.variant} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{v.variant}</p>
            {v.sku && <p className="truncate text-xs text-muted-foreground">{v.sku}</p>}
          </div>
        </div>
      </td>
      <td className="px-3 py-2.5 text-right text-sm tabular-nums">{formatCurrency(v.price)}</td>
      <td className="px-3 py-2.5 text-right text-sm tabular-nums">{pct(v.margin_pct)}</td>
      <td className="px-3 py-2.5 text-right text-sm tabular-nums">
        {v.markdown_pct === null ? "—" : `${v.markdown_pct}% off`}
      </td>
      <td className="py-2.5 pr-4 pl-3 text-right text-sm tabular-nums">
        {v.stock <= 0 ? (
          <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
            Out
          </span>
        ) : (
          formatNumber(v.stock)
        )}
      </td>
    </tr>
  );
}

/** Product Analyst → single-product detail (SPEC-146). Gallery + identity +
 * backend-computed metrics + the per-variant image table. */
export function ProductDetailView({ product }: { product: ProductDetail }) {
  const statusClass = STATUS_STYLES[product.status] ?? "bg-muted text-muted-foreground";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        {/* Gallery */}
        <ProductGallery images={product.images} title={product.title} fallback={product.image_url} />

        {/* Identity + metrics */}
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusClass}`}>
                {product.status}
              </span>
              <span className="text-xs text-muted-foreground">{product.category}</span>
              {product.vendor && (
                <span className="text-xs text-muted-foreground">· {product.vendor}</span>
              )}
            </div>
            <h1 className="mt-2 font-heading text-2xl tracking-tight text-balance sm:text-3xl">
              {product.title}
            </h1>
            <p className="mt-1 text-lg font-medium tabular-nums">
              {priceRange(product.price_min, product.price_max)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground tabular-nums">
              {formatNumber(product.images.length)} photo{product.images.length === 1 ? "" : "s"} ·{" "}
              {formatNumber(product.variants.length)} variant
              {product.variants.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatTile
              label="Revenue"
              value={formatCurrency(product.window_sales.revenue)}
              sub="in this period"
            />
            <StatTile
              label="Units sold"
              value={formatNumber(product.window_sales.units)}
              sub={`${formatNumber(product.window_sales.orders)} orders`}
            />
            <StatTile label="In stock" value={formatNumber(product.total_stock)} sub="all locations" />
            <StatTile
              label="Variants"
              value={formatNumber(product.variants.length)}
              sub={`${formatNumber(product.images.length)} images`}
            />
            {/* SPEC-160: client asked for "another box of how many sold per
                location". Full-width under the tiles because the answer is a
                breakdown, not a single number. */}
            <SoldPerLocation rows={product.sales_by_location} />
          </div>
        </div>
      </div>

      {/* Variants */}
      <section>
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold">Variants</h2>
          <span className="text-xs text-muted-foreground">Each variant with its own Shopify image</span>
        </div>
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2.5 pr-3 pl-4 text-left text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                    Variant
                  </th>
                  <th className="px-3 py-2.5 text-right text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                    Price
                  </th>
                  <th className="px-3 py-2.5 text-right text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                    Margin
                  </th>
                  <th className="px-3 py-2.5 text-right text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                    Markdown
                  </th>
                  <th className="py-2.5 pr-4 pl-3 text-right text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                    Stock
                  </th>
                </tr>
              </thead>
              <tbody>
                {product.variants.map((v, i) => (
                  <VariantRow key={`${v.sku ?? v.variant}-${i}`} v={v} />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  );
}
