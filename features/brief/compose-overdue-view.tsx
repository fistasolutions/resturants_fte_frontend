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
export function ComposeOverdueView({ locationKey }: { locationKey: string }) {
  const sheets = useApiQuery(briefQueries.overdue());
  const locationName =
    sheets.data?.sheets.find((s) => s.location_key === locationKey)?.location_name ?? "this location";

  return (
    <div className="space-y-8 px-4 py-6 sm:px-6 md:px-10 md:py-8">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/brief" className="hover:text-foreground transition-colors">
          Morning Brief
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <Link href="/brief/overdue" className="hover:text-foreground transition-colors">
          Overdue Orders
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="font-medium text-foreground" aria-current="page">{locationName}</span>
      </nav>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Manager communication · {locationName}
        </p>
        <h1 className="font-heading text-2xl tracking-wide sm:text-3xl">Send overdue-order list</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Review the recipient, message, and attached order data before anything is sent.
        </p>
      </div>

      <ComposePanel
        draftUrl="/api/proxy/brief/overdue/draft"
        sendUrl="/api/proxy/brief/overdue/send"
        requestBody={{ location_key: locationKey }}
        backHref="/brief/overdue"
        attachmentFilename={attachmentFilename("overdue-orders", locationName)}
        historyUrl={`/api/proxy/brief/overdue/history?location_key=${locationKey}`}
        recipientSetting={locationSetting(locationKey)}
        sendNeed={["brief.manage"]}
      />
    </div>
  );
}
