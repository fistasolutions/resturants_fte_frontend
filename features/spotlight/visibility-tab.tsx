import Link from "next/link";
import { ArrowRight, ExternalLink, Search, TriangleAlert } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  badgeForState,
  indexBadge,
  indexHint,
  indexSummaryLine,
  inspectInSearchConsoleUrl,
  worstState,
  type IndexTone,
} from "@/lib/index-status";
import { cn } from "@/lib/utils";
import type { PostReach, ReachQuery, VisibilityData } from "@/types/spotlight";
import { formatDate, formatNumber } from "@/utils/format";

import { KpiTile } from "./kpi-tile";
import { StrikingDistanceCard } from "./striking-distance-card";
import { GlispIcon } from "@/components/shared/glisp-icon";

/** Unconnected (or configured:false) state — an honest, truthful empty view
 * that deep-links to the Integrations card. Never shows fabricated numbers. */
function ConnectPrompt() {
  return (
    <Card className="gap-4">
      <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
        <span
          className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
          aria-hidden
        >
          <GlispIcon className="size-6" />
        </span>
        <div className="max-w-md space-y-1">
          <p className="text-sm font-medium text-foreground">
            Connect Google Search Console to see real reach
          </p>
          <p className="text-sm text-muted-foreground">
            Once connected, this tab shows measured impressions, clicks, and
            average search position for every published journal post — no
            estimates.
          </p>
        </div>
        <Link
          href="/integrations"
          className="inline-flex items-center gap-1.5 rounded-[10px] bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Connect in Integrations
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </CardContent>
    </Card>
  );
}

/** Connected but Search Console has returned no measured data yet. */
function AwaitingData({ windowDays }: { windowDays: number }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <span className="text-muted-foreground" aria-hidden>
          <Search className="size-8" />
        </span>
        <div className="max-w-md space-y-1">
          <p className="text-sm font-medium text-foreground">
            No measured reach yet
          </p>
          <p className="text-sm text-muted-foreground">
            Google Search Console is connected, but hasn&apos;t reported reach for
            your published posts over the last {windowDays} days. New data lands
            after the next sync.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function TopPostsCard({
  posts,
  propertyUrl,
}: {
  posts: PostReach[];
  propertyUrl: string | null;
}) {
  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>Published posts</CardTitle>
        <p className="text-sm text-muted-foreground">
          Measured organic reach per journal post, and whether Google has indexed it.
        </p>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Post</TableHead>
              <TableHead>Index</TableHead>
              <TableHead className="text-right">Impressions</TableHead>
              <TableHead className="text-right">Clicks</TableHead>
              <TableHead className="pr-4 text-right">Avg. position</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((post) => (
              <TableRow key={post.draftId}>
                <TableCell className="pl-4 whitespace-normal">
                  {post.liveUrl ? (
                    <a
                      href={post.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-start gap-1 font-medium text-foreground hover:underline"
                    >
                      {post.title}
                      <ExternalLink
                        className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                    </a>
                  ) : (
                    <span className="font-medium text-foreground">{post.title}</span>
                  )}
                </TableCell>
                <TableCell className="whitespace-normal">
                  <div className="flex flex-col items-start gap-1">
                    <IndexPill post={post} />
                    {post.index?.lastCrawlTime && (
                      <span className="text-[11px] text-muted-foreground">
                        Crawled {formatDate(post.index.lastCrawlTime)}
                      </span>
                    )}
                    {post.liveUrl && post.index && post.index.state !== "indexed" && (
                      <a
                        href={inspectInSearchConsoleUrl(propertyUrl, post.liveUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                      >
                        Inspect in Search Console
                        <ExternalLink className="size-3" aria-hidden />
                      </a>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(post.impressions)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(post.clicks)}
                </TableCell>
                <TableCell className="pr-4 text-right tabular-nums">
                  {post.position.toFixed(1)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function TopQueriesCard({ queries }: { queries: ReachQuery[] }) {
  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>Top search queries</CardTitle>
        <p className="text-sm text-muted-foreground">
          The searches bringing people to your journal, by impressions.
        </p>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Query</TableHead>
              <TableHead className="text-right">Impressions</TableHead>
              <TableHead className="pr-4 text-right">Clicks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {queries.map((query) => (
              <TableRow key={query.query}>
                <TableCell className="pl-4 whitespace-normal font-medium text-foreground">
                  {query.query}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(query.impressions)}
                </TableCell>
                <TableCell className="pr-4 text-right tabular-nums">
                  {formatNumber(query.clicks)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

/**
 * Spotlight Visibility tab (backend SPEC-119). Real Google Search Console reach
 * for published posts, or an honest connect prompt when Google isn't linked.
 * KPI tiles are pure display roll-ups of the returned posts (no prior-period
 * baseline is served, so they carry no deltas) — numbers are never fabricated
 * (root Rule 8).
 */
export function VisibilityTab({ data }: { data: VisibilityData }) {
  if (!data.connected) return <ConnectPrompt />;

  const measuredPosts = data.posts
    .filter((post) => !post.estimated)
    .sort((a, b) => b.impressions - a.impressions);

  if (data.totals.measured === 0) {
    return <AwaitingData windowDays={data.windowDays} />;
  }

  const postsTotal =
    data.indexSummary.indexed + data.indexSummary.notIndexed + data.indexSummary.uninspected;
  const kpis = [
    { id: "impressions", label: "Impressions", value: formatNumber(data.totals.impressions) },
    { id: "clicks", label: "Clicks", value: formatNumber(data.totals.clicks) },
    {
      id: "position",
      label: "Avg. position",
      value:
        data.totals.avgPosition !== null ? data.totals.avgPosition.toFixed(1) : "—",
    },
    {
      id: "indexed",
      label: "Indexed by Google",
      value: `${data.indexSummary.indexed} of ${postsTotal}`,
    },
  ];

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground">
        Measured over the last {data.windowDays} days
        {data.propertyUrl ? ` · ${data.propertyUrl}` : ""}
        {data.lastPull ? ` · synced ${formatDate(data.lastPull)}` : ""}
      </p>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiTile key={kpi.id} label={kpi.label} value={kpi.value} />
        ))}
      </div>

      <IndexCallout data={data} />

      <TopPostsCard posts={measuredPosts} propertyUrl={data.propertyUrl} />

      <StrikingDistanceCard />

      {data.topQueries.length > 0 && <TopQueriesCard queries={data.topQueries} />}
    </div>
  );
}

const TONE_CLASS: Record<IndexTone, string> = {
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  muted: "bg-muted text-muted-foreground",
  destructive: "bg-destructive/10 text-destructive",
};

function IndexPill({ post }: { post: PostReach }) {
  const badge = indexBadge(post.index);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        TONE_CLASS[badge.tone],
      )}
      title={post.index?.coverageState || undefined}
    >
      {badge.label}
    </span>
  );
}

/** Why the numbers look the way they do (SPEC-261): how many posts Google has
 * indexed, and the next step for the most urgent state present. Silent when
 * every post is indexed and earning impressions. */
function IndexCallout({ data }: { data: VisibilityData }) {
  const worst = worstState(data.posts.map((post) => post.index?.state ?? null));
  const allIndexed = data.indexSummary.notIndexed === 0 && data.indexSummary.uninspected === 0;
  if (allIndexed && data.totals.impressions > 0) return null;
  const tone: IndexTone = allIndexed ? "success" : badgeForState(worst).tone;
  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-3 rounded-card border p-4",
        tone === "warning" && "border-warning/30 bg-warning/10",
        tone === "destructive" && "border-destructive/30 bg-destructive/10",
        tone === "success" && "border-success/30 bg-success/10",
        tone === "muted" && "border-border bg-muted/40",
      )}
    >
      <TriangleAlert
        className={cn(
          "mt-0.5 size-4 shrink-0",
          tone === "warning" && "text-warning",
          tone === "destructive" && "text-destructive",
          tone === "success" && "text-success",
          tone === "muted" && "text-muted-foreground",
        )}
        aria-hidden
      />
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-medium text-foreground">{indexSummaryLine(data.indexSummary)}</p>
        <p className="text-xs text-muted-foreground">
          {allIndexed ? indexHint("indexed") : indexHint(worst)}
        </p>
      </div>
    </div>
  );
}
