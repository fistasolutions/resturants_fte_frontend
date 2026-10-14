"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Download, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ConversationFilters } from "@/lib/gorgias-filters";

interface AgentOption {
  gorgias_agent_id: number;
  name: string;
  staff_name: string | null;
}

interface ReasonOption {
  reason: string;
  count: number;
}

const SELECT_CLASS =
  "h-9 rounded-lg border bg-card px-2.5 text-sm text-card-foreground outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring";

/** Conversation Log controls (SPEC-094): search + status + agent filters
 * (URL-driven, so they survive with the shared date range) + an Export CSV
 * link that honors the exact active filters. */
export function ConversationsControls({
  filters,
  agents,
  reasons,
  exportHref,
}: {
  filters: ConversationFilters;
  agents: AgentOption[];
  reasons: ReasonOption[];
  exportHref: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(filters.q);

  function commit(next: URLSearchParams) {
    next.delete("page");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    commit(next);
  }

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    setParam("q", q.trim() || null);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <form onSubmit={submitSearch} role="search" className="relative w-full max-w-xs">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Search subject, customer, order…"
          aria-label="Search conversations"
          className="pl-9"
        />
      </form>

      <label className="sr-only" htmlFor="gorgias-status">
        Status
      </label>
      <select
        id="gorgias-status"
        value={filters.status ?? ""}
        onChange={(event) => setParam("status", event.target.value || null)}
        className={SELECT_CLASS}
      >
        <option value="">All statuses</option>
        <option value="open">Open</option>
        <option value="closed">Closed</option>
      </select>

      <label className="sr-only" htmlFor="gorgias-agent">
        Agent
      </label>
      <select
        id="gorgias-agent"
        value={filters.agentId !== null ? String(filters.agentId) : ""}
        onChange={(event) => setParam("agent_id", event.target.value || null)}
        className={SELECT_CLASS}
      >
        <option value="">All agents</option>
        {agents.map((agent) => (
          <option key={agent.gorgias_agent_id} value={agent.gorgias_agent_id}>
            {agent.staff_name ?? agent.name}
          </option>
        ))}
      </select>

      {reasons.length > 0 ? (
        <>
          <label className="sr-only" htmlFor="gorgias-reason">
            Contact reason
          </label>
          <select
            id="gorgias-reason"
            value={filters.reason ?? ""}
            onChange={(event) => setParam("reason", event.target.value || null)}
            className={SELECT_CLASS}
          >
            <option value="">All reasons</option>
            {reasons.map((r) => (
              <option key={r.reason} value={r.reason}>
                {r.reason} ({r.count})
              </option>
            ))}
          </select>
        </>
      ) : null}

      <Button variant="outline" size="sm" asChild className="ml-auto">
        <a href={exportHref} download>
          <Download className="size-4" aria-hidden />
          Export CSV
        </a>
      </Button>
    </div>
  );
}
