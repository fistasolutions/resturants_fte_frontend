import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { ComposeBulkPanel } from "@/components/shared/compose-bulk-panel";

export const metadata: Metadata = { title: "Send All Overdue Orders" };
export const dynamic = "force-dynamic";

export default function ComposeOverdueSendAllPage() {
  return (
    <div className="space-y-6 px-6 py-8 md:px-10">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/brief" className="hover:text-foreground transition-colors">
          Morning Brief
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <Link href="/brief/overdue" className="hover:text-foreground transition-colors">
          Overdue Orders
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="font-medium text-foreground">Send All Remaining</span>
      </nav>

      <div>
        <h1 className="font-heading text-2xl tracking-wide">Send all remaining overdue-order lists</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          One email per location below, each with its own attachment.
        </p>
      </div>

      <ComposeBulkPanel
        draftUrl="/api/proxy/brief/overdue/draft"
        sendUrl="/api/proxy/brief/overdue/send"
        requestBody={{}}
        backHref="/brief/overdue"
        attachmentPrefix="overdue-orders"
        historyUrl="/api/proxy/brief/overdue/history"
        sendNeed={["brief.manage"]}
      />
    </div>
  );
}
