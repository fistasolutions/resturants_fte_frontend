/**
 * The brand's public online ordering writes (frontend SPEC-379 / backend SPEC-394). No sign-in:
 * anyone ordering from the brand's site may price and place an order.
 */
import { proxyUrl } from "@/lib/client-api";
import { fromApi } from "@/lib/restaurant-api";
import { orderBody } from "@/lib/restaurant-os";
import type { OrderInput, OrderQuote, PlacedOrder, TrackRating } from "@/types/restaurant-os";

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

/** SPEC-390: the guest rates the order they tracked — once, after it reached them. */
export async function ratePublicOrder(
  token: string,
  rating: { stars: number; tags: string[]; comment: string | null },
): Promise<TrackRating> {
  const response = await fetch(proxyUrl(`/storefront/track/${encodeURIComponent(token)}/rating`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(rating),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new StorefrontError(payload?.error?.message ?? "The rating could not be saved.", response.status);
  }
  return fromApi<TrackRating>(await response.json());
}

/** SPEC-383: what a gift card holds, by its code. A wrong code reads "No gift card with that code". */
export async function checkPublicGiftCard(slug: string, code: string): Promise<{ balance: number; currency: string; last4: string }> {
  const response = await fetch(proxyUrl(`/storefront/${encodeURIComponent(slug)}/gift-cards/balance`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  if (!response.ok) throw new StorefrontError("No gift card with that code.", response.status);
  return fromApi(await response.json());
}
