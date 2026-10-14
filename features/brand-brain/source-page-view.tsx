"use client";

import { useState } from "react";
import Link from "next/link";
import { notFound, useRouter, useSearchParams } from "next/navigation";
import { Download, Pencil, RefreshCw, Trash2 } from "lucide-react";

import { confirmCopy } from "@/lib/confirm";
import { useConfirm } from "@/components/shared/confirm-provider";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { RoleButton, RoleGate } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BrandBrainBreadcrumb } from "@/features/brand-brain/brand-brain-breadcrumb";
import { HistoryView } from "@/features/brand-brain/history-view";
import { SourceFactsStream, SourcePersonasStream, SourceRulesStream, SourceSamplesStream } from "@/features/brand-brain/source-streams";
import { useBrandBrainRefresh } from "@/features/brand-brain/use-brand-brain-refresh";
import { useApiQuery } from "@/hooks/use-api-query";
import { isNotFound } from "@/lib/api-error";
import { brandBrainHref, pendingCount, sourceKindLabel } from "@/lib/brand-brain";
import { formatBytes, LIBRARY_STATUS_LABEL, libraryStatus, parseTags } from "@/lib/knowledge-base";
import { brandBrainQueries } from "@/lib/queries/brand-brain";
import { cn } from "@/lib/utils";
import { approveAllFacts, deleteSource, recheckSource, sourceFileHref, updateSource } from "@/services/brand-brain-actions";
import type { BrandSource } from "@/types/brand-brain";
import { formatDate, formatDateTime, formatNumber } from "@/utils/format";

import SourceLoading from "@/app/(app)/spotlight/brand-brain/files/[id]/loading";

type Stream = "facts" | "voice" | "rules" | "personas";
const STREAMS: { key: Stream; label: string }[] = [
  { key: "facts", label: "Facts" },
  { key: "voice", label: "Voice samples" },
  { key: "rules", label: "Rules" },
  { key: "personas", label: "Personas" },
];

function EditMeta({ source, onDone }: { source: BrandSource; onDone: () => void }) {
  const [title, setTitle] = useState(source.title);
  const [tags, setTags] = useState(source.tags.join(", "));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        updateSource(source.id, { title: title.trim() || source.title, tags: parseTags(tags) })
          .then(onDone)
          .catch((err: unknown) => setError(err instanceof Error ? err.message : "Couldn't save."))
          .finally(() => setBusy(false));
      }}
    >
      <Input value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Name" placeholder="Name" maxLength={100} className="h-8 w-72" />
      <Input value={tags} onChange={(e) => setTags(e.target.value)} aria-label="Tags" placeholder="Tags, comma-separated" className="h-8 w-56" />
      <RoleButton need="brand_brain.manage" type="submit" size="sm" disabled={busy}>
        Save
      </RoleButton>
      <Button type="button" size="sm" variant="ghost" onClick={onDone} disabled={busy}>
        Cancel
      </Button>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </form>
  );
}

/**
 * One Knowledge Base item on its own page (SPEC-274): breadcrumb, the header with its
 * actions, the four streams it taught (in the URL), and its own history.
 */
export function SourcePageView({ id }: { id: number }) {
  const confirm = useConfirm();
  const router = useRouter();
  const params = useSearchParams();
  const refresh = useBrandBrainRefresh();
  const detail = useApiQuery(brandBrainQueries.source(id), {
    refetchInterval: (q) => (q.state.data?.source.status === "extracting" ? 2000 : false),
  });
  const facts = useApiQuery(brandBrainQueries.sourceFacts(id));
  const voice = useApiQuery(brandBrainQueries.voice());
  const rules = useApiQuery(brandBrainQueries.rules());
  const personas = useApiQuery(brandBrainQueries.personas());
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const raw = params.get("stream");
  const stream: Stream = raw === "voice" || raw === "rules" || raw === "personas" ? raw : "facts";

  if (detail.isPending) return <SourceLoading />;
  if (detail.isError) {
    if (isNotFound(detail.error)) notFound();
    return <QueryErrorState error={detail.error} onRetry={() => void detail.refetch()} />;
  }
  const source = detail.data.source;
  const status = libraryStatus(source);
  const pending = facts.data ? pendingCount(facts.data) : source.pendingCount;
  const samples = (voice.data?.samples ?? []).filter((s) => s.sourceId === id);
  const voiceRules = (voice.data?.rules ?? []).filter((r) => r.sourceId === id);
  const wordRules = (rules.data ?? []).filter((r) => r.sourceId === id);
  const ownPersonas = (personas.data ?? []).filter((p) => p.sourceId === id);
  const counts: Record<Stream, number> = { facts: facts.data?.length ?? source.factCount, voice: samples.length, rules: wordRules.length + voiceRules.length, personas: ownPersonas.length };

  function setStream(next: Stream) {
    router.replace(next === "facts" ? `/spotlight/brand-brain/files/${id}` : `/spotlight/brand-brain/files/${id}?stream=${next}`, { scroll: false });
  }

  async function act(key: string, action: () => Promise<unknown>, after?: () => void) {
    setBusy(key);
    setError(null);
    try {
      await action();
      refresh();
      after?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't do that — try again.");
    } finally {
      setBusy(null);
    }
  }

  const meta = [
    source.kind === "url" ? source.url : source.kind === "text" ? "Pasted text" : source.kind === "research" ? "Read from your store" : source.name,
    source.sizeBytes ? formatBytes(source.sizeBytes) : null,
    source.uploadedAt ? `added ${formatDate(source.uploadedAt)}` : null,
    source.uploadedBy ? `by ${source.uploadedBy}` : null,
    source.checkedAt ? `last read ${formatDateTime(source.checkedAt)}` : null,
    source.kind === "url" && source.nextCheckAt ? `next check ${formatDate(source.nextCheckAt)}` : null,
  ].filter(Boolean);

  return (
    <main className="min-w-0 flex-1 space-y-4 p-4 pb-16 md:p-6">
      <BrandBrainBreadcrumb section="files" sectionLabel="Knowledge Base" current={source.title} />

      <Card className="gap-3 p-5">
        <div className="flex flex-wrap items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-muted text-[10px] font-extrabold tracking-wider">{sourceKindLabel(source.kind)}</span>
          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-xl tracking-wide">{source.title}</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">{meta.join(" · ")}</p>
            {source.tags.length ? (
              <p className="mt-1.5 flex flex-wrap gap-1">
                {source.tags.map((t) => (
                  <span key={t} className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium">
                    {t}
                  </span>
                ))}
              </p>
            ) : null}
          </div>
          <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-widest uppercase", status === "review" ? "bg-warning/15 text-warning" : status === "failed" ? "bg-destructive/10 text-destructive" : status === "reading" ? "bg-ai/10 text-ai" : "bg-success/10 text-success")}>
            {LIBRARY_STATUS_LABEL[status]}
          </span>
        </div>
        {source.status === "failed" && source.error ? <p className="text-sm text-destructive">{source.error}</p> : null}
        {editing ? (
          <EditMeta
            source={source}
            onDone={() => {
              setEditing(false);
              refresh();
            }}
          />
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {source.hasFile ? (
              <a href={sourceFileHref(source.id)} download className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-medium hover:bg-accent">
                <Download className="size-3.5" aria-hidden /> Download original
              </a>
            ) : null}
            <RoleGate need="brand_brain.manage">
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                <Pencil className="size-3.5" aria-hidden /> Edit name &amp; tags
              </Button>
            </RoleGate>
            <RoleButton need="brand_brain.manage" size="sm" variant="outline" disabled={busy === "recheck" || source.status === "extracting"} onClick={() => void act("recheck", () => recheckSource(source.id))}>
              <RefreshCw className="size-3.5" aria-hidden /> {source.status === "extracting" ? "Reading…" : "Re-check"}
            </RoleButton>
            <RoleButton
              need="brand_brain.manage"
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive"
              disabled={busy === "delete"}
              onClick={async () => {
                if (await confirm(confirmCopy("source", source.title))) void act("delete", () => deleteSource(source.id), () => router.push(brandBrainHref("files")));
              }}
            >
              <Trash2 className="size-3.5" aria-hidden /> Remove
            </RoleButton>
            {pending > 0 ? (
              <RoleButton need="brand_brain.manage" size="sm" className="ml-auto bg-success text-success-foreground hover:bg-success/90" disabled={busy === "approve"} onClick={() => void act("approve", () => approveAllFacts(source.id))}>
                ✓ Approve all {formatNumber(pending)}
              </RoleButton>
            ) : null}
            {error ? <span className="text-xs text-destructive">{error}</span> : null}
          </div>
        )}
      </Card>

      <Card className="gap-0 p-0">
        <div role="tablist" aria-label="What it taught" className="flex gap-1 overflow-x-auto border-b border-border px-3">
          {STREAMS.map((s) => (
            <button key={s.key} role="tab" aria-selected={stream === s.key} onClick={() => setStream(s.key)} className={cn("relative px-3 py-2.5 text-sm font-medium whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-ring", stream === s.key ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>
              {s.label}
              <span className="ml-1.5 text-[11px] text-muted-foreground tabular-nums">{formatNumber(counts[s.key])}</span>
              {s.key === "facts" && pending > 0 ? <span className="ml-1.5 rounded-full bg-warning px-1.5 text-[10px] font-bold text-warning-foreground">{formatNumber(pending)}</span> : null}
              {stream === s.key ? <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" /> : null}
            </button>
          ))}
        </div>
        <div className="px-5 py-3">
          {stream === "facts" ? (
            facts.isPending ? <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p> : facts.isError ? <p className="py-6 text-center text-sm text-destructive">{facts.error.message}</p> : <SourceFactsStream facts={facts.data} onChanged={refresh} />
          ) : stream === "voice" ? (
            <SourceSamplesStream samples={samples} onChanged={refresh} />
          ) : stream === "rules" ? (
            <SourceRulesStream rules={wordRules} voiceRules={voiceRules} onChanged={refresh} />
          ) : (
            <SourcePersonasStream personas={ownPersonas} onChanged={refresh} />
          )}
        </div>
      </Card>

      <HistoryView events={detail.data.events} subtitle="this item only" empty="Nothing has happened to this item yet." />

      <p className="text-xs text-muted-foreground">
        <Link href={brandBrainHref("files")} className="underline-offset-2 hover:underline">
          ← Back to the Knowledge Base
        </Link>
      </p>
    </main>
  );
}
