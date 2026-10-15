"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Mail, Play } from "lucide-react";

import { Panel } from "@/components/shared/panel";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { RoleButton } from "@/components/shared/role-gate";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyPanel, FormError, RestaurantSkeleton } from "@/features/restaurant/parts";
import { useApiQuery } from "@/hooks/use-api-query";
import { COACH_FOCUSES, COACH_FOCUS_LABELS, emailable, factLine, filterBriefs, needsAction } from "@/lib/ops-coach";
import { RESTAURANT_KEY, restaurantQueries } from "@/lib/queries/restaurant";
import { cn } from "@/lib/utils";
import { emailOpsCoach, runOpsCoach } from "@/services/restaurant-os-actions";
import type { CoachDay, CoachFocus } from "@/types/restaurant-os";
import { formatCurrency, formatDateTime } from "@/utils/format";

type Filter = CoachFocus | "all" | "action";

/** The Ops Coach (SPEC-385 over backend SPEC-402): every branch's one thing to fix today. */
export function OpsCoachView() {
  const queryClient = useQueryClient();
  const setup = useApiQuery(restaurantQueries.setup());
  const isHq = setup.data?.scope.isHq ?? false;
  const [date, setDate] = useState<string | null>(null);
  const day = useApiQuery(restaurantQueries.coach(date));
  const [filter, setFilter] = useState<Filter>("action");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const result: CoachDay = await runOpsCoach(date);
      queryClient.setQueryData([...RESTAURANT_KEY, "coach", date], result);
      if (date === null && result.date) queryClient.setQueryData([...RESTAURANT_KEY, "coach", null], result);
      await queryClient.invalidateQueries({ queryKey: ["employees"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "The coach could not run.");
    } finally {
      setBusy(false);
    }
  };
  const email = async (on: string) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const result = await emailOpsCoach(on);
      setNotice(
        `Sent ${result.sent} brief${result.sent === 1 ? "" : "s"}` +
          (result.skipped.length ? ` · ${result.skipped.length} branches have no GM email` : "") +
          (result.failed.length ? ` · ${result.failed.length} could not be sent` : ""),
      );
      await queryClient.invalidateQueries({ queryKey: [...RESTAURANT_KEY, "coach"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Emailing failed.");
    } finally {
      setBusy(false);
    }
  };

  if (day.isError) return <QueryErrorState error={day.error} onRetry={() => void day.refetch()} />;
  if (!day.data) return <RestaurantSkeleton tiles={3} />;
  const data = day.data;
  const shown = filterBriefs(data.briefs, filter);
  const toFix = data.briefs.filter((b) => needsAction(b.focus)).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label htmlFor="coach-date" className="text-xs text-muted-foreground">
            Business day
          </Label>
          <Input id="coach-date" type="date" value={date ?? data.date ?? ""} onChange={(e) => setDate(e.target.value || null)} className="h-9 w-[160px]" />
        </div>
        {isHq ? (
          <>
            <RoleButton need={["network.manage"]} disabled={busy} onClick={() => void run()}>
              <Play aria-hidden /> {data.date ? "Run again" : "Run the first brief"}
            </RoleButton>
            {data.date ? (
              <RoleButton need={["network.manage"]} variant="outline" disabled={busy || emailable(data.briefs) === 0} onClick={() => void email(data.date as string)}>
                <Mail aria-hidden /> Email the GMs ({emailable(data.briefs)})
              </RoleButton>
            ) : null}
          </>
        ) : null}
      </div>
      <FormError message={error} />
      {notice ? <p className="text-sm text-muted-foreground">{notice}</p> : null}

      {!data.date ? (
        <EmptyPanel
          title="No brief yet"
          body="Every morning the Ops Coach reads each branch's day and names the one thing to fix. Head office can run the first one now."
        />
      ) : (
        <>
          {data.network ? (
            <Panel title={`The network · ${data.date}`} aside={data.network.createdAt ? <span className="text-xs text-muted-foreground">{formatDateTime(data.network.createdAt)}</span> : null}>
              <p className="p-4 text-sm leading-relaxed text-foreground">{data.network.text}</p>
            </Panel>
          ) : null}
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter briefs">
            {(["action", "all", ...COACH_FOCUSES] as Filter[]).map((key) => {
              const count =
                key === "all" ? data.briefs.length : key === "action" ? toFix : (data.counts[key as CoachFocus] ?? 0);
              if (count === 0 && key !== "action" && key !== "all") return null;
              const label = key === "all" ? "All" : key === "action" ? "To fix" : COACH_FOCUS_LABELS[key as CoachFocus];
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={filter === key}
                  onClick={() => setFilter(key)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    filter === key ? "border-foreground/40 bg-muted font-semibold" : "border-border text-muted-foreground",
                  )}
                >
                  {label} <span className="tabular-nums">{count}</span>
                </button>
              );
            })}
          </div>
          {shown.length === 0 ? (
            <EmptyPanel title="Nothing here" body={filter === "action" ? "Every branch is on track." : "No branch falls under this focus."} />
          ) : (
            <ul className="grid gap-3 lg:grid-cols-2">
              {shown.map((brief) => (
                <li key={brief.id} className="space-y-2 rounded-2xl border border-border bg-card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      <span className="tabular-nums text-muted-foreground">#{brief.facts.code}</span> {brief.facts.name}
                    </p>
                    <Badge variant="outline" className={cn(needsAction(brief.focus) ? "border-warning text-warning" : "")}>
                      {brief.focusLabel}
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground">{brief.text}</p>
                  <p className="text-xs text-muted-foreground">{factLine(brief.facts, formatCurrency).join(" · ")}</p>
                  {brief.wins.length ? <p className="text-xs text-success">Went well: {brief.wins.join(" · ")}</p> : null}
                  <p className="text-xs text-muted-foreground">
                    {brief.emailedAt ? `Emailed to the GM ${formatDateTime(brief.emailedAt)}` : brief.hasManagerEmail ? "Not emailed yet" : "No GM email on file"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
