import { describe, expect, it } from "vitest";

import { GLISP_MOTION_MS, JUST_COMMITTED_MS, avatarState, justCommitted } from "@/lib/glisp-motion";

describe("justCommitted", () => {
  const now = Date.parse("2026-09-16T12:00:00Z");
  it("is true only for a reply that finished seconds ago", () => {
    expect(justCommitted("2026-09-16T11:59:58Z", now)).toBe(true);
    expect(justCommitted(new Date(now - JUST_COMMITTED_MS).toISOString(), now)).toBe(false);
    expect(justCommitted("2026-09-15T12:00:00Z", now)).toBe(false);
  });
  it("never pops for a missing, unparseable or future timestamp", () => {
    expect(justCommitted(null, now)).toBe(false);
    expect(justCommitted("yesterday", now)).toBe(false);
    expect(justCommitted("2026-09-16T12:00:01Z", now)).toBe(false);
  });
});

describe("avatarState", () => {
  it("thinks while a reply is in flight, otherwise breathes", () => {
    expect(avatarState(true)).toBe("thinking");
    expect(avatarState(false)).toBe("online");
  });
});

describe("GLISP_MOTION_MS", () => {
  it("outlasts every keyframe it clears", () => {
    expect(GLISP_MOTION_MS.send).toBeGreaterThanOrEqual(380 + 200);
    expect(GLISP_MOTION_MS.pop).toBeGreaterThanOrEqual(700);
    expect(GLISP_MOTION_MS.nod).toBeGreaterThanOrEqual(600);
    expect(GLISP_MOTION_MS.shake).toBeGreaterThanOrEqual(360);
  });
});
