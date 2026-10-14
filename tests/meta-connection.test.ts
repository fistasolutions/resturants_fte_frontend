/**
 * SPEC-171 — Meta integration card presentation rules.
 *
 * The load-bearing case is the badge ordering: a Facebook Page connected with no
 * linked Instagram account must NEVER read as a clean success, because that is
 * the difference between "publishing works" and "half of publishing works".
 */

import { describe, expect, it } from "vitest";

import {
  connectionSummary,
  metaBadge,
  metaCapability,
  tokenWarning,
} from "@/lib/meta-connection";
import type { MetaStatus } from "@/types/integrations";

function status(over: Partial<MetaStatus> = {}): MetaStatus {
  return {
    connected: true,
    configured: true,
    pageName: "Example Store",
    instagramUsername: "examplestore",
    instagramLinked: true,
    tokenExpiresAt: "2026-10-26T00:00:00Z",
    expiringSoon: false,
    connectedBy: "Rivka Cohen",
    connectedAt: "2026-08-27T10:00:00Z",
    ...over,
  };
}

describe("metaBadge", () => {
  it("reports Unavailable when the server has no Meta app configured", () => {
    expect(metaBadge(status({ configured: false, connected: false }))).toEqual({
      label: "Unavailable",
      tone: "neutral",
    });
  });

  it("reports Not connected when configured but unconnected", () => {
    expect(metaBadge(status({ connected: false }))).toEqual({
      label: "Not connected",
      tone: "warning",
    });
  });

  it("reports Connected when Instagram is linked", () => {
    expect(metaBadge(status())).toEqual({ label: "Connected", tone: "success" });
  });

  it("reports Facebook only — NOT a clean success — when no Instagram is linked", () => {
    const badge = metaBadge(status({ instagramLinked: false, instagramUsername: null }));
    expect(badge).toEqual({ label: "Facebook only", tone: "warning" });
    expect(badge.tone).not.toBe("success");
  });

  it("prefers Unavailable even if a stale connection row still says connected", () => {
    // Config removed from the server while a row lingers: nothing can work, so
    // the card must not imply it can.
    expect(metaBadge(status({ configured: false, connected: true })).label).toBe(
      "Unavailable",
    );
  });
});

describe("metaCapability", () => {
  it("names both channels when Instagram is linked", () => {
    expect(metaCapability(status())).toContain("Instagram and Facebook");
  });

  it("says Facebook only and tells the owner how to fix it", () => {
    const text = metaCapability(status({ instagramLinked: false }));
    expect(text).toContain("Facebook only");
    expect(text).toContain("Meta Business Suite");
  });

  it("says nothing when disconnected", () => {
    expect(metaCapability(status({ connected: false }))).toBeNull();
  });
});

describe("tokenWarning", () => {
  it("stays silent while the token is healthy", () => {
    expect(tokenWarning(status())).toBeNull();
  });

  it("warns when the token is about to expire", () => {
    expect(tokenWarning(status({ expiringSoon: true }))).toContain("Reconnect");
  });

  it("stays silent when disconnected, even if the flag is set", () => {
    expect(tokenWarning(status({ connected: false, expiringSoon: true }))).toBeNull();
  });
});

describe("connectionSummary", () => {
  it("lists page, instagram handle, and who authorised it, in order", () => {
    expect(connectionSummary(status())).toEqual([
      { label: "Page", value: "Example Store" },
      { label: "Instagram", value: "@examplestore" },
      { label: "Authorised by", value: "Rivka Cohen" },
    ]);
  });

  it("drops fields the backend didn't send rather than rendering a bare label", () => {
    expect(
      connectionSummary(status({ instagramUsername: null, connectedBy: null })),
    ).toEqual([{ label: "Page", value: "Example Store" }]);
  });

  it("returns nothing when disconnected", () => {
    expect(connectionSummary(status({ connected: false }))).toEqual([]);
  });
});
