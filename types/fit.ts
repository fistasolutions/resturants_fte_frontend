/** Fit Intelligence view models (SPEC-306 / backend SPEC-303). */

export type FitVerdict = "runs_small" | "runs_large" | "true_to_size" | "inconsistent" | "not_enough";
export type FitConfidence = "high" | "medium" | "low";

export interface FitSummary {
  returns: number;
  fitReturns: number;
  /** Share of all returns that are about fit, 0–1; null with no returns. */
  fitShare: number | null;
  small: number;
  large: number;
  fitRefund: number;
  storeFitRate: number | null;
  styles: number;
  stylesJudged: number;
  runsSmall: number;
  runsLarge: number;
  trueToSize: number;
  inconsistent: number;
  notEnough: number;
}

export interface FitVendor {
  vendor: string;
  vendorKey: string;
  styles: number;
  sold: number;
  small: number;
  large: number;
  fitReturns: number;
  fitRate: number | null;
  /** Share of fit returns saying "too small", 0–1. */
  lean: number | null;
  verdict: FitVerdict;
  confidence: FitConfidence | null;
  stylesSmall: number;
  stylesLarge: number;
}

export interface FitStyle {
  productId: number;
  title: string;
  vendor: string | null;
  vendorKey: string;
  imageUrl: string | null;
  sold: number;
  returned: number;
  small: number;
  large: number;
  fitReturns: number;
  fitRate: number | null;
  lean: number | null;
  verdict: FitVerdict;
  confidence: FitConfidence | null;
  fitRefund: number;
  exchangesUp: number;
  exchangesDown: number;
}

export interface FitCoverage {
  start: string | null;
  end: string;
}

export interface FitRules {
  minFitReturns: number;
  sizeMinReturns: number;
}

export interface FitOverview {
  summary: FitSummary;
  vendors: FitVendor[];
  styles: FitStyle[];
  coverage: FitCoverage;
  rules: FitRules;
}

export interface FitSizeRow {
  size: string;
  sold: number;
  small: number;
  large: number;
  fitRate: number | null;
  lean: number | null;
  advice: string | null;
}

export interface FitGuide {
  headline: string;
  reason: string;
  sizes: { size: string; advice: string }[];
}

export interface FitStyleDetail extends FitStyle {
  handle: string | null;
  sizes: FitSizeRow[];
  guide: FitGuide;
  vendorProfile: FitVendor | null;
  storeFitRate: number | null;
  coverage: FitCoverage;
}
