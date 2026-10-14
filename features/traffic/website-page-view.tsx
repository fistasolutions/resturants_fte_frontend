"use client";

import Link from "next/link";
import { ChevronRight, ExternalLink } from "lucide-react";

import { KpiStrip } from "@/components/shared/kpi-strip";
import { PageHeader } from "@/components/shared/page-header";
import { Panel, PanelRow } from "@/components/shared/panel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrafficError } from "@/features/traffic/traffic-error";
import { WebsiteFrictionChart } from "@/features/traffic/website-friction-chart";
import { IssueRow } from "@/features/traffic/website-friction-view";
import { useApiQuery } from "@/hooks/use-api-query";
import { ApiError } from "@/lib/api-error";
import { FRICTION_LABEL, frictionBand } from "@/lib/clarity";
import { WEBSITE_ROOT, frictionRate, issueLines, pluralise } from "@/lib/clarity-friction";
import type { StripTile } from "@/lib/kpi-strip";
import { clarityQueries } from "@/lib/queries/clarity";
import type { ClarityFrictionDetail } from "@/types/clarity";
import { formatCurrency, formatDate, formatNumber } from "@/utils/format";

function Breadcrumb({ current }: { current: string }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
      <Link href="/traffic" className="transition-colors hover:text-foreground">
        Store Traffic
      </Link>
      <ChevronRight className="size-3.5" aria-hidden />
      <Link href={WEBSITE_ROOT} className="transition-colors hover:text-foreground">
        Website
      </Link>
      <ChevronRight className="size-3.5" aria-hidden />
      <span className="max-w-[60ch] truncate font-medium text-foreground" aria-current="page">
        {current}
      </span>
    </nav>
  );
}

function tiles(data: ClarityFrictionDetail): StripTile[] {
  const p = data.page;
  const band = frictionBand(p.frictionEvents, p.sessions);
  return [
    { key: "sessions", label: "Sessions", value: formatNumber(p.sessions), delta: null, invertDelta: false, sub: `last ${data.windowDays} days`, tone: "neutral" },
    { key: "friction", label: "Friction events", value: formatNumber(p.frictionEvents), delta: null, invertDelta: true, sub: "rage · dead · script · error clicks", tone: band === "severe" ? "bad" : band === "notable" ? "warn" : "neutral" },
    { key: "rate", label: "Per 100 sessions", value: String(frictionRate(p)), delta: null, invertDelta: true, sub: FRICTION_LABEL[band], tone: band === "severe" ? "bad" : band === "notable" ? "warn" : "neutral" },
    { key: "revenue", label: `Revenue · ${data.revenueDays}d`, value: formatCurrency(p.revenue90d), delta: null, invertDelta: false, sub: `${formatNumber(p.units90d)} sold`, tone: "neutral" },
  ];
}

/**
 * One product page's friction (SPEC-282): the site's breadcrumb, the header, four
 * tiles, every issue Clarity recorded with its link, the 30-day chart, the days and
 * the storefront paths. Read from the client cache (SPEC-230); passed bare by the
 * Traffic shell like the store detail.
 */
export function WebsitePageView({ handle }: { handle: string }) {
  const detail = useApiQuery(clarityQueries.frictionPage(handle));

  if (detail.isPending) {
    return (
      <main className="min-w-0 flex-1 space-y-5 p-4 md:p-6">
        <Breadcrumb current="Page" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-72 max-w-full" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </main>
    );
  }
  if (detail.isError) {
    const missing = detail.error instanceof ApiError && detail.error.status === 404;
    return (
      <main className="min-w-0 flex-1 space-y-5 p-4 md:p-6">
        <Breadcrumb current={handle} />
        {missing ? (
          <div className="rounded-card border border-dashed border-border p-6 text-sm text-muted-foreground">
            Clarity has not recorded this page in the last 30 days.{" "}
            <Link href={WEBSITE_ROOT} className="font-medium text-primary hover:underline">
              Back to the list
            </Link>
          </div>
        ) : (
          <TrafficError />
        )}
      </main>
    );
  }

  const data = detail.data;
  const page = data.page;
  const lines = issueLines(page);
  const days = [...data.days].reverse();

  return (
    <main className="min-w-0 flex-1 space-y-5 p-4 md:p-6" data-website-page={handle}>
      <Breadcrumb current={page.title} />
      <PageHeader
        title={page.title}
        description={`${page.path} · Clarity's last ${data.windowDays} days${data.capturedOn ? `, captured to ${formatDate(data.capturedOn)}` : ""}.`}
        actions={
          page.clarity ? (
            <Button asChild variant="outline" size="sm">
              <a href={page.clarity.recordings} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-3.5" aria-hidden /> Watch in Clarity
              </a>
            </Button>
          ) : undefined
        }
      />

      {/* ✦ on every tile (SPEC-284): the analyst has `get_website_friction` for these figures */}
      <KpiStrip tiles={tiles(data)} label={`${page.title} — friction at a glance`} />

      <Panel title="What Clarity recorded" count={`${lines.length} ${lines.length === 1 ? "kind" : "kinds"}`}>
        {lines.length === 0 ? (
          <PanelRow>
            <p className="text-sm text-muted-foreground">No friction on this page in the window.</p>
          </PanelRow>
        ) : (
          <PanelRow>
            <ul className="divide-y divide-border">
              {lines.map((line) => (
                <IssueRow key={line.key} line={line} windowDays={data.windowDays} />
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">
              Clarity&apos;s export carries counts, not which script failed — the recordings show that, and every link above opens them filtered to this page.
            </p>
          </PanelRow>
        )}
      </Panel>

      <Panel title="By day" count={`${days.length} ${days.length === 1 ? "day" : "days"}`}>
        {data.days.length >= 2 ? (
          <PanelRow>
            <WebsiteFrictionChart days={data.days} />
          </PanelRow>
        ) : (
          <PanelRow>
            <p className="text-xs text-muted-foreground">One day captured so far — the chart draws itself as the nightly pulls land.</p>
          </PanelRow>
        )}
        {days.map((d) => (
          <PanelRow
            key={d.capturedOn}
            align="center"
            trailing={
              <span className="text-sm font-semibold tabular-nums">{pluralise(d.frictionEvents, "friction event")}</span>
            }
          >
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
              <span className="text-sm font-medium">{formatDate(d.capturedOn)}</span>
              <span className="text-xs text-muted-foreground">
                {pluralise(d.sessions, "session")} · scroll {Math.round(d.avgScrollDepth * 100)}%
                {d.rageClicks ? ` · ${pluralise(d.rageClicks, "rage click")}` : ""}
                {d.deadClicks ? ` · ${pluralise(d.deadClicks, "dead click")}` : ""}
                {d.scriptErrors ? ` · ${pluralise(d.scriptErrors, "script error")}` : ""}
                {d.errorClicks ? ` · ${pluralise(d.errorClicks, "error click")}` : ""}
                {d.quickBacks ? ` · ${pluralise(d.quickBacks, "quick-back")}` : ""}
              </span>
            </div>
          </PanelRow>
        ))}
      </Panel>

      <Panel title="Where visitors saw it" count={`${data.paths.length} ${data.paths.length === 1 ? "path" : "paths"}`}>
        {data.paths.map((p) => (
          <PanelRow
            key={p.path}
            align="center"
            trailing={
              <span className="text-xs text-muted-foreground">
                {pluralise(p.sessions, "session")} · {pluralise(p.frictionEvents, "event")}
              </span>
            }
          >
            <span className="text-sm break-all">{p.path}</span>
          </PanelRow>
        ))}
      </Panel>
    </main>
  );
}
