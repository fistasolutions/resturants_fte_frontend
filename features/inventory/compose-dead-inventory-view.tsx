"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { ComposePanel } from "@/components/shared/compose-panel";
import { useApiQuery } from "@/hooks/use-api-query";
import { attachmentFilename } from "@/lib/compose";
import { locationSetting } from "@/lib/recipient-settings";
import { analysisQueries } from "@/lib/queries/analysis";

/** The compose step for one misplaced-stock alert (SPEC-230): only the style and
 * location names come from data — the same cached alerts answer the list already
 * holds — so the header is right at once and the compose panel never waits. */
export function ComposeDeadInventoryView({ productId, locationId }: { productId: string; locationId: string }) {
  const alerts = useApiQuery(analysisQueries.deadInventoryAlerts());
  const data = alerts.data ?? null;
  const alert =
    data?.alerts.find(
      (a) => a.product_id === Number(productId) && a.location_id === Number(locationId),
    ) ?? null;

  return (
    <main className="min-w-0 flex-1 space-y-6 p-4 md:p-6">
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-x-1 gap-y-1 text-xs text-muted-foreground"
      >
        <Link href="/inventory" className="transition-colors hover:text-foreground">
          Inventory Analyst
        </Link>
        <ChevronRight className="size-3 shrink-0" aria-hidden />
        <Link
          href="/inventory/dead-inventory-alerts"
          className="transition-colors hover:text-foreground"
        >
          Misplaced stock
        </Link>
        <ChevronRight className="size-3 shrink-0" aria-hidden />
        <span className="max-w-full truncate font-medium text-foreground">
          {alert ? `Send — ${alert.title} · ${alert.location_name}` : "Send alert"}
        </span>
      </nav>

      <div>
        <h1 className="font-heading text-2xl tracking-wide">Send dead-inventory alert</h1>
        {alert && (
          <p className="mt-1 text-sm text-muted-foreground">
            {alert.title} · {alert.location_name}
          </p>
        )}
      </div>

      <ComposePanel
        draftUrl="/api/proxy/analysis/inventory/dead-inventory-alerts/draft"
        sendUrl="/api/proxy/analysis/inventory/dead-inventory-alerts/send"
        requestBody={{ product_id: Number(productId), location_id: Number(locationId) }}
        backHref="/inventory/dead-inventory-alerts"
        attachmentFilename={attachmentFilename("dead-inventory-alert", alert?.location_name ?? "")}
        historyUrl={`/api/proxy/analysis/inventory/dead-inventory-alerts/history?product_id=${productId}&location_id=${locationId}`}
        recipientSetting={locationSetting(locationId)}
        sendNeed={["inventory.view"]}
      />
    </main>
  );
}
