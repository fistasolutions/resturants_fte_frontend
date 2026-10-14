import { Card } from "@/components/ui/card";
import type { CustomerSegmentsData } from "@/types/customers";
import { formatCurrency, formatNumber } from "@/utils/format";

/**
 * Customers → Segments (SPEC-189). Discount received sits beside revenue on
 * purpose: a segment's cost and its value belong in one eye-line, which is what
 * makes "took more discount than it produced revenue" visible at a glance.
 */
export function SegmentsView({ data }: { data: CustomerSegmentsData }) {
  if (data.customersCounted === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm font-medium text-foreground">No customers with orders yet</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.segments.map((segment) => {
          const costsMore = segment.discountGiven > segment.revenue;
          return (
            <Card key={segment.segment} className="flex flex-col gap-3 p-5">
              <p className="text-sm font-semibold text-foreground">{segment.label}</p>
              <p className="text-2xl font-bold tabular-nums text-foreground">
                {formatNumber(segment.customers)}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  customers
                </span>
              </p>
              <dl className="flex flex-col gap-1.5 text-xs">
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Orders</dt>
                  <dd className="tabular-nums text-foreground">
                    {formatNumber(segment.orders)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Revenue</dt>
                  <dd className="tabular-nums text-foreground">
                    {formatCurrency(segment.revenue)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">AOV</dt>
                  <dd className="tabular-nums text-foreground">
                    {formatCurrency(segment.aov)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Discount given</dt>
                  <dd
                    className={`tabular-nums ${
                      segment.discountGiven > 0 ? "text-destructive" : "text-foreground"
                    }`}
                  >
                    {formatCurrency(segment.discountGiven)}
                  </dd>
                </div>
              </dl>
              {costsMore && (
                <p className="rounded-md bg-destructive/10 px-2 py-1.5 text-[11px] font-medium text-destructive">
                  Took more discount than it produced in revenue.
                </p>
              )}
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        {formatNumber(data.customersCounted)} customers classified.{" "}
        {formatNumber(data.excludedGuestOrders)} guest order
        {data.excludedGuestOrders === 1 ? "" : "s"} excluded — a checkout with no customer
        record cannot be shown to belong to any segment.
      </p>
    </div>
  );
}
