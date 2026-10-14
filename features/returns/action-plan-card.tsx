"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ChatMarkdown } from "@/features/chat/chat-markdown";
import type { ReturnsActionPlan } from "@/types/returns-intel";
import { GlispIcon } from "@/components/shared/glisp-icon";

async function fetchPlan(from: string, to: string, refresh: boolean): Promise<ReturnsActionPlan> {
  const response = await fetch(
    `/api/proxy/loop/returns/action-plan?start=${from}&end=${to}${refresh ? "&refresh=true" : ""}`,
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message ?? "The action plan is unavailable right now.");
  }
  return data as ReturnsActionPlan;
}

function minutesAgo(iso: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  return `${Math.round(minutes / 60)} h ago`;
}

/**
 * AI Returns Action Plan (SPEC-096). A client component so the server-rendered
 * KPIs paint instantly while this LLM-backed card loads async and shows its own
 * skeleton — it never blocks the rest of the Overview tab. Refresh forces
 * regeneration; the numbers all come from the backend (Rule 8).
 */
export function ActionPlanCard({ from, to }: { from: string; to: string }) {
  const [plan, setPlan] = useState<ReturnsActionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPlan(from, to, false)
      .then((data) => {
        if (!cancelled) setPlan(data);
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "Something went wrong.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [from, to]);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      setPlan(await fetchPlan(from, to, true));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="gap-2 border-ai/30 bg-ai/5 px-4 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
          AI action plan
        </p>
        <Badge variant="outline" className="gap-1 font-normal text-muted-foreground">
          <GlispIcon className="size-3 text-ai" aria-hidden />
          {plan
            ? `AI analysis · ${minutesAgo(plan.generated_at)}${plan.stale ? " (stale)" : ""}`
            : "AI analysis"}
        </Badge>
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          aria-label="Regenerate action plan"
          className="ml-auto flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        >
          {loading ? (
            <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <RefreshCw className="size-3.5" aria-hidden />
          )}
        </button>
      </div>

      {loading && !plan ? (
        <div className="space-y-2" aria-hidden>
          <div className="h-3.5 w-11/12 animate-pulse rounded bg-muted" />
          <div className="h-3.5 w-full animate-pulse rounded bg-muted" />
          <div className="h-3.5 w-10/12 animate-pulse rounded bg-muted" />
          <div className="h-3.5 w-4/5 animate-pulse rounded bg-muted" />
        </div>
      ) : error ? (
        <p role="alert" className="text-sm text-muted-foreground">
          {error}
        </p>
      ) : plan ? (
        <ChatMarkdown content={plan.content_md} />
      ) : null}
    </Card>
  );
}
