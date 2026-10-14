/**
 * SPEC-017 proxy route: every verb the backend API uses must be exported —
 * Next.js rejects non-exported methods with 405 before they reach the backend
 * (the 2026-07-16 delete-conversation regression, see SPEC-017 Patches).
 */
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import * as proxyRoute from "@/app/api/proxy/[...path]/route";

function makeContext(path: string[]) {
  return { params: Promise.resolve({ path }) };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("proxy route method exports", () => {
  it("exports the shared forward handler for GET, POST, PUT, PATCH and DELETE", () => {
    const { GET, POST, PUT, PATCH, DELETE } = proxyRoute;
    const handlers = [GET, POST, PUT, PATCH, DELETE];
    for (const handler of handlers) {
      expect(typeof handler).toBe("function");
    }
    expect(new Set(handlers).size).toBe(1);
  });
});

describe("proxy forwarding", () => {
  it("forwards DELETE upstream with the method, path and query intact", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    const request = new NextRequest(
      "http://localhost:3000/api/proxy/chat/conversations/abc-123",
      { method: "DELETE" },
    );
    const response = await proxyRoute.DELETE(
      request,
      makeContext(["chat", "conversations", "abc-123"]),
    );

    expect(response.status).toBe(204);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [target, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(String(target)).toMatch(/\/api\/v1\/chat\/conversations\/abc-123$/);
    expect(init.method).toBe("DELETE");
  });

  it("returns a 502 error body when the backend is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("fetch failed")),
    );

    const request = new NextRequest(
      "http://localhost:3000/api/proxy/chat/conversations/abc-123",
      { method: "DELETE" },
    );
    const response = await proxyRoute.DELETE(
      request,
      makeContext(["chat", "conversations", "abc-123"]),
    );

    expect(response.status).toBe(502);
    const body = (await response.json()) as {
      error: { code: string; message: string };
    };
    expect(body.error.code).toBe("backend_unreachable");
  });
  // SPEC-174 — the in-app Reel player streams the mp4 through this proxy. Both
  // directions matter: a dropped `Range` request header makes every play a full
  // download, and a dropped `Content-Range` makes the 206 that comes back
  // undecodable.
  it("forwards the Range header and the range response headers for media", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("TWO", {
        status: 206,
        headers: {
          "content-type": "video/mp4",
          "accept-ranges": "bytes",
          "content-range": "bytes 3-5/6",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const request = new NextRequest(
      "http://localhost:3000/api/proxy/social/posts/1/video",
      { method: "GET", headers: { Range: "bytes=3-5" } },
    );
    const response = await proxyRoute.GET(
      request,
      makeContext(["social", "posts", "1", "video"]),
    );

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(new Headers(init.headers).get("Range")).toBe("bytes=3-5");

    expect(response.status).toBe(206);
    expect(response.headers.get("accept-ranges")).toBe("bytes");
    expect(response.headers.get("content-range")).toBe("bytes 3-5/6");
    expect(response.headers.get("content-type")).toBe("video/mp4");
  });

  it("sends no Range header when the caller did not ask for one", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const request = new NextRequest(
      "http://localhost:3000/api/proxy/social/posts",
      { method: "GET" },
    );
    await proxyRoute.GET(request, makeContext(["social", "posts"]));

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(new Headers(init.headers).has("Range")).toBe(false);
  });

});
