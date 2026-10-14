import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api-error";
import {
  type BoundaryError,
  classifyError,
  isSessionExpired,
  supportReference,
} from "@/lib/error-boundary";

function err(message: string, extra: Partial<BoundaryError> = {}): BoundaryError {
  return Object.assign(new Error(message), extra);
}

describe("classifyError", () => {
  it("recognises an expired session and refuses to offer a retry", () => {
    // The whole point of the branch: retrying re-runs the same unauthenticated
    // request, so a Try again button would loop the user forever.
    const result = classifyError(err("API request failed (401)."));
    expect(result.kind).toBe("session");
    expect(result.retryable).toBe(false);
    expect(result.href).toBe("/login");
  });

  it.each([
    "unauthorized",
    "Unauthorised",
    "invalid_token",
    "Your session has expired",
  ])("treats %s as a session failure", (message) => {
    expect(classifyError(err(message)).kind).toBe("session");
  });

  it.each([
    "backend_unreachable",
    "Failed to fetch",
    "fetch failed",
    "connect ECONNREFUSED 127.0.0.1:8000",
    "The API is not reachable.",
  ])("treats %s as the server being unreachable, and retryable", (message) => {
    const result = classifyError(err(message));
    expect(result.kind).toBe("offline");
    expect(result.retryable).toBe(true);
  });

  it("reads a TypeError's name, since the fetch message differs per browser", () => {
    const error = err("Load failed", { name: "TypeError" });
    // Not offline by name alone — 'Load failed' is not a signal, so this must
    // fall through rather than guess.
    expect(classifyError(error).kind).toBe("unknown");
    expect(classifyError(err("NetworkError when attempting to fetch")).kind).toBe(
      "offline",
    );
  });

  it("reads the cause of a re-thrown error", () => {
    const error = err("Request failed", { cause: new Error("backend_unreachable") });
    expect(classifyError(error).kind).toBe("offline");
  });

  it("recognises a missing record and does not offer a retry", () => {
    const result = classifyError(err("API request failed (404)."));
    expect(result.kind).toBe("missing");
    expect(result.retryable).toBe(false);
  });

  it("falls back to unknown for a production error stripped to a digest", () => {
    // The common production case: Next removes the message and leaves a digest.
    // Inferring a cause from nothing would be a confident wrong answer.
    const result = classifyError(
      err("An error occurred in the Server Components render.", { digest: "18374" }),
    );
    expect(result.kind).toBe("unknown");
    expect(result.retryable).toBe(true);
  });

  it("survives a missing error object", () => {
    expect(classifyError(undefined).kind).toBe("unknown");
  });

  it("never puts a raw message into what the user is shown", () => {
    const leak = "connect ECONNREFUSED 10.1.2.3:5432 password=hunter2";
    const result = classifyError(err(leak));
    expect(result.title).not.toContain("hunter2");
    expect(result.body).not.toContain("hunter2");
    expect(result.body).not.toContain("10.1.2.3");
  });
});

describe("supportReference", () => {
  it("returns the digest, the only honest link to the server log", () => {
    expect(supportReference(err("boom", { digest: "2946731045" }))).toBe("2946731045");
  });

  it("returns nothing rather than a message or a stack (root Rule 6)", () => {
    const error = err("connect ECONNREFUSED 127.0.0.1:8000");
    expect(supportReference(error)).toBeNull();
    expect(supportReference(err("boom", { digest: "   " }))).toBeNull();
    expect(supportReference(undefined)).toBeNull();
  });
});

describe("isSessionExpired", () => {
  it("is true only for auth failures", () => {
    expect(isSessionExpired(err("401 unauthorized"))).toBe(true);
    expect(isSessionExpired(err("500 internal server error"))).toBe(false);
    expect(isSessionExpired(undefined)).toBe(false);
  });
});

describe("no store yet (SPEC-342)", () => {
  it("turns the backend's 409 into a calm step towards onboarding", () => {
    const error = new ApiError(
      409,
      "store_not_connected",
      "No Shopify store is connected yet. Run the first sync before using this feature.",
    );
    const result = classifyError(error);
    expect(result.kind).toBe("store");
    expect(result.title).toBe("Connect your store first");
    expect(result.retryable).toBe(false);
    expect(result.href).toBe("/onboarding");
  });

  it("reads the code even when the message says nothing", () => {
    expect(classifyError(new ApiError(409, "store_not_connected", "Conflict")).kind).toBe("store");
  });

  it("leaves every other failure as it was", () => {
    expect(classifyError(new ApiError(409, "conflict", "Already exists")).kind).toBe("unknown");
    expect(classifyError(new ApiError(404, "not_found", "Not found")).kind).toBe("missing");
    expect(classifyError(new ApiError(401, "invalid_token", "Unauthorized")).kind).toBe("session");
  });
});
