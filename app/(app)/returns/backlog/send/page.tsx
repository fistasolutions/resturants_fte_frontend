import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { ComposePanel } from "@/components/shared/compose-panel";
import { attachmentFilename } from "@/lib/compose";

export const metadata: Metadata = { title: "Email returns lead" };
export const dynamic = "force-dynamic";

export default function ReturnsBacklogSendPage() {
  return (
    <div className="space-y-8 px-4 py-6 sm:px-6 md:px-10 md:py-8">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/returns" className="transition-colors hover:text-foreground">
          Returns
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="font-medium text-foreground" aria-current="page">Clear the queue</span>
      </nav>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Returns communication
        </p>
        <h1 className="font-heading text-2xl tracking-wide sm:text-3xl">Ask the returns lead to clear the queue</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Review the recipient and message before anything is sent. Edit it, or ask AI to
          rewrite it, then send — it&apos;s logged so Results can show the queue coming down.
        </p>
      </div>

      <ComposePanel
        draftUrl="/api/proxy/loop/returns/backlog/draft"
        sendUrl="/api/proxy/loop/returns/backlog/send"
        requestBody={{}}
        backHref="/returns"
        attachmentFilename={attachmentFilename("returns-backlog", "today")}
        historyUrl="/api/proxy/loop/returns/backlog/history"
        recipientSetting={{ kind: "returns" }}
        sendNeed={["returns.view"]}
      />
    </div>
  );
}
