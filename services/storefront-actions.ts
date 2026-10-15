/**
 * The brand's public online ordering writes (frontend SPEC-379 / backend SPEC-394). No sign-in:
 * anyone ordering from the brand's site may price and place an order.
 */
import { proxyUrl } from "@/lib/client-api";
import { fromApi } from "@/lib/restaurant-api";
import { orderBody } from "@/lib/restaurant-os";
import type { OrderInput, OrderQuote, PlacedOrder } from "@/types/restaurant-os";

export class StorefrontError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "StorefrontError";
  }
}

async function post<T>(path: string, input: OrderInput, fallback: string): Promise<T> {
  const response = await fetch(proxyUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderBody(input)),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: { message?: string; details?: { message: string }[] } }
      | null;
    const details = (payload?.error?.details ?? []).map((d) => d.message);
    throw new StorefrontError(details.length ? details.join(" ") : (payload?.error?.message ?? fallback), response.status);
  }
  return fromApi<T>(await response.json());
}

export function quotePublicOrder(slug: string, input: OrderInput): Promise<OrderQuote> {
  return post(`/storefront/${encodeURIComponent(slug)}/quote`, input, "Pricing the order failed.");
}

export function placePublicOrder(slug: string, input: OrderInput): Promise<PlacedOrder> {
  return post(`/storefront/${encodeURIComponent(slug)}/orders`, input, "Placing the order failed.");
}
