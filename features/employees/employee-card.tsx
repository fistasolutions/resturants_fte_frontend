import { ArrowRight, ChevronRight, History } from "lucide-react";
import Link from "next/link";

import { StatusBadge } from "@/components/shared/status-badge";
import { Card } from "@/components/ui/card";
import { EmployeeCharacter } from "@/features/employees/employee-character";
import { ConnectRow, EmployeeSwitch, useEmployeeSwitch } from "@/features/employees/employee-switch";
import { CHARACTERS } from "@/lib/employee-character";
import { figureText, lastLine, statusTone } from "@/lib/employees";
import { cn } from "@/lib/utils";
import type { Employee, EmployeeAction } from "@/types/employees";

/**
 * A row that asks the owner for something: approvals waiting, or the set-up action a
 * never-run employee needs. It sits above the card's stretched link (`relative z-10`),
 * so it is its own click without an anchor inside an anchor.
 */
function AskRow({
  action,
  count,
  tone,
}: {
  action: EmployeeAction;
  count?: number;
  tone: "warning" | "info";
}) {
  return (
    <Link
      href={action.href}
      className={cn(
        "relative z-10 flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
        tone === "warning"
          ? "border-warning/30 bg-warning/10 text-warning hover:bg-warning/15"
          : "border-info/30 bg-info/10 text-info hover:bg-info/15",
      )}
    >
      <span className="truncate">
        {count !== undefined ? <span className="font-bold tabular-nums">{count} </span> : null}
        {action.label}
      </span>
      <ChevronRight className="size-4 shrink-0" aria-hidden />
    </Link>
  );
}

/**
 * One digital employee (SPEC-290, redrawn in SPEC-291). Its character stands on a
 * stage at the left and does its job when the card is hovered or focused; the name
 * is the card's link, stretched over the whole card so the card is one click, and the
 * Needs-you / Set-up row sits above it as its own link. Below, the three figures as
 * one hairline strip, then the last thing it did.
 *
 * SPEC-359: in a guided organization the card carries its Active switch. Switched off, the
 * character is dimmed and the card is not a link (the page is locked anyway); switched on
 * without its integration, a Connect row takes the set-up row's place.
 */
export function EmployeeCard({ employee, now }: { employee: Employee; now: Date }) {
  const footer = lastLine(employee, now);
  const { does } = CHARACTERS[employee.key];
  const toggle = useEmployeeSwitch(employee.key);
  const off = !toggle.active;
  return (
    <Card
      data-employee-card={employee.key}
      className="group/employee relative h-full gap-4 p-4 transition-colors hover:ring-foreground/20 focus-within:ring-foreground/20"
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "emp-stage relative size-24 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-b from-muted to-card ring-1 ring-border transition-colors group-hover/employee:from-ai/15 group-hover/employee:ring-ai/30 group-focus-within/employee:from-ai/15 sm:size-32",
            off && "opacity-50 grayscale",
          )}
          title={does}
        >
          <EmployeeCharacter employee={employee} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-semibold leading-tight">
                {off ? (
                  employee.name
                ) : (
                  <Link
                    href={employee.href}
                    className="rounded-sm outline-none after:absolute after:inset-0 after:rounded-card after:content-[''] focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {employee.name}
                  </Link>
                )}
              </h2>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {employee.role} · {employee.department}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <EmployeeSwitch name={employee.name} model={toggle} />
              {off ? null : (
                <StatusBadge tone={statusTone(employee.status)}>{employee.statusLabel}</StatusBadge>
              )}
            </div>
          </div>
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{employee.job}</p>
          {toggle.error ? (
            <p className="text-xs text-destructive" role="alert">
              {toggle.error}
            </p>
          ) : null}
          {off ? (
            <p className="text-xs text-muted-foreground">
              {toggle.canSwitch
                ? "Switched off. Switch it on to add it to your sidebar."
                : "Switched off."}
            </p>
          ) : toggle.missing ? (
            <ConnectRow integration={toggle.missing} />
          ) : employee.needsYou ? (
            <AskRow action={employee.needsYou} count={employee.needsYou.count} tone="warning" />
          ) : employee.setup ? (
            <AskRow action={employee.setup} tone="info" />
          ) : (
            <p className="text-xs text-muted-foreground">{employee.statusNote}</p>
          )}
        </div>
      </div>

      <dl
        className="grid grid-cols-3 divide-x divide-border rounded-xl border border-border bg-muted/30"
        aria-label={`${employee.name} figures`}
      >
        {employee.figures.map((figure) => (
          <div key={figure.key} className="min-w-0 px-3 py-2">
            <dt className="line-clamp-2 text-[10px] font-extrabold uppercase leading-tight tracking-widest text-muted-foreground">
              {figure.label}
            </dt>
            <dd
              className={cn(
                "mt-0.5 truncate text-lg font-bold leading-tight tracking-tight tabular-nums",
                figure.value === null ? "text-muted-foreground" : "text-foreground",
              )}
            >
              {figureText(figure, employee.status)}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3 text-xs">
        <p className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
          <History className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">{footer ?? "Nothing recorded yet."}</span>
        </p>
        {off ? null : (
          <span className="inline-flex shrink-0 items-center gap-1 font-medium text-foreground transition-transform group-hover/employee:translate-x-0.5">
            Open <ArrowRight className="size-3.5" aria-hidden />
          </span>
        )}
      </div>
    </Card>
  );
}
