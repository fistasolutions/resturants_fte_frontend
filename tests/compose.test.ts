import { describe, expect, it } from "vitest";

import { attachmentFilename, slugify, validateComposeMessage } from "@/lib/compose";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Jackson")).toBe("jackson");
    expect(slugify("MILL Warehouse")).toBe("mill-warehouse");
  });

  it("strips leading/trailing punctuation", () => {
    expect(slugify("  Online / Unattributed  ")).toBe("online-unattributed");
  });

  it("falls back to a generic slug for empty input", () => {
    expect(slugify("")).toBe("location");
    expect(slugify("!!!")).toBe("location");
  });
});

describe("attachmentFilename", () => {
  it("combines a prefix and a slugified location name", () => {
    expect(attachmentFilename("overdue-orders", "Jackson")).toBe("overdue-orders-jackson.csv");
  });
});

describe("validateComposeMessage", () => {
  it("accepts a complete message", () => {
    expect(validateComposeMessage("Overdue orders", "Please review the attached list.")).toEqual(
      {},
    );
  });

  it("rejects empty and whitespace-only fields", () => {
    expect(validateComposeMessage("   ", "\n\t")).toEqual({
      subject: "Add a subject before sending.",
      body: "Write a message before sending.",
    });
  });
});
