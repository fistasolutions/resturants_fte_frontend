import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, apiErrorFromResponse } from "@/lib/api-error";
import { clientApi, proxyUrl } from "@/lib/client-api";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("proxyUrl (SPEC-230)", () => {
  it("maps a backend-relative path onto the proxy route, query string intact", () => {
    expect(proxyUrl("/brief?start=2026-09-01&end=2026-09-12&compare=none")).toBe(
      "/api/proxy/brief?start=2026-09-01&end=2026-09-12&compare=none",
    );
    expect(proxyUrl("/auth/me")).toBe("/api/proxy/auth/me");
  });

  it("tolerates a path without a leading slash", () => {
    expect(proxyUrl("brief/attention")).toBe("/api/proxy/brief/attention");
  });
});

describe("clientApi (SPEC-230)", () => {
  it("GETs through the proxy and resolves the JSON body", async () => {
    const spy = vi.fn(async () => jsonResponse({ name: "Mordy", email: "m@example.com" }));
    vi.stubGlobal("fetch", spy);

    await expect(clientApi<{ name: string }>("/auth/me")).resolves.toEqual({
      name: "Mordy",
      email: "m@example.com",
    });
    expect(spy).toHaveBeenCalledTimes(1);
    const [url, init] = spy.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/proxy/auth/me");
    expect(init.cache).toBe("no-store");
    expect((init.headers as Record<string, string>).Accept).toBe("application/json");
  });

  it("throws the backend's own {code, message} as ApiError on a non-2xx — same as serverApi", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({ error: { code: "store_not_connected", message: "Connect a store first." } }, 409),
      ),
    );

    const err = await clientApi("/dashboard").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 409, code: "store_not_connected", message: "Connect a store first." });
  });

  it("falls back to a status-only ApiError when the failure body is not the envelope", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("<html>Bad Gateway</html>", { status: 502 })));

    const err = await clientApi("/brief").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 502, code: "api_error", message: "API request failed (502)." });
  });
});

describe("apiErrorFromResponse", () => {
  it("is the one place both transports build their error from", async () => {
    const err = await apiErrorFromResponse(
      jsonResponse({ error: { code: "unauthorized", message: "Token expired." } }, 401),
    );
    expect(err.name).toBe("ApiError");
    expect(err.status).toBe(401);
    expect(err.code).toBe("unauthorized");
    expect(err.message).toBe("Token expired.");
  });
});
