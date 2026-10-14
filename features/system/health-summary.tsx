import { Card } from "@/components/ui/card";
import { headlineVerdict } from "@/lib/system-trace";
import type { SystemTotals } from "@/types/system";

function Stat({
  label,
  value,
  foot,
  tone,
}: {
  label: string;
  value: string | number;
  foot: string;
  tone?: "bad" | "warn" | "good";
}) {
  return (
    <Card className="gap-0 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`mt-1.5 text-[28px] leading-none font-semibold tracking-tight tabular-nums ${
          tone === "bad"
            ? "text-destructive"
            : tone === "warn"
              ? "text-warning"
              : tone === "good"
                ? "text-success"
                : "text-foreground"
        }`}
      >
        {value}
      </p>
      <p className="mt-2.5 text-xs text-muted-foreground">{foot}</p>
    </Card>
  );
}

/**
 * The headline (SPEC-228). A clean estate is a real answer and renders as one — "all
 * 23 running on time" is the sentence this page exists to be able to say, and an
 * empty state in its place would read as though nothing had been checked.
 */
export function HealthSummary({ totals }: { totals: SystemTotals }) {
  const problems = totals.failing + totals.neverRun;
  const running = Math.max(
    0,
    totals.runs24h - totals.succeeded24h - totals.errors24h - totals.skipped24h,
  );
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{headlineVerdict(totals)}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Jobs watched"
          value={totals.jobs}
          foot="Every job on the schedule, whether or not it has ever run."
        />
        <Stat
          label="Needs attention"
          value={problems}
          tone={problems > 0 ? "bad" : "good"}
          foot={
            problems > 0
              ? `${totals.failing} failing · ${totals.neverRun} never run`
              : "Nothing failing, nothing missing."
          }
        />
        <Stat
          label="Overdue"
          value={totals.stale}
          tone={totals.stale > 0 ? "warn" : undefined}
          foot="No success within its own cadence."
        />
        <Stat
          label="Runs today"
          value={totals.runs24h}
          foot={
            // Skipped is reported beside errors, never folded into them: the gate
            // skips on purpose and would otherwise read as 96 failures a day.
            //
            // In-flight runs are counted in the total, so they are named here too —
            // "5 runs · 2 succeeded, 0 failed, 0 skipped" is arithmetic that does not
            // reconcile, on a page whose whole subject is whether things ran.
            [
              `${totals.succeeded24h} succeeded`,
              `${totals.errors24h} failed`,
              `${totals.skipped24h} skipped`,
              ...(running > 0 ? [`${running} running`] : []),
            ].join(" · ")
          }
        />
      </div>
    </div>
  );
}
