"use client";

import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { KpiTile } from "@/features/ads/kpi-tile";
import { RULE_LABEL, SEVERITY, multiple, percent } from "@/lib/ad-platforms";
import { cn } from "@/lib/utils";
import type { AdAudit, AdPerformance } from "@/types/ad-platforms";
import { formatCurrency, formatNumber } from "@/utils/format";

/**
 * What the real account looks like (SPEC-333): the money strip, the findings with the spend
 * at risk, and the campaign and ad tables. Presentational — every figure arrives computed
 * by the backend (SPEC-342).
 */
export function MoneyStrip({ data }: { data: AdPerformance }) {
  const t = data.totals;
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      <KpiTile label="Spend" value={formatCurrency(t.spend)} hint={`${data.days} days`} />
      <KpiTile label="Purchases" value={formatNumber(t.purchases)} hint={`${formatCurrency(t.revenue)} revenue (Meta)`} />
      <KpiTile label="ROAS" value={multiple(t.roas)} hint="Meta-attributed revenue ÷ spend" />
      <KpiTile label="Cost per purchase" value={t.cpa == null ? "—" : formatCurrency(t.cpa)} />
      <KpiTile
        label="MER"
        value={multiple(data.mer.value)}
        hint={data.mer.value == null ? (data.mer.reason ?? undefined) : "your store's net sales ÷ ad spend"}
      />
      <KpiTile label="CTR" value={percent(t.ctr, 2)} hint="link clicks ÷ impressions" />
      <KpiTile label="CPM" value={t.cpm == null ? "—" : formatCurrency(t.cpm)} hint="cost per 1,000 impressions" />
      <KpiTile label="CPC" value={t.cpc == null ? "—" : formatCurrency(t.cpc)} />
      <KpiTile label="Frequency" value={t.frequency == null ? "—" : t.frequency.toFixed(2)} hint="impressions ÷ reach, per day" />
      <KpiTile label="Hook rate" value={percent(t.hookRate)} hint="3-second video plays ÷ impressions" />
    </div>
  );
}

export function Findings({ audit }: { audit: AdAudit }) {
  return (
    <Card className="gap-0 overflow-hidden p-0">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">Audit findings</h2>
        <span className="text-xs text-muted-foreground">
          {audit.findings.length} {audit.findings.length === 1 ? "finding" : "findings"} · last {audit.days} days
        </span>
        <span className="ml-auto text-sm">
          Spend at risk <b className={cn("tabular-nums", audit.atRisk > 0 && "text-destructive")}>{formatCurrency(audit.atRisk)}</b>
          <span className="text-muted-foreground"> of {formatCurrency(audit.spend)}</span>
        </span>
      </div>
      {audit.findings.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">
          No problems found in the last {audit.days} days.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {audit.findings.map((f, index) => {
            const severity = SEVERITY[f.severity];
            return (
              <li key={`${f.rule}-${f.name}-${index}`} className="grid gap-1 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge tone={severity.tone}>{severity.label}</StatusBadge>
                    <span className="text-sm font-semibold">{f.title}</span>
                    <span className="text-xs text-muted-foreground">{RULE_LABEL[f.rule]}</span>
                  </div>
                  <p className="text-sm">
                    <span className="font-medium">{f.name}</span>
                    {f.campaignName && <span className="text-muted-foreground"> · {f.campaignName}</span>}
                  </p>
                  <p className="text-sm text-muted-foreground">{f.evidence}</p>
                  <p className="text-sm">
                    <span className="font-medium">Do this:</span> {f.action}
                  </p>
                </div>
                <div className="text-right text-sm tabular-nums">
                  {f.wasted > 0 ? (
                    <>
                      <b className="text-destructive">{formatCurrency(f.wasted)}</b>
                      <span className="block text-xs text-muted-foreground">at risk</span>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">no direct cost</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

const TH = "px-3 py-2 text-left text-[10px] font-extrabold uppercase tracking-widest whitespace-nowrap text-muted-foreground";
const NUM = "px-3 py-2 text-right tabular-nums whitespace-nowrap";

export function CampaignTable({ data }: { data: AdPerformance }) {
  return (
    <Card className="gap-0 overflow-hidden p-0">
      <h2 className="border-b border-border px-4 py-3 text-sm font-semibold">Campaigns</h2>
      {data.campaigns.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">No campaign spent in this window.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr>
                <th className={TH}>Campaign</th>
                <th className={cn(TH, "text-right")}>Spend</th>
                <th className={cn(TH, "text-right")}>Purchases</th>
                <th className={cn(TH, "text-right")}>ROAS</th>
                <th className={cn(TH, "text-right")}>CPA</th>
                <th className={cn(TH, "text-right")}>CTR</th>
                <th className={cn(TH, "text-right")}>Frequency</th>
              </tr>
            </thead>
            <tbody>
              {data.campaigns.map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <span className="font-medium">{c.name}</span>
                    <span className="block text-xs text-muted-foreground">{c.status.toLowerCase().replace(/_/g, " ")}</span>
                  </td>
                  <td className={NUM}>{formatCurrency(c.spend)}</td>
                  <td className={NUM}>{formatNumber(c.purchases)}</td>
                  <td className={cn(NUM, c.roas != null && c.roas < 1 && "text-destructive")}>{multiple(c.roas)}</td>
                  <td className={NUM}>{c.cpa == null ? "—" : formatCurrency(c.cpa)}</td>
                  <td className={NUM}>{percent(c.ctr, 2)}</td>
                  <td className={NUM}>{c.frequency == null ? "—" : c.frequency.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

export function AdTable({ data }: { data: AdPerformance }) {
  return (
    <Card className="gap-0 overflow-hidden p-0">
      <h2 className="border-b border-border px-4 py-3 text-sm font-semibold">Ads</h2>
      {data.ads.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">No ad spent in this window.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead>
              <tr>
                <th className={TH}>Ad</th>
                <th className={cn(TH, "text-right")}>Spend</th>
                <th className={cn(TH, "text-right")}>Purchases</th>
                <th className={cn(TH, "text-right")}>ROAS</th>
                <th className={cn(TH, "text-right")}>CTR</th>
                <th className={cn(TH, "text-right")}>Hook rate</th>
              </tr>
            </thead>
            <tbody>
              {data.ads.map((ad) => (
                <tr key={ad.id} className="border-t border-border align-top">
                  <td className="px-3 py-2">
                    <div className="flex min-w-0 gap-3">
                      {ad.thumbnail ? (
                        // A platform-hosted creative thumbnail; its URL is short-lived and
                        // external, so a plain image is right here.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={ad.thumbnail} alt="" className="size-12 shrink-0 rounded-lg border border-border object-cover" />
                      ) : (
                        <span className="grid size-12 shrink-0 place-items-center rounded-lg border border-border bg-muted text-[10px] text-muted-foreground">
                          {ad.isVideo ? "Video" : "Ad"}
                        </span>
                      )}
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{ad.name}</span>
                        {ad.title && <span className="block truncate text-xs">{ad.title}</span>}
                        {ad.body && <span className="block max-w-md truncate text-xs text-muted-foreground">{ad.body}</span>}
                      </span>
                    </div>
                  </td>
                  <td className={NUM}>{formatCurrency(ad.spend)}</td>
                  <td className={NUM}>{formatNumber(ad.purchases)}</td>
                  <td className={cn(NUM, ad.roas != null && ad.roas < 1 && "text-destructive")}>{multiple(ad.roas)}</td>
                  <td className={NUM}>{percent(ad.ctr, 2)}</td>
                  <td className={NUM}>{ad.isVideo ? percent(ad.hookRate) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
