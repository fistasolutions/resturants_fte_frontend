import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { ComposePanel } from "@/components/shared/compose-panel";
import { attachmentFilename } from "@/lib/compose";

export const metadata: Metadata = { title: "Email warehouse manager" };
export const dynamic = "force-dynamic";

export default function WarehouseBacklogSendPage() {
  return (
    <div className="space-y-8 px-4 py-6 sm:px-6 md:px-10 md:py-8">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/warehouse" className="transition-colors hover:text-foreground">
          Warehouse
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="font-medium text-foreground" aria-current="page">Clear the backlog</span>
      </nav>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Warehouse communication
        </p>
        <h1 className="font-heading text-2xl tracking-wide sm:text-3xl">Ask the warehouse to clear the backlog</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Review the recipient and message before anything is sent. Edit it, or ask AI to
          rewrite it, then send — it&apos;s logged so Results can show the backlog coming down.
        </p>
      </div>

      <ComposePanel
        draftUrl="/api/proxy/warehouse/backlog/draft"
        sendUrl="/api/proxy/warehouse/backlog/send"
        requestBody={{}}
        backHref="/warehouse"
        attachmentFilename={attachmentFilename("warehouse-backlog", "today")}
        historyUrl="/api/proxy/warehouse/backlog/history"
        recipientSetting={{ kind: "warehouse" }}
        sendNeed={["warehouse.manage"]}
      />
    </div>
  );
}
