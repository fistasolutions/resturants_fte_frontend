import { describe, expect, it } from "vitest";

import { loginMedia, nextSlide, viaProxy, type PublicBranding } from "@/lib/login-media";

function asset(id: string, media_type = "image/jpeg") {
  return { id, media_type, width: 10, height: 10, url: `/api/v1/branding/assets/${id}` };
}

const base: PublicBranding = {
  name: "Alpha Goods",
  slug: "alpha-goods",
  logo: { light: asset("l", "image/png"), dark: null },
  login: { kind: "carousel", items: [asset("a"), asset("b")], poster: null },
};

describe("login media", () => {
  it("serves every asset through the proxy", () => {
    expect(viaProxy("/api/v1/branding/assets/x")).toBe("/api/proxy/branding/assets/x");
    expect(viaProxy("https://elsewhere.example/x.png")).toBeNull();
    expect(viaProxy(null)).toBeNull();
  });

  it("builds the panel's view of an organization", () => {
    const media = loginMedia(base);
    expect(media).toMatchObject({
      name: "Alpha Goods",
      logoLight: "/api/proxy/branding/assets/l",
      logoDark: null,
      kind: "carousel",
      sources: ["/api/proxy/branding/assets/a", "/api/proxy/branding/assets/b"],
    });
  });

  it("carries the brand colour, normalised, or null", () => {
    expect(loginMedia(base)?.color).toBeNull();
    expect(loginMedia({ ...base, color: { hex: "#ABC", source: "custom" } })?.color).toBe("#aabbcc");
    expect(loginMedia({ ...base, color: { hex: "red", source: "custom" } })?.color).toBeNull();
  });

  it("falls back to no media when nothing can be shown", () => {
    expect(loginMedia(null)).toBeNull();
    const empty = loginMedia({ ...base, login: { kind: "video", items: [], poster: null } });
    expect(empty?.kind).toBe("none");
    const video = loginMedia({
      ...base,
      login: { kind: "video", items: [asset("v", "video/mp4")], poster: asset("p") },
    });
    expect(video).toMatchObject({ kind: "video", mediaType: "video/mp4", poster: "/api/proxy/branding/assets/p" });
  });

  it("walks the carousel round", () => {
    expect(nextSlide(0, 3)).toBe(1);
    expect(nextSlide(2, 3)).toBe(0);
    expect(nextSlide(4, 0)).toBe(0);
  });
});
