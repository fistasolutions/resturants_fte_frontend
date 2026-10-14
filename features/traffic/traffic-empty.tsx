import { Clock, Footprints, Plug } from "lucide-react";
import Link from "next/link";

import { Card } from "@/components/ui/card";

/** Traffic empty state (SPEC-112 Patches). `connected` distinguishes "V-Count
 * isn't set up" from "V-Count IS connected but has no data for this window yet"
 * — the latter is common because the feed lags ~a day and only covers open
 * hours, so we must never tell a connected store to "connect." */
export function TrafficEmpty({ connected }: { connected: boolean }) {
  if (connected) {
    return (
      <Card className="flex flex-col items-center justify-center gap-4 px-6 py-14 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Clock className="size-6" aria-hidden />
        </span>
        <div className="max-w-md space-y-1.5">
          <h2 className="font-heading text-lg tracking-wide">
            No V-Count data for this period yet
          </h2>
          <p className="text-sm text-muted-foreground">
            V-Count is connected — it just hasn&apos;t published footfall for this window.
            The feed lags about a day and only covers hours your stores were open. Try{" "}
            <span className="font-medium text-foreground">Last 7 days</span>, or check back
            tomorrow for today.
          </p>
        </div>
      </Card>
    );
  }
  return (
    <Card className="flex flex-col items-center justify-center gap-4 px-6 py-14 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-ai/10 text-ai">
        <Footprints className="size-6" aria-hidden />
      </span>
      <div className="max-w-md space-y-1.5">
        <h2 className="font-heading text-lg tracking-wide">
          Connect V-Count to see store traffic
        </h2>
        <p className="text-sm text-muted-foreground">
          Once V-Count is connected, this page pairs your in-store footfall with sales to
          show <span className="font-medium text-foreground">conversion rate</span> — what
          share of people who walk in actually buy — plus peak hours and sales per visitor.
          It&apos;s the one metric Shopify can&apos;t give a physical store.
        </p>
      </div>
      <Link
        href="/integrations"
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        <Plug className="size-4" aria-hidden />
        Set up V-Count
      </Link>
    </Card>
  );
}
