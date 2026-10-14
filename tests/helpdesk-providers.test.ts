import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  CAPABILITY_LABELS,
  HELPDESK_ORDER,
  HELPDESK_PROVIDERS,
  can,
  canReplyOn,
  helpdesk,
} from "@/lib/helpdesk-providers";

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

describe("the helpdesk capability matrix (SPEC-346)", () => {
  it("has one row per helpdesk, in picker order, and only Gorgias is available", () => {
    expect(HELPDESK_ORDER).toEqual(["gorgias", "zendesk", "freshdesk", "reamaze", "helpscout", "intercom", "kustomer", "richpanel", "shopify_inbox"]);
    expect(Object.keys(HELPDESK_PROVIDERS).sort()).toEqual([...HELPDESK_ORDER].sort());
    expect(HELPDESK_ORDER.filter((key) => helpdesk(key).status === "available")).toEqual(["gorgias"]);
  });

  it("states Gorgias's documented limits and auth honestly", () => {
    const gorgias = helpdesk("gorgias");
    expect(gorgias.rateLimit).toMatchObject({ requests: 40, windowSeconds: 20 });
    expect(gorgias.auth).toEqual([
      { method: "api_key", live: true },
      { method: "oauth", live: false },
    ]);
  });

  it("claims no capability for a helpdesk whose adapter does not exist", () => {
    for (const key of HELPDESK_ORDER.filter((k) => k !== "gorgias")) {
      for (const capability of Object.keys(CAPABILITY_LABELS) as (keyof typeof CAPABILITY_LABELS)[]) {
        expect(can(key, capability), `${key}.${capability}`).toBe(false);
      }
      expect(canReplyOn(key, "email")).toBe(false);
    }
    expect(canReplyOn("gorgias", "whatsapp")).toBe(true);
  });

  it("screens decide by capability, never by comparing a provider's name", () => {
    const offenders = files("features/customer-support").filter((path) =>
      /provider\s*===\s*["']gorgias["']|["']gorgias["']\s*===\s*provider/.test(readFileSync(path, "utf8")),
    );
    expect(offenders).toEqual([]);
  });
});
