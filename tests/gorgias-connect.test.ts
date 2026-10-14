/** SPEC-372 — Connect with Gorgias: the pure rules of the round trip and the install link. */

import { describe, expect, it } from "vitest";

import {
  GORGIAS_BAD_SUBDOMAIN,
  GORGIAS_DENIED_MESSAGE,
  GORGIAS_GENERIC_ERROR,
  GORGIAS_NO_SUBDOMAIN,
  canConnectWithGorgias,
  gorgiasAutoStart,
  gorgiasCallbackStep,
  gorgiasErrorMessage,
  gorgiasNotice,
  gorgiasReturnUrl,
  gorgiasScopeLabels,
  gorgiasSubdomain,
  installSubdomain,
  withoutGorgiasInstall,
} from "@/lib/gorgias-connect";
import { parseDetailTab, toConnection, type ApiHubConnection } from "@/lib/integration-hub";
import type { HubOAuth } from "@/types/integrations";

describe("gorgiasSubdomain", () => {
  it.each([
    ["acme", "acme"],
    ["  ACME ", "acme"],
    ["acme.gorgias.com", "acme"],
    ["https://acme-2.gorgias.com/app/tickets", "acme-2"],
  ])("reads %j as %j", (raw, expected) => {
    expect(gorgiasSubdomain(raw)).toEqual({ ok: true, subdomain: expected });
  });

  it("asks for one when there is none", () => {
    expect(gorgiasSubdomain("")).toEqual({ ok: false, message: GORGIAS_NO_SUBDOMAIN });
    expect(gorgiasSubdomain(null)).toEqual({ ok: false, message: GORGIAS_NO_SUBDOMAIN });
  });

  it.each(["evil.com/x?", "a.b", "-acme", "acme_1", "x".repeat(64), "a b"])("refuses %j", (raw) => {
    expect(gorgiasSubdomain(raw)).toEqual({ ok: false, message: GORGIAS_BAD_SUBDOMAIN });
  });
});

describe("the callback", () => {
  it("returns to Gorgias's own Settings tab with the result", () => {
    expect(gorgiasReturnUrl({ gorgias: "connected" })).toBe("/integrations/gorgias?tab=settings&gorgias=connected");
    expect(gorgiasReturnUrl({ gorgias_error: "No luck" })).toBe(
      "/integrations/gorgias?tab=settings&gorgias_error=No+luck",
    );
  });

  it("says a denied consent plainly, with the way back", () => {
    expect(gorgiasCallbackStep({ error: "access_denied", code: null, state: null })).toEqual({
      kind: "cancelled",
      message: GORGIAS_DENIED_MESSAGE,
    });
    expect(GORGIAS_DENIED_MESSAGE).toContain("click Connect with Gorgias again and press Allow");
  });

  it("turns any other refusal or a missing code into one plain sentence", () => {
    for (const query of [
      { error: "server_error", code: "c", state: "s" },
      { error: null, code: null, state: "s" },
      { error: null, code: "c", state: null },
    ]) {
      expect(gorgiasCallbackStep(query)).toEqual({ kind: "failed", message: GORGIAS_GENERIC_ERROR });
    }
  });

  it("hands a code and a state to the backend", () => {
    expect(gorgiasCallbackStep({ error: null, code: "c", state: "s" })).toEqual({
      kind: "exchange",
      code: "c",
      state: "s",
    });
  });

  it("cuts a long message and falls back on a blank one", () => {
    expect(gorgiasErrorMessage("")).toBe(GORGIAS_GENERIC_ERROR);
    expect(gorgiasErrorMessage("  ")).toBe(GORGIAS_GENERIC_ERROR);
    const long = gorgiasErrorMessage("x".repeat(400));
    expect(long).toHaveLength(300);
    expect(long.endsWith("…")).toBe(true);
  });

  it("shows the result line on the page", () => {
    expect(gorgiasNotice(new URLSearchParams("gorgias=connected"))?.tone).toBe("success");
    expect(gorgiasNotice(new URLSearchParams("gorgias_error=Nope"))).toEqual({ tone: "error", text: "Nope" });
    expect(gorgiasNotice(new URLSearchParams("tab=settings"))).toBeNull();
  });

  it("opens the Settings tab when a result or an install link lands", () => {
    for (const query of ["gorgias=connected", "gorgias_error=x", "connect=gorgias&account=acme"]) {
      expect(parseDetailTab(new URLSearchParams(query))).toBe("settings");
    }
  });
});

describe("the hub card's oauth field", () => {
  const base: ApiHubConnection = {
    key: "gorgias",
    connected: true,
    available: true,
    status: "healthy",
    attention: null,
    last_success_at: null,
    last_run_at: null,
    last_records: null,
    runs: [],
    errors_7d: 0,
    can_sync: true,
    can_test: true,
    account: null,
    connected_at: null,
    connected_by: null,
  };

  it("carries needs-reconnecting only when the backend says so", () => {
    const fine = toConnection({ ...base, oauth: { available: true, connected: true, scopes: [] } });
    expect(fine.oauth).toEqual({ available: true, connected: true, scopes: [] });
    const stale = toConnection({
      ...base,
      oauth: { available: true, connected: true, scopes: [], needs_reconnecting: true },
    });
    expect(stale.oauth?.needsReconnecting).toBe(true);
  });

  it("offers the button only when available and not yet connected", () => {
    expect(canConnectWithGorgias({ available: true, connected: false, scopes: [] })).toBe(true);
    expect(canConnectWithGorgias({ available: true, connected: true, scopes: [] })).toBe(false);
    expect(canConnectWithGorgias({ available: false, connected: false, scopes: [] })).toBe(false);
    expect(canConnectWithGorgias(undefined)).toBe(false);
  });
});

describe("gorgiasScopeLabels", () => {
  it("says what the sign-in may do, in reading order, without the OpenID basics", () => {
    expect(
      gorgiasScopeLabels(["openid", "email", "profile", "offline", "tickets:write", "tickets:read", "users:read"]),
    ).toEqual([
      "Read tickets and their messages",
      "Read agents and teams",
      "Reply, add notes and update tickets — only on your approval or chosen autonomy",
    ]);
  });

  it("shows a scope it does not know as it is", () => {
    expect(gorgiasScopeLabels(["tickets:read", "customers:read"])).toEqual([
      "Read tickets and their messages",
      "customers:read",
    ]);
  });
});

describe("the install link (App URL)", () => {
  const available: HubOAuth = { available: true, connected: false, scopes: [] };
  const allowed = { known: true, allowed: true };
  const link = new URLSearchParams("connect=gorgias&account=Acme");

  it("does nothing without the link", () => {
    expect(gorgiasAutoStart(new URLSearchParams("tab=settings"), available, allowed, null)).toBeNull();
  });

  it("waits while the connection or the access is loading", () => {
    expect(gorgiasAutoStart(link, undefined, allowed, null)).toBe("wait");
    expect(gorgiasAutoStart(link, available, { known: false, allowed: false }, null)).toBe("wait");
  });

  it("starts on Gorgias's account, else the saved one, else asks for it", () => {
    expect(gorgiasAutoStart(link, available, allowed, null)).toBe("start");
    expect(installSubdomain(link, "saved")).toBe("acme");
    const bare = new URLSearchParams("connect=gorgias");
    expect(gorgiasAutoStart(bare, available, allowed, "saved")).toBe("start");
    expect(installSubdomain(bare, "saved")).toBe("saved");
    expect(gorgiasAutoStart(bare, available, allowed, null)).toBe("need_subdomain");
    expect(gorgiasAutoStart(new URLSearchParams("connect=gorgias&account=a b"), available, allowed, null)).toBe(
      "need_subdomain",
    );
  });

  it("says when it is already connected, not allowed or not set up", () => {
    expect(gorgiasAutoStart(link, { ...available, connected: true }, allowed, null)).toBe("connected");
    expect(gorgiasAutoStart(link, available, { known: true, allowed: false }, null)).toBe("not_allowed");
    expect(gorgiasAutoStart(link, null, allowed, null)).toBe("unavailable");
    expect(gorgiasAutoStart(link, { ...available, available: false }, allowed, null)).toBe("unavailable");
  });

  it("reconnects a sign-in Gorgias stopped accepting", () => {
    expect(
      gorgiasAutoStart(link, { available: true, connected: true, scopes: [], needsReconnecting: true }, allowed, null),
    ).toBe("start");
  });

  it("drops the link from the address so it never runs twice", () => {
    expect(withoutGorgiasInstall("/integrations/gorgias", new URLSearchParams("tab=settings&connect=gorgias&account=acme"))).toBe(
      "/integrations/gorgias?tab=settings",
    );
    expect(withoutGorgiasInstall("/integrations/gorgias", link)).toBe("/integrations/gorgias");
  });
});
