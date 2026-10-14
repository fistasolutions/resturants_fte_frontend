/**
 * Social Growth — Performance display logic (SPEC-131). Pure and unit-testable.
 * The backend owns every count (Rule 8); this module only reshapes counts into
 * ordered stages and bar-width percentages — no business calculation.
 */
import type { SocialFunnel } from "@/types/social";

export interface FunnelStage {
  key: keyof SocialFunnel;
  label: string;
  count: number;
  /** Width relative to the top of the funnel (`generated`), 0–100. */
  percent: number;
}

const FUNNEL_ORDER: { key: keyof SocialFunnel; label: string }[] = [
  { key: "generated", label: "Generated" },
  { key: "inReview", label: "In review" },
  { key: "approved", label: "Approved" },
  { key: "scheduled", label: "Scheduled" },
  { key: "published", label: "Published" },
];

/** The five pipeline stages in order, each sized relative to `generated`. When
 * nothing has been generated every bar is 0 (no divide-by-zero, honest empty). */
export function funnelStages(funnel: SocialFunnel): FunnelStage[] {
  const top = funnel.generated;
  return FUNNEL_ORDER.map(({ key, label }) => {
    const count = funnel[key];
    return {
      key,
      label,
      count,
      percent: top > 0 ? Math.round((count / top) * 100) : 0,
    };
  });
}

export interface BarRow<T> {
  item: T;
  /** Width relative to the largest count in the set, 0–100. */
  percent: number;
}

/** Attach a bar-width percentage (relative to the max count) to each item — for
 * the by-channel and content-mix breakdowns. Empty input → empty output. */
export function barRows<T>(items: T[], getCount: (item: T) => number): BarRow<T>[] {
  const max = items.reduce((m, item) => Math.max(m, getCount(item)), 0);
  return items.map((item) => ({
    item,
    percent: max > 0 ? Math.round((getCount(item) / max) * 100) : 0,
  }));
}
