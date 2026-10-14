import type { DiscountSignal } from "@/lib/discount-share";

const SIGNAL_CLS: Record<DiscountSignal, string> = {
  green: "bg-success/10 text-success border-success/20",
  yellow: "bg-warning/10 text-warning border-warning/20",
  red: "bg-destructive/10 text-destructive border-destructive/20",
};

const SIGNAL_LABEL: Record<DiscountSignal, string> = {
  green: "All clear",
  yellow: "Review",
  red: "Needs attention",
};

/** Company traffic-light — policy signal, NOT a manager-approval record. */
export function SignalBadge({ signal }: { signal: DiscountSignal }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${SIGNAL_CLS[signal]}`}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {SIGNAL_LABEL[signal]}
    </span>
  );
}

const REASON_LABEL: Record<string, string> = {
  unusually_large: "Large",
  over_pct_limit: "Over % limit",
  stacked: "Stacked",
};

export function ReasonBadge({ reason, severity }: { reason: string; severity: "red" | "yellow" }) {
  const cls =
    severity === "red"
      ? "bg-destructive/10 text-destructive border-destructive/20"
      : "bg-warning/10 text-warning border-warning/20";
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium border ${cls}`}>
      {REASON_LABEL[reason] ?? reason}
    </span>
  );
}
