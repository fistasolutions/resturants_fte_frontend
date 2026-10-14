/**
 * SPEC-302 — the eye on a secret field: what it says, when it may be pressed, and what
 * the box shows while the value is hidden.
 */

import { describe, expect, it } from "vitest";

import {
  canReveal,
  inputType,
  isReadOnlyWhileRevealed,
  maskedPlaceholder,
  revealAction,
  revealTitle,
  secretHint,
  type SecretStatus,
} from "@/lib/integration-secrets";

const stored: SecretStatus = { configured: true, source: "database" };
const fromEnv: SecretStatus = { configured: true, source: "env" };
const unset: SecretStatus = { configured: false, source: "unset" };

describe("the hidden state", () => {
  it("says where a configured value lives, and when there is none", () => {
    expect(maskedPlaceholder(stored)).toBe("Configured on the server");
    expect(maskedPlaceholder(fromEnv)).toBe("Set in the server environment");
    expect(maskedPlaceholder(unset)).toBe("Not configured");
    expect(maskedPlaceholder(undefined)).toBe("Not configured");
  });

  it("keeps the field a password until it is revealed", () => {
    expect(inputType(false)).toBe("password");
    expect(inputType(true)).toBe("text");
  });
});

describe("the button", () => {
  it("can only be pressed when there is something to show", () => {
    expect(canReveal(stored)).toBe(true);
    expect(canReveal(fromEnv)).toBe(true);
    expect(canReveal(unset)).toBe(false);
    expect(canReveal(undefined)).toBe(false);
  });

  it("announces what pressing it will do", () => {
    expect(revealTitle(stored, false)).toBe("Show this value");
    expect(revealTitle(stored, true)).toBe("Hide this value");
    expect(revealTitle(unset, false)).toBe("Nothing is configured yet");
  });
});

describe("the revealed state", () => {
  it("is read-only, so a stray keypress cannot half-edit a credential", () => {
    expect(isReadOnlyWhileRevealed(true)).toBe(true);
    expect(isReadOnlyWhileRevealed(false)).toBe(false);
  });

  it("tells you how to change it, and where an env value came from", () => {
    expect(secretHint(stored, false)).toBe("Type a new value to replace it.");
    expect(secretHint(stored, true)).toBe("Hide it, then type a new value to replace it.");
    expect(secretHint(fromEnv, true)).toContain("server environment");
    expect(secretHint(unset, false)).toBe("");
  });
});

describe("pressing the eye again", () => {
  it("hides what is shown, re-shows what was already read, and fetches once", () => {
    expect(revealAction("api_token", { api_token: true }, { api_token: "abc" })).toBe("hide");
    expect(revealAction("api_token", {}, { api_token: "abc" })).toBe("show");
    expect(revealAction("api_token", {}, {})).toBe("fetch");
    // A different field on the same card has its own answer.
    expect(revealAction("password", {}, { api_token: "abc" })).toBe("fetch");
  });
});
