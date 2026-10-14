"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Play } from "lucide-react";

import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCan } from "@/hooks/use-can";
import { generatablePeriods } from "@/lib/tax-report";

/**
 * Manual report generation (SPEC-166 Patches).
 *
 * The client's plan is explicitly manual-first: generate, cross-verify against
 * the existing Report Pundit output, and only switch the schedule on once the
 * numbers agree. This runs the identical backend code path as the scheduled
 * job (backend SPEC-171 §4), so what he validates here is what automation will
 * later produce.
 */
export function GenerateForm() {
  const router = useRouter();
  // Computed once per mount: the option list depends on today's date, and
  // recomputing every render would be wasted work.
  const options = useMemo(() => generatablePeriods(new Date()), []);
  const [selected, setSelected] = useState(options[0]?.key ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const can = useCan();
  const gate = can("tax_reports.manage");

  const option = options.find((o) => o.key === selected) ?? options[0];

  async function generate() {
    if (!option || busy) return;
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      const response = await fetch(
        `/api/proxy/tax-reports/generate?year=${option.year}&month=${option.month}&period=${option.period}`,
        { method: "POST" },
      );
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.error?.message ?? `Could not generate (${response.status}).`);
      }
      // Say plainly whether it reconciled — that is the one thing worth knowing
      // before downloading, and the client wrote those words himself.
      setDone(`${body.period_label} — ${body.status} · ${body.row_count} rows`);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not generate the report.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="gap-3 p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1 sm:max-w-xs">
          <label
            htmlFor="tax-report-period"
            className="mb-1.5 block text-[11px] font-medium tracking-wide text-muted-foreground uppercase"
          >
            Reporting period
          </label>
          <Select value={selected} onValueChange={setSelected} disabled={busy}>
            <SelectTrigger id="tax-report-period" className="h-9 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((item) => (
                <SelectItem key={item.key} value={item.key}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <button
          type="button"
          onClick={generate}
          disabled={busy || !option || !gate.allowed}
          title={gate.reason ?? undefined}
          className="inline-flex h-9 items-center gap-2 rounded-[10px] bg-primary px-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Play className="size-4" aria-hidden />
          )}
          {busy ? "Generating…" : "Generate report"}
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        Uses the same calculation as the automatic run. Regenerating a period replaces its
        file rather than creating a duplicate.
      </p>

      {/* Live region: generation takes a few seconds, so the result must be
          announced rather than only appearing visually. */}
      <div aria-live="polite" className="min-h-0">
        {error && <p className="text-xs font-medium text-destructive">{error}</p>}
        {gate.reason && <p className="text-xs text-muted-foreground">{gate.reason}</p>}
        {done && <p className="text-xs font-medium text-foreground">{done}</p>}
      </div>
    </Card>
  );
}
