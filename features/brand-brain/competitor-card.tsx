"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Check, ExternalLink, RefreshCw, X } from "lucide-react";

import { RoleButton } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCompetitorRun } from "@/features/brand-brain/competitor-run-provider";
import { axisRows, competitorHref, gapsFiledLabel, isGapFiled, orderGapTopics, ORIGIN_LABEL, overlapLine, priceBand, STATUS_LABEL } from "@/lib/competitors";
import { cn } from "@/lib/utils";
import { approveCompetitor, rejectCompetitor, rereadCompetitor } from "@/services/brand-brain-actions";
import type { Competitor } from "@/types/brand-brain";
import { formatDate, formatNumber } from "@/utils/format";

const CHIP = "rounded-md px-1.5 py-0.5 text-[10px] font-semibold";
const ORIGIN_TONE = { agent: "bg-ai/10 text-ai", owner: "bg-destructive/10 text-destructive" } as const;
const STATUS_TONE = { pending: "bg-warning/15 text-warning", approved: "bg-success/10 text-success", rejected: "bg-muted text-muted-foreground" } as const;

const GAP_SHOWN = 4;

/**
 * One competitor (SPEC-283): the evidence, the profile on four axes, the topics
 * they cover that the brand does not, and the actions its state allows. `full`
 * (the profile page) shows every axis, every gap topic and every page read.
 */
export function CompetitorCard({ competitor: initial, full = false, onChanged }: { competitor: Competitor; full?: boolean; onChanged?: (next: Competitor) => void }) {
  const queryClient = useQueryClient();
  const { follow } = useCompetitorRun();
  const [c, setC] = useState(initial);
  const [busy, setBusy] = useState<"approve" | "reject" | "reread" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rows = axisRows(c);
  const band = priceBand(c);
  // The filed ones first (SPEC-292): what became a topic is what the owner acts on.
  const ordered = orderGapTopics(c);
  const gaps = full ? ordered : ordered.slice(0, GAP_SHOWN);

  async function act(kind: "approve" | "reject" | "reread") {
    setBusy(kind);
    setError(null);
    try {
      if (kind === "reread") {
        follow(await rereadCompetitor(c.id));
      } else {
        const next = kind === "approve" ? await approveCompetitor(c.id) : await rejectCompetitor(c.id);
        setC(next);
        onChanged?.(next);
      }
      void queryClient.invalidateQueries({ queryKey: ["brand-brain"] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong — try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card className={cn("gap-0 p-0", c.status === "pending" && "border-l-4 border-l-warning")} data-competitor={c.status}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 p-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {full ? <span className="text-base font-bold">{c.name}</span> : (
              <Link href={competitorHref(c.id)} className="text-sm font-bold hover:underline">
                {c.name}
              </Link>
            )}
            <span className={cn(CHIP, ORIGIN_TONE[c.origin])}>{ORIGIN_LABEL[c.origin]}</span>
            <span className={cn(CHIP, STATUS_TONE[c.status])}>{STATUS_LABEL[c.status]}{c.status !== "pending" && c.reviewedAt ? ` ${formatDate(c.reviewedAt)}` : ""}</span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            <a href={c.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-foreground hover:underline">
              {c.domain} <ExternalLink className="size-3" aria-hidden />
            </a>
            {c.categories.length ? ` · ${c.categories.join(", ")}` : ""}
            {band ? ` · ${band}` : ""}
            {` · ${overlapLine(c)}`}
          </p>
          {c.why ? (
            <p className="mt-1.5 text-xs text-muted-foreground">
              <b className="font-semibold text-foreground">Why it&apos;s a competitor:</b> {c.why}
              {c.ownerNote && c.ownerNote !== c.why ? ` — ${c.ownerNote}` : ""}
            </p>
          ) : null}
          {c.positioning && (full || c.status === "pending") ? <p className="mt-1 text-xs text-muted-foreground italic">&ldquo;{c.positioning}&rdquo;</p> : null}
          {rows.length > 0 ? (
            <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
              {rows.map((r) => (
                <div key={r.key} className="rounded-lg border border-border px-2.5 py-2">
                  <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">{r.label}</p>
                  <p className="mt-0.5 text-xs">{r.theirs}</p>
                </div>
              ))}
            </div>
          ) : c.readError ? (
            <p className="mt-2 text-xs text-destructive">Could not read the site: {c.readError}</p>
          ) : c.lastReadAt ? (
            <p className="mt-2 text-xs text-muted-foreground">The pages showed no prices, shipping or returns terms.</p>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">Not read yet — the profile lands when the reading finishes.</p>
          )}
          {c.whereYouWin ? (
            <p className="mt-2 text-xs">
              <b className="font-semibold text-success">Where you win:</b> {c.whereYouWin}
            </p>
          ) : null}
          {gaps.length > 0 ? (
            <p className="mt-2 flex flex-wrap items-center gap-1 text-xs">
              <b className="mr-1 font-semibold">They cover, you don&apos;t:</b>
              {gaps.map((t) => (
                <span
                  key={t}
                  className={cn("rounded-md px-2 py-0.5", isGapFiled(t, c.gapsFiled) ? "bg-ai/10 text-ai" : "bg-muted")}
                  title={isGapFiled(t, c.gapsFiled) ? "In the query bank as a competitor gap" : "Not filed — no category you sell matches it"}
                >
                  {t}
                </span>
              ))}
              {!full && c.gapTopics.length > GAP_SHOWN ? <span className="text-muted-foreground">+ {c.gapTopics.length - GAP_SHOWN} more</span> : null}
              {c.status === "approved" ? (
                <span className="text-muted-foreground">· {gapsFiledLabel(c)}</span>
              ) : null}
              {c.status === "approved" && c.gapsFiled.length > 0 ? (
                <Link href="/spotlight?tab=inbound&filter=gaps" className="ml-1 font-semibold text-ai hover:underline">
                  → on the Inbound Engine
                </Link>
              ) : null}
            </p>
          ) : null}
          <p className="mt-2 text-[11px] text-muted-foreground">
            {c.lastReadAt ? `Read ${formatDate(c.lastReadAt)} · ${formatNumber(c.pagesRead.length)} ${c.pagesRead.length === 1 ? "page" : "pages"}` : "Not read yet"}
            {full && c.pagesRead.length > 0 ? (
              <span className="block mt-1 space-x-2">
                {c.pagesRead.map((u) => (
                  <a key={u} href={u} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">{u.replace(/^https?:\/\/(www\.)?/, "")}</a>
                ))}
              </span>
            ) : null}
          </p>
          {error ? <p role="alert" className="mt-1 text-xs text-destructive">{error}</p> : null}
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {c.status === "pending" ? (
            <>
              <RoleButton need="brand_brain.manage" size="sm" className="h-8" disabled={busy !== null} onClick={() => act("approve")} aria-label={`Approve ${c.name}`}>
                <Check className="size-3.5" aria-hidden /> {busy === "approve" ? "Approving…" : "Approve"}
              </RoleButton>
              <RoleButton need="brand_brain.manage" size="sm" variant="outline" className="h-8 text-destructive" disabled={busy !== null} onClick={() => act("reject")} aria-label={`Reject ${c.name}`}>
                <X className="size-3.5" aria-hidden /> Reject
              </RoleButton>
              {c.readError || !c.lastReadAt ? (
                <RoleButton need="brand_brain.manage" size="sm" variant="ghost" className="h-8" disabled={busy !== null} onClick={() => act("reread")}>
                  <RefreshCw className={cn("size-3.5", busy === "reread" && "animate-spin")} aria-hidden /> Read again
                </RoleButton>
              ) : null}
            </>
          ) : c.status === "approved" ? (
            <>
              {!full ? (
                <Button asChild size="sm" variant="outline" className="h-8">
                  <Link href={competitorHref(c.id)}>Open</Link>
                </Button>
              ) : null}
              <RoleButton need="brand_brain.manage" size="sm" variant="ghost" className="h-8" disabled={busy !== null} onClick={() => act("reread")}>
                <RefreshCw className={cn("size-3.5", busy === "reread" && "animate-spin")} aria-hidden /> Re-read now
              </RoleButton>
              <RoleButton need="brand_brain.manage" size="sm" variant="ghost" className="h-8 text-muted-foreground" disabled={busy !== null} onClick={() => act("reject")}>
                Remove
              </RoleButton>
            </>
          ) : (
            <RoleButton need="brand_brain.manage" size="sm" variant="outline" className="h-8" disabled={busy !== null} onClick={() => act("approve")}>
              Restore
            </RoleButton>
          )}
        </div>
      </div>
    </Card>
  );
}
