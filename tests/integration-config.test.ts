/** SPEC-077 — integration settings client service: adapter + PUT contract. */
import { afterEach, describe, expect, it, vi } from "vitest";

import { adaptIntegrationSettings, updateIntegrationSettings } from "@/services/integration-config";

const API_SETTINGS = {
  smtp: {
    fields: {
      host: { value: "smtp.example.com", source: "database" as const },
      port: { value: "587", source: "env" as const },
      from_email: { value: null, source: "unset" as const },
    },
    secrets: {
      user: { configured: true, source: "database" as const },
      password: { configured: true, source: "env" as const },
    },
    secret_configured: true,
  },
  klaviyo: {
    fields: { winback_list_id: { value: "ABC123", source: "database" as const } },
    secrets: { private_key: { configured: false, source: "unset" as const } },
    secret_configured: false,
  },
  gorgias: {
    fields: { subdomain: { value: null, source: "unset" as const } },
    secrets: { api_token: { configured: false, source: "unset" as const } },
    secret_configured: false,
  },
  loop: {
    fields: {},
    secrets: { api_key: { configured: false, source: "unset" as const } },
    secret_configured: false,
  },
  ipacky: {
    fields: {
      email: { value: null, source: "unset" as const },
      sync_time: { value: "01:00", source: "env" as const },
    },
    secrets: { password: { configured: false, source: "unset" as const } },
    secret_configured: false,
  },
  vcount: {
    fields: {
      username: { value: null, source: "unset" as const },
      sync_time: { value: "02:00", source: "env" as const },
    },
    secrets: { password: { configured: false, source: "unset" as const } },
    secret_configured: false,
  },
  clarity: {
    fields: {
      username: { value: null, source: "unset" as const },
      sync_time: { value: "02:00", source: "env" as const },
    },
    secrets: { password: { configured: false, source: "unset" as const } },
    secret_configured: false,
  },
  // "ai" is no longer an integration provider (SPEC-238): the AI providers have
  // their own endpoint and cards.
};

describe("adaptIntegrationSettings", () => {
  it("maps snake_case secret_configured to camelCase for every provider", () => {
    const result = adaptIntegrationSettings(API_SETTINGS);
    expect(result.smtp.secretConfigured).toBe(true);
    expect(result.klaviyo.secretConfigured).toBe(false);
    expect(result.gorgias.secretConfigured).toBe(false);
    expect(result.smtp.fields.host).toEqual({ value: "smtp.example.com", source: "database" });
    expect(result.smtp.fields.from_email).toEqual({ value: null, source: "unset" });
  });

  it("passes through per-field secret configured status and source without ever carrying a value", () => {
    const result = adaptIntegrationSettings(API_SETTINGS);
    expect(result.smtp.secrets).toEqual({
      user: { configured: true, source: "database" },
      password: { configured: true, source: "env" },
    });
    expect(result.gorgias.secrets).toEqual({
      api_token: { configured: false, source: "unset" },
    });
  });
});

describe("updateIntegrationSettings", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("PUTs the given fields to the provider-scoped proxy route", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => API_SETTINGS,
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await updateIntegrationSettings("gorgias", { subdomain: "examplestore" });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/proxy/settings/integrations/gorgias",
      expect.objectContaining({
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: { subdomain: "examplestore" } }),
      }),
    );
    expect(result.gorgias.fields.subdomain.value).toBe(null);
  });

  it("throws the API error message on a failed response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: { message: "Port must be between 1 and 65535." } }),
      }),
    );
    await expect(updateIntegrationSettings("smtp", { port: "70000" })).rejects.toThrow(
      "Port must be between 1 and 65535.",
    );
  });

  it("falls back to a generic message when the error body is unreadable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => {
          throw new Error("not json");
        },
      }),
    );
    await expect(updateIntegrationSettings("klaviyo", { winback_list_id: "x" })).rejects.toThrow(
      "Could not save the integration settings.",
    );
  });
});
