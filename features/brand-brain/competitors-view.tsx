"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search } from "lucide-react";

import { GlispIcon } from "@/components/shared/glisp-icon";
import { RoleButton } from "@/components/shared/role-gate";
import { Card } from "@/components/ui/card";
import { AddCompetitorDialog } from "@/features/brand-brain/add-competitor-dialog";
import { CompetitorCard } from "@/features/brand-brain/competitor-card";
import { useCompetitorRun } from "@/features/brand-brain/competitor-run-provider";
import {
  COMPETITOR_VIEWS,
  competitorsHref,
  competitorsInView,
  defaultView,
  searchProviderLabel,
  viewCounts,
  viewFromParam,
  type CompetitorView,
} from "@/lib/competitors";
import { cn } from "@/lib/utils";
import { startCompetitorFind } from "@/services/brand-brain-actions";
import type { Competitor, CompetitorSummary } from "@/types/brand-brain";
import { formatDateTime, formatNumber } from "@/utils/format";

const SEG = "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring";

function Tile({ label, value, sub, className }: { label: string; value: React.ReactNode; sub?: React.ReactNode; className?: string }) {
  return (
    <Card className={cn("gap-1 p-4", className)}>
      <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">{label}</p>
      <p className="text-lg font-bold tracking-tight">{value}</p>
      {sub ? <p className="text-xs text-muted-foreground">{sub}</p> : null}
    </Card>
  );
}

/**
 * Brand Brain › Competitors (SPEC-283): the tiles, Find competitors and Add manually,
 * the Approved · To review · Rejected segments (URL state, so back/forward and a
 * shared link work), and one card per competitor. The run itself shows in the
 * top-right toast, which follows it across pages.
 */
export function CompetitorsView({ competitors, summary, refreshing = false, onChanged }: { competitors: Competitor[]; summary: CompetitorSummary | undefined; refreshing?: boolean; onChanged: () => void }) {
  const router = useRouter();
  const params = useSearchParams();
  const { run, follow } = useCompetitorRun();
  const [adding, setAdding] = useState(() => params.get("add") === "1");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const counts = useMemo(() => viewCounts(competitors), [competitors]);
  // No `?view=` → the queue while finds wait and nothing is approved, else Approved.
  const view = viewFromParam(params.get("view")) ?? defaultView(counts);
  const rows = useMemo(() => competitorsInView(competitors, view), [competitors, view]);
  const running = run?.status === "running" || Boolean(summary?.running);

  // `?add=1` opens the dialog on arrival (a link can start the flow — read once, as
  // Files does); closing it cleans the URL so a reload does not reopen it.
  const setView = (next: CompetitorView) => router.replace(competitorsHref(next), { scroll: false });
  const closeAdd = (open: boolean) => {
    setAdding(open);
    if (!open && params.get("add")) router.replace(competitorsHref(viewFromParam(params.get("view")) ?? undefined), { scroll: false });
  };

  async function find() {
    setStarting(true);
    setError(null);
    try {
      follow(await startCompetitorFind());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start — try again.");
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="space-y-4">
      <section aria-label="Competitor summary" className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Tile label="Competitors tracked" value={formatNumber(summary?.tracked ?? counts.approved)} sub="approved profiles the writers position against" />
        <Tile
          label="Waiting for your review"
          value={formatNumber(summary?.review ?? counts.review)}
          sub="found by the agent or added by you — approve, edit or reject"
          className={cn((summary?.review ?? counts.review) > 0 && "border-l-4 border-l-warning")}
        />
        <Tile label="Topics they cover that you don't" value={summary ? formatNumber(summary.gapTopics) : "—"} sub="the content gap · the ones that match a category you sell become topics on the Inbound Engine" />
        <Tile label="Last researched" value={summary?.lastResearched ? formatDateTime(summary.lastResearched) : "never"} sub="approved sites are re-read every week; a change becomes a dated fact" />
      </section>

      <section aria-label="Competitor actions" className="flex flex-wrap items-center gap-2">
        <RoleButton need="brand_brain.manage" size="sm" onClick={find} disabled={running || starting} data-find-competitors>
          <Search className="size-3.5" aria-hidden />
          {running ? "Researching…" : starting ? "Starting…" : "Find competitors"}
        </RoleButton>
        <RoleButton need="brand_brain.manage" size="sm" variant="outline" onClick={() => setAdding(true)}>
          <Plus className="size-3.5" aria-hidden /> Add manually
        </RoleButton>
        <div role="group" aria-label="Show" className="ml-1 flex flex-wrap rounded-lg border border-border bg-card p-0.5">
          {COMPETITOR_VIEWS.map((v) => (
            <button key={v.key} type="button" aria-pressed={view === v.key} onClick={() => setView(v.key)} className={cn(SEG, view === v.key ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}>
              {v.label} <span className="ml-1 tabular-nums opacity-70">{formatNumber(counts[v.key])}</span>
            </button>
          ))}
        </div>
        <p className="ml-auto text-xs text-muted-foreground">
          {summary?.webSearch
            ? `Evidence: who ranks beside you on your own searches, via ${searchProviderLabel(summary.webSearchProvider)} · same categories · same price band`
            : "No web search on any card — candidates come from your categories and overlap is not measured. Add a Gemini or OpenAI card on Integrations to measure it."}
        </p>
        {error ? <p role="alert" className="w-full text-xs text-destructive">{error}</p> : null}
      </section>

      {rows.length === 0 ? (
        <Card className="p-8 text-center" aria-busy={refreshing}>
          <GlispIcon className="mx-auto mb-3 size-8" aria-hidden />
          {refreshing ? (
            <p className="text-sm font-medium text-muted-foreground">Refreshing…</p>
          ) : view === "approved" && competitors.length === 0 ? (
            <>
              <p className="text-sm font-medium">No competitors yet</p>
              <p className="mx-auto mt-1 max-w-xl text-xs text-muted-foreground">
                Click <b>Find competitors</b> and the agent reads where the store already collides — the stores ranking for your searches, the same categories and price band — and brings back up to five profiles for your review. Or add one you already know.
              </p>
            </>
          ) : (
            <p className="text-sm font-medium">
              {view === "review" ? "Nothing waiting for review." : view === "rejected" ? "Nothing rejected." : "Nothing approved yet — review the ones waiting."}
            </p>
          )}
        </Card>
      ) : (
        <section aria-label="Competitors" className="space-y-2">
          {rows.map((c) => (
            <CompetitorCard key={c.id} competitor={c} onChanged={onChanged} />
          ))}
        </section>
      )}
      <p className="text-xs text-muted-foreground">
        Approved competitors are facts in Facts › Competitors with the pages they were read from; the writers position against them, and the topics they cover that you don&apos;t become topics on the Inbound Engine. Nothing is a competitor until you approve it.
      </p>
      <AddCompetitorDialog open={adding} onOpenChange={closeAdd} />
    </div>
  );
}
