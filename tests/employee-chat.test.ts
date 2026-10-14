import { describe, expect, it } from "vitest";

import {
  cardsFrom,
  EMPLOYEES,
  FINANCE_EMPLOYEE,
  lastThreadKey,
  newThread,
  SPOTLIGHT_EMPLOYEE,
  threadTimeLabel,
  threadTitleFrom,
  threadToOpen,
  upsertThread,
  withReply,
  withUserTurn,
} from "@/lib/employee-chat";
import { SPOTLIGHT_TAB_IDS, spotlightTabLabel } from "@/lib/spotlight";
import type { ChatConversation } from "@/types/chat";

const NOW = "2026-09-22T09:00:00.000Z";

function thread(id: string, updatedAt: string, title = `Thread ${id}`): ChatConversation {
  return { id, title, createdAt: updatedAt, updatedAt, messages: [], projectId: null, pinnedAt: null };
}

describe("the Search Visibility employee (SPEC-293)", () => {
  it("is the first employee, with a Chat tab second in Search Visibility's bar", () => {
    expect(Object.keys(EMPLOYEES)).toEqual(["spotlight", "finance", "email_marketing", "customer_support"]);
    expect(SPOTLIGHT_EMPLOYEE.starters.map((s) => s.label)).toEqual([
      "What should I write next?",
      "Show me today's picks",
      "Which topics sit on page two?",
      "Write about …",
    ]);
    expect(SPOTLIGHT_EMPLOYEE.starters[3].prefill).toBe(true);
    expect(SPOTLIGHT_TAB_IDS[1]).toBe("chat");
    expect(spotlightTabLabel("chat")).toBe("Chat");
    expect(lastThreadKey("spotlight")).toBe("employee-chat:spotlight:last");
  });

  it("reads only the cards it can draw", () => {
    expect(cardsFrom(null)).toEqual([]);
    expect(cardsFrom({ grounded: true, systems: [], tools: [], chips: [] })).toEqual([]);
    expect(
      cardsFrom({
        grounded: true,
        systems: [],
        tools: [],
        chips: [],
        cards: [
          { kind: "generation", job_id: 12, keyword: "graduation dresses" },
          { kind: "generation" },
          { kind: "something-else", job_id: 3 },
        ],
      }),
    ).toEqual([{ kind: "generation", job_id: 12, keyword: "graduation dresses" }]);
  });

  it("titles a thread from the first ask and appends turns without mutating", () => {
    expect(threadTitleFrom("  Write   about graduation dresses for the buyer  ")).toBe(
      "Write about graduation dresses for the buyer",
    );
    expect(threadTitleFrom("x".repeat(80), 20)).toBe(`${"x".repeat(19)}…`);
    const fresh = newThread("t1", "Write about skirts", NOW);
    const asked = withUserTurn(fresh, { id: "u1", role: "user", content: "Write about skirts", createdAt: NOW });
    expect(fresh.messages).toEqual([]);
    expect(asked.messages.map((m) => m.role)).toEqual(["user"]);
    const answered = withReply(asked, {
      id: "42",
      content: "Started.",
      createdAt: "2026-09-22T09:00:05.000Z",
      sources: { grounded: true, systems: [], tools: ["write_article"], chips: [], cards: [{ kind: "generation", job_id: 5 }] },
    });
    expect(answered.messages.map((m) => m.role)).toEqual(["user", "assistant"]);
    expect(answered.updatedAt).toBe("2026-09-22T09:00:05.000Z");
    expect(cardsFrom(answered.messages[1].sources)).toEqual([{ kind: "generation", job_id: 5 }]);
  });

  it("keeps the rail newest first and reopens the remembered thread", () => {
    const a = thread("a", "2026-09-20T10:00:00Z");
    const b = thread("b", "2026-09-21T10:00:00Z");
    const list = upsertThread([a], b);
    expect(list.map((t) => t.id)).toEqual(["b", "a"]);
    const bumped = upsertThread(list, { ...a, updatedAt: "2026-09-22T10:00:00Z" });
    expect(bumped.map((t) => t.id)).toEqual(["a", "b"]);
    expect(threadToOpen(bumped, "b")).toBe("b");
    expect(threadToOpen(bumped, "gone")).toBe("a");
    expect(threadToOpen([], "b")).toBeNull();
  });

  it("labels a thread's time short enough for one line", () => {
    const now = new Date("2026-09-22T15:07:30Z");
    expect(threadTimeLabel("2026-09-22T15:07:00Z", now)).toBe("Just now");
    expect(threadTimeLabel("2026-09-22T09:05:00Z", now)).toMatch(/AM|PM/);
    expect(threadTimeLabel("2026-09-20T09:05:00Z", now)).toBe("Sep 20");
    expect(threadTimeLabel("nope", now)).toBe("");
  });
});

describe("the Accounts Payable employee (SPEC-301)", () => {
  it("has its own thread memory and starters that ask, never pay", () => {
    expect(FINANCE_EMPLOYEE.id).toBe("finance");
    expect(lastThreadKey("finance")).toBe("employee-chat:finance:last");
    expect(FINANCE_EMPLOYEE.starters).toHaveLength(4);
    expect(FINANCE_EMPLOYEE.starters.every((s) => !/\bpay (it|them|now)\b/i.test(s.text))).toBe(true);
  });
});

describe("the Customer Support Agent's chat (SPEC-346)", () => {
  it("offers the three asks the owner named, plus a prefilled topic ask", () => {
    const meta = EMPLOYEES.customer_support;
    expect(meta.name).toBe("Customer Support Agent");
    expect(meta.starters.map((s) => s.label)).toEqual([
      "What are customers angry about this week?",
      "Draft a reply for late orders",
      "Why did CSAT drop?",
      "Ask about a topic …",
    ]);
    expect(meta.starters.filter((s) => s.prefill)).toHaveLength(1);
  });
});
