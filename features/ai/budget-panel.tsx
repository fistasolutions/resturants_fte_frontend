"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { RoleButton } from "@/components/shared/role-gate";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCan } from "@/hooks/use-can";
import { formatUsd } from "@/lib/ai-value";
import type { AiSpendCap, AiSurface } from "@/types/ai-value";

const PLATFORM = "platform";

/** Ceilings the owner sets, and the kill switches that stop a surface outright.
 *
 * Deliberately **not** optimistic: a ceiling that looks saved and is not is precisely
 * the failure this whole feature exists to prevent, so every change waits for the server
 * and the page re-reads afterwards.
 */
export function BudgetPanel({
  caps,
  surfaces,
}: {
  caps: AiSpendCap[];
  surfaces: AiSurface[];
}) {
  const router = useRouter();
  const can = useCan();
  const gate = can("ai.manage");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newScope, setNewScope] = useState(PLATFORM);
  const [newAmount, setNewAmount] = useState("");
  const [newPeriod, setNewPeriod] = useState<"month" | "run">("month");

  async function save(body: Record<string, unknown>, key: string) {
    setBusy(key);
    setError(null);
    try {
      const response = await fetch("/api/proxy/ai-value/caps", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error("The ceiling was not saved.");
      router.refresh();
    } catch {
      setError("That did not save. The ceiling is unchanged.");
    } finally {
      setBusy(null);
    }
  }

  async function remove(scope: string, period: string) {
    setBusy(`${scope}-${period}`);
    setError(null);
    try {
      const response = await fetch(
        `/api/proxy/ai-value/caps?scope=${encodeURIComponent(scope)}&period=${period}`,
        { method: "DELETE" },
      );
      if (!response.ok) throw new Error("not removed");
      router.refresh();
    } catch {
      setError("That did not delete. The ceiling is still in place.");
    } finally {
      setBusy(null);
    }
  }

  const labelFor = (scope: string) =>
    scope === PLATFORM
      ? "Whole platform"
      : (surfaces.find((s) => s.key === scope)?.label ?? scope);

  return (
    <Card className="gap-0 p-4">
      <p className="text-sm font-semibold">Budget guard</p>
      <p className="mt-0.5 mb-3 text-xs text-muted-foreground">
        Checked before an expensive run starts — not after the provider has billed it.
        Chat is never capped: someone is waiting on the answer.
      </p>

      {error && (
        <p className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
          {error}
        </p>
      )}

      {caps.length === 0 && (
        <p className="mb-3 text-sm text-muted-foreground">
          No ceilings set. AI spend is currently uncapped.
        </p>
      )}

      {caps.map((cap) => {
        const key = `${cap.scope}-${cap.period}`;
        return (
          <div key={key} className="border-b border-border py-3 last:border-b-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{labelFor(cap.scope)}</span>
                <span className="block text-xs text-muted-foreground">
                  {cap.period === "run" ? "most one run may cost" : "calendar-month ceiling"}
                  {cap.paused && cap.pausedReason ? ` · ${cap.pausedReason}` : ""}
                </span>
              </span>
              <Input
                type="number"
                min={0}
                step="1"
                defaultValue={cap.limitUsd}
                aria-label={`${labelFor(cap.scope)} limit in dollars`}
                className="h-8 w-24 tabular-nums"
                disabled={!gate.allowed}
                title={gate.reason ?? undefined}
                onBlur={(e) => {
                  const next = Number(e.currentTarget.value);
                  if (Number.isFinite(next) && next !== cap.limitUsd) {
                    void save(
                      { scope: cap.scope, period: cap.period, limit_usd: next },
                      key,
                    );
                  }
                }}
              />
              <RoleButton
                need="ai.manage"
                type="button"
                variant={cap.paused ? "default" : "outline"}
                size="sm"
                disabled={busy === key}
                onClick={() =>
                  void save(
                    {
                      scope: cap.scope,
                      period: cap.period,
                      paused: !cap.paused,
                      paused_reason: cap.paused ? null : "Paused from the AI page.",
                    },
                    key,
                  )
                }
              >
                {cap.paused ? "Resume" : "Pause"}
              </RoleButton>
              <RoleButton
                need="ai.manage"
                type="button"
                variant="ghost"
                size="sm"
                disabled={busy === key}
                onClick={() => void remove(cap.scope, cap.period)}
              >
                Delete
              </RoleButton>
            </div>
          </div>
        );
      })}

      <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-border pt-3">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Surface
          <select
            value={newScope}
            disabled={!gate.allowed}
            onChange={(e) => setNewScope(e.target.value)}
            className="h-8 rounded-md border border-border bg-card px-2 text-sm text-foreground"
          >
            <option value={PLATFORM}>Whole platform</option>
            {surfaces
              .filter((s) => s.key !== "chat")
              .map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Period
          <select
            value={newPeriod}
            disabled={!gate.allowed}
            onChange={(e) => setNewPeriod(e.target.value as "month" | "run")}
            className="h-8 rounded-md border border-border bg-card px-2 text-sm text-foreground"
          >
            <option value="month">Per month</option>
            <option value="run">Per run</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Limit (USD)
          <Input
            type="number"
            min={0}
            step="1"
            value={newAmount}
            disabled={!gate.allowed}
            onChange={(e) => setNewAmount(e.target.value)}
            className="h-8 w-28 tabular-nums"
            placeholder="600"
          />
        </label>
        <RoleButton
          need="ai.manage"
          type="button"
          size="sm"
          disabled={!newAmount || busy === "new"}
          onClick={() => {
            void save(
              { scope: newScope, period: newPeriod, limit_usd: Number(newAmount) },
              "new",
            );
            setNewAmount("");
          }}
        >
          {busy === "new" ? "Saving…" : "Set ceiling"}
        </RoleButton>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        A ceiling stops images, video and article writing when it is reached. If the check
        itself fails the run is allowed — a database blip must not become a new way for
        the platform to stop working.
      </p>
      {caps.some((c) => c.period === "month" && c.scope === PLATFORM) && (
        <p className="mt-1 text-xs text-muted-foreground">
          Platform ceiling:{" "}
          <b className="text-foreground">
            {formatUsd(caps.find((c) => c.scope === PLATFORM)?.limitUsd ?? 0)}
          </b>{" "}
          a month.
        </p>
      )}
    </Card>
  );
}
