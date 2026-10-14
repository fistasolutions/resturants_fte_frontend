"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertCircle, Check, ChevronDown, LoaderCircle } from "lucide-react";

import { RoleButton } from "@/components/shared/role-gate";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCan } from "@/hooks/use-can";
import { initials } from "@/lib/initials";
import type { GorgiasAgentSummary } from "@/types/team-performance";
import { PRODUCT } from "@/lib/product";

type RowState = "idle" | "saving" | "saved" | "error";

async function saveMapping(gorgiasAgentId: number, staffName: string): Promise<void> {
  const res = await fetch(`/api/proxy/gorgias/agents/${gorgiasAgentId}/mapping`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ staff_name: staffName }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? "Could not save this mapping.");
  }
}

function UnmappedAgentRow({ agent }: { agent: GorgiasAgentSummary }) {
  const router = useRouter();
  const [staffName, setStaffName] = useState("");
  const [state, setState] = useState<RowState>("idle");
  const [error, setError] = useState<string | null>(null);
  const can = useCan();
  const canMap = can("team_performance.manage").allowed;

  async function handleSave() {
    const trimmed = staffName.trim();
    if (!trimmed) {
      setError("Enter a staff name.");
      setState("error");
      return;
    }
    setState("saving");
    setError(null);
    try {
      await saveMapping(agent.gorgias_agent_id, trimmed);
      setState("saved");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save — try again.");
      setState("error");
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border bg-card px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-2.5 sm:w-60 sm:shrink-0">
        <Avatar size="sm">
          <AvatarFallback className="text-[0.625rem] font-medium">
            {initials(agent.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{agent.name}</p>
          <p className="truncate text-xs text-muted-foreground">{agent.email}</p>
        </div>
      </div>
      <div className="flex flex-1 items-center gap-2">
        <Label htmlFor={`agent-mapping-${agent.gorgias_agent_id}`} className="sr-only">
          Staff name for {agent.name}
        </Label>
        <Input
          id={`agent-mapping-${agent.gorgias_agent_id}`}
          value={staffName}
          onChange={(e) => {
            setStaffName(e.target.value);
            if (state !== "idle") setState("idle");
          }}
          placeholder="Staff member's name"
          disabled={!canMap}
          className="h-8 text-sm"
        />
        <RoleButton
          need="team_performance.manage"
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void handleSave()}
          disabled={state === "saving"}
        >
          {state === "saving" ? (
            <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
          ) : state === "saved" ? (
            <Check className="size-3.5 text-success" aria-hidden />
          ) : (
            "Save"
          )}
        </RoleButton>
      </div>
      {error ? (
        <p role="alert" className="text-xs text-destructive sm:basis-full">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** A-06 — unmapped Gorgias agents are surfaced here, never dropped, with an
 * inline way to resolve them (assign the matching staff member's name).
 * Collapsed by default (SPEC-094 UI polish) so the long mapping list doesn't
 * push the leaderboard below the fold; the summary line stays always visible. */
export function UnmappedAgentsBanner({ agents }: { agents: GorgiasAgentSummary[] }) {
  const [open, setOpen] = useState(false);
  if (agents.length === 0) return null;

  return (
    <div className="rounded-card border border-warning/30 bg-warning/10 p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-start gap-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
      >
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">
            {agents.length} Gorgias agent{agents.length === 1 ? "" : "s"} aren&apos;t linked to a
            staff member yet
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Their metrics are still shown below, under their Gorgias name — map them to a {PRODUCT.short}
            team member to make the table easier to read.
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground">
          {open ? "Hide" : "Map agents"}
          <ChevronDown
            className={`size-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
        </span>
      </button>
      {open ? (
        <div className="mt-3 space-y-2">
          {agents.map((agent) => (
            <UnmappedAgentRow key={agent.gorgias_agent_id} agent={agent} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
