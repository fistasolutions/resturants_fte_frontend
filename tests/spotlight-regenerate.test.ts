import { afterEach, describe, expect, it, vi } from "vitest";

import { regenerateDraftStream } from "@/services/spotlight-actions";

// Node-safe: spotlight-actions imports only the pure adapters (types + mapping),
// never the server-only service. The SSE reader is exercised against a mocked
// fetch exactly like tests/chat-service.test.ts.

function sseResponse(frames: string[], status = 200): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const frame of frames) {
        controller.enqueue(encoder.encode(frame));
      }
      controller.close();
    },
  });
  return {
    ok: status >= 200 && status < 300,
    status,
    body,
    json: async () => ({}),
  } as unknown as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("regenerateDraftStream (SPEC-117, backend SPEC-113)", () => {
  it("fires onStatus per status frame and resolves the overwritten draft id", async () => {
    const fetchMock = vi.fn(async () =>
      sseResponse([
        'data: {"status": "Reading your Brand Brain…"}\n\n',
        'data: {"status": "Writing the article…"}\n\n',
        'data: {"status": "Scoring for SEO…"}\n\n',
        'data: {"draft_id": 42}\n\ndata: {"done": true}\n\n',
      ]),
    );
    vi.stubGlobal("fetch", fetchMock);

    const phrases: string[] = [];
    const id = await regenerateDraftStream(42, "Make it punchier", (s) =>
      phrases.push(s),
    );

    expect(id).toBe(42);
    expect(phrases).toEqual([
      "Reading your Brand Brain…",
      "Writing the article…",
      "Scoring for SEO…",
    ]);

    // POSTs the prompt to the draft's regenerate endpoint via the proxy.
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("/spotlight/drafts/42/regenerate");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ prompt: "Make it punchier" });
  });

  it("fires onDelta per body chunk so the article streams live (SPEC-114)", async () => {
    const fetchMock = vi.fn(async () =>
      sseResponse([
        'data: {"status": "Writing the article…"}\n\n',
        'data: {"delta": "# Modest "}\n\n',
        'data: {"delta": "Dresses\\n\\n"}\n\n',
        'data: {"delta": "Body text."}\n\n',
        'data: {"draft_id": 42}\n\ndata: {"done": true}\n\n',
      ]),
    );
    vi.stubGlobal("fetch", fetchMock);

    const chunks: string[] = [];
    const id = await regenerateDraftStream(
      42,
      "Make it punchier",
      undefined,
      (chunk) => chunks.push(chunk),
    );

    expect(id).toBe(42);
    expect(chunks).toEqual(["# Modest ", "Dresses\n\n", "Body text."]);
    expect(chunks.join("")).toBe("# Modest Dresses\n\nBody text.");
  });

  it("throws the detail message on an error frame", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        sseResponse([
          'data: {"status": "Reading your Brand Brain…"}\n\n',
          'data: {"error": "offbrand_request", "detail": "The request conflicts with the Brand Brain guardrails."}\n\n',
          'data: {"done": true}\n\n',
        ]),
      ),
    );

    await expect(regenerateDraftStream(7, "sell the cheapest")).rejects.toThrow(
      "The request conflicts with the Brand Brain guardrails.",
    );
  });

  it("throws when the stream ends without a draft id", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        sseResponse([
          'data: {"status": "Writing the article…"}\n\n',
          'data: {"done": true}\n\n',
        ]),
      ),
    );

    await expect(regenerateDraftStream(7, "punchier")).rejects.toThrow(
      /without an id/,
    );
  });

  it("throws the backend error message on a non-OK response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 404,
        body: null,
        json: async () => ({ error: { message: "Blog draft not found." } }),
      })) as unknown as typeof fetch,
    );

    await expect(regenerateDraftStream(999, "punchier")).rejects.toThrow(
      "Blog draft not found.",
    );
  });
});
