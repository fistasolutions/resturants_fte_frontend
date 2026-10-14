/** SPEC-371 — Connect with Klaviyo: the return-path allowlist, the callback's decisions, the
 * result line, the hub forward, the card adapter and the scopes in words. */
import { describe, expect, it } from "vitest";

import { parseDetailTab, toConnection, type ApiHubConnection } from "@/lib/integration-hub";
import {
  canConnectWithKlaviyo,
  KLAVIYO_DENIED_MESSAGE,
  KLAVIYO_EMAIL_RETURN,
  KLAVIYO_GENERIC_ERROR,
  KLAVIYO_INTEGRATIONS_RETURN,
  KLAVIYO_RETURN_COOKIE,
  klaviyoAutoStart,
  klaviyoCallbackStep,
  klaviyoErrorMessage,
  klaviyoHubForward,
  klaviyoNotice,
  klaviyoReturnCookie,
  klaviyoReturnPath,
  klaviyoReturnUrl,
  klaviyoScopeLabels,
  toHubOAuth,
  withoutConnectParam,
} from "@/lib/klaviyo-connect";

describe("klaviyoReturnPath", () => {
  it("allows the hub and Email Marketing's Settings", () => {
    expect(klaviyoReturnPath("/integrations")).toBe("/integrations");
    expect(klaviyoReturnPath("/email-marketing?tab=settings")).toBe("/email-marketing?tab=settings");
  });

  it("reads the cookie's encoded form", () => {
    expect(klaviyoReturnPath(encodeURIComponent(KLAVIYO_EMAIL_RETURN))).toBe(KLAVIYO_EMAIL_RETURN);
  });

  it("falls back to the hub for anything unknown, absent or malformed", () => {
    for (const value of [
      undefined,
      null,
      "",
      "https://evil.example.com",
      "//evil.example.com",
      "/email-marketing",
      "/email-marketing?tab=settings&next=https://evil.example.com",
      "/integrations/../admin",
      "%E0%A4%A",
    ]) {
      expect(klaviyoReturnPath(value)).toBe(KLAVIYO_INTEGRATIONS_RETURN);
    }
  });
});

describe("klaviyoReturnCookie", () => {
  it("remembers the start page for fifteen minutes and round-trips through the allowlist", () => {
    const cookie = klaviyoReturnCookie(KLAVIYO_EMAIL_RETURN);
    expect(cookie.startsWith(`${KLAVIYO_RETURN_COOKIE}=`)).toBe(true);
    expect(cookie).toContain("Max-Age=900");
    expect(cookie).toContain("SameSite=Lax");
    const value = cookie.slice(`${KLAVIYO_RETURN_COOKIE}=`.length).split(";")[0];
    expect(klaviyoReturnPath(value)).toBe(KLAVIYO_EMAIL_RETURN);
  });

  it("forgets it with null", () => {
    expect(klaviyoReturnCookie(null)).toContain("Max-Age=0");
  });
});

describe("klaviyoReturnUrl", () => {
  it("adds the result to the page's own query", () => {
    expect(klaviyoReturnUrl(KLAVIYO_EMAIL_RETURN, { klaviyo: "connected" })).toBe(
      "/email-marketing?tab=settings&klaviyo=connected",
    );
    expect(klaviyoReturnUrl("/integrations", { klaviyo_error: "Try again." })).toBe(
      "/integrations?klaviyo_error=Try+again.",
    );
  });

  it("leaves the page as it is with no result", () => {
    expect(klaviyoReturnUrl("/integrations", {})).toBe("/integrations");
    expect(klaviyoReturnUrl(KLAVIYO_EMAIL_RETURN, {})).toBe(KLAVIYO_EMAIL_RETURN);
  });
});

describe("klaviyoCallbackStep", () => {
  it("says plainly that a denied consent left Klaviyo unconnected, and how to connect", () => {
    expect(klaviyoCallbackStep({ error: "access_denied", code: null, state: "s" })).toEqual({
      kind: "cancelled",
      message: KLAVIYO_DENIED_MESSAGE,
    });
    expect(KLAVIYO_DENIED_MESSAGE).toContain("press Allow");
  });

  it("turns any other refusal into the plain sentence, never Klaviyo's words", () => {
    expect(klaviyoCallbackStep({ error: "invalid_scope", code: null, state: null })).toEqual({
      kind: "failed",
      message: KLAVIYO_GENERIC_ERROR,
    });
  });

  it("needs both a code and a state", () => {
    expect(klaviyoCallbackStep({ error: null, code: "c", state: null }).kind).toBe("failed");
    expect(klaviyoCallbackStep({ error: null, code: null, state: "s" }).kind).toBe("failed");
    expect(klaviyoCallbackStep({ error: null, code: "", state: "s" }).kind).toBe("failed");
  });

  it("passes a code and state on to be exchanged", () => {
    expect(klaviyoCallbackStep({ error: null, code: "c", state: "s" })).toEqual({
      kind: "exchange",
      code: "c",
      state: "s",
    });
  });
});

describe("klaviyoErrorMessage", () => {
  it("keeps the backend's sentence", () => {
    expect(klaviyoErrorMessage("Klaviyo did not accept that connection — try again")).toBe(
      "Klaviyo did not accept that connection — try again",
    );
  });

  it("falls back for a blank one and cuts a long one short", () => {
    expect(klaviyoErrorMessage("  ")).toBe(KLAVIYO_GENERIC_ERROR);
    expect(klaviyoErrorMessage(null)).toBe(KLAVIYO_GENERIC_ERROR);
    const long = klaviyoErrorMessage("x".repeat(500));
    expect(long.length).toBe(300);
    expect(long.endsWith("…")).toBe(true);
  });
});

describe("klaviyoNotice", () => {
  it("says connected", () => {
    expect(klaviyoNotice(new URLSearchParams("klaviyo=connected"))?.tone).toBe("success");
  });

  it("shows the error sentence, which wins over a stale success", () => {
    expect(klaviyoNotice(new URLSearchParams("klaviyo=connected&klaviyo_error=Try+again."))).toEqual({
      tone: "error",
      text: "Try again.",
    });
  });

  it("says nothing otherwise", () => {
    expect(klaviyoNotice(new URLSearchParams(""))).toBeNull();
    expect(klaviyoNotice(new URLSearchParams("klaviyo=something"))).toBeNull();
    expect(klaviyoNotice(new URLSearchParams("tab=settings"))).toBeNull();
  });
});

describe("klaviyoHubForward", () => {
  it("sends a result on the hub to Klaviyo's Settings tab", () => {
    expect(klaviyoHubForward(new URLSearchParams("klaviyo=connected"))).toBe(
      "/integrations/klaviyo?tab=settings&klaviyo=connected",
    );
    expect(klaviyoHubForward(new URLSearchParams("klaviyo_error=No."))).toBe(
      "/integrations/klaviyo?tab=settings&klaviyo_error=No.",
    );
  });

  it("leaves the hub alone without a result", () => {
    expect(klaviyoHubForward(new URLSearchParams("tab=browse"))).toBeNull();
    expect(klaviyoHubForward(new URLSearchParams("klaviyo=other"))).toBeNull();
  });
});

describe("the hub card's oauth field", () => {
  const base: ApiHubConnection = {
    key: "klaviyo",
    connected: true,
    available: true,
    status: "healthy",
    attention: null,
    last_success_at: null,
    last_run_at: null,
    last_records: null,
    runs: [],
    errors_7d: 0,
    can_sync: false,
    can_test: true,
    account: null,
    connected_at: null,
    connected_by: null,
  };

  it("is absent from an older backend", () => {
    expect(toConnection(base).oauth).toBeUndefined();
    expect("oauth" in toConnection(base)).toBe(false);
    expect(toHubOAuth(null)).toBeUndefined();
  });

  it("is adapted, keeping only string scopes", () => {
    const connection = toConnection({
      ...base,
      oauth: { available: true, connected: true, scopes: ["campaigns:read", 3, "flows:write"] },
    });
    expect(connection.oauth).toEqual({ available: true, connected: true, scopes: ["campaigns:read", "flows:write"] });
  });

  it("offers the button only when available and not yet connected", () => {
    expect(canConnectWithKlaviyo({ available: true, connected: false, scopes: [] })).toBe(true);
    expect(canConnectWithKlaviyo({ available: true, connected: true, scopes: [] })).toBe(false);
    expect(canConnectWithKlaviyo({ available: false, connected: false, scopes: [] })).toBe(false);
    expect(canConnectWithKlaviyo(undefined)).toBe(false);
  });
});

describe("klaviyoScopeLabels", () => {
  it("says what each resource allows, one line each, in a fixed order", () => {
    expect(klaviyoScopeLabels(["flows:write", "campaigns:read", "accounts:read", "flows:read"])).toEqual([
      "See the account's name and settings",
      "Read campaigns and their results",
      "Read flows and their results; build flows and turn them on or off",
    ]);
  });

  it("says a write scope without its read", () => {
    expect(klaviyoScopeLabels(["subscriptions:write"])).toEqual(["Subscribe your own seed addresses for test sends"]);
  });

  it("covers all fifteen scopes the app asks for", () => {
    const all = [
      "accounts:read",
      "campaigns:read",
      "campaigns:write",
      "flows:read",
      "flows:write",
      "lists:read",
      "lists:write",
      "segments:read",
      "segments:write",
      "profiles:read",
      "profiles:write",
      "metrics:read",
      "templates:read",
      "templates:write",
      "subscriptions:write",
    ];
    const lines = klaviyoScopeLabels(all);
    expect(lines).toHaveLength(9);
    expect(lines.every((line) => !line.includes(":"))).toBe(true);
  });

  it("shows an unknown scope as it is, and nothing for none", () => {
    expect(klaviyoScopeLabels(["data-privacy:read"])).toEqual(["data-privacy:read"]);
    expect(klaviyoScopeLabels([])).toEqual([]);
  });
});

describe("the install link (SPEC-371 amendment)", () => {
  const link = new URLSearchParams("connect=klaviyo");
  const available = { available: true, connected: false, scopes: [] };
  const allowed = { known: true, allowed: true };

  it("does nothing without the link", () => {
    expect(klaviyoAutoStart(new URLSearchParams("tab=settings"), available, allowed)).toBeNull();
    expect(klaviyoAutoStart(new URLSearchParams("connect=other"), available, allowed)).toBeNull();
  });

  it("waits while the connection or the member's access loads", () => {
    expect(klaviyoAutoStart(link, undefined, allowed)).toBe("wait");
    expect(klaviyoAutoStart(link, available, { known: false, allowed: false })).toBe("wait");
  });

  it("starts the sign-in for a member who may connect apps", () => {
    expect(klaviyoAutoStart(link, available, allowed)).toBe("start");
  });

  it("says when Klaviyo is already connected", () => {
    expect(klaviyoAutoStart(link, { ...available, connected: true }, allowed)).toBe("connected");
  });

  it("gives the role's reason to a member who may not", () => {
    expect(klaviyoAutoStart(link, available, { known: true, allowed: false })).toBe("not_allowed");
  });

  it("falls back to the key form when the platform has no Klaviyo app", () => {
    expect(klaviyoAutoStart(link, null, allowed)).toBe("unavailable");
    expect(klaviyoAutoStart(link, { available: false, connected: false, scopes: [] }, allowed)).toBe("unavailable");
  });

  it("removes the link from the address and keeps the rest", () => {
    expect(withoutConnectParam("/integrations/klaviyo", new URLSearchParams("connect=klaviyo"))).toBe("/integrations/klaviyo");
    expect(withoutConnectParam("/integrations/klaviyo", new URLSearchParams("connect=klaviyo&tab=settings"))).toBe(
      "/integrations/klaviyo?tab=settings",
    );
  });

  it("opens the Settings tab for the link and for a Klaviyo result", () => {
    expect(parseDetailTab(link)).toBe("settings");
    expect(parseDetailTab(new URLSearchParams("klaviyo=connected"))).toBe("settings");
    expect(parseDetailTab(new URLSearchParams("klaviyo_error=x"))).toBe("settings");
    expect(parseDetailTab(new URLSearchParams(""))).toBe("overview");
  });
});
