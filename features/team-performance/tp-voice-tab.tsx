"use client";

import VoiceLoading from "@/app/(app)/team-performance/voice-of-customer/loading";
import { VoiceOfCustomerView } from "@/features/team-performance/voice-of-customer-view";
import { useApiQuery } from "@/hooks/use-api-query";
import type { ResolvedRange } from "@/lib/date-range";
import { gorgiasQueries } from "@/lib/queries/gorgias";

/** Team Performance → Voice of Customer, read from the client cache (SPEC-230). */
export function TeamPerformanceVoiceTab({ range }: { range: ResolvedRange }) {
  const result = useApiQuery(gorgiasQueries.voiceOfCustomer(range.from, range.to));
  if (result.isPending) return <VoiceLoading />;
  if (result.isError) {
    return (
      <div className="rounded-card border border-destructive/20 bg-destructive/10 p-6 text-sm text-destructive">
        Couldn&apos;t load Voice of Customer. Try again shortly.
      </div>
    );
  }
  return <VoiceOfCustomerView data={result.data} />;
}
