/**
 * Pure adaptation + presentation logic for the Data Trust surface (SPEC-217).
 *
 * Lives in `lib/` because this repo's Vitest runs node-only — there is no
 * component runner, so anything that must be tested has to be a pure function
 * here rather than logic inside the view.
 */

import type {
  DataTrustApiResponse,
  DataTrustReport,
  DataTrustRule,
  DataTrustSeverity,
} from "@/types/data-trust";

const SEVERITIES: DataTrustSeverity[] = ["excluded", "high", "medium", "low"];

function toSeverity(value: string): DataTrustSeverity {
  return (SEVERITIES as string[]).includes(value)
    ? (value as DataTrustSeverity)
    : "low";
}

export function adaptDataTrust(response: DataTrustApiResponse): DataTrustReport {
  return {
    summary: {
      rulesTriggered: response.summary.rules_triggered,
      productsExcluded: response.summary.products_excluded,
      stockValueReported: response.summary.stock_value_reported,
      stockValueExcluded: response.summary.stock_value_excluded,
      stockValueTrusted: response.summary.stock_value_trusted,
      excludedSharePct: response.summary.excluded_share_pct,
    },
    rules: response.rules.map((rule) => ({
      key: rule.key,
      label: rule.label,
      severity: toSeverity(rule.severity),
      count: rule.count,
      valueImpact: rule.value_impact,
      excluded: rule.excluded,
      affects: rule.affects,
      explanation: rule.explanation,
      action: rule.action,
      samples: rule.samples.map((sample) => ({
        productId: sample.product_id,
        title: sample.title,
        detail: sample.detail,
      })),
    })),
  };
}

/**
 * Excluded rules first, then by severity, then by size.
 *
 * Excluded rules changed the client's numbers, so they answer the question the
 * page exists to answer ("why did this figure move?") before anything else.
 */
export function sortRules(rules: DataTrustRule[]): DataTrustRule[] {
  return [...rules].sort((a, b) => {
    const rank = SEVERITIES.indexOf(a.severity) - SEVERITIES.indexOf(b.severity);
    return rank !== 0 ? rank : b.count - a.count;
  });
}

/**
 * A text badge, not just a colour: excluded and flagged must be distinguishable
 * without relying on colour alone (SPEC-217 accessibility criterion).
 */
export function ruleStatusLabel(rule: DataTrustRule): string {
  return rule.excluded ? "Excluded from figures" : "Flagged only";
}

/** True when contamination is large enough that quoting the raw figure misleads. */
export function isMateriallyContaminated(sharePct: number): boolean {
  return sharePct >= 5;
}

/** One sentence stating the correction, or null when there is nothing to correct. */
export function correctionSentence(report: DataTrustReport): string | null {
  const { productsExcluded, excludedSharePct } = report.summary;
  if (productsExcluded === 0) return null;
  const noun = productsExcluded === 1 ? "product" : "products";
  return (
    `${productsExcluded} test ${noun} left active in Shopify accounted for ` +
    `${excludedSharePct}% of reported stock value. They are excluded from every ` +
    `stock figure in the platform.`
  );
}
