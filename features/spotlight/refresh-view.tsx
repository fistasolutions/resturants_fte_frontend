"use client";

import { RefreshCw } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { refreshSummary, windowLabel, type RefreshData } from "@/lib/refresh-loop";

import { RefreshPostCard } from "./refresh-post-card";

/**
 * Spotlight › Published › Worth rewriting (SPEC-305, backend SPEC-302).
 *
 * The cheapest wins on the platform: posts already ranking on the bottom of page one or
 * on page two for searches they were never written for. The Monday scan stores the
 * evidence; this reads it. An empty list says so and says when it will look again — a
 * zero here is good news, not a blank panel.
 */
export function RefreshView({ data }: { data: RefreshData }) {
  if (data.posts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <span className="text-muted-foreground" aria-hidden>
            <RefreshCw className="size-8" />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              Nothing is waiting for a rewrite
            </p>
            <p className="mx-auto max-w-lg text-sm text-muted-foreground">
              Every Monday, Search Visibility reads what each live post actually ranks for and
              lists the ones sitting between positions 8 and 20 for searches they were
              never written for. {windowLabel(data)}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="gap-0">
        <CardContent className="space-y-1 p-4">
          <p className="text-sm font-medium text-foreground">{refreshSummary(data)}</p>
          <p className="text-xs text-muted-foreground">{windowLabel(data)}</p>
        </CardContent>
      </Card>
      <div className="space-y-3">
        {data.posts.map((post) => (
          <RefreshPostCard key={post.draftId} post={post} />
        ))}
      </div>
    </div>
  );
}
