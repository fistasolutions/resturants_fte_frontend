"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ChatMarkdown } from "@/features/chat/chat-markdown";
import type { PageCommentary } from "@/types/analysis";
import { GlispIcon } from "@/components/shared/glisp-icon";

async function fetchCommentary(
  page: string,
  query: string,
  refresh: boolean,
): Promise<PageCommentary> {
  // `query` is the page's range query (`start=…&end=…`, SPEC-040) so the
  // narrative always describes exactly the visible window.
  const response = await fetch(
    `/api/proxy/analysis/${page}/commentary?${query}${refresh ? "&refresh=true" : ""}`,
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      data?.error?.message ?? "AI commentary is unavailable right now.",
    );
  }
  return data as PageCommentary;
}

function minutesAgo(iso: string): string {
  const minutes = Math.max(
    0,
    Math.round((Date.now() - new Date(iso).getTime()) / 60_000),
  );
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  return `${Math.round(minutes / 60)} h ago`;
}

interface AiCommentaryProps {
  page: "products" | "inventory" | "inventory_transfers";
  /** Range query string, e.g. "start=2026-06-01&end=2026-07-01". */
  query: string;
  /** Pre-fetched commentary from the RSC — renders immediately with no skeleton.
   * The refresh button still works client-side to force regeneration. */
  initialCommentary?: PageCommentary | null;
}

/** The on-page AI verdict (SPEC-026 §2): when initialCommentary is provided (RSC
 * pre-fetch), renders instantly with no skeleton. Refresh forces regeneration
 * client-side. */
export function AiCommentary({ page, query, initialCommentary }: AiCommentaryProps) {
  const [commentary, setCommentary] = useState<PageCommentary | null>(
    initialCommentary ?? null,
  );
  const [loading, setLoading] = useState(!initialCommentary);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // When initialCommentary was pre-fetched server-side, skip the initial load.
    if (initialCommentary) return;
    let cancelled = false;
    fetchCommentary(page, query, false)
      .then((data) => {
        if (!cancelled) setCommentary(data);
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setError(
            caught instanceof Error ? caught.message : "Something went wrong.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, query, initialCommentary]);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      setCommentary(await fetchCommentary(page, query, true));
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="gap-2 px-4 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
          AI analyst verdict
        </p>
        <Badge variant="outline" className="gap-1 font-normal text-muted-foreground">
          <GlispIcon className="size-3" state={loading ? "generating" : undefined} aria-hidden />
          {commentary
            ? `AI analysis · ${minutesAgo(commentary.generated_at)}${commentary.stale ? " (stale)" : ""}`
            : "AI analysis"}
        </Badge>
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          aria-label="Regenerate AI analysis"
          className="ml-auto flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        >
          {loading ? (
            <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <RefreshCw className="size-3.5" aria-hidden />
          )}
        </button>
      </div>

      {loading && !commentary ? (
        <div className="space-y-2" aria-hidden>
          <div className="h-3.5 w-11/12 animate-pulse rounded bg-muted" />
          <div className="h-3.5 w-full animate-pulse rounded bg-muted" />
          <div className="h-3.5 w-4/5 animate-pulse rounded bg-muted" />
        </div>
      ) : error ? (
        <p role="alert" className="text-sm text-muted-foreground">
          {error}
        </p>
      ) : commentary ? (
        <ChatMarkdown content={commentary.content_md} />
      ) : null}
    </Card>
  );
}
