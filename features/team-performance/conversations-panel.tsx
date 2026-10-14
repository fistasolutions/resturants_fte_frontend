"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConversationsTable } from "@/features/team-performance/conversations-table";
import { conversationsApiQuery, type ConversationFilters } from "@/lib/gorgias-filters";
import type { GorgiasConversationList } from "@/types/gorgias";

async function fetchPage(
  filters: ConversationFilters,
  start: string,
  end: string,
  page: number,
  pageSize: number,
): Promise<GorgiasConversationList> {
  const query = conversationsApiQuery(filters, start, end, pageSize, (page - 1) * pageSize);
  const res = await fetch(`/api/proxy/gorgias/conversations?${query}`);
  if (!res.ok) throw new Error(`${res.status}`);
  return (await res.json()) as GorgiasConversationList;
}

/** Conversation Log table + client-side pagination (SPEC-094, mirroring the
 * Orders list panel). Paging fetches straight from the proxy so the controls
 * row above never re-renders; a filter/range change remounts this via `key`. */
export function ConversationsPanel({
  initial,
  filters,
  start,
  end,
  pageSize,
  returnTo,
}: {
  initial: GorgiasConversationList;
  filters: ConversationFilters;
  start: string;
  end: string;
  pageSize: number;
  returnTo: string;
}) {
  const [list, setList] = useState(initial);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(list.total / pageSize));

  async function goToPage(next: number) {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchPage(filters, start, end, next, pageSize);
      setList(result);
      setPage(next);
    } catch {
      setError("Could not load that page — try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {list.conversations.length === 0 ? (
        <Card className="gap-0 p-0">
          <p className="px-6 py-10 text-sm text-muted-foreground">
            {filters.q
              ? `No conversations match "${filters.q}" with the active filters.`
              : "No conversations match the active filters."}
          </p>
        </Card>
      ) : (
        <div className={`transition-opacity ${loading ? "opacity-50" : ""}`}>
          <ConversationsTable conversations={list.conversations} returnTo={returnTo} />
        </div>
      )}

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      {list.total > pageSize && (
        <nav aria-label="Conversation pages" className="mt-4 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => goToPage(page - 1)}
          >
            <ChevronLeft className="size-4" aria-hidden />
            Previous
          </Button>
          <p className="text-xs tabular-nums text-muted-foreground">
            Page {page} of {totalPages} · {list.total} conversations
          </p>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => goToPage(page + 1)}
          >
            Next
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        </nav>
      )}
    </>
  );
}
