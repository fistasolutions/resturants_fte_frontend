import { afterEach, describe, expect, it, vi } from "vitest";

import { login, logout } from "@/services/auth";

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

describe("login", () => {
  it("posts normalized credentials and resolves the signed-in result", async () => {
    const spy = mockFetch(200, {
      user: { name: "Ada", email: "ada@store.com" },
      hasOrganization: true,
      redirect: null,
    });

    await expect(
      login({ email: "  ADA@Store.com ", password: "secret-pass" }),
    ).resolves.toEqual({
      user: { name: "Ada", email: "ada@store.com" },
      hasOrganization: true,
      redirect: null,
    });

    const [url, init] = spy.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/session");
    expect(JSON.parse(String(init.body))).toEqual({
      kind: "password",
      email: "ada@store.com",
      password: "secret-pass",
    });
  });

  it("surfaces the backend error message", async () => {
    mockFetch(401, { error: { code: "invalid_credentials", message: "Invalid email or password." } });
    await expect(
      login({ email: "a@b.com", password: "wrong" }),
    ).rejects.toThrow("Invalid email or password.");
  });

  it("falls back to a generic message on malformed errors", async () => {
    mockFetch(500, {});
    await expect(login({ email: "a@b.com", password: "x" })).rejects.toThrow(
      "Something went wrong. Try again.",
    );
  });
});

describe("logout", () => {
  it("DELETEs the session", async () => {
    const spy = mockFetch(200, { ok: true });
    await logout();
    const [url, init] = spy.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/session");
    expect(init.method).toBe("DELETE");
  });
});
