import Link from "next/link";
import { ArrowRight, Plug } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { barRows, funnelStages } from "@/lib/social-performance";
import { ComingSoonTiles } from "./coming-soon-tiles";
import {
  engagementRows,
  isUnreported,
  metricLabel,
} from "@/lib/social-publish";
import type { PerformanceData, SocialAttribution } from "@/types/social";
import { formatCurrency, formatNumber } from "@/utils/format";

import { KpiTile } from "./kpi-tile";
import { ChannelBadge, ReasonChip } from "./social-pills";

/* ── Attribution — the headline value ─────────────────────────────────── */

function AttributionCard({ attribution }: { attribution: SocialAttribution }) {
  const { windowDays, attributedOrders, attributedRevenue, topPosts } = attribution;
  const window = `Trailing ${windowDays} days`;
  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>Revenue from social</CardTitle>
        <p className="text-sm text-muted-foreground">
          Sales credited to your posts through their tracked links · {window.toLowerCase()}.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <KpiTile
            label="Attributed revenue"
            value={formatCurrency(attributedRevenue)}
            hint={window}
          />
          <KpiTile
            label="Attributed orders"
            value={formatNumber(attributedOrders)}
            hint={window}
          />
        </div>
        {topPosts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <p className="text-sm font-medium text-foreground">No attributed sales yet</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              Attribution starts when your tracked links go live and shoppers buy
              through them.
            </p>
          </div>
        ) : (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Top attributed posts
            </p>
            <div className="scrollbar-subtle overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Post</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="pr-4 text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topPosts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="pl-4 font-medium whitespace-normal text-foreground">
                        {post.productName}
                      </TableCell>
                      <TableCell>
                        <ChannelBadge channel={post.channel} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(post.attributedOrders)}
                      </TableCell>
                      <TableCell className="pr-4 text-right tabular-nums">
                        {formatCurrency(post.attributedRevenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Funnel ───────────────────────────────────────────────────────────── */

function FunnelCard({ funnel }: { funnel: PerformanceData["funnel"] }) {
  const stages = funnelStages(funnel);
  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>Content pipeline</CardTitle>
        <p className="text-sm text-muted-foreground">
          Every post from generated to published — and where the pipeline stands now.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {stages.map((stage) => (
          <div key={stage.key} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">{stage.label}</span>
              <span className="tabular-nums text-muted-foreground">
                {formatNumber(stage.count)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${stage.percent}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/* ── Breakdowns ───────────────────────────────────────────────────────── */

function ChannelBreakdownCard({ byChannel }: { byChannel: PerformanceData["byChannel"] }) {
  const rows = barRows(byChannel, (c) => c.count);
  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>By channel</CardTitle>
        <p className="text-sm text-muted-foreground">Where your content is headed.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No content generated yet.</p>
        ) : (
          rows.map(({ item, percent }) => (
            <div key={item.channel} className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <ChannelBadge channel={item.channel} />
                <span className="text-sm tabular-nums text-muted-foreground">
                  {formatNumber(item.count)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary/80"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function ContentMixCard({ contentMix }: { contentMix: PerformanceData["contentMix"] }) {
  const rows = barRows(contentMix, (c) => c.count);
  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>Content mix</CardTitle>
        <p className="text-sm text-muted-foreground">Why each post was picked.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No content generated yet.</p>
        ) : (
          rows.map(({ item, percent }) => (
            <div key={item.reason} className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <ReasonChip reason={item.reason} />
                <span className="text-sm tabular-nums text-muted-foreground">
                  {formatNumber(item.count)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary/80"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

/* ── Reach & engagement — gated, never fabricated ─────────────────────── */

function ReachSection({
  connected,
  engagement,
}: {
  connected: boolean;
  engagement: PerformanceData["engagement"];
}) {
  if (!connected) {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-card border border-warning/30 bg-warning/10 p-4">
        <Plug className="size-4 shrink-0 text-warning" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">
            Connect Instagram/TikTok to unlock reach &amp; engagement
          </p>
          <p className="text-xs text-muted-foreground">
            Reach, impressions, and engagement come from each platform&apos;s API — we
            show measured numbers only, never estimates.
          </p>
        </div>
        <Link
          href="/integrations"
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-foreground underline underline-offset-4"
        >
          Connect a channel
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>
    );
  }
  if (engagement.measuredPosts === 0) {
    // Connected but nothing measured yet — a distinct state from "not connected"
    // and from "measured zero". Saying which one it is prevents a support ticket.
    return (
      <Card className="gap-2 px-6 py-8 text-center">
        <p className="text-sm font-medium text-foreground">Reach &amp; engagement</p>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          Nothing measured yet. Posts published today report their first numbers
          tomorrow morning.
        </p>
      </Card>
    );
  }

  const rows = engagementRows(engagement.totals);

  return (
    <Card className="gap-4 px-4 py-4">
      <div>
        <p className="text-sm font-semibold text-foreground">Reach &amp; engagement</p>
        <p className="text-xs text-muted-foreground">
          Measured from Meta across {engagement.measuredPosts} published{" "}
          {engagement.measuredPosts === 1 ? "post" : "posts"}. A dash means the
          platform didn&apos;t report that metric — never a zero.
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {rows.map((row) => (
          <div key={row.key} className="space-y-0.5">
            <dt className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
              {row.label}
            </dt>
            <dd
              className={
                isUnreported(row.value)
                  ? "text-lg font-semibold tabular-nums text-muted-foreground"
                  : "text-lg font-semibold tabular-nums text-foreground"
              }
              title={isUnreported(row.value) ? "Not reported by the platform" : undefined}
            >
              {metricLabel(row.value)}
            </dd>
          </div>
        ))}
      </dl>

      {engagement.topPosts.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-2 text-xs font-medium text-muted-foreground">Post</th>
                <th className="pb-2 text-right text-xs font-medium text-muted-foreground">
                  Reach
                </th>
                <th className="pb-2 text-right text-xs font-medium text-muted-foreground">
                  Likes
                </th>
                <th className="pb-2 text-right text-xs font-medium text-muted-foreground">
                  Saves
                </th>
              </tr>
            </thead>
            <tbody>
              {engagement.topPosts.map((topPost) => (
                <tr key={topPost.id} className="border-b border-border/60 last:border-0">
                  <td className="py-2 pr-3">
                    {topPost.permalink ? (
                      <a
                        href={topPost.permalink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary underline-offset-4 hover:underline"
                      >
                        {topPost.productName}
                      </a>
                    ) : (
                      <span className="font-medium text-foreground">
                        {topPost.productName}
                      </span>
                    )}
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {metricLabel(topPost.reach)}
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {metricLabel(topPost.likes)}
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {metricLabel(topPost.saves)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

export function PerformanceTab({ data }: { data: PerformanceData }) {
  return (
    <div className="space-y-6">
      <AttributionCard attribution={data.attribution} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <FunnelCard funnel={data.funnel} />
        <div className="space-y-4">
          <ChannelBreakdownCard byChannel={data.byChannel} />
          <ContentMixCard contentMix={data.contentMix} />
        </div>
      </div>

      <ReachSection connected={data.platformConnected} engagement={data.engagement} />

      {/* SPEC-172 — the deliberately-deferred surface, on the wall rather than
          absent, so the roadmap reads as decisions instead of gaps. */}
      <ComingSoonTiles />
    </div>
  );
}
