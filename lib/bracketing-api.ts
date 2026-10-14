/**
 * Bracketing: the backend's shapes → view models (SPEC-309). Pure; an unknown figure stays
 * null (a customer outside the totals query has no return rate — never 0%).
 */
import type {
  BracketChannel,
  BracketCustomer,
  BracketStyle,
  BracketingData,
} from "@/types/bracketing";
import type { FitVerdict } from "@/types/fit";

interface ApiCustomer {
  customer_id: number;
  name: string;
  orders: number | null;
  units: number | null;
  units_returned: number | null;
  return_rate: number | null;
  refunded: number | null;
  bracket_orders: number;
  bracket_returns?: number;
  kept_one: number;
  bracket_refunded: number;
}

export interface ApiBracketing {
  summary: {
    orders: number;
    bracket_orders: number;
    bracket_share: number | null;
    brackets: number;
    kept_all: number;
    kept_one: number;
    kept_some: number;
    returned_all: number;
    units: number;
    units_returned: number;
    refunded: number;
    all_refunded: number;
    refunded_share: number | null;
  };
  channels: { channel: BracketChannel; bracket_orders: number; brackets: number; kept_one: number; refunded: number }[];
  styles: {
    product_id: number;
    title: string;
    vendor: string | null;
    image_url: string | null;
    orders: number | null;
    bracket_orders: number;
    bracket_rate: number | null;
    brackets: number;
    kept_one: number;
    returned_all: number;
    units_returned: number;
    refunded: number;
    fit_verdict: FitVerdict | null;
  }[];
  repeat_bracketers: ApiCustomer[];
  high_return: ApiCustomer[];
  window: { start: string; end: string };
  rules: {
    repeat_bracket_orders: number;
    repeat_return_share?: number;
    high_return_min_orders: number;
    high_return_rate: number;
  };
}

function toCustomer(raw: ApiCustomer): BracketCustomer {
  return {
    customerId: raw.customer_id,
    name: raw.name,
    orders: raw.orders,
    units: raw.units,
    unitsReturned: raw.units_returned,
    returnRate: raw.return_rate,
    refunded: raw.refunded,
    bracketOrders: raw.bracket_orders,
    bracketReturns: raw.bracket_returns ?? 0,
    keptOne: raw.kept_one,
    bracketRefunded: raw.bracket_refunded,
  };
}

function toStyle(raw: ApiBracketing["styles"][number]): BracketStyle {
  return {
    productId: raw.product_id,
    title: raw.title,
    vendor: raw.vendor,
    imageUrl: raw.image_url,
    orders: raw.orders,
    bracketOrders: raw.bracket_orders,
    bracketRate: raw.bracket_rate,
    brackets: raw.brackets,
    keptOne: raw.kept_one,
    returnedAll: raw.returned_all,
    unitsReturned: raw.units_returned,
    refunded: raw.refunded,
    fitVerdict: raw.fit_verdict,
  };
}

export function toBracketing(raw: ApiBracketing): BracketingData {
  const s = raw.summary;
  return {
    summary: {
      orders: s.orders,
      bracketOrders: s.bracket_orders,
      bracketShare: s.bracket_share,
      brackets: s.brackets,
      keptAll: s.kept_all,
      keptOne: s.kept_one,
      keptSome: s.kept_some,
      returnedAll: s.returned_all,
      units: s.units,
      unitsReturned: s.units_returned,
      refunded: s.refunded,
      allRefunded: s.all_refunded,
      refundedShare: s.refunded_share,
    },
    channels: raw.channels.map((c) => ({
      channel: c.channel,
      bracketOrders: c.bracket_orders,
      brackets: c.brackets,
      keptOne: c.kept_one,
      refunded: c.refunded,
    })),
    styles: raw.styles.map(toStyle),
    repeatBracketers: raw.repeat_bracketers.map(toCustomer),
    highReturn: raw.high_return.map(toCustomer),
    window: raw.window,
    rules: {
      repeatBracketOrders: raw.rules.repeat_bracket_orders,
      repeatReturnShare: raw.rules.repeat_return_share ?? 0.5,
      highReturnMinOrders: raw.rules.high_return_min_orders,
      highReturnRate: raw.rules.high_return_rate,
    },
  };
}
