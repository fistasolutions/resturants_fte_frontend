import { describe, expect, it } from "vitest";

import {
  CAROUSEL_MAX,
  IMAGE_MAX_BYTES,
  LOGO_MAX_BYTES,
  VIDEO_MAX_BYTES,
  checkLoginMedia,
  checkLogo,
  moveItem,
  removeItem,
  sidebarLogos,
  toBranding,
} from "@/lib/branding";
import type { PublicBranding } from "@/lib/login-media";
import { EMPTY_WORKSPACE, toWorkspace } from "@/lib/workspace";

const asset = (id: string, type = "image/png") => ({
  id,
  media_type: type,
  width: 10,
  height: 10,
  url: `/api/v1/branding/assets/${id}`,
});
const png = (name = "a.png", size = 1000) => ({ name, type: "image/png", size });
const mp4 = (size = 1000) => ({ name: "v.mp4", type: "video/mp4", size });

describe("toBranding", () => {
  it("routes every URL through the proxy and keeps the kind", () => {
    const api: PublicBranding = {
      name: "Example Store",
      slug: "example-store",
      logo: { light: asset("l"), dark: null },
      login: { kind: "carousel", items: [asset("a"), asset("b")], poster: null },
    };
    const b = toBranding(api);
    expect(b.logo).toEqual({ light: "/api/proxy/branding/assets/l", dark: null });
    expect(b.login.kind).toBe("carousel");
    expect(b.login.items.map((i) => i.url)).toEqual(["/api/proxy/branding/assets/a", "/api/proxy/branding/assets/b"]);
  });

  it("a login kind with no items is none", () => {
    const b = toBranding({
      name: "x",
      slug: "x",
      logo: { light: null, dark: null },
      login: { kind: "image", items: [], poster: null },
    });
    expect(b.login.kind).toBe("none");
  });
});

describe("checkLogo", () => {
  it("accepts a small PNG, refuses other types and large files", () => {
    expect(checkLogo(png())).toBeNull();
    expect(checkLogo({ name: "a.gif", type: "image/gif", size: 10 })).toMatch(/isn't a PNG/);
    expect(checkLogo(png("big.png", LOGO_MAX_BYTES + 1))).toMatch(/larger than 2 MB/);
  });
});

describe("checkLoginMedia", () => {
  it("image: exactly one picture within the limit", () => {
    expect(checkLoginMedia("image", [png()])).toBeNull();
    expect(checkLoginMedia("image", [])).toBe("Choose one picture.");
    expect(checkLoginMedia("image", [png("x.png", IMAGE_MAX_BYTES + 1)])).toMatch(/10 MB/);
  });

  it("video: one MP4/WebM within the limit, the poster a picture", () => {
    expect(checkLoginMedia("video", [mp4()])).toBeNull();
    expect(checkLoginMedia("video", [mp4()], png("p.png"))).toBeNull();
    expect(checkLoginMedia("video", [png()])).toMatch(/isn't an MP4/);
    expect(checkLoginMedia("video", [mp4(VIDEO_MAX_BYTES + 1)])).toMatch(/25 MB/);
    expect(checkLoginMedia("video", [mp4()], mp4())).toMatch(/isn't a JPEG/);
    expect(checkLoginMedia("video", [])).toBe("Choose one video.");
  });

  it("carousel: 2 to 6 pictures, each checked", () => {
    expect(checkLoginMedia("carousel", [png(), png()])).toBeNull();
    expect(checkLoginMedia("carousel", [png()])).toMatch(/2 to 6 pictures — you have 1/);
    expect(checkLoginMedia("carousel", Array.from({ length: CAROUSEL_MAX + 1 }, () => png()))).toMatch(/you have 7/);
    expect(checkLoginMedia("carousel", [png(), mp4()])).toMatch(/isn't a JPEG/);
  });
});

describe("carousel order", () => {
  it("moves within bounds and removes", () => {
    expect(moveItem(["a", "b", "c"], 0, 1)).toEqual(["b", "a", "c"]);
    expect(moveItem(["a", "b", "c"], 2, -1)).toEqual(["a", "c", "b"]);
    expect(moveItem(["a", "b"], 0, -1)).toEqual(["a", "b"]);
    expect(moveItem(["a", "b"], 1, 1)).toEqual(["a", "b"]);
    expect(removeItem(["a", "b", "c"], 1)).toEqual(["a", "c"]);
  });
});

describe("sidebarLogos", () => {
  it("each theme uses its own, else the other, else none", () => {
    expect(sidebarLogos("l", "d")).toEqual({ light: "l", dark: "d" });
    expect(sidebarLogos("l", null)).toEqual({ light: "l", dark: "l" });
    expect(sidebarLogos(null, "d")).toEqual({ light: "d", dark: "d" });
    expect(sidebarLogos(null, null)).toEqual({ light: null, dark: null });
  });
});

describe("toWorkspace", () => {
  it("reads navigation, brand, features, calendar and store settings", () => {
    const w = toWorkspace({
      organization: { name: "Example Store", features: ["ci"], calendar_system: "hebrew" },
      store: { currency: "USD", iana_timezone: "America/New_York" },
      branding: { logo: { light: asset("l"), dark: null } },
      navigation: [{ key: "orders", visible: true, ready: true, reason: null }],
    });
    expect(w.brand).toEqual({ name: "Example Store", logoLight: "/api/proxy/branding/assets/l", logoDark: null, color: null });
    expect(w.features).toEqual(["ci"]);
    expect(w.calendarSystem).toBe("hebrew");
    expect(w.currency).toBe("USD");
    expect(w.timezone).toBe("America/New_York");
    expect(w.navigation).toHaveLength(1);
  });

  it("an empty or missing answer is the platform default", () => {
    expect(toWorkspace(null)).toBe(EMPTY_WORKSPACE);
    const w = toWorkspace({});
    expect(w.navigation).toBeNull();
    expect(w.brand.name).toBeNull();
    expect(w.brand.color).toBeNull();
    expect(w.features).toEqual([]);
    expect(w.currency).toBeNull();
  });

  it("asks for onboarding only when the backend says there is no store (SPEC-342)", () => {
    expect(toWorkspace({ store: null }).needsStore).toBe(true);
    expect(toWorkspace({ store: { currency: "USD" } }).needsStore).toBe(false);
    // An older backend without the key, or a failed read, never locks anyone out.
    expect(toWorkspace({}).needsStore).toBe(false);
    expect(toWorkspace(null).needsStore).toBe(false);
    expect(EMPTY_WORKSPACE.needsStore).toBe(false);
  });
});

describe("the brand colour in the adapters (SPEC-322)", () => {
  const view: PublicBranding = {
    name: "Example Store",
    slug: "example-store",
    logo: { light: null, dark: null },
    login: { kind: "none", items: [], poster: null },
  };

  it("the Settings view reads color, normalised", () => {
    expect(toBranding({ ...view, color: { hex: "#D7263D", source: "logo" } }).color).toEqual({ hex: "#d7263d", source: "logo" });
    expect(toBranding({ ...view, color: null }).color).toBeNull();
    // An older backend sends no color at all.
    expect(toBranding(view).color).toBeNull();
  });

  it("the workspace carries the hex; a malformed one is no colour", () => {
    expect(toWorkspace({ branding: { color: { hex: "#1E3A8A", source: "custom" } } }).brand.color).toBe("#1e3a8a");
    expect(toWorkspace({ branding: { color: { hex: "url(x)", source: "custom" } } }).brand.color).toBeNull();
  });
});

describe("the team's login link", () => {
  it("is the login page with the organization's short name", async () => {
    const { loginLink } = await import("@/lib/branding");
    expect(loginLink("fame-on-central")).toBe("/login?org=fame-on-central");
    expect(loginLink("fame-on-central", "https://app.example.com/")).toBe(
      "https://app.example.com/login?org=fame-on-central",
    );
    expect(loginLink("a b&c", "http://localhost:3000")).toBe("http://localhost:3000/login?org=a%20b%26c");
  });

  it("toBranding keeps the slug", () => {
    const b = toBranding({ name: "x", slug: "example-store", logo: { light: null, dark: null }, login: { kind: "none", items: [], poster: null } });
    expect(b.slug).toBe("example-store");
  });
});
