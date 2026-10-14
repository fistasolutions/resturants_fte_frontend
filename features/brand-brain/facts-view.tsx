"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckSquare, Search, X } from "lucide-react";

import { confirmCopy } from "@/lib/confirm";
import { useConfirm } from "@/components/shared/confirm-provider";
import { RoleGate } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FactRow } from "@/features/brand-brain/fact-row";
import { FactsBulkBar } from "@/features/brand-brain/facts-bulk-bar";
import { FactsRail } from "@/features/brand-brain/facts-rail";
import { AddFactForm } from "@/features/spotlight/brand-brain-rows";
import { useCan } from "@/hooks/use-can";
import {
  bulkOptions,
  FACT_FILTERS,
  FACT_SECTION_ORDER,
  factNeedsDecision,
  factSectionLabel,
  factsSummary,
  filterCounts,
  filterFacts,
  SECTION_USERS,
  sectionStats,
  sourceTitleMap,
  type FactFilter,
} from "@/lib/brand-brain";
import { cn } from "@/lib/utils";
import { approveFact, rejectFact, setFactEnabled } from "@/services/brand-brain-actions";
import { deleteFact } from "@/services/spotlight-actions";
import type { BrandSource } from "@/types/brand-brain";
import type { Fact, FactSection } from "@/types/spotlight";
import { formatDate, formatNumber } from "@/utils/format";

const ADDABLE: readonly FactSection[] = ["identity", "voice", "guardrail", "product", "policy", "competitor", "market", "calendar"];
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

function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="rounded border border-border border-b-2 bg-card px-1 font-mono text-[10px] text-muted-foreground">{children}</kbd>;
}

/**
 * Brand Brain → Facts (SPEC-274): the decision you owe and what the brain holds
 * first, then every fact by section — one line each, the source inline, a coloured
 * edge for what needs you — with a section rail, filters, search, a bulk bar and
 * keys (j / k move, a approve, r reject, Enter open). A row opens its own page.
 */
export function FactsView({ facts, sources, onChanged }: { facts: Fact[]; sources: BrandSource[]; onChanged: () => void }) {
  const confirm = useConfirm();
  const can = useCan();
  const canManage = can("brand_brain.manage").allowed;
  // `?filter=measured` is where the old Measured tab lands (SPEC-281).
  const params = useSearchParams();
  const [filter, setFilter] = useState<FactFilter>(() => {
    const wanted = params.get("filter");
    return FACT_FILTERS.some((f) => f.key === wanted) ? (wanted as FactFilter) : "all";
  });
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<number>>(() => new Set());
  const [selecting, setSelecting] = useState(false);
  const [focus, setFocus] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const listRef = useRef<HTMLDivElement>(null);

  const titles = useMemo(() => sourceTitleMap(sources), [sources]);
  const summary = factsSummary(facts);
  const counts = filterCounts(facts);
  const stats = sectionStats(facts);
  const visible = filterFacts(facts, filter, query);
  const groups = FACT_SECTION_ORDER.map((section) => ({
    section,
    rows: visible.filter((f) => (f.section ?? "identity") === section && f.status !== "rejected"),
  }));
  const rejected = visible.filter((f) => f.status === "rejected");
  const ordered = groups.flatMap((g) => (collapsed.has(g.section) ? [] : g.rows)).filter((f) => f.id != null);
  const focusedIndex = ordered.findIndex((f) => f.id === focus);

  function jump(section: string) {
    setActive(section);
    document.getElementById(`facts-${section}`)?.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  function toggle(section: string) {
    setCollapsed((c) => {
      const next = new Set(c);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  }

  function select(id: number, on: boolean) {
    setSelected((s) => {
      const next = new Set(s);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  const options = bulkOptions(facts, selected);

  // Each bulk action touches only the selected rows it applies to (SPEC-274): a
  // decision never reaches an approved fact, a switch never reaches a pending one.
  const bulk = useCallback(
    async (applies: (f: Fact) => boolean, action: (id: number) => Promise<unknown>) => {
      const ids = facts.filter((f) => f.id != null && selected.has(f.id) && applies(f)).map((f) => f.id as number);
      if (ids.length === 0) return;
      setBusy(true);
      try {
        await Promise.all(ids.map((id) => action(id)));
        setSelected(new Set());
        onChanged();
      } finally {
        setBusy(false);
      }
    },
    [facts, selected, onChanged],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing = target && ((target.tagName === "INPUT" && (target as HTMLInputElement).type !== "checkbox") || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (typing) return;
      if (e.key === "Escape") {
        setSelected(new Set());
        setSelecting(false);
        setFocus(null);
        return;
      }
      if (ordered.length === 0) return;
      if (e.key === "j" || e.key === "k") {
        e.preventDefault();
        const next = focusedIndex < 0 ? 0 : Math.min(ordered.length - 1, Math.max(0, focusedIndex + (e.key === "j" ? 1 : -1)));
        const id = ordered[next].id as number;
        setFocus(id);
        listRef.current?.querySelector<HTMLElement>(`[data-fact-id="${id}"]`)?.scrollIntoView({ block: "nearest" });
        return;
      }
      const current = focusedIndex >= 0 ? ordered[focusedIndex] : null;
      if (!current || current.id == null) return;
      if (e.key === "a" && canManage && factNeedsDecision(current)) void approveFact(current.id).then(onChanged);
      if (e.key === "r" && canManage && factNeedsDecision(current)) void rejectFact(current.id).then(onChanged);
      if (e.key === "Enter") listRef.current?.querySelector<HTMLElement>(`[data-fact-id="${current.id}"] [role="row"]`)?.click();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ordered, focusedIndex, onChanged, canManage]);

  const decisions = summary.pending + summary.conflict;

  return (
    <div className="space-y-4 pb-16">
      <section aria-label="Facts summary" className="grid grid-cols-2 gap-4 xl:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <Tile
          label="Needs a decision"
          className={cn(decisions > 0 && "border-l-4 border-l-warning")}
          value={decisions > 0 ? `${formatNumber(decisions)} ${decisions === 1 ? "fact" : "facts"} — ${formatNumber(summary.pending)} pending, ${formatNumber(summary.conflict)} ${summary.conflict === 1 ? "conflict" : "conflicts"}` : "Nothing waiting"}
          sub={
            decisions > 0 ? (
              <>
                A conflict is a document saying something different from what is approved — keep or replace.{" "}
                <button type="button" onClick={() => setFilter("wait")} className="font-semibold text-foreground underline-offset-2 hover:underline">
                  Decide now →
                </button>
              </>
            ) : (
              "Every fact has been decided; the writers read what is approved."
            )
          }
        />
        <Tile label="The brain holds" value={`${formatNumber(summary.total)} facts`} sub={`${formatNumber(summary.approved)} approved · ${formatNumber(summary.off)} switched off · ${formatNumber(summary.measured)} measured live`} />
        <Tile label="Where they came from" value={`${formatNumber(summary.onboarding)} · ${formatNumber(summary.file)} · ${formatNumber(summary.manual)}`} sub="onboarding · files · by hand" />
        <Tile label="Freshness" value={summary.newestApproval ? formatDate(summary.newestApproval) : "—"} sub={summary.oldestFact ? `newest approval · oldest fact ${formatDate(summary.oldestFact)}` : "no approved fact yet"} />
      </section>

      <section aria-label="Filter facts" className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Show" className="flex rounded-lg border border-border bg-card p-0.5">
          {FACT_FILTERS.map((f) => (
            <button key={f.key} type="button" aria-pressed={filter === f.key} onClick={() => setFilter(f.key)} className={cn(SEG, filter === f.key ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}>
              {f.label} <span className="ml-1 tabular-nums opacity-70">{formatNumber(counts[f.key])}</span>
            </button>
          ))}
        </div>
        <div className="relative min-w-[200px] flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder='Find a fact — "returns", "shipping", "size"…' aria-label="Find a fact" className="h-8 pl-8" />
        </div>
        {filter !== "all" || query ? (
          <button
            type="button"
            onClick={() => {
              setFilter("all");
              setQuery("");
            }}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-[11px] font-medium outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-3" aria-hidden /> Clear
          </button>
        ) : null}
        <p className="ml-auto hidden items-center gap-1 text-[11px] text-muted-foreground lg:flex">
          <Kbd>j</Kbd>
          <Kbd>k</Kbd> move · <Kbd>a</Kbd> approve · <Kbd>r</Kbd> reject · <Kbd>↵</Kbd> open
        </p>
        <RoleGate need="brand_brain.manage">
          <Button
            size="sm"
            variant={selecting ? "default" : "outline"}
            className="h-8"
            aria-pressed={selecting}
            onClick={() => {
              setSelecting((on) => !on);
              setSelected(new Set());
            }}
          >
            <CheckSquare className="size-3.5" aria-hidden /> {selecting ? "Done selecting" : "Select"}
          </Button>
        </RoleGate>
      </section>

      <div className="grid items-start gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
        <FactsRail stats={stats} active={active} rejected={summary.rejected} onJump={jump} />

        <div ref={listRef} className="min-w-0 space-y-3">
          {groups.map(({ section, rows }) => {
            const stat = stats.find((s) => s.section === section);
            const isCollapsed = collapsed.has(section);
            const hidden = filter !== "all" || query ? rows.length === 0 && (stat?.count ?? 0) > 0 : false;
            if (hidden) return null;
            return (
              <Card key={section} id={`facts-${section}`} className="scroll-mt-4 gap-0 overflow-hidden p-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border bg-muted/40 px-3 py-2">
                  <button type="button" onClick={() => toggle(section)} aria-expanded={!isCollapsed} className="w-5 text-center text-xs text-muted-foreground hover:text-foreground" aria-label={isCollapsed ? "Expand" : "Collapse"}>
                    {isCollapsed ? "▸" : "▾"}
                  </button>
                  <p className="text-[13px] font-bold">{factSectionLabel(section)}</p>
                  <p className="text-xs text-muted-foreground">
                    {stat && stat.count > 0 ? `${formatNumber(stat.count)} ${stat.count === 1 ? "fact" : "facts"}` : null}
                    {stat && stat.pending > 0 ? ` · ${formatNumber(stat.pending)} need${stat.pending === 1 ? "s" : ""} a decision` : null}
                    {stat && stat.count === 0 ? <span className="text-warning">empty — the writers have nothing to go on here</span> : null}
                  </p>
                  <span className="ml-auto text-[11px] text-muted-foreground">Used by: {SECTION_USERS[section].join(" · ")}</span>
                </div>
                {!isCollapsed ? (
                  rows.length === 0 ? (
                    <p className="px-4 py-3 text-xs text-muted-foreground">{stat && stat.count > 0 ? "Nothing here matches the filter." : "Add the first fact with + Add, or feed the brain a document about it."}</p>
                  ) : (
                    rows.map((f) => (
                      <div key={f.id ?? f.label} data-fact-id={f.id ?? undefined}>
                        <FactRow fact={f} sourceTitles={titles} selected={f.id != null && selected.has(f.id)} focused={f.id != null && focus === f.id} selecting={selecting} onSelect={select} onChanged={onChanged} />
                      </div>
                    ))
                  )
                ) : null}
                {!isCollapsed && ADDABLE.includes(section) ? (
                  <RoleGate need="brand_brain.manage">
                    <div className="border-t border-border px-3 py-1.5">
                      <AddFactForm section={section} onAdded={onChanged} />
                    </div>
                  </RoleGate>
                ) : null}
              </Card>
            );
          })}

          {rejected.length > 0 ? (
            <Card id="facts-rejected" className="scroll-mt-4 gap-0 overflow-hidden p-0">
              <div className="flex items-center gap-3 border-b border-border bg-muted/40 px-3 py-2">
                <p className="text-[13px] font-bold text-muted-foreground">Rejected</p>
                <p className="text-xs text-muted-foreground">{formatNumber(rejected.length)} · the writers never read these · restore any</p>
              </div>
              {rejected.map((f) => (
                <div key={f.id ?? f.label} data-fact-id={f.id ?? undefined}>
                  <FactRow fact={f} sourceTitles={titles} selected={false} focused={false} selecting={false} onSelect={select} onChanged={onChanged} />
                </div>
              ))}
            </Card>
          ) : null}

          <FactsBulkBar
            options={options}
            busy={busy}
            onApprove={() => void bulk(factNeedsDecision, (id) => approveFact(id))}
            onReject={() => void bulk(factNeedsDecision, (id) => rejectFact(id))}
            onOff={() => void bulk((f) => f.status === "approved" && f.enabled !== false, (id) => setFactEnabled(id, false))}
            onOn={() => void bulk((f) => f.status === "approved" && f.enabled === false, (id) => setFactEnabled(id, true))}
            onDelete={async () => {
              if (await confirm(confirmCopy("facts", "", options.total))) void bulk(() => true, (id) => deleteFact(id));
            }}
            onClear={() => {
              setSelected(new Set());
              setSelecting(false);
            }}
          />
        </div>
      </div>
    </div>
  );
}
