import { describe, expect, it } from "vitest";

import {
  validateEmail,
  validateName,
  validatePassword,
  validatePasswordConfirmation,
} from "@/utils/validation";

describe("validateEmail", () => {
  it("accepts a normal address", () => {
    expect(validateEmail("merchant@store.com")).toBeNull();
  });
  it("trims surrounding whitespace", () => {
    expect(validateEmail("  merchant@store.com  ")).toBeNull();
  });
  it("requires a value", () => {
    expect(validateEmail("")).toBe("Email is required.");
    expect(validateEmail("   ")).toBe("Email is required.");
  });
  it("rejects malformed addresses", () => {
    expect(validateEmail("not-an-email")).toBe("Enter a valid email address.");
    expect(validateEmail("a@b")).toBe("Enter a valid email address.");
    expect(validateEmail("a b@c.com")).toBe("Enter a valid email address.");
  });
});

describe("validatePassword", () => {
  it("accepts 8+ characters", () => {
    expect(validatePassword("longenough")).toBeNull();
    expect(validatePassword("12345678")).toBeNull();
  });
  it("requires a value", () => {
    expect(validatePassword("")).toBe("Password is required.");
  });
  it("rejects short passwords", () => {
    expect(validatePassword("1234567")).toBe(
      "Password must be at least 8 characters.",
    );
  });
});

describe("validateName", () => {
  it("accepts a normal name", () => {
    expect(validateName("Admin")).toBeNull();
  });
  it("requires a value", () => {
    expect(validateName("  ")).toBe("Name is required.");
  });
  it("rejects single characters", () => {
    expect(validateName("A")).toBe("Name must be at least 2 characters.");
  });
});

describe("validatePasswordConfirmation", () => {
  it("accepts a matching confirmation", () => {
    expect(validatePasswordConfirmation("password1", "password1")).toBeNull();
  });
  it("requires a confirmation", () => {
    expect(validatePasswordConfirmation("password1", "")).toBe(
      "Confirm your password.",
    );
  });
  it("rejects mismatches", () => {
    expect(validatePasswordConfirmation("password1", "password2")).toBe(
      "Passwords do not match.",
    );
  });
});
