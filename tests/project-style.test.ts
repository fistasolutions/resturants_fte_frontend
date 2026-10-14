import { describe, expect, it } from "vitest";

import {
  PROJECT_COLORS,
  PROJECT_ICONS,
  colorBg,
  colorText,
  colorTint,
  isProjectColor,
  isProjectIcon,
  projectIcon,
} from "@/lib/project-style";

describe("project style (SPEC-255)", () => {
  it("mirrors the backend lists exactly", () => {
    expect([...PROJECT_COLORS]).toEqual([
      "slate", "violet", "blue", "teal", "green", "amber", "rose", "orange",
    ]);
    expect([...PROJECT_ICONS]).toEqual([
      "folder", "tag", "bag", "truck", "users", "chart", "calendar", "flame", "star", "box", "receipt", "megaphone",
    ]);
  });

  it("maps every colour to a token class and falls back to slate", () => {
    for (const color of PROJECT_COLORS) {
      expect(colorText(color)).toBe(`text-label-${color}`);
      expect(colorBg(color)).toBe(`bg-label-${color}`);
    }
    expect(colorText("pink")).toBe("text-label-slate");
    expect(colorBg(null)).toBe("bg-label-slate");
    expect(isProjectColor("teal")).toBe(true);
    expect(isProjectColor("")).toBe(false);
  });

  it("maps every icon to a component and falls back to the folder", () => {
    for (const icon of PROJECT_ICONS) expect(projectIcon(icon)).toBeTypeOf("object");
    expect(projectIcon("unicorn")).toBe(projectIcon("folder"));
    expect(isProjectIcon("flame")).toBe(true);
  });
});

describe("colorTint (SPEC-255 Patches)", () => {
  it("is the project colour at 15 %, slate for anything unknown", () => {
    expect(colorTint("green")).toBe("bg-label-green/15");
    expect(colorTint("nope")).toBe("bg-label-slate/15");
    expect(colorTint(null)).toBe("bg-label-slate/15");
  });
});
