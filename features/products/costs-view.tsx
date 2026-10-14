"use client";

import { useQueryClient } from "@tanstack/react-query";

import { KpiStrip } from "@/components/shared/kpi-strip";
import { CostsAssumptionsCard } from "@/features/products/costs-assumptions-card";
import { CostsManualCard } from "@/features/products/costs-manual-card";
import { CostsReconciliationCard } from "@/features/products/costs-reconciliation-card";
import { CostsShipmentCard } from "@/features/products/costs-shipment-card";
import { CostsShipmentsTable } from "@/features/products/costs-shipments-table";
import { coverageTiles } from "@/lib/costs";
import type { ApiCostSummary } from "@/types/costs";

interface Props {
  data: ApiCostSummary;
  queryKey: readonly unknown[];
}

/**
 * Products → Costs (SPEC-251). The tiles and every card read the one summary the
 * page prefetched; every write (a shipment, a manual entry, the assumptions, a
 * delete, a refresh) invalidates the `["costs"]` prefix so the whole tab moves at
 * once. Nothing here calculates — the engine (backend SPEC-256) does (root Rule 8).
 */
export function CostsView({ data }: Props) {
  const queryClient = useQueryClient();
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["costs"] });
  const base = data.base_currency;

  return (
    <div className="flex flex-col gap-4">
      <KpiStrip
        tiles={coverageTiles(data.coverage, data.reconciliation.shipments)}
        label="Cost coverage"
        explain={false}
      />

      <p className="text-xs text-muted-foreground">
        Every margin on True Profit, Brands, Discount Decisions and Profit Lens reads the
        landed cost in force on each sale&apos;s date, and falls back to Shopify&apos;s unit
        cost where none has been recorded. A cost recorded today applies from its effective
        date forward — history is never rewritten.
      </p>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="flex flex-col gap-4 xl:col-span-2">
          <CostsShipmentCard baseCurrency={base} onRecorded={refresh} />
          <CostsShipmentsTable shipments={data.shipments} baseCurrency={base} onChanged={refresh} />
        </div>
        <div className="flex flex-col gap-4">
          <CostsReconciliationCard reconciliation={data.reconciliation} period={data.period} />
          <CostsAssumptionsCard assumptions={data.assumptions} onSaved={refresh} />
          <CostsManualCard baseCurrency={base} onSaved={refresh} />
        </div>
      </div>
    </div>
  );
}
