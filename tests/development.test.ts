import { describe, expect, it } from "vitest";

import { OPENING_LABELS, OPENING_STAGES, PROSPECT_LABELS, PROSPECT_STAGES, movableOpeningStages, movableProspectStages } from "@/lib/development";

describe("franchise development (SPEC-395)", () => {
  it("labels every stage", () => {
    for (const s of PROSPECT_STAGES) expect(PROSPECT_LABELS[s]).toBeTruthy();
    for (const s of OPENING_STAGES) expect(OPENING_LABELS[s]).toBeTruthy();
  });

  it("never offers signing or opening as a plain move", () => {
    expect(movableProspectStages("inquiry")).not.toContain("signed");
    expect(movableProspectStages("inquiry")).not.toContain("inquiry");
    expect(movableProspectStages("approved")).toContain("lost");
    expect(movableOpeningStages("permits")).not.toContain("open");
    expect(movableOpeningStages("permits")).toContain("dropped");
  });

  it("offers nothing once final", () => {
    expect(movableProspectStages("signed")).toEqual([]);
    expect(movableOpeningStages("open")).toEqual([]);
  });
});
