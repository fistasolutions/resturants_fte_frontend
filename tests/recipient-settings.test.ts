import { describe, expect, it } from "vitest";

import {
  MANAGER_NOTIFICATIONS_PATH,
  locationSetting,
  parseFocus,
  parseReturnPath,
  recipientFocus,
  recipientLabel,
  recipientSettingsHref,
  returnLabel,
  withLocationId,
} from "@/lib/recipient-settings";

describe("recipientFocus", () => {
  it("names the location row by id", () => {
    expect(recipientFocus({ kind: "location", locationId: 75397202150 })).toBe("location-75397202150");
  });

  it("has nothing to point at when the location is unknown", () => {
    expect(recipientFocus({ kind: "location", locationId: null })).toBeNull();
  });

  it("uses the card name for store-level contacts", () => {
    expect(recipientFocus({ kind: "warehouse" })).toBe("warehouse");
    expect(recipientFocus({ kind: "support" })).toBe("support");
    expect(recipientFocus({ kind: "returns" })).toBe("returns");
  });
});

describe("parseFocus", () => {
  it("round-trips every setting", () => {
    const settings = [
      { kind: "location", locationId: 12 },
      { kind: "warehouse" },
      { kind: "support" },
      { kind: "returns" },
    ] as const;
    for (const setting of settings) {
      expect(parseFocus(recipientFocus(setting))).toEqual(setting);
    }
  });

  it("rejects anything it did not produce", () => {
    expect(parseFocus(null)).toBeNull();
    expect(parseFocus("")).toBeNull();
    expect(parseFocus("location-")).toBeNull();
    expect(parseFocus("location-abc")).toBeNull();
    expect(parseFocus("location-12; drop")).toBeNull();
    expect(parseFocus("general")).toBeNull();
  });
});

describe("parseReturnPath", () => {
  it("accepts a same-origin relative path with its query", () => {
    expect(parseReturnPath("/orders/review/send/75397202150?status=unfulfilled&range=7d")).toBe(
      "/orders/review/send/75397202150?status=unfulfilled&range=7d",
    );
    expect(parseReturnPath("/")).toBe("/");
  });

  it("refuses anything that could leave the app", () => {
    expect(parseReturnPath("https://evil.example/")).toBeNull();
    expect(parseReturnPath("//evil.example/")).toBeNull();
    expect(parseReturnPath("/\\evil.example")).toBeNull();
    expect(parseReturnPath("javascript:alert(1)")).toBeNull();
    expect(parseReturnPath("orders/review")).toBeNull();
    expect(parseReturnPath("/orders\nreview")).toBeNull();
    expect(parseReturnPath("")).toBeNull();
    expect(parseReturnPath(null)).toBeNull();
    expect(parseReturnPath(undefined)).toBeNull();
    expect(parseReturnPath(`/${"a".repeat(2100)}`)).toBeNull();
  });
});

describe("recipientSettingsHref", () => {
  it("lands on the Manager Notifications tab, highlights the row, and remembers the page", () => {
    expect(
      recipientSettingsHref(
        { kind: "location", locationId: 75397202150 },
        "/orders/review/send/75397202150?status=unfulfilled",
      ),
    ).toBe(
      `${MANAGER_NOTIFICATIONS_PATH}?focus=location-75397202150&return=%2Forders%2Freview%2Fsend%2F75397202150%3Fstatus%3Dunfulfilled`,
    );
  });

  it("still opens the right tab when nothing specific can be highlighted", () => {
    expect(recipientSettingsHref({ kind: "location", locationId: null }, "/discounts/attention/send/9")).toBe(
      `${MANAGER_NOTIFICATIONS_PATH}?return=%2Fdiscounts%2Fattention%2Fsend%2F9`,
    );
  });

  it("drops an unsafe return target rather than fixing it", () => {
    expect(recipientSettingsHref({ kind: "warehouse" }, "https://evil.example")).toBe(
      `${MANAGER_NOTIFICATIONS_PATH}?focus=warehouse`,
    );
    expect(recipientSettingsHref({ kind: "returns" }, null)).toBe(`${MANAGER_NOTIFICATIONS_PATH}?focus=returns`);
  });

  it("is a plain path when there is nothing to carry", () => {
    expect(recipientSettingsHref({ kind: "location", locationId: null }, null)).toBe(MANAGER_NOTIFICATIONS_PATH);
  });
});

describe("withLocationId", () => {
  it("fills in a location the page did not know", () => {
    expect(withLocationId({ kind: "location", locationId: null }, 10)).toEqual({ kind: "location", locationId: 10 });
  });

  it("never overrides a location the route already named", () => {
    expect(withLocationId({ kind: "location", locationId: 5 }, 10)).toEqual({ kind: "location", locationId: 5 });
  });

  it("leaves store-level settings and missing ids alone", () => {
    expect(withLocationId({ kind: "support" }, 10)).toEqual({ kind: "support" });
    expect(withLocationId({ kind: "location", locationId: null }, null)).toEqual({ kind: "location", locationId: null });
    expect(withLocationId({ kind: "location", locationId: null }, undefined)).toEqual({
      kind: "location",
      locationId: null,
    });
  });
});

describe("locationSetting", () => {
  it("reads a numeric route param", () => {
    expect(locationSetting("75397202150")).toEqual({ kind: "location", locationId: 75397202150 });
    expect(locationSetting(801)).toEqual({ kind: "location", locationId: 801 });
  });

  it("treats the overdue 'unattributed' bucket and junk as no location", () => {
    expect(locationSetting("unattributed")).toEqual({ kind: "location", locationId: null });
    expect(locationSetting("")).toEqual({ kind: "location", locationId: null });
    expect(locationSetting(undefined)).toEqual({ kind: "location", locationId: null });
    expect(locationSetting(Number.NaN)).toEqual({ kind: "location", locationId: null });
  });
});

describe("recipientLabel", () => {
  it("names the contact in plain words", () => {
    expect(recipientLabel({ kind: "location", locationId: 1 })).toBe("a manager email for this location");
    expect(recipientLabel({ kind: "warehouse" })).toBe("the warehouse manager's email");
    expect(recipientLabel({ kind: "support" })).toBe("the support lead's email");
    expect(recipientLabel({ kind: "returns" })).toBe("the returns lead's email");
  });
});

describe("returnLabel", () => {
  it("knows when the owner left a message behind", () => {
    expect(returnLabel("/orders/review/send/75397202150?status=unfulfilled")).toBe("Back to your message");
    expect(returnLabel("/orders/review/send-all?range=7d")).toBe("Back to your message");
    expect(returnLabel("/team-performance/agents/3/review")).toBe("Back to your message");
    expect(returnLabel("/warehouse/backlog/send")).toBe("Back to your message");
  });

  it("stays generic for a list page", () => {
    expect(returnLabel("/discounts/attention")).toBe("Go back");
    expect(returnLabel("/orders/review?send=1")).toBe("Go back");
  });
});
