import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { ComposeBulkPanel } from "@/components/shared/compose-bulk-panel";

export const metadata: Metadata = { title: "Send All Transfer Sheets" };
export const dynamic = "force-dynamic";

// SPEC-088: relocated from /brief/transfers/send-all. Backend endpoints stay
// at /brief/transfers/* (no product-visible URL) — only the route moved.
export default function ComposeTransferSendAllPage() {
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
        <span className="font-medium text-foreground">Send All Remaining</span>
      </nav>

      <div>
        <h1 className="font-heading text-2xl tracking-wide">Send all remaining transfer sheets</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          One email per location below, each with its own attachment.
        </p>
      </div>

      <ComposeBulkPanel
        draftUrl="/api/proxy/brief/transfers/draft"
        sendUrl="/api/proxy/brief/transfers/send"
        requestBody={{}}
        backHref="/inventory/transfers/review"
        attachmentPrefix="transfer-sheet"
        historyUrl="/api/proxy/brief/transfers/history"
        sendNeed={["brief.manage"]}
      />
    </div>
  );
}
