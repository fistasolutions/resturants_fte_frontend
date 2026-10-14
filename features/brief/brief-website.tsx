"use client";

import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";

import { BriefDot, BriefPanel, BriefRow } from "@/features/brief/brief-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiQuery } from "@/hooks/use-api-query";
import { FRICTION_LABEL, frictionBand } from "@/lib/clarity";
import { WEBSITE_ROOT, brokeChip, brokeLine, frictionPageHref } from "@/lib/clarity-friction";
import { clarityQueries } from "@/lib/queries/clarity";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate, formatNumber } from "@/utils/format";

const BAND_TONE = {
  severe: "bg-destructive/10 text-destructive",
  notable: "bg-warning/15 text-warning",
  minor: "bg-muted text-muted-foreground",
} as const;

/**
 * Morning Brief → "Website · what broke yesterday" (SPEC-284, backend SPEC-281):
 * the money pages whose friction is new or doubled on Clarity's latest day, three
 * at most, revenue first — and the quiet line for everything else. Fetched on its
 * own (SPEC-230) so it never blocks the Brief; not rendered at all when Clarity
 * has nothing yet. Every figure is backend-computed (Rule 8).
 */
export function BriefWebsite() {
  const broke = useApiQuery(clarityQueries.brokeYesterday());

  if (broke.isError) return null;

  const aside = (
    <Link
      href={WEBSITE_ROOT}
      className="inline-flex items-center gap-0.5 rounded outline-none underline-offset-2 hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring"
    >
      Website <ArrowRight className="size-3" aria-hidden />
    </Link>
  );

  if (broke.isPending) {
    return (
      <BriefPanel title="Website · what broke yesterday" aside={aside}>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-2">
            <Skeleton className="size-2 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-48" />
              <Skeleton className="h-3 w-72 max-w-full" />
            </div>
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </BriefPanel>
    );
  }

  const data = broke.data;
  if (!data.connected) return null;
  const count = data.pages.length > 0 ? `${data.pages.length} · ${formatCurrency(data.totalRevenue)} behind them` : undefined;

  return (
    <BriefPanel
      title="Website · what broke yesterday"
      count={count}
      aside={
        <>
          {data.capturedOn ? <span>Clarity to {formatDate(data.capturedOn)}</span> : null}
          {aside}
        </>
      }
    >
      {data.pages.map((page) => {
        const band = frictionBand(page.frictionEvents, page.sessions);
        return (
          <BriefRow
            key={page.handle}
            className="py-2"
            leading={<BriefDot tone={band === "severe" ? "error" : band === "notable" ? "warn" : "neutral"} />}
            trailing={
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-sm font-semibold tabular-nums">{formatCurrency(page.revenue90d)}</p>
                  <p className="text-[11px] text-muted-foreground">{formatNumber(page.units90d)} sold · 90d</p>
                </div>
                {page.clarity ? (
                  <a
                    href={page.clarity.recordings}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    <ExternalLink className="size-3.5" aria-hidden />
                    Watch
                  </a>
                ) : null}
              </div>
            }
          >
            <div className="flex flex-wrap items-center gap-1.5">
              <Link href={frictionPageHref(page.handle)} className="text-sm font-medium underline-offset-4 hover:underline">
                {page.title}
              </Link>
              <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-semibold", BAND_TONE[band])}>{FRICTION_LABEL[band]}</span>
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">{brokeChip(page)}</span>
            </div>
            <p className="text-xs text-muted-foreground">{brokeLine(page, data.capturedOn, formatDate)}</p>
          </BriefRow>
        );
      })}
      <BriefRow className="bg-muted/40 py-2" leading={<BriefDot tone="ok" />}>
        <p className="text-sm">{data.pages.length === 0 ? "Nothing broke on a money page yesterday." : "Everything else is quiet."}</p>
        <p className="text-xs text-muted-foreground">
          {data.others > 0
            ? `${formatNumber(data.others)} other product ${data.others === 1 ? "page" : "pages"} had friction below this line${data.othersMaxRevenue > 0 ? ` — the biggest earns ${formatCurrency(data.othersMaxRevenue)} over 90 days` : ""}; all of them are on Website.`
            : "No other product page recorded friction."}
        </p>
      </BriefRow>
    </BriefPanel>
  );
}
