import Link from "next/link";
import { AlertTriangle, Clock, Frown, MailQuestion } from "lucide-react";

import { formatNumber } from "@/utils/format";
import type { GorgiasAlertCounts } from "@/types/gorgias";

type Tone = "destructive" | "warning" | "muted";

interface AlertDef {
  key: keyof GorgiasAlertCounts;
  label: string;
  icon: typeof AlertTriangle;
  /** Tone when the count is non-zero. */
  tone: Tone;
}

const ALERTS: AlertDef[] = [
  { key: "unanswered", label: "Unanswered", icon: MailQuestion, tone: "destructive" },
  { key: "over_24h", label: "Open > 24h", icon: Clock, tone: "warning" },
  { key: "unhappy", label: "Unhappy customers", icon: Frown, tone: "destructive" },
  { key: "reopened", label: "Reopened", icon: AlertTriangle, tone: "warning" },
];

function toneClasses(tone: Tone, active: boolean): string {
  if (!active) return "bg-card ring-foreground/10 text-muted-foreground";
  if (tone === "destructive") return "bg-destructive/10 ring-destructive/20 text-destructive";
  return "bg-warning/10 ring-warning/20 text-warning";
}

/** Overview alerts strip (SPEC-094) — the client's green/amber/red signal.
 * Zero counts stay neutral (green-by-absence); non-zero light up amber/red.
 * Each card links to the Alerts tab. */
export function OverviewAlertsStrip({
  counts,
  alertsHref,
}: {
  counts: GorgiasAlertCounts;
  alertsHref: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {ALERTS.map(({ key, label, icon: Icon, tone }) => {
        const count = counts[key];
        const active = count > 0;
        return (
          <Link
            key={key}
            href={alertsHref}
            className={`flex items-center justify-between rounded-card p-4 ring-1 transition-colors hover:ring-foreground/20 ${toneClasses(
              tone,
              active,
            )}`}
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <Icon className="size-4" aria-hidden />
              {label}
            </span>
            <span className="font-heading text-xl tracking-wide tabular-nums">
              {formatNumber(count)}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
