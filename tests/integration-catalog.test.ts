/**
 * SPEC-328 — the Integrations hub's copy. The keys are backend SPEC-337's contract and the
 * field keys are the settings API's whitelists, so a drift here is a form that posts a field
 * the backend refuses, or a page the owner cannot reach.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  APPS,
  COMING_SOON,
  INTEGRATION_KEYS,
  SMTP_FIELDS,
  connectMethod,
  isIntegrationKey,
  neverDo,
} from "@/lib/integration-catalog";
import { navItems } from "@/lib/navigation";

/** The backend's `EDITABLE_FIELDS` + `SECRET_FIELDS` (services/settings/integration_settings_service.py). */
const BACKEND_FIELDS: Record<string, { editable: string[]; secret: string[] }> = {
  smtp: { editable: ["host", "port", "from_email"], secret: ["user", "password"] },
  klaviyo: { editable: ["winback_list_id"], secret: ["private_key"] },
  gorgias: { editable: ["subdomain", "email"], secret: ["api_token"] },
  loop: { editable: [], secret: ["api_key"] },
  ipacky: { editable: ["email", "sync_time"], secret: ["password"] },
  vcount: { editable: ["username", "sync_time", "store"], secret: ["password"] },
  clarity: { editable: ["project_id"], secret: ["api_token"] },
};

describe("integration catalogue (SPEC-328)", () => {
  it("lists exactly the backend's connections, in its order", () => {
    expect([...INTEGRATION_KEYS]).toEqual([
      "shopify",
      "gorgias",
      "loop",
      "klaviyo",
      "ipacky",
      "vcount",
      "clarity",
      "gsc",
      "meta",
      "quickbooks",
    ]);
    for (const key of INTEGRATION_KEYS) expect(APPS[key].key).toBe(key);
  });

  it("posts only fields the settings API accepts", () => {
    for (const key of INTEGRATION_KEYS) {
      const app = APPS[key];
      if (app.kind !== "key") {
        expect(app.provider).toBeUndefined();
        continue;
      }
      const backend = BACKEND_FIELDS[app.provider ?? ""];
      expect(backend, key).toBeDefined();
      for (const field of app.fields ?? []) expect(backend.editable, `${key}.${field.key}`).toContain(field.key);
      expect((app.secrets ?? []).map((f) => f.key).sort()).toEqual([...backend.secret].sort());
    }
    expect(SMTP_FIELDS.fields.map((f) => f.key)).toEqual(BACKEND_FIELDS.smtp.editable);
    expect(SMTP_FIELDS.secrets.map((f) => f.key)).toEqual(BACKEND_FIELDS.smtp.secret);
  });

  it("links every page an app powers to a real route", () => {
    const routes = navItems.map((item) => item.href);
    for (const key of INTEGRATION_KEYS) {
      for (const page of APPS[key].powers) {
        const root = `/${page.href.split(/[/?#]/)[1]}`;
        expect(routes, `${key} → ${page.href}`).toContain(root);
      }
    }
  });

  it("never names a store, a city or a timezone in its copy", () => {
    const text = JSON.stringify({ APPS, COMING_SOON, SMTP_FIELDS });
    expect(text).not.toMatch(/\(NY\)|New_York|New York/);
    expect(text).not.toMatch(/examplestore/i);
  });

  it("says what is never done, and states the one thing sent where there is one", () => {
    expect(neverDo(APPS.gorgias)).toContain("Send messages or posts from your Gorgias account");
    expect(neverDo(APPS.meta).some((line) => line.startsWith("Send"))).toBe(false);
    expect(APPS.meta.sends).toBeTruthy();
    // One Meta card carries both jobs: posting and the read-only Ads audit.
    expect(APPS.meta.powers.map((p) => p.href)).toEqual(["/social", "/ads?tab=audit"]);
    expect(APPS.meta.reads.some((line) => line.includes("ad accounts"))).toBe(true);
    expect(APPS.klaviyo.sends).toBeTruthy();
  });

  it("describes how each kind connects", () => {
    expect(connectMethod(APPS.gsc)).toBe("Sign in with Google");
    expect(connectMethod(APPS.shopify)).toBe("Installed with the store");
    expect(connectMethod(APPS.loop)).toBe("API key");
    expect(isIntegrationKey("gsc")).toBe(true);
    expect(isIntegrationKey("smtp")).toBe(false);
  });

  it("ships every app's own logo with the app", () => {
    const logos = [...INTEGRATION_KEYS.map((key) => APPS[key].logo), ...COMING_SOON.map((app) => app.logo)];
    for (const logo of logos) {
      expect(logo, logo).toMatch(/^\/app-logos\/[a-z0-9-]+\.(svg|png)$/);
      expect(existsSync(join(process.cwd(), "public", logo)), logo).toBe(true);
    }
  });
});
