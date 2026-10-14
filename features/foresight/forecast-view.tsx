"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle, Pencil, Target, X } from "lucide-react";

import { RoleGate } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ForecastPace, ForecastStoreRow, PaceStatus } from "@/types/foresight";
import { formatCompactCurrency } from "@/utils/format";
import { GlispIcon } from "@/components/shared/glisp-icon";

const DELTA: Record<PaceStatus, { bar: string; text: string }> = {
  ahead: { bar: "bg-success", text: "text-success" },
  on_track: { bar: "bg-success", text: "text-muted-foreground" },
  behind: { bar: "bg-warning", text: "text-destructive" },
  no_goal: { bar: "bg-muted-foreground/40", text: "text-muted-foreground" },
};

function Tile({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <Card className="gap-1 p-4">
      <span className="text-[10.5px] font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      <span className={`font-heading text-2xl tracking-tight tabular-nums ${tone ?? ""}`}>{value}</span>
      {sub && <span className="text-[11.5px] text-muted-foreground">{sub}</span>}
    </Card>
  );
}

/** Inline per-store goal editor — posts to the per-location goal endpoint and refreshes
 * the server component so the pace recomputes. `locationId` null = online bucket. */
function GoalEditor({
  locationId,
  goal,
  compact,
}: {
  locationId: number | null;
  goal: number | null;
  compact?: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(goal ? String(goal) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const parsed = value.trim() ? Number(value.replace(/[^0-9.]/g, "")) : null;
      const res = await fetch("/api/proxy/settings/location-goal", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location_id: locationId, goal: parsed }),
      });
      if (!res.ok) throw new Error("Could not save the goal.");
      setEditing(false);
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save — try again.");
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <RoleGate need="settings.manage">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <Pencil className="size-3" aria-hidden />
          {goal === null ? "Set goal" : compact ? "Edit" : "Edit goal"}
        </button>
      </RoleGate>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1.5">
        <Target className="size-3.5 text-muted-foreground" aria-hidden />
        <Input
          type="text"
          inputMode="numeric"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
          placeholder="e.g. 250000"
          className="h-7 w-32 text-sm"
        />
        <Button type="button" size="sm" className="h-7 px-2" onClick={save} disabled={saving}>
          {saving ? (
            <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <Check className="size-3.5" aria-hidden />
          )}
        </Button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Cancel"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

/** Foresight → Forecast & Pace-to-Goal (SPEC-153): company projection vs goal, then a
 * live pace-by-store breakdown (each store's own goal, set inline) and an AI read. */
export function ForecastView({ data }: { data: ForecastPace }) {
  const behindTone = data.status === "behind" ? "text-warning" : "text-success";

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {data.month_label} · day {data.days_elapsed} of {data.days_in_month}
      </p>

      <section className="grid gap-4 sm:grid-cols-3">
        <Tile
          label="Month goal"
          value={data.has_goal ? formatCompactCurrency(data.goal ?? 0) : "—"}
          sub={data.has_goal ? "sum of store goals" : "set store goals below"}
        />
        <Tile
          label="Projected finish"
          value={formatCompactCurrency(data.projected)}
          sub={
            data.has_goal && data.pct_to_goal !== null
              ? data.status === "behind"
                ? `▼ ${(100 - data.pct_to_goal).toFixed(0)}% behind goal`
                : `▲ on track (${data.pct_to_goal}% of goal)`
              : "at the current run rate"
          }
          tone={data.has_goal ? behindTone : ""}
        />
        <Tile
          label="To get back on pace"
          value={
            data.has_goal && data.catch_up_per_day
              ? `+${formatCompactCurrency(data.catch_up_per_day)}/day`
              : data.has_goal
                ? "on pace"
                : "—"
          }
          sub={data.has_goal ? `over the remaining ${data.days_remaining} days` : ""}
        />
      </section>

      <Card className="gap-0 p-0">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold">◔ Pace by store — actual vs projected vs goal</h3>
        </div>
        <div className="px-4 py-1">
          {data.stores.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No store revenue yet this month.
            </p>
          ) : (
            data.stores.map((row) => <PaceRowWithDay key={row.location_id ?? row.location} row={row} day={data.days_elapsed} />)
          )}
        </div>
        {data.ai_read && (
          <div className="flex items-start gap-2.5 border-t border-ai/25 bg-ai/5 px-4 py-3">
            <GlispIcon className="mt-0.5 size-4 shrink-0 text-ai" aria-hidden />
            <p className="text-sm text-ai">
              <span className="font-semibold">AI read: </span>
              {data.ai_read}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

/** PaceRow with the day number threaded into the "% of goal on day N" footer. */
function PaceRowWithDay({ row, day }: { row: ForecastStoreRow; day: number }) {
  const d = DELTA[row.status];
  const hasGoal = row.goal !== null;
  const fill = Math.max(2, Math.min(100, row.goal_reached_pct ?? 0));
  const mark = Math.max(0, Math.min(100, row.expected_pct));

  return (
    <div className="border-b border-border py-3 last:border-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-sm font-semibold">{row.location}</span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatCompactCurrency(row.mtd)} so far · projecting{" "}
            <span className="font-semibold text-foreground">{formatCompactCurrency(row.projected)}</span>
            {hasGoal && <> vs {formatCompactCurrency(row.goal ?? 0)} goal</>}
          </span>
          <GoalEditor locationId={row.location_id} goal={row.goal} compact />
        </div>
      </div>

      {hasGoal ? (
        <>
          <div className="relative mt-2 h-3 overflow-hidden rounded-full bg-muted">
            <div className={`absolute left-0 top-0 h-full rounded-full ${d.bar}`} style={{ width: `${fill}%` }} />
            <div className="absolute -top-0.5 h-4 w-0.5 bg-foreground" style={{ left: `${mark}%` }} aria-hidden />
          </div>
          <div className="mt-1.5 flex justify-between text-[11px]">
            <span className="text-muted-foreground tabular-nums">
              {row.goal_reached_pct}% of goal on day {day}
            </span>
            <span className={`font-medium tabular-nums ${d.text}`}>
              {row.status === "on_track"
                ? "on pace"
                : row.delta_pct !== null
                  ? `${row.delta_pct >= 0 ? "▲" : "▼"} ${Math.abs(row.delta_pct)}% ${row.delta_pct >= 0 ? "ahead of pace" : "behind"}`
                  : ""}
            </span>
          </div>
        </>
      ) : (
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          No goal set — projecting {formatCompactCurrency(row.projected)} at the current run rate. Set a
          goal to track pace.
        </p>
      )}
    </div>
  );
}
