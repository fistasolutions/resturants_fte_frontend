"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { RoleGate } from "@/components/shared/role-gate";
import { StatusBadge } from "@/components/shared/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmLink } from "@/features/email-marketing/em-link";
import { ListSkeleton } from "@/features/email-marketing/skeletons";
import { clampPage, pageCount, paginate } from "@/lib/catalog-pagination";
import { useApiQuery } from "@/hooks/use-api-query";
import { useCan } from "@/hooks/use-can";
import {
  CAMPAIGN_STATUS_ORDER,
  CAMPAIGNS_PAGE_SIZE,
  builderHref,
  campaignChip,
  filterCampaigns,
  formatMoney,
  formatMoneyRange,
  GOALS,
} from "@/lib/email-marketing";
import { strategyLabel } from "@/lib/email-builder";
import { emailMarketingQueries } from "@/lib/queries/email-marketing";
import { cn } from "@/lib/utils";
import type { CampaignStatus, EmailCampaign } from "@/types/email-marketing";
import { formatNumber } from "@/utils/format";

type Filter = "all" | CampaignStatus;

function outcome(c: EmailCampaign): string {
  if (c.results?.profit) {
    const p = c.results.profit;
    return p.amount >= 0 ? `${formatMoney(p)} profit` : `${formatMoney({ ...p, amount: -p.amount })} loss`;
  }
  if (c.status === "sent" || c.status === "failed" || c.status === "cancelled") return "—";
  return `≈ ${formatMoneyRange(c.expectedProfit)}`;
}

/** Every campaign with its status, audience and money (SPEC-345) — expected profit before it
 * sends, profit caused after. Ordered so what needs a decision comes first. Status chips, a name
 * search and client-side pagination (SPEC-345 patch 2026-10-14): changing a filter or a page
 * re-renders only this list, never the page. New campaign is shown only to a role with
 * `email_marketing.manage` (SPEC-364, Rule 13). */
export function CampaignsTab() {
  const campaigns = useApiQuery(emailMarketingQueries.campaigns());
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  // The page is kept against the filter+search it belongs to; a new filter or search reads back
  // as page 1 during render (no effect), the pattern this codebase uses for derived state.
  const signature = `${filter}|${query.trim().toLowerCase()}`;
  const [pageState, setPageState] = useState({ sig: signature, page: 1 });
  const canCreate = useCan()("email_marketing.manage").allowed;

  const data = campaigns.data;
  const all = useMemo(
    () =>
      data
        ? [...data].sort((a, b) => CAMPAIGN_STATUS_ORDER.indexOf(a.status) - CAMPAIGN_STATUS_ORDER.indexOf(b.status))
        : [],
    [data],
  );
  const counts = useMemo(() => {
    const map = new Map<CampaignStatus, number>();
    for (const c of all) map.set(c.status, (map.get(c.status) ?? 0) + 1);
    return map;
  }, [all]);
  const shown = useMemo(() => filterCampaigns(all, filter, query), [all, filter, query]);
  const pages = pageCount(shown.length, CAMPAIGNS_PAGE_SIZE);
  const page = pageState.sig === signature ? pageState.page : 1;
  const current = clampPage(page, shown.length, CAMPAIGNS_PAGE_SIZE);
  const visible = useMemo(() => paginate(shown, current, CAMPAIGNS_PAGE_SIZE), [shown, current]);
  const goTo = (next: number) => setPageState({ sig: signature, page: clampPage(next, shown.length, CAMPAIGNS_PAGE_SIZE) });

  if (campaigns.isPending) return <ListSkeleton />;
  if (campaigns.isError) return <QueryErrorState error={campaigns.error} onRetry={() => void campaigns.refetch()} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
          {(["all", ...CAMPAIGN_STATUS_ORDER] as Filter[])
            .filter((f) => f === "all" || counts.has(f))
            .map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  filter === f ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {f === "all" ? `All ${all.length}` : `${campaignChip(f).label} ${counts.get(f)}`}
              </button>
            ))}
        </div>
        <div className="relative ml-auto">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search campaigns…"
            aria-label="Search campaigns by name"
            className="h-8 w-44 pl-8 text-sm sm:w-56"
          />
        </div>
        <RoleGate need="email_marketing.manage">
          <EmLink href={builderHref()} className={cn(buttonVariants({ size: "sm" }))}>
            <Plus aria-hidden />
            New campaign
          </EmLink>
        </RoleGate>
      </div>

      {shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {all.length === 0
            ? canCreate
              ? "No campaigns yet. Start one with New campaign, or accept a slot on the Plan tab."
              : "No campaigns yet."
            : query.trim()
              ? "No campaigns match your search."
              : "No campaigns with this status."}
        </div>
      ) : (
        <>
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {visible.map((c) => {
              const chip = campaignChip(c.status);
              return (
                <li key={c.id}>
                  <EmLink
                    href={`/email-marketing/campaigns/${c.id}`}
                    className="grid gap-x-4 gap-y-1 px-4 py-3 outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:grid-cols-[1fr_auto]"
                  >
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-medium text-foreground">{c.name}</span>
                        <StatusBadge tone={chip.tone}>{chip.label}</StatusBadge>
                        {c.createdBy === "employee" ? <span className="text-[11px] text-muted-foreground">by the employee</span> : null}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {GOALS[c.goal].label} · {formatNumber(c.results?.recipients ?? c.recipientEstimate)} recipients · {strategyLabel(c.strategy)}
                      </span>
                    </span>
                    <span className={cn("text-sm font-semibold tabular-nums sm:text-right", c.results?.profit && c.results.profit.amount < 0 ? "text-destructive" : "text-foreground")}>
                      {outcome(c)}
                    </span>
                  </EmLink>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center justify-between gap-3 pt-1">
            <p className="text-xs text-muted-foreground">
              {pages > 1 ? `Page ${current} of ${pages} · ` : ""}
              {shown.length} {shown.length === 1 ? "campaign" : "campaigns"}
            </p>
            {pages > 1 ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => goTo(current - 1)}
                  disabled={current <= 1}
                  aria-label="Previous page"
                  className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
                >
                  <ChevronLeft className="size-4" /> Prev
                </button>
                <button
                  type="button"
                  onClick={() => goTo(current + 1)}
                  disabled={current >= pages}
                  aria-label="Next page"
                  className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
                >
                  Next <ChevronRight className="size-4" />
                </button>
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
