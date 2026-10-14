import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { ComposeBulkPanel } from "@/components/shared/compose-bulk-panel";
import { filterSummary, ordersApiQuery, parseOrderFilters } from "@/lib/order-filters";

export const metadata: Metadata = { title: "Send All Orders Lists" };
export const dynamic = "force-dynamic";

interface ComposeOrdersSendAllPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function ComposeOrdersSendAllPage({
  searchParams,
}: ComposeOrdersSendAllPageProps) {
  const rawParams = await searchParams;
  const filters = parseOrderFilters(rawParams);
  const query = ordersApiQuery(filters);
  const summary = filterSummary(filters);

  const backQuery = new URLSearchParams(
    Object.entries(rawParams).filter((entry): entry is [string, string] => entry[1] !== undefined),
  ).toString();
  const backHref = backQuery ? `/orders/review?${backQuery}` : "/orders/review";

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
        <span className="font-medium text-foreground">Send All Remaining</span>
      </nav>

      <div>
        <h1 className="font-heading text-2xl tracking-wide">Send all remaining orders lists</h1>
        <p className="mt-1 text-sm text-muted-foreground">{summary}</p>
      </div>

      <ComposeBulkPanel
        draftUrl={`/api/proxy/orders/draft-to-manager?${query}`}
        sendUrl={`/api/proxy/orders/send-to-manager?${query}`}
        requestBody={{ filter_summary: summary }}
        backHref={backHref}
        attachmentPrefix="orders"
        historyUrl="/api/proxy/orders/history"
        sendNeed={["orders.view"]}
      />
    </div>
  );
}
