import { ArrowRight, Package } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { LocationTransferOpportunity } from "@/types/analysis";
import { formatCurrency, formatNumber } from "@/utils/format";

function formatIdleLong(days: number | null): string {
  if (days === null) return "No recorded sale at the source";
  if (days === 0) return "Sold today, now idle at the source";
  return `${formatNumber(days)}d since last sale at the source`;
}

interface LocationTransferDetailProps {
  opportunity: LocationTransferOpportunity;
  destinationLocationName: string;
  windowDays: number;
}

/** Detail sub-page content for one transfer-in candidate (SPEC-081) —
 * mirrors `DeadInventoryDetail`'s hero layout (this feature's source-vs-
 * destination mirror image), minus a send action: this feature is
 * visibility-only (backend SPEC-075's own scope note). */
export function LocationTransferDetail({
  opportunity,
  destinationLocationName,
  windowDays,
}: LocationTransferDetailProps) {
  const sortedSizes = [...opportunity.size_breakdown].sort((a, b) => b.units - a.units);
  const toMove = sortedSizes.length > 0
    ? sortedSizes.reduce((sum, s) => sum + s.units, 0)
    : opportunity.source_stock;

  return (
    <div className="space-y-4">
      {/* Image-led hero: product on the left, decision context on the right. */}
      <section className="overflow-hidden rounded-card bg-card ring-1 ring-foreground/10">
        <div className="grid lg:grid-cols-[minmax(20rem,2fr)_minmax(0,3fr)]">
          <div className="relative min-h-80 overflow-hidden border-b border-border bg-muted lg:min-h-[32rem] lg:border-b-0 lg:border-r">
            {opportunity.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={opportunity.image_url}
                alt={opportunity.title}
                className="absolute inset-0 size-full object-contain p-4"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Package className="size-10" aria-hidden />
                <p className="text-sm">Product image unavailable</p>
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-col p-4 sm:p-6">
            <div className="border-b border-border pb-6">
              <Badge variant="outline" className="border-success/30 font-normal text-success">
                Transfer opportunity
              </Badge>
              <h1 className="mt-3 font-heading text-3xl tracking-wide text-foreground">
                {opportunity.title}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                {destinationLocationName} sold {formatNumber(opportunity.destination_units_sold)}{" "}
                unit{opportunity.destination_units_sold === 1 ? "" : "s"} of this style in the
                last {formatNumber(windowDays)} days, while {opportunity.source_location_name}{" "}
                has {formatNumber(opportunity.source_stock)} sitting unsold.
              </p>
            </div>

            <div className="border-b border-border py-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Recommended transfer
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Move from</p>
                  <p className="font-semibold text-warning">
                    {opportunity.source_location_name}
                  </p>
                </div>
                <div className="flex size-8 items-center justify-center rounded-full bg-muted">
                  <ArrowRight className="size-4 text-muted-foreground" aria-hidden />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">To</p>
                  <p className="font-semibold text-success">{destinationLocationName}</p>
                </div>
              </div>
            </div>

            <dl className="grid grid-cols-2 border-b border-border py-2 sm:grid-cols-4">
              <div className="border-b border-r border-border p-3 sm:border-b-0">
                <dt className="text-xs text-muted-foreground">Stock at source</dt>
                <dd className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                  {formatNumber(opportunity.source_stock)}
                </dd>
              </div>
              <div className="border-b border-border p-3 sm:border-b-0 sm:border-r">
                <dt className="text-xs text-muted-foreground">Value sitting idle</dt>
                <dd className="mt-1 text-lg font-semibold tabular-nums text-warning">
                  {formatCurrency(opportunity.source_stock_value)}
                </dd>
              </div>
              <div className="border-r border-border p-3">
                <dt className="text-xs text-muted-foreground">Your demand</dt>
                <dd className="mt-1 text-lg font-semibold tabular-nums text-success">
                  {formatNumber(opportunity.destination_units_sold)}
                </dd>
              </div>
              <div className="p-3">
                <dt className="text-xs text-muted-foreground">Your current stock</dt>
                <dd className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                  {formatNumber(opportunity.destination_stock)}
                </dd>
              </div>
            </dl>

            <p className="pt-6 text-xs text-muted-foreground">
              {formatIdleLong(opportunity.days_since_last_sale_at_source)}
            </p>
          </div>
        </div>
      </section>

      {/* Full-width operational table, visually separate from product context. */}
      <section className="overflow-hidden rounded-card bg-card ring-1 ring-foreground/10">
        <div className="border-b border-border px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-foreground">Sizes to move</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Complete variant breakdown at {opportunity.source_location_name}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(sortedSizes.length)} size{sortedSizes.length === 1 ? "" : "s"} ·{" "}
              {formatNumber(toMove)} units total
            </p>
          </div>
        </div>

        {sortedSizes.length === 0 ? (
          <div className="px-4 py-6 sm:px-6">
            <p className="text-sm text-muted-foreground">
              No variant-level stock recorded — the {formatNumber(opportunity.source_stock)} unit
              {opportunity.source_stock === 1 ? "" : "s"} to move are untracked by size at{" "}
              {opportunity.source_location_name}.
            </p>
          </div>
        ) : (
          <>
            <div className="max-h-96 overflow-auto px-4 sm:px-6">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-card text-left">
                    <th
                      scope="col"
                      className="sticky top-0 bg-card py-3 pr-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground"
                    >
                      Size
                    </th>
                    <th
                      scope="col"
                      className="sticky top-0 bg-card py-3 pr-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground"
                    >
                      SKU
                    </th>
                    <th
                      scope="col"
                      className="sticky top-0 bg-card py-3 pr-0 text-right text-xs font-semibold uppercase tracking-widest text-muted-foreground"
                    >
                      Units available
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSizes.map((size, i) => (
                    <tr
                      key={`${size.sku ?? size.variant_title}-${i}`}
                      className="border-b border-border/60 last:border-0 transition-colors hover:bg-muted/40"
                    >
                      <td className="py-2 pr-4 font-medium text-foreground">
                        {size.variant_title}
                      </td>
                      <td className="py-2 pr-4 text-xs text-muted-foreground">
                        {size.sku ?? "—"}
                      </td>
                      <td className="py-2 pr-0 text-right tabular-nums text-foreground">
                        {formatNumber(size.units)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-3 sm:px-6">
              <p className="text-sm font-semibold text-foreground">Total available</p>
              <p className="text-sm font-semibold tabular-nums text-foreground">
                {formatNumber(toMove)} units
              </p>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
