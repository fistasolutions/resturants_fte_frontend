import { describe, expect, it } from "vitest";

import { scrollEdges } from "@/lib/folder-tabs";

describe("folder tab bar edges", () => {
  it("has nothing to fade when everything fits", () => {
    expect(scrollEdges(0, 800, 800)).toEqual({ moreStart: false, moreEnd: false });
    expect(scrollEdges(0, 800, 801)).toEqual({ moreStart: false, moreEnd: false });
  });

  it("fades the end at the start of a long bar", () => {
    expect(scrollEdges(0, 360, 900)).toEqual({ moreStart: false, moreEnd: true });
  });

  it("fades both sides in the middle", () => {
    expect(scrollEdges(200, 360, 900)).toEqual({ moreStart: true, moreEnd: true });
  });

  it("fades the start at the end, allowing sub-pixel positions", () => {
    expect(scrollEdges(539, 360, 900)).toEqual({ moreStart: true, moreEnd: false });
    expect(scrollEdges(540, 360, 900)).toEqual({ moreStart: true, moreEnd: false });
  });
});

describe("folderTab", () => {
  it("marks only the active tab, keeping extra classes", async () => {
    const { folderTab } = await import("@/components/shared/folder-tabs");
    expect(folderTab(true)).toEqual({ className: "folder-tab", "data-active": "" });
    expect(folderTab(false)).toEqual({ className: "folder-tab" });
    expect(folderTab(false, "gap-3").className).toBe("folder-tab gap-3");
  });
});
