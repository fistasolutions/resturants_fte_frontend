"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, ClipboardList } from "lucide-react";

import { Panel } from "@/components/shared/panel";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { RoleButton } from "@/components/shared/role-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyPanel, FormError, RestaurantSkeleton } from "@/features/restaurant/parts";
import { useApiQuery } from "@/hooks/use-api-query";
import { RESTAURANT_KEY, restaurantQueries } from "@/lib/queries/restaurant";
import { RESULT_LABELS, answersOf, emptyDraft, sections, unanswered, type Draft } from "@/lib/standards";
import { cn } from "@/lib/utils";
import { closeAuditAction, recordAudit } from "@/services/restaurant-os-actions";
import type { AuditPoint, AuditResult, AuditsData } from "@/types/restaurant-os";

const RESULTS: AuditResult[] = ["pass", "fail", "not_seen"];

function VisitForm({ data, onDone }: { data: AuditsData; onDone: () => Promise<void> }) {
  const [branchId, setBranchId] = useState("");
  const [visitedOn, setVisitedOn] = useState(new Date().toISOString().slice(0, 10));
  const [draft, setDraft] = useState<Draft>(emptyDraft(data.checklist));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const left = unanswered(draft);
  const set = (key: string, change: Partial<Draft[string]>) => setDraft((d) => ({ ...d, [key]: { ...d[key], ...change } }));

  const save = async () => {
    const answers = answersOf(draft);
    if (!answers || !branchId) return;
    setBusy(true);
    setError(null);
    try {
      await recordAudit(Number(branchId), visitedOn, answers);
      setDraft(emptyDraft(data.checklist));
      setBranchId("");
      await onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Saving the visit failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label htmlFor="visit-branch" className="text-xs text-muted-foreground">
            Branch
          </Label>
          <select
            id="visit-branch"
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="h-9 rounded-input border border-input bg-background px-3 text-sm text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <option value="">Choose a branch</option>
            {data.branches.map((b) => (
              <option key={b.branchId} value={String(b.branchId)}>
                {b.branch}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="visit-date" className="text-xs text-muted-foreground">
            Visited on
          </Label>
          <Input id="visit-date" type="date" value={visitedOn} onChange={(e) => setVisitedOn(e.target.value)} className="h-9 w-[160px]" />
        </div>
      </div>
      {sections(data.checklist).map((section) => (
        <Panel key={section.label} title={section.label}>
          <ul className="divide-y divide-border">
            {section.points.map((point: AuditPoint) => (
              <li key={point.key} className="space-y-2 px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex-1 text-sm text-foreground">{point.text}</span>
                  <div className="flex gap-1" role="radiogroup" aria-label={point.text}>
                    {RESULTS.map((r) => (
                      <button
                        key={r}
                        type="button"
                        role="radio"
                        aria-checked={draft[point.key]?.result === r}
                        onClick={() => set(point.key, { result: r })}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          draft[point.key]?.result === r
                            ? r === "fail"
                              ? "border-destructive/50 bg-destructive/10 font-semibold text-destructive"
                              : "border-foreground/40 bg-muted font-semibold"
                            : "border-border text-muted-foreground",
                        )}
                      >
                        {RESULT_LABELS[r]}
                      </button>
                    ))}
                  </div>
                </div>
                {draft[point.key]?.result === "fail" ? (
                  <Input
                    aria-label={`What failed: ${point.text}`}
                    placeholder="What failed (optional)"
                    value={draft[point.key].note}
                    maxLength={500}
                    onChange={(e) => set(point.key, { note: e.target.value })}
                    className="h-8"
                  />
                ) : null}
              </li>
            ))}
          </ul>
        </Panel>
      ))}
      <FormError message={error} />
      <RoleButton need={["network.manage"]} disabled={busy || left > 0 || !branchId} onClick={() => void save()}>
        {left > 0 ? `${left} points to answer` : busy ? "Saving…" : "Save the visit"}
      </RoleButton>
    </div>
  );
}

/** Brand Standards (SPEC-392 over backend SPEC-411). */
export function StandardsView() {
  const queryClient = useQueryClient();
  const data = useApiQuery(restaurantQueries.audits(null));
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: [...RESTAURANT_KEY, "audits"] });
    await queryClient.invalidateQueries({ queryKey: ["employees"] });
  };

  if (data.isError) return <QueryErrorState error={data.error} onRetry={() => void data.refetch()} />;
  if (!data.data) return <RestaurantSkeleton tiles={3} />;
  const page = data.data;

  const close = async (auditId: number, key: string) => {
    setError(null);
    try {
      await closeAuditAction(auditId, key);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Closing the action failed.");
    }
  };

  if (recording) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setRecording(false)}>
          Back to the network
        </Button>
        <VisitForm
          data={page}
          onDone={async () => {
            await refresh();
            setRecording(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <RoleButton need={["network.manage"]} onClick={() => setRecording(true)}>
        <ClipboardList aria-hidden /> Record a visit
      </RoleButton>
      <FormError message={error} />
      <Panel title="Branches" count={String(page.branches.length)}>
        <ul className="divide-y divide-border">
          {page.branches.map((b) => (
            <li key={b.branchId} className="flex flex-wrap items-center gap-3 px-4 py-2 text-sm">
              <span className="flex-1 font-medium">{b.branch}</span>
              {b.score !== null ? <span className="tabular-nums">{b.score}</span> : null}
              {b.grade ? <span className="text-muted-foreground">{b.grade}</span> : null}
              <span className="text-xs text-muted-foreground">
                {b.lastVisit ? `Visited ${b.daysSince} days ago` : "Never visited"}
              </span>
              {b.overdue ? <Badge variant="secondary">Visit due</Badge> : null}
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title="Open corrective actions" count={String(page.openActions.length)}>
        {page.openActions.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">Nothing open.</p>
        ) : (
          <ul className="divide-y divide-border">
            {page.openActions.map((a) => (
              <li key={`${a.auditId}-${a.key}`} className="flex flex-wrap items-center gap-3 px-4 py-2 text-sm">
                <span className="flex-1">
                  <span className="font-medium">{a.branch}</span> · {a.text}
                </span>
                <span className={cn("text-xs", a.overdue ? "font-semibold text-destructive" : "text-muted-foreground")}>
                  Due {a.dueOn}
                </span>
                <RoleButton need={["network.manage"]} size="sm" variant="outline" onClick={() => void close(a.auditId, a.key)}>
                  <Check aria-hidden /> Done
                </RoleButton>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      {page.audits.length === 0 ? (
        <EmptyPanel title="No visits yet" body="Record a QSC visit to score a branch against the brand's checklist." />
      ) : (
        <Panel title="Visits" count={String(page.audits.length)}>
          <ul className="divide-y divide-border">
            {page.audits.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 px-4 py-2 text-sm">
                <span className="flex-1 font-medium">{a.branch}</span>
                <span className="tabular-nums">{a.score ?? "—"}</span>
                <span className="text-muted-foreground">{a.grade}</span>
                <span className="text-xs text-muted-foreground">
                  {a.visitedOn} · {a.auditor} · Q {a.sectionScores.quality ?? "—"} · S {a.sectionScores.service ?? "—"} · C{" "}
                  {a.sectionScores.cleanliness ?? "—"}
                </span>
                {a.openActions ? <Badge variant="secondary">{a.openActions} open</Badge> : null}
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
