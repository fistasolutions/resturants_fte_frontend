"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { ComposePanel } from "@/components/shared/compose-panel";
import { useApiQuery } from "@/hooks/use-api-query";
import { attachmentFilename } from "@/lib/compose";
import { locationSetting } from "@/lib/recipient-settings";
import { briefQueries } from "@/lib/queries/brief";

/** The compose step (SPEC-230): only the location's display name comes from data —
 * the same sheets answer the review page already put in the cache — so the header
 * is right at once and falls back to "this location" only if it never arrives. */
export function ComposeTransferView({ locationId }: { locationId: string }) {
  const sheets = useApiQuery(briefQueries.transfers());
  const locationName =
    sheets.data?.sheets.find((s) => String(s.location_id) === locationId)?.location_name ?? "this location";

  return (
    <div className="space-y-6 px-6 py-8 md:px-10">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/inventory" className="hover:text-foreground transition-colors">
          Inventory Analyst
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <Link href="/inventory/transfers/review" className="hover:text-foreground transition-colors">
          Transfer Review
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="font-medium text-foreground">{locationName}</span>
      </nav>

      <div>
        <h1 className="font-heading text-2xl tracking-wide">Send transfer sheet</h1>
        <p className="mt-1 text-sm text-muted-foreground">{locationName}</p>
      </div>

      <ComposePanel
        draftUrl="/api/proxy/brief/transfers/draft"
        sendUrl="/api/proxy/brief/transfers/send"
        requestBody={{ location_id: Number(locationId) }}
        backHref="/inventory/transfers/review"
        attachmentFilename={attachmentFilename("transfer-sheet", locationName)}
        historyUrl={`/api/proxy/brief/transfers/history?location_id=${locationId}`}
        recipientSetting={locationSetting(locationId)}
        sendNeed={["brief.manage"]}
      />
    </div>
  );
}
