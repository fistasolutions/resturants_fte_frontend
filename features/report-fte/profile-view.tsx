import { StatusBadge } from "@/components/shared/status-badge";
import { StatusDot } from "@/components/shared/panel";
import { Card } from "@/components/ui/card";
import { ScoreTiles } from "@/features/report-fte/score-tiles";
import { cn } from "@/lib/utils";
import type { ProfileData } from "@/types/report-fte";

/**
 * Report FTE → Profile (SPEC-256). A digital employee has five things a human
 * employee has: a job description, a scope of authority, a shift, a manager and one
 * number it is judged on. This page is those five.
 */
export function ProfileView({ data }: { data: ProfileData }) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-4">
        <Card className="gap-4 p-4">
          <div className="flex items-start gap-3">
            <span
              aria-hidden
              className="relative grid size-12 shrink-0 place-items-center rounded-xl bg-foreground text-lg font-semibold text-background"
            >
              RF
              <span className="absolute -right-1 -top-1 size-3 rounded-full border-2 border-card bg-brand" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-foreground">{data.employee.name}</h2>
              <p className="text-xs text-muted-foreground">
                {data.employee.department} · hired {data.hired}
              </p>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Job description</p>
            <p className="mt-1 max-w-prose text-sm leading-relaxed text-foreground">
              Builds any report the owner or a manager asks for, from the figures the analytics engine computes — never
              from figures of its own. Proposes the plan first, composes only from tool results, writes the narrative in
              the brand&apos;s voice with every number cited, and delivers on the schedule it was given.{" "}
              {data.employee.judgedOn}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
              What it may do — the authority ladder
            </p>
            <ol className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5" aria-label="Authority ladder">
              {data.ladder.map((rung) => {
                const now = rung.level === data.currentLevel;
                return (
                  <li
                    key={rung.level}
                    aria-current={now ? "step" : undefined}
                    className={cn(
                      "rounded-xl border px-3 py-2",
                      now ? "border-success bg-success/10" : "border-border bg-card",
                    )}
                  >
                    <p className={cn("text-xs font-semibold", now ? "text-success" : "text-foreground")}>
                      L{rung.level} · {rung.title}
                    </p>
                    <p className="text-[11px] leading-snug text-muted-foreground">{rung.body}</p>
                  </li>
                );
              })}
            </ol>
            <p className="mt-2 text-[11px] text-muted-foreground">{data.promotionNote}</p>
          </div>
        </Card>

        <Card className="gap-2 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            Guardrails <StatusBadge tone="success">enforced by test</StatusBadge>
          </h3>
          <ul className="divide-y divide-border">
            {data.guardrails.map((guardrail) => (
              <li key={guardrail.title} className="flex items-start justify-between gap-3 py-2">
                <div className="flex min-w-0 gap-2">
                  <span className="pt-1.5">
                    <StatusDot tone={guardrail.state === "on" ? "ok" : "neutral"} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{guardrail.title}</p>
                    <p className="text-[11px] text-muted-foreground">{guardrail.body}</p>
                  </div>
                </div>
                <StatusBadge tone={guardrail.state === "on" ? "success" : "neutral"}>{guardrail.state}</StatusBadge>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <Card className="gap-3 p-4">
          <h3 className="text-sm font-semibold text-foreground">Scorecard · {data.scorecardMonth}</h3>
          <ScoreTiles tiles={data.scorecard} columns={2} label={`Scorecard for ${data.scorecardMonth}`} />
          <p className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Its number:</span> {data.itsNumber}
          </p>
        </Card>
        <Card className="gap-2 p-4">
          <h3 className="text-sm font-semibold text-foreground">Shift</h3>
          <ul className="divide-y divide-border">
            {data.shift.map((entry) => (
              <li key={entry.when} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{entry.when}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{entry.what}</p>
                </div>
                <StatusBadge tone={entry.cadence === "on demand" ? "ai" : "neutral"}>{entry.cadence}</StatusBadge>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
