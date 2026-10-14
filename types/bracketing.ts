/** Bracketing view models (SPEC-309 / backend SPEC-306). */
import type { FitVerdict } from "@/types/fit";

export type BracketChannel = "online" | "in_store" | "other";

export interface BracketSummary {
  orders: number;
  bracketOrders: number;
  bracketShare: number | null;
  brackets: number;
  keptAll: number;
  keptOne: number;
  keptSome: number;
  returnedAll: number;
  units: number;
  unitsReturned: number;
  refunded: number;
  allRefunded: number;
  refundedShare: number | null;
}

export interface BracketChannelRow {
  channel: BracketChannel;
  bracketOrders: number;
  brackets: number;
  keptOne: number;
  refunded: number;
}

export interface BracketStyle {
  productId: number;
  title: string;
  vendor: string | null;
  imageUrl: string | null;
  /** Orders in the range holding the style at all; null when unknown. */
  orders: number | null;
  bracketOrders: number;
  bracketRate: number | null;
  brackets: number;
  keptOne: number;
  returnedAll: number;
  unitsReturned: number;
  refunded: number;
  fitVerdict: FitVerdict | null;
}

export interface BracketCustomer {
  customerId: number;
  name: string;
  orders: number | null;
  units: number | null;
  unitsReturned: number | null;
  returnRate: number | null;
  refunded: number | null;
  bracketOrders: number;
  bracketReturns: number;
  keptOne: number;
  bracketRefunded: number;
}

export interface BracketingRules {
  repeatBracketOrders: number;
  repeatReturnShare: number;
  highReturnMinOrders: number;
  highReturnRate: number;
}

export interface BracketingData {
  summary: BracketSummary;
  channels: BracketChannelRow[];
  styles: BracketStyle[];
  repeatBracketers: BracketCustomer[];
  highReturn: BracketCustomer[];
  window: { start: string; end: string };
  rules: BracketingRules;
}
