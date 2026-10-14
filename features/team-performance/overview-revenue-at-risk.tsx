import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { formatCurrency, formatNumber } from "@/utils/format";

/** Revenue-at-risk headline card (SPEC-096 ①) — lifetime value of customers
 * currently in an at-risk conversation. Links to the Alerts tab, where the
 * ranked list lives. Amber when non-zero; neutral when all clear. */
export function OverviewRevenueAtRisk({
  total,
  customerCount,
  alertsHref,
}: {
  total: number;
  customerCount: number;
  alertsHref: string;
}) {
  const active = total > 0;
  return (
    <Link
      href={alertsHref}
      className={`block rounded-card p-4 ring-1 transition-colors hover:ring-foreground/20 ${
        active ? "bg-warning/10 ring-warning/20" : "bg-card ring-foreground/10"
      }`}
    >
      <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <ShieldAlert
          className={`size-4 ${active ? "text-warning" : "text-muted-foreground"}`}
          aria-hidden
        />
        Revenue at risk
      </p>
      <p
        className={`mt-2 font-heading text-2xl tracking-wide tabular-nums ${
          active ? "text-warning" : "text-foreground"
        }`}
      >
        {formatCurrency(total)}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        Lifetime value of {formatNumber(customerCount)} customer
        {customerCount === 1 ? "" : "s"} waiting or unhappy · answer highest-value first
      </p>
    </Link>
  );
}
