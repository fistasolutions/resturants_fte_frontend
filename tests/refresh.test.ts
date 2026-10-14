import { afterEach, describe, expect, it, vi } from "vitest";

import { refreshTokens } from "@/lib/refresh";

function mockFetch(status: number, body: unknown) {
  const response = {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
  const spy = vi.fn(async () => response);
  vi.stubGlobal("fetch", spy);
  return spy;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("refreshTokens", () => {
  it("returns the rotated pair on a 200 with both tokens", async () => {
    mockFetch(200, { access_token: "new-access", refresh_token: "new-refresh" });
    await expect(refreshTokens("old-refresh")).resolves.toEqual({
      accessToken: "new-access",
      refreshToken: "new-refresh",
    });
  });

  it("posts a JSON { refresh_token } body to the refresh endpoint", async () => {
    const spy = mockFetch(200, {
      access_token: "a",
      refresh_token: "b",
    });
    await refreshTokens("the-refresh-token");
    expect(spy).toHaveBeenCalledTimes(1);
    const [url, init] = spy.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("/api/v1/auth/refresh");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      refresh_token: "the-refresh-token",
    });
  });

  it("returns null on a non-2xx response", async () => {
    mockFetch(401, { error: { code: "invalid_token" } });
    await expect(refreshTokens("expired")).resolves.toBeNull();
  });

  it("returns null when the body is missing a token", async () => {
    mockFetch(200, { access_token: "only-access" });
    await expect(refreshTokens("x")).resolves.toBeNull();
  });

  it("returns null when fetch throws (network error)", async () => {
    const spy = vi.fn(async () => {
      throw new Error("network down");
    });
    vi.stubGlobal("fetch", spy);
    await expect(refreshTokens("x")).resolves.toBeNull();
  });
});
