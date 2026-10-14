"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, RefreshCw, Search } from "lucide-react";

import { RoleButton } from "@/components/shared/role-gate";
import { Card, CardContent } from "@/components/ui/card";
import { generateDisabledReason } from "@/lib/generation";
import { bandLabel, missedLine, type RefreshPost } from "@/lib/refresh-loop";
import { startRefreshRewrite } from "@/services/spotlight-generation";
import { formatNumber } from "@/utils/format";

import { useGeneration } from "./generation-provider";

/**
 * One published post worth rewriting (SPEC-305): what it was written for, the searches
 * it ranks 8–20 for and never answered, and the one button that acts on them.
 *
 * Rewriting is the existing refine loop — the draft is overwritten in place, returns to
 * review, and the owner still approves and publishes it. Nothing here touches the live
 * article, which is why the button says "Rewrite" and not "Update the post".
 */
export function RefreshPostCard({ post }: { post: RefreshPost }) {
  const router = useRouter();
  const { job, setJob } = useGeneration();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // One generation at a time (backend SPEC-224) — disabled and explained, never hidden.
  const blocked = generateDisabledReason(job);

  async function handleRewrite() {
    if (blocked) return;
    setBusy(true);
    setError(null);
    try {
      const started = await startRefreshRewrite(post.draftId);
      setJob(started);
      router.push(`/spotlight/draft/${post.draftId}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not start the rewrite.");
      setBusy(false);
    }
  }

  const more = post.missedCount - post.topMissed.length;

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h3 className="text-sm font-medium text-foreground">
              {post.url ? (
                <a
                  href={post.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-start gap-1 hover:underline"
                >
                  {post.title}
                  <ArrowUpRight className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                </a>
              ) : (
                post.title
              )}
            </h3>
            <p className="text-xs text-muted-foreground">
              Written for &ldquo;{post.targetKeyword}&rdquo;
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold tabular-nums text-foreground">
              +{formatNumber(Math.round(post.potentialClicks))}
            </p>
            <p className="text-xs text-muted-foreground">clicks a month</p>
          </div>
        </div>

        <ul className="space-y-2">
          {post.topMissed.map((missed) => (
            <li
              key={missed.query}
              className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-md bg-muted/50 px-3 py-2"
            >
              <Search className="size-3.5 shrink-0 self-center text-muted-foreground" aria-hidden />
              <span className="text-sm text-foreground">{missed.query}</span>
              <span className="text-xs text-muted-foreground">
                {bandLabel(missed.position)} · {missedLine(missed)}
              </span>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {more > 0
              ? `${formatNumber(more)} more ${more === 1 ? "search" : "searches"} in striking distance.`
              : "The rewrite keeps the title, the URL and everything that works."}
          </p>
          <RoleButton
            need="spotlight.manage"
            size="sm"
            variant="outline"
            onClick={handleRewrite}
            disabled={busy || blocked !== null}
            title={blocked ?? undefined}
            aria-live="polite"
          >
            <RefreshCw className={busy ? "size-3.5 animate-pulse" : "size-3.5"} aria-hidden />
            {busy ? "Starting…" : blocked ? "Writing…" : "Rewrite"}
          </RoleButton>
        </div>
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
