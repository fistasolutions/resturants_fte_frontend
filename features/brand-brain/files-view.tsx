"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, X } from "lucide-react";

import { RoleButton, RoleGate } from "@/components/shared/role-gate";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AddKnowledgeDialog, type AddKnowledgeStart } from "@/features/brand-brain/add-knowledge-dialog";
import { KnowledgeCard } from "@/features/brand-brain/knowledge-card";
import { KnowledgeDropZone } from "@/features/brand-brain/knowledge-drop-zone";
import { brandBrainHref, sourceHref } from "@/lib/brand-brain";
import {
  allTags,
  filterLibrary,
  LIBRARY_STATUS_FILTERS,
  librarySummary,
  matchesStatus,
  sortLibrary,
  statusCounts,
  type LibrarySort,
  type LibraryStatusFilter,
} from "@/lib/knowledge-base";
import { cn } from "@/lib/utils";
import { recheckSource } from "@/services/brand-brain-actions";
import type { BrandSource, CoverageData, SourceKind } from "@/types/brand-brain";
import { formatNumber } from "@/utils/format";

const KIND_OPTIONS: { value: SourceKind; label: string }[] = [
  { value: "pdf", label: "PDF" },
  { value: "docx", label: "Word" },
  { value: "xlsx", label: "Sheet" },
  { value: "pptx", label: "Slides" },
  { value: "csv", label: "CSV" },
  { value: "txt", label: "Text file" },
  { value: "text", label: "Pasted text" },
  { value: "url", label: "Web page" },
];

const SEG = "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring";

function Tile({ label, value, sub, className, children }: { label: string; value?: React.ReactNode; sub?: React.ReactNode; className?: string; children?: React.ReactNode }) {
  return (
    <Card className={cn("gap-1 p-4", className)}>
      <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">{label}</p>
      {value !== undefined ? <p className="text-lg font-bold tracking-tight">{value}</p> : null}
      {sub ? <p className="text-xs text-muted-foreground">{sub}</p> : null}
      {children}
    </Card>
  );
}

/**
 * Brand Brain → Knowledge Base (SPEC-274): what needs you and the value of acting
 * first, then a library you can scan — one card per item, four stream pills, one
 * status — and the drop zone on the page. An item opens on its own page.
 */
export function FilesView({ sources, coverage, onChanged }: { sources: BrandSource[]; coverage: CoverageData | undefined; onChanged: () => void }) {
  const router = useRouter();
  const params = useSearchParams();
  const [open, setOpen] = useState(params.get("add") === "1");
  const [start, setStart] = useState<AddKnowledgeStart | null>(null);
  const [status, setStatus] = useState<LibraryStatusFilter>("all");
  const [kind, setKind] = useState<SourceKind | null>(null);
  const [tag, setTag] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<LibrarySort>("review");

  const tags = allTags(sources);
  const summary = librarySummary(sources);
  const counts = statusCounts(sources);
  const rows = sortLibrary(
    filterLibrary(sources, { query, tag, kind }).filter((s) => matchesStatus(s, status)),
    sort,
  );
  const active = status !== "all" || kind !== null || tag !== null || query.trim() !== "";
  const pendingSource = sources.find((s) => s.pendingCount > 0);
  const emptySection = coverage?.sections.find((s) => s.status === "empty");

  function openDoor(next: AddKnowledgeStart) {
    setStart(next);
    setOpen(true);
  }

  function closeDialog(next: boolean) {
    setOpen(next);
    if (!next) {
      setStart(null);
      if (params.get("add")) router.replace(brandBrainHref("files"), { scroll: false });
    }
  }

  async function recheck(id: number) {
    await recheckSource(id);
    onChanged();
  }

  return (
    <div className="space-y-4 pb-16">
      <section aria-label="Knowledge Base summary" className="grid grid-cols-2 gap-4 xl:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <Tile
          label="Needs you"
          className={cn(summary.pending > 0 && "border-l-4 border-l-warning")}
          value={
            summary.pending > 0
              ? `${formatNumber(summary.pending)} facts from ${formatNumber(summary.pendingSources)} ${summary.pendingSources === 1 ? "document are" : "documents are"} waiting`
              : "Nothing waiting"
          }
          sub={
            summary.pending > 0
              ? "A fact reaches the writers only once you approve it."
              : "Every fact the library taught has been decided."
          }
        >
          {pendingSource ? (
            <Link href={sourceHref(pendingSource.id)} className="mt-2 inline-flex w-fit items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
              Review {formatNumber(pendingSource.pendingCount)} →
            </Link>
          ) : null}
        </Tile>
        <Tile label="In the library" value={`${formatNumber(summary.items)} ${summary.items === 1 ? "item" : "items"}`} sub={`${formatNumber(summary.documents)} ${summary.documents === 1 ? "document" : "documents"} · ${formatNumber(summary.notes)} ${summary.notes === 1 ? "note" : "notes"} · ${formatNumber(summary.pages)} ${summary.pages === 1 ? "page" : "pages"} watched`} />
        <Tile label="What they taught" value={`${formatNumber(summary.facts)} facts`} sub={`${formatNumber(summary.personas)} ${summary.personas === 1 ? "persona" : "personas"} · ${formatNumber(summary.samples)} voice samples · ${formatNumber(summary.rules)} rules`} />
        <Tile label="Coverage" value={coverage ? `${coverage.score}%` : "—"} sub={emptySection ? `${emptySection.label} is empty — add a page or a document about it.` : coverage ? "Every section has something." : ""}>
          {coverage ? (
            <div className="mt-1 flex h-6 items-end gap-1" aria-hidden>
              {coverage.sections.map((s) => (
                <div key={s.key} className="relative flex-1 overflow-hidden rounded-sm bg-muted" title={`${s.label} ${s.progress}%`}>
                  <div className={cn("absolute inset-x-0 bottom-0", s.status === "empty" ? "bg-warning" : "bg-success")} style={{ height: `${Math.max(6, s.progress)}%` }} />
                  <div className="h-6" />
                </div>
              ))}
            </div>
          ) : null}
        </Tile>
      </section>

      <section aria-label="Filter the library" className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Status" className="flex rounded-lg border border-border bg-card p-0.5">
          {LIBRARY_STATUS_FILTERS.map((f) => (
            <button key={f.key} type="button" aria-pressed={status === f.key} onClick={() => setStatus(f.key)} className={cn(SEG, status === f.key ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}>
              {f.label} <span className="ml-1 tabular-nums opacity-70">{formatNumber(counts[f.key])}</span>
            </button>
          ))}
        </div>
        <Select value={kind ?? "any"} onValueChange={(v) => setKind(v === "any" ? null : (v as SourceKind))}>
          <SelectTrigger className="h-8 w-[130px]" aria-label="Type">
            <SelectValue placeholder="Any type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any type</SelectItem>
            {KIND_OPTIONS.map((k) => (
              <SelectItem key={k.value} value={k.value}>
                {k.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {tags.length ? (
          <Select value={tag ?? "any"} onValueChange={(v) => setTag(v === "any" ? null : v)}>
            <SelectTrigger className="h-8 w-[130px]" aria-label="Tag">
              <SelectValue placeholder="Any tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any tag</SelectItem>
              {tags.map((t) => (
                <SelectItem key={t.tag} value={t.tag}>
                  {t.tag} ({t.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
        <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search titles and tags…" aria-label="Search the Knowledge Base" className="h-8 pl-8" />
        </div>
        {active ? (
          <button
            type="button"
            onClick={() => {
              setStatus("all");
              setKind(null);
              setTag(null);
              setQuery("");
            }}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-[11px] font-medium outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-3" aria-hidden /> Clear
          </button>
        ) : null}
        <span className="ml-auto" />
        <Select value={sort} onValueChange={(v) => setSort(v as LibrarySort)}>
          <SelectTrigger className="h-8 w-[160px]" aria-label="Sort">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="review">Needs review first</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="taught">Most taught</SelectItem>
          </SelectContent>
        </Select>
        <RoleButton need="brand_brain.manage" size="sm" onClick={() => openDoor({ door: "file", file: null })}>
          <Plus className="size-4" aria-hidden /> Add to Knowledge Base
        </RoleButton>
      </section>

      <AddKnowledgeDialog
        open={open}
        onOpenChange={closeDialog}
        suggestions={tags.map((t) => t.tag)}
        start={start}
        onAdded={() => onChanged()}
      />

      <RoleGate need="brand_brain.manage">
        <KnowledgeDropZone onFile={(file) => openDoor({ door: "file", file })} onText={() => openDoor({ door: "text" })} onUrl={() => openDoor({ door: "url" })} />
      </RoleGate>

      {sources.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm font-medium">The Knowledge Base is empty.</p>
          <p className="mt-1 text-xs text-muted-foreground">Add the founding brand document, the size chart, the returns policy and a brand book — the writers learn from each one as soon as you approve what it taught.</p>
        </Card>
      ) : rows.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm font-medium">No items match.</p>
        </Card>
      ) : (
        <section aria-label="Library" className="space-y-2">
          {rows.map((s) => (
            <KnowledgeCard key={s.id} source={s} onRecheck={(id) => void recheck(id)} />
          ))}
        </section>
      )}
    </div>
  );
}
