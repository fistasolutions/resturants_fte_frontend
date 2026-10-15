/**
 * The driver app's writes (frontend SPEC-384 / backend SPEC-400). No sign-in: the link's token is
 * the key, so anyone holding a driver's link may act as that driver.
 */
import { proxyUrl } from "@/lib/client-api";
import { fromApi } from "@/lib/restaurant-api";
import type { DriverApp, Tender } from "@/types/restaurant-os";

export class DriverAppError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "DriverAppError";
  }
}

async function post<T>(token: string, path: string, body: unknown, fallback: string): Promise<T> {
  const response = await fetch(proxyUrl(`/storefront/driver/${encodeURIComponent(token)}${path}`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new DriverAppError(payload?.error?.message ?? fallback, response.status);
  }
  return fromApi<T>(await response.json());
}

export function reportDriverLocation(token: string, lat: number, lng: number, accuracy: number | null): Promise<{ stored: boolean }> {
  return post(token, "/location", { lat, lng, accuracy }, "Sharing the location failed.");
}

export function markDeliveredByDriver(token: string, orderId: number, tender: Tender | null): Promise<DriverApp> {
  return post(
    token,
    `/orders/${orderId}/delivered`,
    { tender: tender ? { method: tender.method, amount_tendered: tender.amountTendered ?? null, code: tender.code ?? null } : null },
    "Marking it delivered failed.",
  );
}

export function setDriverAvailability(token: string, status: "available" | "off"): Promise<DriverApp> {
  return post(token, "/status", { status }, "Changing your status failed.");
}
