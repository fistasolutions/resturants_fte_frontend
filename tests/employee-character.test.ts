import { describe, expect, it } from "vitest";

import {
  CHARACTERS,
  GAZE_NEUTRAL,
  MOODS,
  characterLabel,
  gazeFor,
  moodFor,
} from "@/lib/employee-character";

const BOX = { left: 100, top: 100, width: 128, height: 128 };

describe("gazeFor", () => {
  it("looks straight ahead at its own centre", () => {
    expect(gazeFor({ x: 164, y: 164 }, BOX)).toEqual(GAZE_NEUTRAL);
  });

  it("deflects toward the pointer, a little near the face and fully far away", () => {
    expect(gazeFor({ x: 228, y: 164 }, BOX)).toEqual({ x: 0.13, y: 0 });
    expect(gazeFor({ x: 164, y: 36 }, BOX)).toEqual({ x: 0, y: -0.25 });
    expect(gazeFor({ x: 2000, y: -2000 }, BOX)).toEqual({ x: 1, y: -1 });
  });

  it("is neutral for a box with no size, and never NaN", () => {
    expect(gazeFor({ x: 10, y: 10 }, { ...BOX, width: 0 })).toEqual(GAZE_NEUTRAL);
    expect(gazeFor({ x: Number.NaN, y: 10 }, BOX)).toEqual({ x: 0, y: -0.3 });
  });
});

describe("moods", () => {
  it("maps every backend status to a face", () => {
    expect(moodFor("working")).toBe("working");
    expect(moodFor("needs_you")).toBe("needs_you");
    expect(moodFor("attention")).toBe("attention");
    expect(moodFor("idle")).toBe("idle");
    expect(moodFor("not_started")).toBe("asleep");
    expect(moodFor("unread")).toBe("attention");
  });

  it("only the needs-you face raises a hand; only the sleeper shuts its eyes", () => {
    expect(Object.entries(MOODS).filter(([, mood]) => mood.hand).map(([key]) => key)).toEqual(["needs_you"]);
    expect(Object.entries(MOODS).filter(([, mood]) => mood.eyes === "shut").map(([key]) => key)).toEqual(["asleep"]);
  });

  it("names the employee and its mood for assistive tech", () => {
    expect(characterLabel("Search Visibility", "needs_you")).toBe("Search Visibility — needs you");
    expect(characterLabel("Paid Ads Manager", "asleep")).toBe("Paid Ads Manager — not started");
  });
});

describe("characters", () => {
  it("gives each employee its own prop", () => {
    const kinds = Object.values(CHARACTERS).map((character) => character.kind);
    expect(new Set(kinds).size).toBe(Object.keys(CHARACTERS).length);
    expect(Object.keys(CHARACTERS).sort()).toEqual([
      "ads",
      "customer_support",
      "email_marketing",
      "finance",
      "ops_coach",
      "report-fte",
      "social",
      "spotlight",
    ]);
  });
});
