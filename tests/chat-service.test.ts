import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getAssistantReply,
  listConversations,
  setActiveConversation,
  toChatConversation,
  toImportPayload,
  type ApiConversation,
} from "@/services/chat";
import type { ChatConversation } from "@/types/chat";

const CONVERSATION_ID = "11111111-aaaa-4bbb-8ccc-000000000001";

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

describe("getAssistantReply streaming (SPEC-016, SPEC-019)", () => {
  it("fires onDelta with accumulated text per frame and resolves the full reply", async () => {
    const fetchMock = vi.fn(async () =>
      sseResponse([
        `data: {"conversation_id": "${CONVERSATION_ID}"}\n\n`,
        'data: {"delta": "Revenue is "}\n\n',
        'data: {"delta": "**up 12%**"}\n\n',
        'data: {"delta": " this week."}\n\ndata: {"done": true}\n\n',
      ]),
    );
    vi.stubGlobal("fetch", fetchMock);

    const chunks: string[] = [];
    const reply = await getAssistantReply("how is revenue?", CONVERSATION_ID, (acc) =>
      chunks.push(acc),
    );

    expect(chunks).toEqual([
      "Revenue is ",
      "Revenue is **up 12%**",
      "Revenue is **up 12%** this week.",
    ]);
    expect(reply.reply).toBe("Revenue is **up 12%** this week.");
    // The conversation id rides in the request body (server-side persistence).
    const requestBody = JSON.parse(
      (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string,
    );
    expect(requestBody).toEqual({
      message: "how is revenue?",
      conversation_id: CONVERSATION_ID,
    });
  });

  it("fires onStatus per status frame and keeps status out of the reply (SPEC-036)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        sseResponse([
          `data: {"conversation_id": "${CONVERSATION_ID}"}\n\n`,
          'data: {"status": "Understanding your question…"}\n\n',
          'data: {"status": "Crunching revenue numbers…"}\n\n',
          'data: {"delta": "Revenue is up."}\n\n',
          'data: {"done": true}\n\n',
        ]),
      ),
    );

    const statuses: string[] = [];
    const reply = await getAssistantReply(
      "how is revenue?",
      CONVERSATION_ID,
      undefined,
      undefined,
      (status) => statuses.push(status),
    );

    expect(statuses).toEqual([
      "Understanding your question…",
      "Crunching revenue numbers…",
    ]);
    expect(reply.reply).toBe("Revenue is up.");
  });

  it("handles frames split across network chunks", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        sseResponse(['data: {"del', 'ta": "Hello"}\n\n', 'data: {"delta": " world"}\n\n']),
      ),
    );

    const chunks: string[] = [];
    const reply = await getAssistantReply("hi", CONVERSATION_ID, (acc) => chunks.push(acc));
    expect(chunks).toEqual(["Hello", "Hello world"]);
    expect(reply.reply).toBe("Hello world");
  });

  it("works without an onDelta callback", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => sseResponse(['data: {"delta": "Answer."}\n\n'])),
    );
    await expect(getAssistantReply("q", CONVERSATION_ID)).resolves.toMatchObject({ reply: "Answer." });
  });

  it("throws on an SSE error frame", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        sseResponse(['data: {"error": "agent_error", "detail": "Tool failed."}\n\n']),
      ),
    );
    await expect(getAssistantReply("q", CONVERSATION_ID)).rejects.toThrow("Tool failed.");
  });

  it("throws the backend message on a non-OK response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 402,
        body: null,
        json: async () => ({ error: { message: "Out of quota." } }),
      })),
    );
    await expect(getAssistantReply("q", CONVERSATION_ID)).rejects.toThrow("Out of quota.");
  });

  it("resolves a fallback line for an empty stream", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => sseResponse([])));
    await expect(getAssistantReply("q", CONVERSATION_ID)).resolves.toMatchObject({
      reply: "I could not produce an answer — please try again.",
    });
  });
});

// ── SPEC-019 — API↔UI history adapters (pure) ────────────────────────────────

const API_CONVERSATION: ApiConversation = {
  id: CONVERSATION_ID,
  title: "How is revenue this week?",
  created_at: "2026-07-10T09:00:00Z",
  updated_at: "2026-07-10T09:05:00Z",
  messages: [
    {
      id: 41,
      role: "user",
      content: "How is revenue this week?",
      created_at: "2026-07-10T09:00:00Z",
    },
    {
      id: 42,
      role: "assistant",
      content: "Revenue this week is **$1,000**.",
      created_at: "2026-07-10T09:00:30Z",
    },
  ],
};

describe("toChatConversation (SPEC-019)", () => {
  it("maps every field and stringifies message ids", () => {
    expect(toChatConversation(API_CONVERSATION)).toEqual({
      id: CONVERSATION_ID,
      title: "How is revenue this week?",
      createdAt: "2026-07-10T09:00:00Z",
      updatedAt: "2026-07-10T09:05:00Z",
      messages: [
        {
          id: "41",
          role: "user",
          content: "How is revenue this week?",
          createdAt: "2026-07-10T09:00:00Z",
          model: null,
          temperature: null,
          sources: null,
          feedback: null,
          pinnedAt: null,
        },
        {
          id: "42",
          role: "assistant",
          content: "Revenue this week is **$1,000**.",
          createdAt: "2026-07-10T09:00:30Z",
          model: null,
          temperature: null,
          sources: null,
          feedback: null,
          pinnedAt: null,
        },
      ],
      // SPEC-249: unfiled, unpinned unless the server says otherwise.
      projectId: null,
      pinnedAt: null,
    });
  });

  it("carries a project, a pinned chat and a pinned answer (SPEC-249)", () => {
    const filed = toChatConversation({
      ...API_CONVERSATION,
      project_id: "p-1",
      pinned_at: "2026-09-16T00:00:00Z",
      messages: [{ ...API_CONVERSATION.messages[1], pinned_at: "2026-09-16T00:00:01Z" }],
    });
    expect(filed.projectId).toBe("p-1");
    expect(filed.pinnedAt).toBe("2026-09-16T00:00:00Z");
    expect(filed.messages[0].pinnedAt).toBe("2026-09-16T00:00:01Z");
  });
});

describe("toImportPayload (SPEC-019)", () => {
  const conversation: ChatConversation = toChatConversation(API_CONVERSATION);

  it("preserves ids, titles, contents, and exact timestamps", () => {
    const payload = toImportPayload([conversation]);
    expect(payload.conversations).toHaveLength(1);
    expect(payload.conversations[0]).toEqual({
      id: conversation.id,
      title: "How is revenue this week?",
      created_at: "2026-07-10T09:00:00Z",
      updated_at: "2026-07-10T09:05:00Z",
      messages: [
        {
          role: "user",
          content: "How is revenue this week?",
          created_at: "2026-07-10T09:00:00Z",
        },
        {
          role: "assistant",
          content: "Revenue this week is **$1,000**.",
          created_at: "2026-07-10T09:00:30Z",
        },
      ],
    });
  });

  it("respects the backend caps (100 conversations, 200 messages, 80-char titles)", () => {
    const many = Array.from({ length: 120 }, (_, index) => ({
      ...conversation,
      id: `00000000-0000-4000-8000-${`${index}`.padStart(12, "0")}`,
      title: "t".repeat(120),
      messages: Array.from({ length: 250 }, (_, messageIndex) => ({
        id: String(messageIndex),
        role: "user" as const,
        content: "x",
        createdAt: "2026-07-10T09:00:00Z",
      })),
    }));
    const payload = toImportPayload(many);
    expect(payload.conversations).toHaveLength(100);
    expect(payload.conversations[0].title).toHaveLength(80);
    expect(payload.conversations[0].messages).toHaveLength(200);
  });
});

describe("getAssistantReply — the done frame (SPEC-240)", () => {
  it("resolves the stored message id and the provenance from the done frame", async () => {
    const sources = {
      grounded: true,
      systems: ["Shopify"],
      tools: ["get_inventory_alerts"],
      chips: [{ kind: "product", label: "E-Gift Card", href: "/products/7" }],
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        sseResponse([
          'data: {"conversation_id": "c"}\n\n',
          'data: {"delta": "Stock is fine."}\n\n',
          `data: {"done": true, "message_id": 251, "sources": ${JSON.stringify(sources)}}\n\n`,
        ]),
      ),
    );
    const turn = await getAssistantReply("q", CONVERSATION_ID);
    expect(turn).toEqual({ reply: "Stock is fine.", messageId: "251", sources });
  });

  it("leaves the id null when the reply could not be stored", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        sseResponse(['data: {"delta": "x"}\n\n', 'data: {"done": true, "message_id": null, "sources": null}\n\n']),
      ),
    );
    const turn = await getAssistantReply("q", CONVERSATION_ID);
    expect(turn.messageId).toBeNull();
    expect(turn.sources).toBeNull();
  });
});

describe("listConversations / setActiveConversation (SPEC-245)", () => {
  const item: ApiConversation = {
    id: CONVERSATION_ID,
    title: "Best sellers",
    created_at: "2026-09-15T09:00:00Z",
    updated_at: "2026-09-15T09:05:00Z",
    messages: [],
  };

  it("returns the conversations and the account's last active thread", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ items: [item], active_id: CONVERSATION_ID }),
      })),
    );
    const history = await listConversations();
    expect(history.conversations.map((c) => c.id)).toEqual([CONVERSATION_ID]);
    expect(history.activeId).toBe(CONVERSATION_ID);
  });

  it("treats a missing or null active_id as none", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ items: [] }) })),
    );
    expect((await listConversations()).activeId).toBeNull();
  });

  it("records the thread with a PUT and surfaces a failure as an error", async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    await setActiveConversation(CONVERSATION_ID);
    await setActiveConversation(null);
    const calls = fetchMock.mock.calls as unknown as [string, RequestInit][];
    expect(calls[0][0]).toMatch(/\/chat\/active$/);
    expect(calls[0][1].method).toBe("PUT");
    expect(JSON.parse(String(calls[0][1].body))).toEqual({ conversation_id: CONVERSATION_ID });
    expect(JSON.parse(String(calls[1][1].body))).toEqual({ conversation_id: null });

    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 404 })));
    await expect(setActiveConversation(CONVERSATION_ID)).rejects.toThrow(/404/);
  });
});

describe("toImportPayload drops what the server would refuse (SPEC-019 Patches)", () => {
  const base: ChatConversation = toChatConversation(API_CONVERSATION);
  it("skips empty and over-long messages, empty titles, non-UUID ids and threads left empty", () => {
    const payload = toImportPayload([
      { ...base, messages: [{ id: "a", role: "user", content: "", createdAt: "2026-07-10T09:00:00Z" }, ...base.messages] },
      { ...base, id: "not-a-uuid" },
      { ...base, id: "11111111-2222-4333-8444-555555555555", title: "   " },
      { ...base, id: "11111111-2222-4333-8444-666666666666", messages: [{ id: "b", role: "assistant", content: "x".repeat(8001), createdAt: "2026-07-10T09:00:00Z" }] },
    ]);
    expect(payload.conversations).toHaveLength(1);
    expect(payload.conversations[0].id).toBe(base.id);
    expect(payload.conversations[0].messages).toHaveLength(2);
  });
});
