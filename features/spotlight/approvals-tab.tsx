"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, FileText } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { draftHref } from "@/lib/spotlight";
import type { BlogDraft } from "@/types/spotlight";
import { formatNumber } from "@/utils/format";

import { DeleteDraftButton } from "./delete-draft-button";
import { DraftDecision } from "./draft-decision";
import { SeoGauge } from "./seo-gauge";
import { SeoBadge } from "./seo-badge";

function DraftReviewCard({
  draft,
  onDeleted,
}: {
  draft: BlogDraft;
  onDeleted: (id: number) => void;
}) {
  return (
    <Card className="gap-4">
      <CardHeader>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {draft.targetKeyword} · {draft.persona}
        </p>
        <CardTitle className="text-lg">
          <Link href={draftHref(draft)} className="hover:underline">
            {draft.title}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <SeoBadge score={draft.seoScore} />
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatNumber(draft.wordCount)} words
          </span>
          {draft.povPillar && (
            <span className="text-xs text-muted-foreground">· {draft.povPillar}</span>
          )}
        </div>

        {draft.metaDescription && (
          <p className="text-sm text-muted-foreground">{draft.metaDescription}</p>
        )}

        <SeoGauge score={draft.seoScore} />

        <DraftDecision draftId={draft.id} status={draft.status} />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={draftHref(draft)}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80"
          >
            Read the full draft
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
          <DeleteDraftButton
            draftId={draft.id}
            onDeleted={onDeleted}
            size="sm"
            label={`Delete draft: ${draft.title}`}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function QueueCard({
  queue,
  onDeleted,
}: {
  queue: BlogDraft[];
  onDeleted: (id: number) => void;
}) {
  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>Pending queue</CardTitle>
        <p className="text-sm text-muted-foreground">
          {queue.length} more {queue.length === 1 ? "draft" : "drafts"} awaiting review.
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {queue.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing else in the queue.</p>
        ) : (
          queue.map((draft) => (
            <div
              key={draft.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
            >
              <Link
                href={draftHref(draft)}
                className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="text-muted-foreground" aria-hidden>
                  <FileText className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {draft.title}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{draft.persona}</p>
                </div>
                <SeoBadge score={draft.seoScore} />
              </Link>
              <DeleteDraftButton
                draftId={draft.id}
                onDeleted={onDeleted}
                label={`Delete draft: ${draft.title}`}
              />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function EmptyApprovals() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <span className="text-success" aria-hidden>
          <CheckCircle2 className="size-8" />
        </span>
        <div>
          <p className="text-sm font-medium text-foreground">Inbox zero</p>
          <p className="text-sm text-muted-foreground">
            No drafts awaiting review. Generate one from the{" "}
            <Link href="/spotlight?tab=inbound" className="text-primary hover:underline">
              Inbound Engine
            </Link>
            .
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/** The human-in-the-loop queue: real `in_review` drafts (backend SPEC-109). The
 * newest is featured with the inline Approve / Request-changes action; the rest
 * queue below. Every card deep-links to the full blog detail, and each can be
 * deleted with a confirm (optimistic removal, SPEC-112). */
export function ApprovalsTab({ drafts: initialDrafts }: { drafts: BlogDraft[] }) {
  const [drafts, setDrafts] = useState(initialDrafts);
  const removeDraft = (id: number) =>
    setDrafts((current) => current.filter((draft) => draft.id !== id));

  if (drafts.length === 0) return <EmptyApprovals />;

  const [featured, ...queue] = drafts;
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
      <DraftReviewCard draft={featured} onDeleted={removeDraft} />
      <QueueCard queue={queue} onDeleted={removeDraft} />
    </div>
  );
}
