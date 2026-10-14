/**
 * Answers that show, not tell (SPEC-257): the pure half of the answer card's
 * text ⇄ chart toggle — the takeaway kept above a chart, value formatting by
 * unit, Recharts rows from the backend's spec, and the remembered preference.
 */
import type { AnswerVisual, AnswerVisualUnit } from "@/types/chat";
import { formatCompactCurrency, formatCurrency, formatNumber, formatPercent } from "@/utils/format";

export type AnswerView = "text" | "chart";
// Keeps the pre-rename prefix on purpose (SPEC-337): a new key would reset every saved choice.
export const ANSWER_VIEW_KEY = "ecommerce-fte.chat.answer-view";

/** The answer's first real paragraph — what stays on screen above the chart.
 * Headings, rules and table rows are skipped; an empty answer yields "". */
export function takeaway(content: string): string {
  const paragraphs = content
    .replace(/```[\s\S]*?```/g, "")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
  for (const block of paragraphs) {
    const lines = block.split("\n").filter((line) => !/^\s*(#{1,6}\s|\||-{3,}|\*{3,})/.test(line));
    const text = lines.join("\n").trim();
    if (text) return text;
  }
  return "";
}

/** A full value for tooltips and labels. */
export function formatValue(unit: AnswerVisualUnit, value: number): string {
  if (unit === "currency") return formatCurrency(value);
  if (unit === "percent") return formatPercent(value);
  return formatNumber(value);
}

/** A short value for an axis. */
export function formatAxis(unit: AnswerVisualUnit, value: number): string {
  if (unit === "currency") return formatCompactCurrency(value);
  if (unit === "percent") return `${Math.round(value)}%`;
  if (Math.abs(value) >= 1000) return `${Math.round(value / 100) / 10}k`;
  return formatNumber(value);
}

/** One Recharts row per label with a column per series (`s0`, `s1`, …). */
export interface ChartRow {
  label: string;
  [series: `s${number}`]: number | string;
}

export function chartRows(visual: AnswerVisual): ChartRow[] {
  const labels = visual.series[0]?.points.map((point) => point.label) ?? [];
  return labels.map((label, index) => {
    const row: ChartRow = { label };
    visual.series.forEach((series, seriesIndex) => {
      const point = series.points[index];
      row[`s${seriesIndex}`] = point?.value ?? 0;
    });
    return row;
  });
}

/** Shorten a long bar label for the axis; the full one stays in the tooltip. */
export function axisLabel(label: string, max = 22): string {
  return label.length <= max ? label : `${label.slice(0, max - 1).trimEnd()}…`;
}

/** "Sep 10" for an ISO day; anything else unchanged. */
export function dateLabel(label: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(label);
  if (!match) return label;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

/** "From get_top_products · top 8 by revenue" — the line under the chart. */
export function chartCaption(visual: AnswerVisual): string {
  const count = visual.series[0]?.points.length ?? 0;
  const metric = visual.metric.replace(/_/g, " ");
  if (visual.kind === "bar") return `From ${visual.tool} · top ${count} by ${metric}`;
  if (visual.kind === "line") return `From ${visual.tool} · ${count} points`;
  return `From ${visual.tool} · ${visual.series.map((s) => s.name.toLowerCase()).join(" vs ")}`;
}

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** Text unless the owner last chose the chart. */
export function readAnswerView(): AnswerView {
  try {
    return storage()?.getItem(ANSWER_VIEW_KEY) === "chart" ? "chart" : "text";
  } catch {
    return "text";
  }
}

export function writeAnswerView(view: AnswerView): void {
  try {
    const store = storage();
    if (!store) return;
    if (view === "chart") store.setItem(ANSWER_VIEW_KEY, "chart");
    else store.removeItem(ANSWER_VIEW_KEY);
  } catch {
    // Storage blocked — the toggle still works for this page life.
  }
}
