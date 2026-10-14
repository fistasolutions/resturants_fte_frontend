"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import MisplacedLoading from "@/app/(app)/inventory/dead-inventory-alerts/loading";
import { DeadInventoryReview } from "@/features/inventory/dead-inventory-review";
import { useApiQuery } from "@/hooks/use-api-query";
import { analysisQueries } from "@/lib/queries/analysis";
import { formatCurrency, formatNumber } from "@/utils/format";

function SummaryStat({
  label,
  value,
  tone = "default",
  hint,
}: {
  label: string;
  value: string;
  tone?: "default" | "warning";
  hint?: string;
}) {
  return (
    <div className="flex-1 basis-36 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5">
        <span
          className={`text-lg font-semibold leading-none tracking-tight tabular-nums ${
            tone === "warning" ? "text-warning" : "text-foreground"
          }`}
        >
          {value}
        </span>
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </p>
    </div>
  );
}

// SPEC-089: "Misplaced stock" — a style sitting unsold at one store while it
// sells at another (store→store). No longer an inventory tab (the Transfers plan
// owns store→store now), so it renders bare under the shell and carries its OWN
// breadcrumb + header. The manager-nudge send/history flow below is unchanged.
function PageChrome({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-w-0 flex-1 space-y-4 p-4 md:p-6">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1 text-xs text-muted-foreground"
      >
        <Link href="/inventory" className="transition-colors hover:text-foreground">
          Inventory Analyst
        </Link>
        <ChevronRight className="size-3" aria-hidden />
        <span className="font-medium text-foreground">Misplaced stock</span>
      </nav>
      <div>
        <h1 className="font-heading text-2xl tracking-wide">Misplaced stock</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Styles sitting unsold at one store while the same style is actively selling at
          another — nudge the store to move it. Store-to-store only.
        </p>
      </div>
      {children}
    </main>
  );
}

/** Misplaced stock (SPEC-089), read from the client cache (SPEC-230). The loader
 * resolves null on failure — the retry copy below, as before. */
export function MisplacedStockView() {
  const alerts = useApiQuery(analysisQueries.deadInventoryAlerts());
  if (alerts.isPending) return <MisplacedLoading />;
  const data = alerts.data ?? null;

  if (!data) {
    return (
      <PageChrome>
        <div className="rounded-card bg-card px-4 py-8 text-center ring-1 ring-foreground/10">
          <p className="text-sm font-medium text-destructive">
            Could not load misplaced-stock alerts — try refreshing.
          </p>
        </div>
      </PageChrome>
    );
  }

  return (
    <PageChrome>
      {/* Dense summary strip — one bordered band with dividers, not 3 floating cards. */}
      <div className="flex flex-wrap divide-y divide-border rounded-card bg-card ring-1 ring-foreground/10 sm:divide-x sm:divide-y-0">
        <SummaryStat label="Styles flagged" value={formatNumber(data.summary.styles_flagged)} />
        <SummaryStat
          label="Unsold value"
          value={formatCurrency(data.summary.total_value)}
          tone="warning"
          hint="stuck"
        />
        <SummaryStat
          label="Locations affected"
          value={formatNumber(data.summary.locations_affected)}
        />
        <SummaryStat label="Window" value={`${data.window_days}d`} hint="fixed" />
      </div>

      <DeadInventoryReview initialAlerts={data.alerts} />
    </PageChrome>
  );
}
