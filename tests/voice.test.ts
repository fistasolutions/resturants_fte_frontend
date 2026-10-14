import { describe, expect, it } from "vitest";

import {
  appendDictation,
  dictationFailure,
  isDictationShortcut,
  readVoiceReplies,
  writeVoiceReplies,
} from "@/lib/voice";

describe("appendDictation", () => {
  it("joins dictated words to typed text with one space", () => {
    expect(appendDictation("", "how is revenue")).toBe("how is revenue");
    expect(appendDictation("Compare ", "this week to last")).toBe("Compare this week to last");
    expect(appendDictation("Why", "  is   returns  up ")).toBe("Why is returns up");
  });

  it("ignores empty recognitions", () => {
    expect(appendDictation("keep me", "   ")).toBe("keep me");
  });
});

describe("dictationFailure", () => {
  it("explains the failures the owner can act on and stays quiet on the rest", () => {
    expect(dictationFailure("not-allowed")).toMatch(/Microphone blocked/);
    expect(dictationFailure("audio-capture")).toBe("No microphone found.");
    expect(dictationFailure("network")).toMatch(/network/);
    expect(dictationFailure("no-speech")).toBeNull();
    expect(dictationFailure("aborted")).toBeNull();
    expect(dictationFailure("anything-else")).toBeNull();
  });
});

describe("voice replies preference", () => {
  it("is off by default and survives without storage (node)", () => {
    expect(readVoiceReplies()).toBe(false);
    expect(() => writeVoiceReplies(true)).not.toThrow();
  });
});

describe("isDictationShortcut", () => {
  it("is Alt+Space alone", () => {
    expect(isDictationShortcut({ key: " ", altKey: true, metaKey: false, ctrlKey: false })).toBe(true);
    expect(isDictationShortcut({ key: "Spacebar", altKey: true, metaKey: false, ctrlKey: false })).toBe(true);
    expect(isDictationShortcut({ key: " ", altKey: false, metaKey: false, ctrlKey: false })).toBe(false);
    expect(isDictationShortcut({ key: " ", altKey: true, metaKey: true, ctrlKey: false })).toBe(false);
    expect(isDictationShortcut({ key: "a", altKey: true, metaKey: false, ctrlKey: false })).toBe(false);
  });
});
