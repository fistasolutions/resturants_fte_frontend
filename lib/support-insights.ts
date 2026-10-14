/**
 * Customer Support Agent → Insights (SPEC-346): recurring problems turned into fixes. Pure: the
 * kind labels, the order the fixes are read in, the filter, and the hand-on links. Each insight's
 * money and its basis arrive computed; this never sums them into a headline figure, because
 * two insights can describe the same tickets (a late order that also arrived damaged).
 */

import type { Insight, InsightKind } from "@/types/customer-support";

export const INSIGHT_KINDS: { key: InsightKind; label: string; description: string }[] = [
  { key: "size_chart", label: "Size & fit", description: "Size charts customers say are wrong, by product." },
  { key: "damage", label: "Damage", description: "Items arriving damaged, by carrier or warehouse." },
  { key: "late", label: "Late orders", description: "Orders over the shop's own handling time, by location." },
  { key: "policy", label: "Policy confusion", description: "Policies customers misread, with the page to rewrite." },
  { key: "product", label: "Most written about", description: "Products that draw the most questions." },
];

const KIND_LABEL = new Map(INSIGHT_KINDS.map((kind) => [kind.key, kind.label]));

export function insightKindLabel(kind: InsightKind): string {
  return KIND_LABEL.get(kind) ?? kind;
}

export type InsightFilter = "all" | InsightKind;

export function normalizeInsightFilter(value: string | null | undefined): InsightFilter {
  return INSIGHT_KINDS.some((kind) => kind.key === value) ? (value as InsightKind) : "all";
}

/** Money first, then ticket count, then title — the fix worth most is read first. */
export function sortInsights(insights: Insight[]): Insight[] {
  return [...insights].sort(
    (a, b) => b.money.amountMinor - a.money.amountMinor || b.tickets - a.tickets || a.title.localeCompare(b.title),
  );
}

export function filterInsights(insights: Insight[], filter: InsightFilter): Insight[] {
  return filter === "all" ? insights : insights.filter((insight) => insight.kind === filter);
}

/** How many insights of each kind, for the filter chips. */
export function insightCounts(insights: Insight[]): Record<InsightFilter, number> {
  const counts: Record<InsightFilter, number> = { all: insights.length, size_chart: 0, damage: 0, late: 0, policy: 0, product: 0 };
  for (const insight of insights) counts[insight.kind] += 1;
  return counts;
}

/** A rising trend reads as "up 40%"; null as "new this week". */
export function trendText(trend: number | null): string {
  if (trend === null) return "new this week";
  if (Math.abs(trend) < 1) return "flat on last week";
  return `${trend > 0 ? "up" : "down"} ${Math.abs(Math.round(trend))}% on last week`;
}

/** Hand-on links go to a page that already exists — never a new route. */
export const SEND_TO_ROOTS = ["/products", "/warehouse", "/spotlight", "/returns", "/inventory", "/team-performance", "/customers"];

export function isKnownDestination(href: string): boolean {
  const root = `/${href.split(/[/?#]/)[1] ?? ""}`;
  return SEND_TO_ROOTS.includes(root);
}
