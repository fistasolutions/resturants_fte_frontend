"use client";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmLink } from "@/features/email-marketing/em-link";
import { CardGridSkeleton } from "@/features/email-marketing/skeletons";
import { useApiQuery } from "@/hooks/use-api-query";
import { flowChip, formatMoney, healthTone } from "@/lib/email-marketing";
import { providerInfo } from "@/lib/email-providers";
import { emailMarketingQueries } from "@/lib/queries/email-marketing";
import type { Flow } from "@/types/email-marketing";
import { formatNumber } from "@/utils/format";

const ORDER: Record<Flow["status"], number> = { live: 0, manual: 1, draft: 2, missing: 3 };

function FlowCard({ flow }: { flow: Flow }) {
  const chip = flowChip(flow.status);
  const provider = providerInfo(flow.provider).name;
  return (
    <EmLink
      href={`/email-marketing/flows/${flow.id}`}
      className="flex h-full flex-col gap-2 rounded-2xl border border-border bg-card p-4 outline-none transition-colors hover:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-foreground">{flow.name}</span>
        <StatusBadge tone={chip.tone}>{chip.label}</StatusBadge>
        {flow.health !== "missing" ? <StatusBadge tone={healthTone(flow.health)}>{flow.health === "healthy" ? "Healthy" : flow.health === "weak" ? "Weak" : "Broken"}</StatusBadge> : null}
      </div>
      <p className="text-xs text-muted-foreground">{flow.purpose}</p>
      <p className="text-xs text-foreground">
        <span className="font-medium">Our edge:</span> <span className="text-muted-foreground">{flow.edge}</span>
      </p>
      <div className="mt-auto flex flex-wrap items-end justify-between gap-2 border-t border-border pt-2 text-xs">
        <span className="text-muted-foreground">
          {flow.externalId ? `In ${provider}` : `Not in ${provider}`}
          {flow.recipients30d > 0 ? ` · ${formatNumber(flow.recipients30d)} recipients in 30 days` : ""}
        </span>
        <span className="font-semibold tabular-nums text-foreground">{flow.rpr ? `${formatMoney(flow.rpr)} per recipient` : "—"}</span>
      </div>
      <p className="text-[11px] text-muted-foreground">{flow.healthNote}</p>
    </EmLink>
  );
}

/** The lifecycle library (SPEC-345): every flow a store should run, whether it exists in the
 * email platform, its status, what it earns per recipient and a health verdict. */
export function FlowsTab() {
  const flows = useApiQuery(emailMarketingQueries.flows());
  if (flows.isPending) return <CardGridSkeleton cards={9} />;
  if (flows.isError) return <QueryErrorState error={flows.error} onRetry={() => void flows.refetch()} />;
  const list = [...flows.data].sort((a, b) => ORDER[a.status] - ORDER[b.status]);
  const live = list.filter((f) => f.status === "live").length;
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground" role="status">
        {live} of {list.length} lifecycle flows live · {list.filter((f) => f.status === "missing").length} missing · {list.filter((f) => f.health === "weak" || f.health === "broken").length} need work.
        Turning a flow on is always a separate approval.
      </p>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((flow) => (
          <li key={flow.id}>
            <FlowCard flow={flow} />
          </li>
        ))}
      </ul>
    </div>
  );
}
