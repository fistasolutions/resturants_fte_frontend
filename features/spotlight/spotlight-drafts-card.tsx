"use client";

/**
 * The Spotlight drafts list (SPEC-163) — lifted out of the Inbound Engine tab so
 * drafts have exactly ONE browsing home. Inbound answers "what should I write?";
 * this answers "what have I written?", and the two were sharing a screen.
 *
 * Browsing lives here; deciding lives on the Needs-review tab.
 */
import { useState } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { draftHref, draftStatusLabel } from "@/lib/spotlight";
import { cn } from "@/lib/utils";
import type { BlogDraft } from "@/types/spotlight";
import { formatNumber } from "@/utils/format";

import { DeleteDraftButton } from "./delete-draft-button";
import { draftOverallScore, hasScorecard } from "./quality-scorecard";
import { QualityScoreBadge, SeoBadge } from "./seo-badge";

const pillBase =
  "inline-flex h-5 w-fit shrink-0 items-center rounded-4xl px-2 text-[0.6875rem] font-medium whitespace-nowrap";

const STATUS_CLASS: Record<BlogDraft["status"], string> = {
  in_review: "bg-warning/10 text-warning",
  approved: "bg-success/10 text-success",
  changes_requested: "bg-destructive/10 text-destructive",
  published: "bg-success/10 text-success",
  unpublished: "bg-muted text-muted-foreground",
  draft: "bg-muted text-muted-foreground",
};

export function SpotlightDraftsCard({ drafts: initialDrafts }: { drafts: BlogDraft[] }) {
  // Local copy so a delete removes the row optimistically (SPEC-112).
  const [drafts, setDrafts] = useState(initialDrafts);
  const removeDraft = (id: number) =>
    setDrafts((current) => current.filter((draft) => draft.id !== id));

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>Drafts</CardTitle>
        <p className="text-sm text-muted-foreground">
          Blog posts written by the agent, each grounded in your Brand Brain and
          scored for SEO readiness.
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {drafts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No drafts yet — pick a query and choose “Generate draft.”
          </p>
        ) : (
          <div className="scrollbar-subtle max-h-[60vh] space-y-2 overflow-y-auto pr-1">
            {drafts.map((draft) => (
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
                  <p className="truncate text-xs text-muted-foreground">
                    {draft.targetKeyword} · {draft.persona} · {formatNumber(draft.wordCount)} words
                  </p>
                </div>
                {hasScorecard(draft) ? (
                  <QualityScoreBadge score={draftOverallScore(draft)} />
                ) : (
                  <SeoBadge score={draft.seoScore} />
                )}
                <span className={cn(pillBase, STATUS_CLASS[draft.status])}>
                  {draftStatusLabel(draft.status)}
                </span>
              </Link>
              <DeleteDraftButton
                draftId={draft.id}
                onDeleted={removeDraft}
                label={`Delete draft: ${draft.title}`}
              />
            </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
