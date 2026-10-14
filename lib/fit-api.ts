/**
 * Fit Intelligence: the backend's shapes → the view models (SPEC-306).
 *
 * Pure. Unknown stays unknown — a rate with nothing sold is null, never 0, and a style
 * with too few fit returns keeps a null confidence, because the page must never imply a
 * verdict the evidence does not carry.
 */
import type {
  FitConfidence,
  FitCoverage,
  FitGuide,
  FitOverview,
  FitSizeRow,
  FitStyle,
  FitStyleDetail,
  FitVendor,
  FitVerdict,
} from "@/types/fit";

export interface ApiFitVendor {
  vendor: string;
  vendor_key: string;
  styles: number;
  sold: number;
  small: number;
  large: number;
  fit_returns: number;
  fit_rate: number | null;
  lean: number | null;
  verdict: FitVerdict;
  confidence: FitConfidence | null;
  styles_small: number;
  styles_large: number;
}

export interface ApiFitStyle {
  product_id: number;
  title: string;
  vendor: string | null;
  vendor_key: string;
  image_url: string | null;
  handle?: string | null;
  sold: number;
  returned: number;
  small: number;
  large: number;
  fit_returns: number;
  fit_rate: number | null;
  lean: number | null;
  verdict: FitVerdict;
  confidence: FitConfidence | null;
  fit_refund: number;
  exchanges_up: number;
  exchanges_down: number;
}

export interface ApiFitOverview {
  summary: {
    returns: number;
    fit_returns: number;
    fit_share: number | null;
    small: number;
    large: number;
    fit_refund: number;
    store_fit_rate: number | null;
    styles: number;
    styles_judged: number;
    runs_small: number;
    runs_large: number;
    true_to_size: number;
    inconsistent: number;
    not_enough: number;
  };
  vendors: ApiFitVendor[];
  styles: ApiFitStyle[];
  coverage: FitCoverage;
  rules: { min_fit_returns: number; size_min_returns: number };
}

export interface ApiFitStyleDetail extends ApiFitStyle {
  sizes: {
    size: string;
    sold: number;
    small: number;
    large: number;
    fit_rate: number | null;
    lean: number | null;
    advice: string | null;
  }[];
  guide: FitGuide;
  vendor_profile: ApiFitVendor | null;
  store_fit_rate: number | null;
  coverage: FitCoverage;
}

export function toFitVendor(raw: ApiFitVendor): FitVendor {
  return {
    vendor: raw.vendor,
    vendorKey: raw.vendor_key,
    styles: raw.styles,
    sold: raw.sold,
    small: raw.small,
    large: raw.large,
    fitReturns: raw.fit_returns,
    fitRate: raw.fit_rate,
    lean: raw.lean,
    verdict: raw.verdict,
    confidence: raw.confidence,
    stylesSmall: raw.styles_small,
    stylesLarge: raw.styles_large,
  };
}

export function toFitStyle(raw: ApiFitStyle): FitStyle {
  return {
    productId: raw.product_id,
    title: raw.title,
    vendor: raw.vendor,
    vendorKey: raw.vendor_key,
    imageUrl: raw.image_url,
    sold: raw.sold,
    returned: raw.returned,
    small: raw.small,
    large: raw.large,
    fitReturns: raw.fit_returns,
    fitRate: raw.fit_rate,
    lean: raw.lean,
    verdict: raw.verdict,
    confidence: raw.confidence,
    fitRefund: raw.fit_refund,
    exchangesUp: raw.exchanges_up,
    exchangesDown: raw.exchanges_down,
  };
}

export function toFitOverview(raw: ApiFitOverview): FitOverview {
  const s = raw.summary;
  return {
    summary: {
      returns: s.returns,
      fitReturns: s.fit_returns,
      fitShare: s.fit_share,
      small: s.small,
      large: s.large,
      fitRefund: s.fit_refund,
      storeFitRate: s.store_fit_rate,
      styles: s.styles,
      stylesJudged: s.styles_judged,
      runsSmall: s.runs_small,
      runsLarge: s.runs_large,
      trueToSize: s.true_to_size,
      inconsistent: s.inconsistent,
      notEnough: s.not_enough,
    },
    vendors: raw.vendors.map(toFitVendor),
    styles: raw.styles.map(toFitStyle),
    coverage: raw.coverage,
    rules: { minFitReturns: raw.rules.min_fit_returns, sizeMinReturns: raw.rules.size_min_returns },
  };
}

function toSizeRow(raw: ApiFitStyleDetail["sizes"][number]): FitSizeRow {
  return {
    size: raw.size,
    sold: raw.sold,
    small: raw.small,
    large: raw.large,
    fitRate: raw.fit_rate,
    lean: raw.lean,
    advice: raw.advice,
  };
}

export function toFitStyleDetail(raw: ApiFitStyleDetail): FitStyleDetail {
  return {
    ...toFitStyle(raw),
    handle: raw.handle ?? null,
    sizes: raw.sizes.map(toSizeRow),
    guide: { headline: raw.guide.headline, reason: raw.guide.reason, sizes: raw.guide.sizes ?? [] },
    vendorProfile: raw.vendor_profile ? toFitVendor(raw.vendor_profile) : null,
    storeFitRate: raw.store_fit_rate,
    coverage: raw.coverage,
  };
}
