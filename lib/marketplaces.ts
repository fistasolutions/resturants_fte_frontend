/** Marketplace connections' pure half (frontend SPEC-393 / backend SPEC-413). */
import type { MarketplaceAggregator, MarketplaceProvider } from "@/types/restaurant-os";

export const PROVIDER_LABELS: Record<MarketplaceProvider, string> = {
  doordash: "DoorDash",
  ubereats: "Uber Eats",
  grubhub: "Grubhub",
  other: "Other marketplace",
};

export const AGGREGATOR_LABELS: Record<MarketplaceAggregator, string> = {
  deliverect: "Deliverect",
  generic: "Other aggregator (generic format)",
};

/** An absolute URL for the aggregator from the API's path. */
export function absoluteUrl(origin: string, apiPath: string): string {
  const proxied = apiPath.replace(/^\/api\/v1/, "/api/proxy");
  return `${origin.replace(/\/$/, "")}${proxied}`;
}
