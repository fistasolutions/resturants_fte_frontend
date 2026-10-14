import { describe, expect, it } from "vitest";

import {
  BASE_CPS,
  CATCH_UP_S,
  FINISH_S,
  createStreamPacer,
  revealStep,
  type PacerScheduler,
} from "@/lib/stream-pacer";

describe("revealStep (SPEC-355)", () => {
  const text = "x".repeat(1000);

  it("moves at least the base pace", () => {
    expect(revealStep(0, "x".repeat(10_000), 1000, false)).toBeGreaterThanOrEqual(BASE_CPS);
    expect(revealStep(0, text, 16, false)).toBeGreaterThanOrEqual(1);
  });

  it("speeds up so the backlog drains within the catch-up window", () => {
    const backlog = 1000;
    // One second of frames: at least backlog / CATCH_UP_S characters a second.
    expect(revealStep(0, text, 100, false)).toBeGreaterThanOrEqual(Math.floor((backlog / CATCH_UP_S) * 0.1));
    // Finishing drains faster.
    expect(revealStep(0, text, 100, true)).toBeGreaterThanOrEqual(Math.floor((backlog / FINISH_S) * 0.1));
  });

  it("never overshoots and stays put when caught up", () => {
    expect(revealStep(995, text, 100, true)).toBe(1000); // 9 more would pass the end
    expect(revealStep(1000, text, 100, false)).toBe(1000);
  });

  it("caps a long frame (a background tab)", () => {
    expect(revealStep(0, "x".repeat(100_000), 60_000, false)).toBeLessThan(100_000 * 0.1);
  });

  it("never splits a surrogate pair", () => {
    const emoji = "ab😀cd";
    // Position 3 would end between the emoji's two halves.
    for (let shown = 0; shown < emoji.length; shown += 1) {
      const next = revealStep(shown, emoji, 1, false);
      const code = emoji.charCodeAt(next - 1);
      expect(next === emoji.length || code < 0xd800 || code > 0xdbff).toBe(true);
    }
  });
});

function manualScheduler(hidden = false) {
  let now = 0;
  let queue: ((time: number) => void)[] = [];
  const scheduler: PacerScheduler = {
    request: (callback) => {
      queue.push(callback);
      return queue.length;
    },
    cancel: () => {
      queue = [];
    },
    now: () => now,
    hidden: () => hidden,
  };
  const frame = (ms = 16) => {
    now += ms;
    const run = queue;
    queue = [];
    run.forEach((callback) => callback(now));
  };
  return { scheduler, frame, pending: () => queue.length };
}

describe("createStreamPacer", () => {
  it("draws the text over frames and resolves finish only when all is shown", async () => {
    const { scheduler, frame } = manualScheduler();
    const frames: string[] = [];
    const pacer = createStreamPacer((text) => frames.push(text), scheduler);
    const reply = "Hello there, this is a reply that arrived in one burst.";
    pacer.push(reply);
    frame();
    expect(frames.at(-1)!.length).toBeLessThan(reply.length);
    let finished = false;
    const done = pacer.finish().then(() => {
      finished = true;
    });
    for (let i = 0; i < 200 && frames.at(-1) !== reply; i += 1) frame();
    await done;
    expect(finished).toBe(true);
    expect(frames.at(-1)).toBe(reply);
    // Every frame is a prefix of the reply, growing.
    frames.reduce((previous, current) => {
      expect(reply.startsWith(current)).toBe(true);
      expect(current.length).toBeGreaterThanOrEqual(previous.length);
      return current;
    }, "");
  });

  it("finishes at once when nothing is left, and flushes in a hidden tab", async () => {
    const empty = createStreamPacer(() => undefined, manualScheduler().scheduler);
    await empty.finish();
    const frames: string[] = [];
    const hidden = createStreamPacer((text) => frames.push(text), manualScheduler(true).scheduler);
    hidden.push("All of it");
    await hidden.finish();
    expect(frames.at(-1)).toBe("All of it");
  });

  it("cancel releases a pending finish and stops drawing", async () => {
    const { scheduler, pending } = manualScheduler();
    const pacer = createStreamPacer(() => undefined, scheduler);
    pacer.push("Some text that will not be finished");
    const done = pacer.finish();
    pacer.cancel();
    await done;
    expect(pending()).toBe(0);
  });
});
