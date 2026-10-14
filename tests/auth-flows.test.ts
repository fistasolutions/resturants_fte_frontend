import { describe, expect, it } from "vitest";

import {
  codeDigits,
  destinationAfterSignIn,
  normaliseShop,
  organizationClaim,
  RESEND_COOLDOWN_SECONDS,
  resendWait,
  safeNext,
  sessionRequest,
  stepForError,
  validSlug,
} from "@/lib/auth-flows";

function token(payload: object): string {
  const encode = (value: object) =>
    btoa(JSON.stringify(value)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${encode({ alg: "HS256" })}.${encode(payload)}.signature`;
}

describe("sessionRequest", () => {
  it("treats a body with no kind as a password sign-in (the old login form)", () => {
    expect(sessionRequest({ email: " A@Example.com ", password: "secret" })).toEqual({
      path: "/auth/login",
      body: { email: "a@example.com", password: "secret" },
      withBearer: false,
    });
  });

  it("maps every kind to its backend call", () => {
    expect(sessionRequest({ kind: "verify", email: "a@b.co", code: "123456" })?.path).toBe(
      "/auth/verify-email",
    );
    expect(
      sessionRequest({ kind: "reset", email: "a@b.co", code: "123456", password: "newpass12" }),
    ).toMatchObject({ path: "/auth/password/reset", body: { password: "newpass12" } });
    expect(sessionRequest({ kind: "google", code: "c", state: "s" })?.body).toEqual({
      code: "c",
      state: "s",
    });
    expect(
      sessionRequest({ kind: "shopify", query: { shop: "x.myshopify.com", hmac: "h", n: 1 } })
        ?.body,
    ).toEqual({ query: { shop: "x.myshopify.com", hmac: "h" } });
  });

  it("sends an invitation token only when there is one", () => {
    const plain = sessionRequest({ kind: "register", name: " Sam ", email: "S@x.co", password: "p" });
    expect(plain?.body).toEqual({ name: "Sam", email: "s@x.co", password: "p" });
    const invited = sessionRequest({
      kind: "register",
      name: "Sam",
      email: "s@x.co",
      password: "p",
      invitationToken: "tok",
    });
    expect(invited?.body).toMatchObject({ invitation_token: "tok" });
  });

  it("accepts an invitation with the signed-in user's bearer, and checks the token", () => {
    const token = "a".repeat(32);
    expect(sessionRequest({ kind: "invite", token })).toEqual({
      path: `/auth/invitations/${token}/accept`,
      body: null,
      withBearer: true,
    });
    expect(sessionRequest({ kind: "invite", token: "../../admin" })).toBeNull();
    expect(sessionRequest({ kind: "shopify", query: "nope" })).toBeNull();
    expect(sessionRequest({ kind: "teleport" })).toBeNull();
  });
});

describe("organizationClaim", () => {
  it("reads the organization a token works in", () => {
    expect(organizationClaim(token({ sub: "1", org: 7 }))).toBe(7);
    expect(organizationClaim(token({ sub: "1" }))).toBeNull();
    expect(organizationClaim(token({ sub: "1", org: "7" }))).toBeNull();
    expect(organizationClaim("not-a-token")).toBeNull();
    expect(organizationClaim("a.%%%.c")).toBeNull();
  });
});

describe("where to go after signing in", () => {
  it("returns to a safe in-app page, else the home page; no organization → onboarding", () => {
    expect(destinationAfterSignIn(true, "/orders?tab=open")).toBe("/orders?tab=open");
    expect(destinationAfterSignIn(true, null)).toBe("/");
    expect(destinationAfterSignIn(false, "/orders")).toBe("/onboarding");
  });

  it("never follows another origin or an auth screen", () => {
    for (const next of ["https://evil.example", "//evil.example", "/\\evil", "/login", "/verify?x=1", "/auth/google/callback"]) {
      expect(safeNext(next)).toBeNull();
    }
    expect(safeNext("/invite-report")).toBe("/invite-report");
  });
});

describe("small pieces", () => {
  it("routes the backend's errors that mean 'go somewhere else'", () => {
    expect(stepForError("email_not_verified")).toBe("verify");
    expect(stepForError("password_not_set")).toBe("use-provider");
    expect(stepForError("invalid_credentials")).toBeNull();
    expect(stepForError(undefined)).toBeNull();
  });

  it("keeps digits only, six at most", () => {
    expect(codeDigits("12 34-56 78")).toBe("123456");
    expect(codeDigits("abc")).toBe("");
  });

  it("normalises a shop as typed", () => {
    expect(normaliseShop("My-Store")).toBe("my-store.myshopify.com");
    expect(normaliseShop("https://my-store.myshopify.com/admin")).toBe("my-store.myshopify.com");
    expect(normaliseShop("bad shop!")).toBeNull();
    expect(normaliseShop("")).toBeNull();
  });

  it("counts the resend cooldown down to zero", () => {
    expect(resendWait(null, 1_000)).toBe(0);
    expect(resendWait(0, 0)).toBe(RESEND_COOLDOWN_SECONDS);
    expect(resendWait(0, 59_500)).toBe(1);
    expect(resendWait(0, 90_000)).toBe(0);
  });

  it("accepts only a real organization slug", () => {
    expect(validSlug(" Alpha-Goods ")).toBe("alpha-goods");
    expect(validSlug("../x")).toBeNull();
    expect(validSlug(null)).toBeNull();
  });
});
