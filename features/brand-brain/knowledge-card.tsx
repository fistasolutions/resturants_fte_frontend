"use client";

import Link from "next/link";
import { Download, RefreshCw } from "lucide-react";

import { RoleGate } from "@/components/shared/role-gate";
import { Card } from "@/components/ui/card";
import { sourceHref, sourceKindLabel } from "@/lib/brand-brain";
import { formatBytes, LIBRARY_STATUS_LABEL, libraryStatus, streamPills, type LibraryStatus } from "@/lib/knowledge-base";
import { cn } from "@/lib/utils";
import { sourceFileHref } from "@/services/brand-brain-actions";
import type { BrandSource, SourceKind } from "@/types/brand-brain";
import { formatDate } from "@/utils/format";

const KIND_TONE: Record<SourceKind, string> = {
  pdf: "bg-destructive/10 text-destructive",
  docx: "bg-primary/10 text-primary",
  xlsx: "bg-success/10 text-success",
  pptx: "bg-warning/10 text-warning",
  csv: "bg-success/10 text-success",
  txt: "bg-muted text-muted-foreground",
  text: "bg-muted text-muted-foreground",
  url: "bg-ai/10 text-ai",
  research: "bg-ai/10 text-ai",
};

const STATUS_TONE: Record<LibraryStatus, string> = {
  review: "bg-warning/15 text-warning",
  reading: "bg-ai/10 text-ai",
  ready: "bg-success/10 text-success",
  failed: "bg-destructive/10 text-destructive",
  watched: "bg-success/10 text-success",
};

const PILL_TONE = {
  wait: "border-border text-foreground [&_i]:bg-warning",
  on: "border-border text-foreground [&_i]:bg-success",
  off: "border-border text-foreground [&_i]:bg-muted-foreground/50",
  zero: "border-dashed border-border text-muted-foreground/60 [&_i]:hidden",
} as const;

/**
 * One Knowledge Base item (SPEC-274): type, name, meta, what it taught as four stream
 * pills, one status. The card opens the document page; Download and Re-check are
 * the two quick actions that make sense without opening it.
 */
export function KnowledgeCard({ source, onRecheck }: { source: BrandSource; onRecheck: (id: number) => void }) {
  const status = libraryStatus(source);
  const pills = streamPills(source);
  const meta = [
    source.kind === "url" ? "Web page" : source.kind === "text" ? "Pasted text" : source.kind === "research" ? "Read from your store" : source.name,
    source.sizeBytes ? formatBytes(source.sizeBytes) : null,
    source.uploadedAt ? `added ${formatDate(source.uploadedAt)}` : null,
    source.uploadedBy ? `by ${source.uploadedBy}` : null,
    source.kind === "url" && source.nextCheckAt ? `next check ${formatDate(source.nextCheckAt)}` : null,
  ].filter(Boolean);

  return (
    <Card className={cn("group relative gap-0 p-0 transition-colors hover:border-foreground/30", status === "review" && "border-l-4 border-l-warning")} data-knowledge-card={status}>
      <Link href={sourceHref(source.id)} className="grid grid-cols-[44px_1fr_auto] items-start gap-3 rounded-card p-4 outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className={cn("grid size-11 place-items-center rounded-lg text-[10px] font-extrabold tracking-wider", KIND_TONE[source.kind])}>{sourceKindLabel(source.kind)}</span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{source.title}</span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
            {meta.join(" · ")}
            {source.tags.length ? (
              <span className="ml-1.5 inline-flex gap-1 align-middle">
                {source.tags.map((t) => (
                  <span key={t} className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-foreground">
                    {t}
                  </span>
                ))}
              </span>
            ) : null}
          </span>
          <span className="mt-2 flex flex-wrap gap-1.5">
            {status === "reading" ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-ai/30 px-2.5 py-0.5 text-[11px] font-semibold text-ai">
                <span className="size-1.5 animate-pulse rounded-full bg-ai" aria-hidden /> Reading…
              </span>
            ) : status === "failed" ? (
              <span className="inline-flex items-center rounded-full border border-destructive/30 px-2.5 py-0.5 text-[11px] font-semibold text-destructive">{source.error ?? "Could not be read"}</span>
            ) : (
              pills.map((p) => (
                <span key={p.key} className={cn("inline-flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-0.5 text-[11px] font-semibold", PILL_TONE[p.tone])}>
                  <i className="size-1.5 rounded-full" aria-hidden />
                  {p.label}
                </span>
              ))
            )}
          </span>
        </span>
        <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-widest whitespace-nowrap uppercase", STATUS_TONE[status])}>{LIBRARY_STATUS_LABEL[status]}</span>
      </Link>
      <div className="absolute right-4 bottom-3 hidden gap-1 group-hover:flex">
        {source.hasFile ? (
          <a href={sourceFileHref(source.id)} download className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-0.5 text-[11px] font-medium hover:bg-accent">
            <Download className="size-3" aria-hidden /> Download
          </a>
        ) : null}
        {status !== "reading" ? (
          <RoleGate need="brand_brain.manage">
          <button type="button" onClick={() => onRecheck(source.id)} className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-0.5 text-[11px] font-medium hover:bg-accent">
            <RefreshCw className="size-3" aria-hidden /> Re-check
          </button>
          </RoleGate>
        ) : null}
      </div>
    </Card>
  );
}
