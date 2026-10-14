import { describe, expect, it } from "vitest";

import {
  BRAND_VARS,
  INK,
  MIN_FILL_CONTRAST,
  MIN_TEXT_CONTRAST,
  NEAR_DESTRUCTIVE_NOTE,
  PLATFORM_RED,
  SURFACES,
  WHITE,
  adjustedNote,
  brandCss,
  brandTheme,
  colorChanged,
  contrastRatio,
  hexFieldError,
  isNearDestructive,
  normaliseHex,
  relativeLuminance,
  toBrandColor,
  toBrandPalette,
  type ThemeName,
} from "@/lib/brand-color";

const THEMES: ThemeName[] = ["light", "dark"];

/** HSL → hex, for the sweep. */
function hslHex(h: number, s: number, l: number): string {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return `#${[f(0), f(8), f(4)].map((c) => Math.round(c * 255).toString(16).padStart(2, "0")).join("")}`;
}

describe("WCAG maths", () => {
  it("relative luminance of the extremes and a known grey", () => {
    expect(relativeLuminance("#000000")).toBe(0);
    expect(relativeLuminance("#ffffff")).toBe(1);
    expect(relativeLuminance("#777777")).toBeCloseTo(0.1845, 3);
  });

  it("contrast ratio against known pairs", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 5);
    expect(contrastRatio("#777777", "#ffffff")).toBeCloseTo(4.48, 2);
    expect(contrastRatio("#767676", "#ffffff")).toBeCloseTo(4.54, 2);
    expect(contrastRatio("#e42828", "#e42828")).toBe(1);
  });
});

describe("normaliseHex", () => {
  it("accepts #rgb, #rrggbb, any case, with or without #", () => {
    expect(normaliseHex("#D7263D")).toBe("#d7263d");
    expect(normaliseHex("#abc")).toBe("#aabbcc");
    expect(normaliseHex("  1a2B3c ")).toBe("#1a2b3c");
  });

  it("refuses everything else", () => {
    for (const bad of ["red", "#12345", "#1234567", "#ff00ff80", "#ggg", "", "#", null, undefined, "#fff;}body{"]) {
      expect(normaliseHex(bad)).toBeNull();
    }
  });
});

describe("brandTheme", () => {
  it("returns null for anything that is not a colour", () => {
    expect(brandTheme("nope")).toBeNull();
    expect(brandTheme(null)).toBeNull();
  });

  it("a dark blue keeps its fill with white text in light mode and is lightened in dark mode", () => {
    const theme = brandTheme("#1e3a8a")!;
    expect(theme.light["--primary"]).toBe("#1e3a8a");
    expect(theme.light["--primary-foreground"]).toBe(WHITE);
    expect(theme.adjusted.light).toBe(false);
    expect(theme.adjusted.dark).toBe(true);
    expect(relativeLuminance(theme.dark["--primary"])).toBeGreaterThan(relativeLuminance("#1e3a8a"));
  });

  it("yellow gets ink text and is darkened for the light page", () => {
    const theme = brandTheme("#facc15")!;
    expect(theme.light["--primary-foreground"]).toBe(INK);
    expect(theme.adjusted.light).toBe(true);
    expect(relativeLuminance(theme.light["--primary"])).toBeLessThan(relativeLuminance("#facc15"));
    expect(theme.dark["--primary"]).toBe("#facc15");
    expect(theme.dark["--primary-foreground"]).toBe(INK);
  });

  it("every fill/text pair reads at 4.5 : 1 and every fill at 3 : 1 against its page — a sweep", () => {
    const levels: Array<[number, number]> = [
      [1, 0.5],
      [1, 0.25],
      [1, 0.75],
      [0.6, 0.4],
      [0.6, 0.6],
      [0.3, 0.5],
      [0.8, 0.15],
      [0.8, 0.9],
      [0, 0.5],
    ];
    let checked = 0;
    for (let hue = 0; hue <= 350; hue += 10) {
      for (const [s, l] of levels) {
        const hex = hslHex(hue, s, l);
        const theme = brandTheme(hex)!;
        for (const name of THEMES) {
          const vars = theme[name];
          const { page, others } = SURFACES[name];
          for (const [fill, text] of [
            ["--primary", "--primary-foreground"],
            ["--brand", "--brand-foreground"],
            ["--sidebar-primary", "--sidebar-primary-foreground"],
            ["--showcase-band", "--showcase-band-foreground"],
          ] as const) {
            expect(contrastRatio(vars[fill], vars[text]), `${hex} ${name} ${fill}`).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
            expect(contrastRatio(vars[fill], page), `${hex} ${name} vs page`).toBeGreaterThanOrEqual(MIN_FILL_CONTRAST);
            for (const surface of others) {
              expect(contrastRatio(vars[fill], surface)).toBeGreaterThanOrEqual(MIN_FILL_CONTRAST);
            }
          }
          expect(normaliseHex(vars["--primary"])).toBe(vars["--primary"]);
          checked += 1;
        }
      }
    }
    expect(checked).toBe(36 * levels.length * 2);
  });

  it("the platform red itself passes untouched in both themes", () => {
    const theme = brandTheme("#e42828")!;
    expect(theme.adjusted).toEqual({ light: false, dark: false });
    expect(theme.light["--brand-foreground"]).toBe(WHITE);
  });

  it("sets exactly the brand variables — never a status, chart, label or surface token", () => {
    const theme = brandTheme("#0ea5e9")!;
    for (const name of THEMES) {
      const keys = Object.keys(theme[name]);
      expect(keys.sort()).toEqual([...BRAND_VARS].sort());
      for (const key of keys) {
        expect(key).not.toMatch(/destructive|success|warning|info|--ai|chart|label|background|border|--foreground|muted|card|popover|input/);
      }
    }
  });
});

describe("isNearDestructive", () => {
  it("flags saturated reds close to the error red, not blue, orange or tints", () => {
    expect(isNearDestructive("#e42828")).toBe(true);
    expect(isNearDestructive("#d7263d")).toBe(true);
    expect(brandTheme("#d7263d")!.nearDestructive).toBe(true);
    expect(isNearDestructive("#2563eb")).toBe(false);
    expect(isNearDestructive("#16a34a")).toBe(false);
    expect(isNearDestructive("#fde2e2")).toBe(false);
    expect(isNearDestructive("#3b0a0a")).toBe(false);
    expect(isNearDestructive("#b0a0a0")).toBe(false);
    expect(isNearDestructive("not a colour")).toBe(false);
  });
});

describe("brandCss", () => {
  it("is null without a colour", () => {
    expect(brandCss(null)).toBeNull();
    expect(brandCss("#fff;}body{display:none")).toBeNull();
  });

  it("scopes light to html:root and dark to html.dark, built from normalised hex only", () => {
    const css = brandCss("#1E3A8A")!;
    expect(css.startsWith("html:root{--primary:#1e3a8a;")).toBe(true);
    expect(css).toContain("}html.dark{--primary:#");
    expect(css).toMatch(/^[a-z0-9:#;{}.\-]+$/);
    expect(css).not.toContain("destructive");
  });
});

describe("the adapters", () => {
  it("toBrandColor reads the stored colour; absent, null or malformed is none", () => {
    expect(toBrandColor({ hex: "#D7263D", source: "logo" })).toEqual({ hex: "#d7263d", source: "logo" });
    expect(toBrandColor({ hex: "#abc", source: "custom" })).toEqual({ hex: "#aabbcc", source: "custom" });
    expect(toBrandColor({ hex: "#abc" })).toEqual({ hex: "#aabbcc", source: "custom" });
    expect(toBrandColor(undefined)).toBeNull();
    expect(toBrandColor(null)).toBeNull();
    expect(toBrandColor({ hex: "blue", source: "custom" })).toBeNull();
  });

  it("toBrandPalette normalises, de-duplicates, drops junk and keeps at most five", () => {
    expect(
      toBrandPalette({ colors: ["#D7263D", "#d7263d", "junk", 4, "#111", "#222222", "#333333", "#444444", "#555555"], from: "light" }),
    ).toEqual({ colors: ["#d7263d", "#111111", "#222222", "#333333", "#444444"], from: "light" });
    expect(toBrandPalette({ colors: [], from: null })).toEqual({ colors: [], from: null });
    expect(toBrandPalette(undefined)).toEqual({ colors: [], from: null });
    expect(toBrandPalette({ colors: "x", from: "sideways" })).toEqual({ colors: [], from: null });
  });
});

describe("the Settings card's decisions", () => {
  it("colorChanged: only a valid choice that differs from the saved colour", () => {
    const saved = { hex: "#1e3a8a", source: "custom" as const };
    expect(colorChanged(saved, null)).toBe(false);
    expect(colorChanged(saved, { hex: "#1e3a8a", source: "logo" })).toBe(false);
    expect(colorChanged(saved, { hex: "#d7263d", source: "logo" })).toBe(true);
    expect(colorChanged(null, { hex: "#d7263d", source: "custom" })).toBe(true);
    expect(colorChanged(null, null)).toBe(false);
  });

  it("hexFieldError: quiet while empty or valid, words otherwise", () => {
    expect(hexFieldError("")).toBeNull();
    expect(hexFieldError("#1E3A8A")).toBeNull();
    expect(hexFieldError("#abc")).toBeNull();
    expect(hexFieldError("#1e3a")).toMatch(/#rrggbb/);
    expect(hexFieldError("blue")).toMatch(/#rrggbb/);
  });

  it("adjustedNote names the theme that moved", () => {
    expect(adjustedNote({ light: false, dark: false })).toBeNull();
    expect(adjustedNote({ light: true, dark: false })).toMatch(/light theme/);
    expect(adjustedNote({ light: false, dark: true })).toMatch(/dark theme/);
    expect(adjustedNote({ light: true, dark: true })).toMatch(/both themes/);
  });

  it("the platform red is a valid, unadjusted colour", () => {
    expect(normaliseHex(PLATFORM_RED)).toBe(PLATFORM_RED);
    expect(NEAR_DESTRUCTIVE_NOTE).toMatch(/errors and delete buttons/);
  });
});
