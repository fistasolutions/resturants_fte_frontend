"use client";

import { BriefCoverage } from "@/features/brief/brief-coverage";
import { BriefPanel } from "@/features/brief/brief-panel";
import { BriefPredictions } from "@/features/brief/brief-predictions";
import { BriefSkeleton } from "@/features/brief/brief-skeleton";
import { BriefStrip } from "@/features/brief/brief-strip";
import { BriefWebsite } from "@/features/brief/brief-website";
import { BriefTrustBar } from "@/features/brief/brief-trust-bar";
import { DecisionList } from "@/features/brief/decision-list";
import { NeedsMordyAttention } from "@/features/brief/needs-mordy-attention";
import { NoDecisionsState } from "@/features/brief/no-decisions-state";
import { OvernightWatch } from "@/features/brief/overnight-watch";
import { useApiQuery } from "@/hooks/use-api-query";
import { ApiError } from "@/lib/api-error";
import { buildBriefStrip } from "@/lib/brief-strip";
import type { CompareMode, ResolvedRange } from "@/lib/date-range";
import { briefQueries } from "@/lib/queries/brief";
import { storeTimeZone } from "@/utils/format";

interface BriefViewProps {
  /** An archived day to show read-only, or null for today's live brief. */
  requestedDate: string | null;
  range: ResolvedRange;
  compare: CompareMode;
  /** "Jul 31, 2026" — the actual compared-against range, or null for compare=none. */
  comparePeriodLabel: string | null;
}

/**
 * The Morning Brief, read from the client cache (SPEC-230), laid out as a KPI strip
 * over two columns (SPEC-231): decisions and attention on the left, the things you
 * only glance at — overnight watch, predictions, integration health — on the right.
 *
 * The page prefetches the same three queries on the server and streams them in; this
 * component only observes the cache. First visit: `isPending` → the same skeleton the
 * route's `loading.tsx` showed. Revisit: cached data paints at once and the streamed
 * refresh patches it in place. A history or attention failure degrades that one section
 * (the old `allSettled` contract); only the brief itself failing shows the error copy.
 */
export function BriefView({
  requestedDate,
  range,
  compare,
  comparePeriodLabel,
}: BriefViewProps) {
  const isArchive = requestedDate !== null;

  const brief = useApiQuery(
    requestedDate
      ? briefQueries.byDate(requestedDate)
      : briefQueries.data({ from: range.from, to: range.to, compare }),
  );
  // "Needs Attention" is always live "right now" — skipped entirely in the frozen
  // archive view (SPEC-104): no fetch, not just no render.
  const attention = useApiQuery(briefQueries.attention(), { enabled: !isArchive });

  if (brief.isPending) return <BriefSkeleton />;

  if (brief.isError) {
    const err = brief.error;
    const message =
      err instanceof ApiError
        ? `Could not load brief (${err.status}) — try refreshing.`
        : "Could not load brief — check your connection and try again.";
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-sm text-destructive">{message}</p>
      </div>
    );
  }

  const data = brief.data;
  // null when skipped (archive) or the fetch failed — the section handles both.
  const attentionData = attention.data ?? null;
  const tiles = buildBriefStrip(data, attentionData);

  // Current date shown in picker — prefer the snapshot's yesterday date
  const displayDate = data.yesterday.date;

  return (
    <div className="space-y-4">
      {/* Archive notice */}
      {isArchive && (
        <div className="rounded-lg border border-border bg-muted/40 px-4 py-2">
          <p className="text-xs text-muted-foreground">
            Viewing archived brief for{" "}
            <span className="font-semibold text-foreground">
              {new Date(displayDate + "T00:00:00").toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </span>
            {" — "}actions shown are read-only.
          </p>
        </div>
      )}

      {/* KPI strip — yesterday's numbers the payload always carried (SPEC-231) */}
      <BriefStrip tiles={tiles} />

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-5">
        {/* Main column: what needs a decision, then what needs a look */}
        <div className="min-w-0 space-y-4 lg:col-span-3">
          <BriefPanel
            title={isArchive ? "Decisions That Day" : "Today's Decisions"}
            count={data.decisions.length > 0 ? String(data.decisions.length) : undefined}
          >
            {data.decisions.length === 0 ? (
              <NoDecisionsState />
            ) : (
              <DecisionList
                decisions={data.decisions}
                preparedAt={data.generated_at}
                readonly={isArchive}
                compareLabel={isArchive ? undefined : (comparePeriodLabel ?? undefined)}
              />
            )}
          </BriefPanel>

          {/* "Needs Mordy's Attention" — exceptions-only (SPEC-104). Live-only,
              so hidden in archive view. */}
          {!isArchive && <NeedsMordyAttention data={attentionData} />}

          {/* Website · what broke yesterday (SPEC-284) — live-only, Clarity's latest day. */}
          {!isArchive && <BriefWebsite />}
        </div>

        {/* Rail: the things you glance at */}
        <div className="min-w-0 space-y-4 lg:col-span-2">
          <OvernightWatch items={data.overnight_watch} />

          {/* Predictions (V4) — forward-looking pace-to-goal. Live-only (a forecast
              of the current month). */}
          {!isArchive && <BriefPredictions />}

          <BriefCoverage coverage={data.coverage} />
        </div>
      </div>

      <BriefTrustBar>
        Data as of{" "}
        {new Date(data.generated_at).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          timeZone: storeTimeZone(),
          timeZoneName: "short",
        })}
      </BriefTrustBar>
    </div>
  );
}
