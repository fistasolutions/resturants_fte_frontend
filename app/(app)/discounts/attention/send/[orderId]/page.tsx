import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { ComposePanel } from "@/components/shared/compose-panel";
import { attachmentFilename } from "@/lib/compose";
import { locationSetting } from "@/lib/recipient-settings";

export const metadata: Metadata = { title: "Review discount with manager" };
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default async function DiscountReviewSendPage({ params }: PageProps) {
  const { orderId } = await params;

  return (
    <div className="space-y-8 px-4 py-6 sm:px-6 md:px-10 md:py-8">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/discounts" className="transition-colors hover:text-foreground">
          Discounts
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <Link href="/discounts/attention" className="transition-colors hover:text-foreground">
          Needs attention
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="font-medium text-foreground" aria-current="page">Review discount</span>
      </nav>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Manager communication
        </p>
        <h1 className="font-heading text-2xl tracking-wide sm:text-3xl">Ask the manager to confirm</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Review the recipient and message before anything is sent. Edit it, or ask AI to
          rewrite it, then send — it&apos;s logged so the flag shows as handled.
        </p>
      </div>

      <ComposePanel
        draftUrl="/api/proxy/discounts/attention/draft"
        sendUrl="/api/proxy/discounts/attention/send"
        requestBody={{ order_id: Number(orderId) }}
        backHref="/discounts/attention"
        attachmentFilename={attachmentFilename("discount-review", orderId)}
        historyUrl={`/api/proxy/discounts/attention/history?order_id=${orderId}`}
        recipientSetting={locationSetting(null)}
        sendNeed={["discounts.manage"]}
      />
    </div>
  );
}
