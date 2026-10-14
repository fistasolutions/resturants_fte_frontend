import { formatNumber } from "@/utils/format";
import type { GorgiasChannelBreakdown, GorgiasReasonBreakdown } from "@/types/gorgias";

interface Row {
  label: string;
  count: number;
}

function BreakdownCard({
  title,
  rows,
  showShare = false,
}: {
  title: string;
  rows: Row[];
  /** Show each row's share of the total (the driver mix, SPEC-096 ②). */
  showShare?: boolean;
}) {
  const total = rows.reduce((acc, r) => acc + r.count, 0);
  const top = rows.slice(0, 6);
  const max = top.reduce((acc, r) => Math.max(acc, r.count), 0) || 1;
  return (
    <div className="rounded-card bg-card p-4 ring-1 ring-foreground/10">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {top.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No data in this range.</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {top.map((row) => (
            <li key={row.label} className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate text-foreground">{row.label}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {showShare && total > 0 ? (
                    <>
                      <span className="text-foreground">
                        {Math.round((row.count / total) * 100)}%
                      </span>{" "}
                      <span className="text-muted-foreground">
                        ({formatNumber(row.count)})
                      </span>
                    </>
                  ) : (
                    formatNumber(row.count)
                  )}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary/60"
                  style={{ width: `${Math.round((row.count / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Overview breakdowns (SPEC-094 + SPEC-096): top contact reasons (the driver
 * mix, with share-of-total %) + channel mix, each a ranked bar list. */
export function OverviewBreakdowns({
  reasons,
  channels,
}: {
  reasons: GorgiasReasonBreakdown[];
  channels: GorgiasChannelBreakdown[];
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <BreakdownCard
        title="Top contact reasons"
        rows={reasons.map((r) => ({ label: r.reason, count: r.count }))}
        showShare
      />
      <BreakdownCard
        title="Channels"
        rows={channels.map((c) => ({ label: c.channel, count: c.count }))}
      />
    </div>
  );
}
