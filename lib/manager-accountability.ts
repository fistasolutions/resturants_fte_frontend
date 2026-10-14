/**
 * Results → Managers (SPEC-241, backend SPEC-248) — the pure bits of the view: how an
 * act-rate, a first move and a last nudge read; the summary tiles; and the one sentence
 * a send result becomes. Every count arrives grouped by the backend; nothing here
 * derives a figure (root Rule 8).
 */

import type {
  ManagerAccountability,
  ManagerRow,
  ReportCardScoreboard,
  ReportCardSendResult,
} from "@/types/results";
import { formatNumber, formatPercent } from "@/utils/format";

export type Tone = "good" | "warn" | "muted";

/** ≥ 60 % of measured nudges worked reads as good; below that the owner should call. */
export const ACT_RATE_GOOD = 0.6;

export function actRateCell(row: ManagerRow): { text: string; tone: Tone } {
  if (row.actRate === null) {
    return { text: row.nudges === 0 ? "—" : "measuring", tone: "muted" };
  }
  return {
    text: formatPercent(row.actRate * 100),
    tone: row.actRate >= ACT_RATE_GOOD ? "good" : "warn",
  };
}

/** "3.4 h" — hours until the first order on a list shipped; "—" where not measurable. */
export function firstMoveText(row: ManagerRow): string {
  if (row.medianRespondedHours === null) return "—";
  const h = row.medianRespondedHours;
  return h >= 48 ? `${Math.round(h / 24)} d` : `${h.toLocaleString("en-US", { maximumFractionDigits: 1 })} h`;
}

/** "Jul 31 · 46 d ago", or "never". */
export function lastNudgeText(row: ManagerRow): string {
  if (!row.lastNudgeAt) return "never";
  const date = new Date(row.lastNudgeAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  if (row.daysSinceLast === null) return date;
  if (row.daysSinceLast === 0) return `${date} · today`;
  return `${date} · ${formatNumber(row.daysSinceLast)} d ago`;
}

/** Only a store has a scoreboard; a warehouse / support / returns lead does not. */
export function hasReportCard(row: ManagerRow): boolean {
  return row.roles.length === 1 && row.roles[0].role === "location" && row.roles[0].locationId !== null;
}

export interface SummaryTile {
  key: string;
  label: string;
  value: string;
  sub?: string;
  tone: Tone | "plain";
}

export function summaryTiles(summary: ManagerAccountability["summary"]): SummaryTile[] {
  const measured = summary.worked + summary.none;
  return [
    { key: "managers", label: "Managers", value: formatNumber(summary.managers), tone: "plain" },
    {
      key: "with_email",
      label: "With an email",
      value: formatNumber(summary.withEmail),
      sub: `${formatNumber(summary.managers - summary.withEmail)} nobody to tell`,
      tone: summary.withEmail === summary.managers ? "good" : "warn",
    },
    {
      key: "never_nudged",
      label: "Never nudged",
      value: formatNumber(summary.neverNudged),
      tone: summary.neverNudged === 0 ? "good" : "muted",
    },
    {
      key: "nudges",
      label: "Nudges",
      value: formatNumber(summary.nudges),
      sub: `${formatNumber(summary.worked)} worked · ${formatNumber(summary.none)} no change · ${formatNumber(summary.early)} measuring`,
      tone: measured === 0 ? "muted" : summary.worked / measured >= ACT_RATE_GOOD ? "good" : "warn",
    },
  ];
}

/** "Sent to 1 store (North Store). Skipped 5: South Store, Online … — no manager email." */
export function sendResultSentence(result: ReportCardSendResult): string {
  const parts: string[] = [];
  if (result.sent.length) {
    parts.push(
      `Sent to ${formatNumber(result.sent.length)} store${result.sent.length === 1 ? "" : "s"} (${result.sent
        .map((s) => s.locationName)
        .join(", ")}).`,
    );
  }
  if (result.skipped.length) {
    const byReason = new Map<string, string[]>();
    for (const s of result.skipped) {
      const list = byReason.get(s.reason ?? "skipped") ?? [];
      list.push(s.locationName);
      byReason.set(s.reason ?? "skipped", list);
    }
    for (const [reason, names] of byReason) {
      parts.push(`Skipped ${formatNumber(names.length)}: ${names.join(", ")} — ${reason}.`);
    }
  }
  if (result.failed.length) {
    parts.push(
      `Failed ${formatNumber(result.failed.length)}: ${result.failed
        .map((f) => `${f.locationName} (${f.reason ?? "delivery failed"})`)
        .join(", ")}.`,
    );
  }
  return parts.join(" ") || "Nothing to send.";
}

/** The card's scoreboard as label/value rows, the way the email lays them out. */
export function scoreboardRows(sb: ReportCardScoreboard): { label: string; value: string }[] {
  const pct = (v: number | null) => (v === null ? "—" : formatPercent(v));
  const delta =
    sb.health !== null && sb.healthPrev !== null && sb.health !== sb.healthPrev
      ? ` (${sb.health > sb.healthPrev ? "↑" : "↓"}${Math.abs(sb.health - sb.healthPrev)})`
      : "";
  return [
    { label: "Store health", value: sb.health === null ? "—" : `${sb.health}${delta}` },
    { label: "Rank", value: sb.rank === null ? "—" : `${sb.rank} of ${sb.of}` },
    { label: "Net margin", value: pct(sb.netMarginPct) },
    { label: "In-store conversion", value: pct(sb.conversionPct) },
    {
      label: "Manual discounting",
      value: pct(sb.discountRatePct) + (sb.discountDiscipline ? ` · ${sb.discountDiscipline}` : ""),
    },
    { label: "Return rate", value: pct(sb.returnRatePct) },
    { label: "Fulfilment", value: sb.fulfillDays === null ? "—" : `${sb.fulfillDays} days` },
  ];
}
