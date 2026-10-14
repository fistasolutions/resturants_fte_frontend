/**
 * SPEC-300 — the QuickBooks card's rules.
 *
 * The one that matters: a company that has stopped updating must drive the badge, because
 * its bills silently stop arriving and a green badge over it would hide exactly the
 * failure this employee exists to prevent.
 */
import { describe, expect, it } from "vitest";

import {
  brokenConnections,
  connectLabel,
  connectNotice,
  connectionRows,
  connectionsPollInterval,
  quickBooksBadge,
  quickBooksCapability,
  returnCookie,
  returnPathFor,
  syncProgress,
  SYNC_POLL_MS,
} from "@/lib/quickbooks-connection";
import type { ConnectionsOverview, QboConnection } from "@/types/finance";

const NOW = new Date("2026-09-23T12:00:00Z").getTime();

function company(over: Partial<QboConnection> = {}): QboConnection {
  return {
    id: 1,
    companyName: "Lawrence",
    realmIdMasked: "9130…4471",
    status: "connected",
    lastSyncedAt: "2026-09-23T11:40:00Z",
    lastError: null,
    connectedAt: "2026-09-20T09:00:00Z",
    sync: null,
    homeCurrency: "USD",
    fxMissing: [],
    ...over,
  };
}

function overview(
  connections: QboConnection[],
  over: Partial<ConnectionsOverview> = {},
): ConnectionsOverview {
  return {
    connections,
    connected: connections.filter((row) => row.status === "connected").length,
    ready: connections.some((row) => row.status === "connected"),
    configured: true,
    syncing: connections.some((row) => row.sync !== null),
    reportingCurrency: "USD",
    rates: [],
    ...over,
  };
}

describe("the badge", () => {
  it("says nothing is available when the server has no credentials", () => {
    const badge = quickBooksBadge(overview([], { configured: false }));
    expect(badge).toEqual({ label: "Unavailable", tone: "neutral" });
  });

  it("asks to be connected when it is configured and empty", () => {
    expect(quickBooksBadge(overview([]))).toEqual({ label: "Not connected", tone: "warning" });
  });

  it("counts the connected companies", () => {
    expect(quickBooksBadge(overview([company()])).label).toBe("1 company");
    expect(
      quickBooksBadge(
        overview([company(), company({ id: 2, companyName: "Pomona" }), company({ id: 3 })]),
      ),
    ).toEqual({ label: "3 companies", tone: "success" });
  });

  it("a broken company outranks the healthy ones", () => {
    const rows = [
      company(),
      company({ id: 2, companyName: "Pomona", status: "needs_reconnect" }),
      company({ id: 3, companyName: "Jackson" }),
    ];
    // Two of three are fine, and the badge still refuses to read green.
    expect(quickBooksBadge(overview(rows))).toEqual({
      label: "1 needs reconnecting",
      tone: "warning",
    });
    expect(brokenConnections(overview(rows)).map((row) => row.companyName)).toEqual(["Pomona"]);
  });
});

describe("what it says it is doing", () => {
  it("says nothing before anything is connected", () => {
    expect(quickBooksCapability(overview([]))).toBeNull();
    expect(quickBooksCapability(overview([], { configured: false }))).toBeNull();
  });

  it("names the companies that stopped, not just the count", () => {
    const text = quickBooksCapability(
      overview([
        company(),
        company({ id: 2, companyName: "Pomona", status: "needs_reconnect" }),
        company({ id: 3, companyName: "Jackson", status: "revoked" }),
      ]),
    );
    expect(text).toContain("Pomona, Jackson");
    expect(text).toContain("reconnect");
  });

  it("promises hourly reads and no writes when all is well", () => {
    const text = quickBooksCapability(overview([company()])) ?? "";
    expect(text).toContain("every hour");
    expect(text).toContain("Nothing is ever written back");
  });
});

describe("the company rows", () => {
  it("says when each company was last read", () => {
    const [row] = connectionRows(overview([company()]), NOW);
    expect(row).toMatchObject({ company: "Lawrence", realm: "9130…4471", broken: false });
    expect(row.detail).toBe("read 20 min ago");
  });

  it("a company connected but never synced is waiting, not broken", () => {
    const [row] = connectionRows(overview([company({ lastSyncedAt: null })]), NOW);
    expect(row.detail).toBe("waiting for its first read");
    expect(row.broken).toBe(false);
  });

  it("a broken company shows its own reason", () => {
    const [row] = connectionRows(
      overview([
        company({ status: "needs_reconnect", lastError: "QuickBooks refused that connection." }),
      ]),
      NOW,
    );
    expect(row.detail).toBe("QuickBooks refused that connection.");
    expect(row.broken).toBe(true);
  });

  it("falls back to a plain sentence when no reason was recorded", () => {
    const [row] = connectionRows(
      overview([company({ status: "revoked", lastError: null })]),
      NOW,
    );
    expect(row.detail).toBe("Needs reconnecting.");
    expect(row.broken).toBe(true);
  });
});

describe("the connect button", () => {
  it("keeps inviting the next company — there are three sets of books", () => {
    expect(connectLabel(overview([]))).toBe("Connect QuickBooks");
    expect(connectLabel(overview([company()]))).toBe("Connect another company");
  });
});

describe("the progress bar (SPEC-303)", () => {
  const running = (step: number, first = true) =>
    company({
      sync: { state: "running", step, steps: 7, label: "Reading open bills", startedAt: null, first },
    });

  it("has no bar when nothing is running", () => {
    expect(syncProgress(company())).toBeNull();
    expect(connectionRows(overview([company()]), NOW)[0].sync).toBeNull();
  });

  it("a waiting company sits empty and says it is in line", () => {
    const view = syncProgress(
      company({
        sync: { state: "queued", step: 0, steps: 7, label: "Waiting for its turn", startedAt: null, first: true },
      }),
    );
    expect(view).toEqual({
      percent: 0,
      label: "Waiting for its turn",
      stepText: "In line",
      heading: "First read",
      waiting: true,
    });
  });

  it("a running company fills by finished reads and names the one under way", () => {
    expect(syncProgress(running(0))?.percent).toBe(0);
    expect(syncProgress(running(4))).toMatchObject({ percent: 57, stepText: "Step 5 of 7", waiting: false });
    expect(syncProgress(running(7))?.stepText).toBe("Step 7 of 7");
    expect(syncProgress(running(3, false))?.heading).toBe("Reading");
  });

  it("each company keeps its own bar", () => {
    const rows = connectionRows(
      overview([
        running(2),
        company({
          id: 2,
          companyName: "Pomona",
          sync: { state: "queued", step: 0, steps: 7, label: "Waiting for its turn", startedAt: null, first: true },
        }),
        company({ id: 3, companyName: "Jackson" }),
      ]),
      NOW,
    );
    expect(rows.map((r) => r.sync?.stepText ?? null)).toEqual(["Step 3 of 7", "In line", null]);
  });

  it("polls only while something is being read", () => {
    expect(connectionsPollInterval(overview([running(1)]))).toBe(SYNC_POLL_MS);
    expect(connectionsPollInterval(overview([company()]))).toBe(false);
    expect(connectionsPollInterval(undefined)).toBe(false);
  });
});

describe("back to where the connect started (SPEC-303)", () => {
  it("accepts only Integrations or Accounts Payable", () => {
    expect(returnPathFor("/integrations")).toBe("/integrations");
    // SPEC-328: a connect started on QuickBooks' own page returns there.
    expect(returnPathFor("/integrations/quickbooks")).toBe("/integrations/quickbooks");
    expect(returnPathFor("/integrations/gorgias")).toBe("/employees/finance");
    expect(returnPathFor("/employees/finance")).toBe("/employees/finance");
    expect(returnPathFor("https://evil.example.com")).toBe("/employees/finance");
    expect(returnPathFor("//evil.example.com")).toBe("/employees/finance");
    expect(returnPathFor(undefined)).toBe("/employees/finance");
  });

  it("remembers for 15 minutes and forgets on demand", () => {
    expect(returnCookie("/integrations")).toBe("qbo_return=%2Fintegrations; Path=/; Max-Age=900; SameSite=Lax");
    expect(returnCookie(null)).toContain("Max-Age=0");
  });

  it("says how the round trip ended", () => {
    expect(connectNotice(new URLSearchParams("connected=Lawrence"))).toEqual({
      tone: "success",
      text: "Lawrence connected — reading its books now.",
    });
    expect(connectNotice(new URLSearchParams("qbo_error=Expired"))?.tone).toBe("error");
    expect(connectNotice(new URLSearchParams("qbo_cancelled=1"))?.tone).toBe("neutral");
    expect(connectNotice(new URLSearchParams(""))).toBeNull();
  });
});
