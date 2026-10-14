"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { ComposePanel } from "@/components/shared/compose-panel";
import { useApiQuery } from "@/hooks/use-api-query";
import { attachmentFilename } from "@/lib/compose";
import { locationSetting } from "@/lib/recipient-settings";
import { orderQueries } from "@/lib/queries/orders";

interface ComposeOrdersViewProps {
  locationKey: string;
  /** The backend query string (`ordersApiQuery(filters)`). */
  query: string;
  summary: string;
  backHref: string;
}

/**
 * The compose step of Review & Send Orders (SPEC-230). Only the location's display
 * name comes from data, and it is the same review-by-location answer the previous
 * page already put in the cache — so the header is right immediately and falls back
 * to "this location" only if that answer never arrives (as before).
 */
export function ComposeOrdersView({ locationKey, query, summary, backHref }: ComposeOrdersViewProps) {
  const review = useApiQuery(orderQueries.reviewByLocation(query));
  const locationName =
    review.data?.sheets.find((s) => s.location_key === locationKey)?.location_name ??
    "this location";

  return (
    <div className="space-y-6 px-6 py-8 md:px-10">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/orders" className="hover:text-foreground transition-colors">
          Orders
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <Link href={backHref} className="hover:text-foreground transition-colors">
          Review &amp; Send
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="font-medium text-foreground">{locationName}</span>
      </nav>

      <div>
        <h1 className="font-heading text-2xl tracking-wide">Send orders list</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {locationName} · {summary}
        </p>
      </div>

      <ComposePanel
        draftUrl={`/api/proxy/orders/draft-to-manager?${query}`}
        sendUrl={`/api/proxy/orders/send-to-manager?${query}`}
        requestBody={{ filter_summary: summary, location_key: locationKey }}
        backHref={backHref}
        attachmentFilename={attachmentFilename("orders", locationName)}
        historyUrl={`/api/proxy/orders/history?location_key=${locationKey}`}
        recipientSetting={locationSetting(locationKey)}
        sendNeed={["orders.view"]}
      />
    </div>
  );
}
