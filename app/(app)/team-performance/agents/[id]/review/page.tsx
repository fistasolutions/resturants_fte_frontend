import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { ComposePanel } from "@/components/shared/compose-panel";
import { attachmentFilename } from "@/lib/compose";

export const metadata: Metadata = { title: "Email support lead" };
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AgentReviewSendPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="space-y-8 px-4 py-6 sm:px-6 md:px-10 md:py-8">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/team-performance/agents" className="transition-colors hover:text-foreground">
          Team Performance
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="font-medium text-foreground" aria-current="page">Coach an agent</span>
      </nav>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Support communication
        </p>
        <h1 className="font-heading text-2xl tracking-wide sm:text-3xl">Ask the support lead to coach</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Review the recipient and message before anything is sent. Edit it, or ask AI to
          rewrite it, then send — it&apos;s logged so Results can show the agent&apos;s response
          time coming down.
        </p>
      </div>

      <ComposePanel
        draftUrl="/api/proxy/gorgias/agent-review/draft"
        sendUrl="/api/proxy/gorgias/agent-review/send"
        requestBody={{ gorgias_agent_id: Number(id) }}
        backHref="/team-performance/agents"
        attachmentFilename={attachmentFilename("support-review", id)}
        historyUrl={`/api/proxy/gorgias/agent-review/history?gorgias_agent_id=${id}`}
        recipientSetting={{ kind: "support" }}
        sendNeed={["team_performance.manage"]}
      />
    </div>
  );
}
