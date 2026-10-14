import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  evict,
  forgetFollowUps,
  loadFollowUps,
  saveFollowUps,
} from "@/lib/chat-followups";

/**
 * SPEC-223. Switching conversation used to clear the chips to the generic
 * starters, which reads as the assistant forgetting the exchange.
 *
 * Vitest runs in node here, so `window.localStorage` is stubbed — including the
 * case where it THROWS, which is real: a private window or blocked site data
 * makes the accessor itself raise, and the chips must degrade to the starters
 * rather than take the page down.
 */
function stubStorage(impl?: Partial<Storage>) {
  const data = new Map<string, string>();
  const storage = {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
    ...impl,
  };
  vi.stubGlobal("window", { localStorage: storage });
  return data;
}

beforeEach(() => stubStorage());
afterEach(() => vi.unstubAllGlobals());

describe("saveFollowUps / loadFollowUps", () => {
  it("returns a conversation's own chips", () => {
    saveFollowUps("conv-a", ["How is revenue this week?", "Best sellers?"]);
    expect(loadFollowUps("conv-a")).toEqual([
      "How is revenue this week?",
      "Best sellers?",
    ]);
  });

  it("keeps conversations apart", () => {
    saveFollowUps("conv-a", ["A question"]);
    saveFollowUps("conv-b", ["B question"]);
    expect(loadFollowUps("conv-a")).toEqual(["A question"]);
    expect(loadFollowUps("conv-b")).toEqual(["B question"]);
  });

  it("falls back to the starters for an unknown or absent conversation", () => {
    expect(loadFollowUps("never-seen")).toBeNull();
    expect(loadFollowUps(null)).toBeNull();
  });

  it("does not store an empty set", () => {
    saveFollowUps("conv-a", []);
    expect(loadFollowUps("conv-a")).toBeNull();
  });
});

describe("forgetFollowUps", () => {
  it("drops the chips when its conversation is deleted", () => {
    saveFollowUps("conv-a", ["A question"]);
    forgetFollowUps("conv-a");
    expect(loadFollowUps("conv-a")).toBeNull();
  });
});

describe("storage failures", () => {
  it("degrades to the starters when reading throws", () => {
    stubStorage({
      getItem: () => {
        throw new Error("site data blocked");
      },
    });
    expect(loadFollowUps("conv-a")).toBeNull();
  });

  it("never throws out of a write", () => {
    stubStorage({
      setItem: () => {
        throw new Error("quota exceeded");
      },
    });
    expect(() => saveFollowUps("conv-a", ["x"])).not.toThrow();
  });

  it("ignores a corrupt payload rather than crashing", () => {
    const data = stubStorage();
    data.set("aias_chat_followups", "{not json");
    expect(loadFollowUps("conv-a")).toBeNull();
  });

  it("rejects a payload of the wrong shape", () => {
    const data = stubStorage();
    data.set("aias_chat_followups", JSON.stringify({ "conv-a": [1, 2, 3] }));
    expect(loadFollowUps("conv-a")).toBeNull();
  });
});

describe("evict", () => {
  it("keeps the cache bounded, dropping the oldest first", () => {
    const cache = Object.fromEntries(
      Array.from({ length: 35 }, (_, i) => [`conv-${i}`, ["q"]]),
    );
    const trimmed = evict(cache, 30);
    expect(Object.keys(trimmed)).toHaveLength(30);
    expect(trimmed["conv-0"]).toBeUndefined();  // oldest gone
    expect(trimmed["conv-34"]).toEqual(["q"]);  // newest kept
  });

  it("leaves a small cache untouched", () => {
    const cache = { a: ["q"] };
    expect(evict(cache, 30)).toBe(cache);
  });
});
