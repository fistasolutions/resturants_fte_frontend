/**
 * Error-boundary logic (SPEC-227).
 *
 * Kept out of the boundary components so it is unit-testable — the repo has no
 * jsdom runner, so `lib/` is where correctness is provable and components stay
 * presentational.
 *
 * The governing constraint: in production Next strips a server error's message
 * before it reaches the browser and leaves a `digest` behind. That is a security
 * property, not an obstacle. So this classifies only what actually survives —
 * client-thrown errors keep their message in production, server ones keep theirs
 * in development — and otherwise says plainly that it does not know.
 */

/** Next passes `digest` on an error whose message was stripped server-side. */
export type BoundaryError = Error & { digest?: string };

export type ErrorKind = "store" | "session" | "offline" | "missing" | "unknown";

export interface ErrorPresentation {
  kind: ErrorKind;
  title: string;
  body: string;
  /** False when retrying would just re-run the same failing request. */
  retryable: boolean;
  href?: string;
  hrefLabel?: string;
}

/**
 * Next 16 passes `unstable_retry`; `reset` is still on the `ErrorInfo` type.
 * Both are accepted so the boundaries are correct today and survive `reset`
 * being dropped.
 */
export interface ErrorBoundaryProps {
  error: BoundaryError;
  reset?: () => void;
  unstable_retry?: () => void;
}

const SESSION_SIGNALS = [
  "401",
  "unauthorized",
  "unauthorised",
  "invalid_token",
  "invalid credentials",
  "session",
  "not authenticated",
];

const OFFLINE_SIGNALS = [
  "backend_unreachable",
  "failed to fetch",
  "fetch failed",
  "networkerror",
  "econnrefused",
  "enotfound",
  "socket hang up",
  "network request failed",
  "is not reachable",
];

const MISSING_SIGNALS = ["404", "not_found", "not found"];

/** SPEC-342: the backend's 409 when the company has no store yet. */
const STORE_SIGNALS = ["store_not_connected", "no shopify store is connected"];

function haystack(error: BoundaryError | undefined): string {
  if (!error) return "";
  // `cause` carries the original on a re-thrown ApiError; `name` catches
  // TypeError: Failed to fetch, whose message varies by browser.
  const cause = error.cause;
  // An ApiError's `code` (SPEC-342) is the most precise signal it carries.
  const code = (error as { code?: unknown }).code;
  return [error.name, code, error.message, cause instanceof Error ? cause.message : cause]
    .filter((part) => typeof part === "string")
    .join(" ")
    .toLowerCase();
}

function matches(text: string, signals: string[]): boolean {
  return signals.some((signal) => text.includes(signal));
}

/** True only for the one case where retrying loops on the same failure. */
export function isSessionExpired(error: BoundaryError | undefined): boolean {
  return matches(haystack(error), SESSION_SIGNALS);
}

/**
 * The reference a user can quote. Returns the digest or nothing — never a
 * message and never a stack, which would leak server internals (root Rule 6).
 */
export function supportReference(error: BoundaryError | undefined): string | null {
  const digest = error?.digest;
  return typeof digest === "string" && digest.trim() !== "" ? digest.trim() : null;
}

export function classifyError(error: BoundaryError | undefined): ErrorPresentation {
  const text = haystack(error);

  if (matches(text, STORE_SIGNALS)) {
    return {
      kind: "store",
      title: "Connect your store first",
      body:
        "This page shows your store's data. Connect your Shopify store and it fills in " +
        "as the first sync lands.",
      // Retrying asks for the same store that does not exist yet.
      retryable: false,
      href: "/onboarding",
      hrefLabel: "Connect your store",
    };
  }

  if (matches(text, SESSION_SIGNALS)) {
    return {
      kind: "session",
      title: "Your session has expired",
      body:
        "You have been signed out for security. Sign in again and you will come " +
        "straight back to what you were doing.",
      // Retrying re-runs the same unauthenticated request and fails identically,
      // forever. This case needs the login page, not a button that looks helpful.
      retryable: false,
      href: "/login",
      hrefLabel: "Sign in",
    };
  }

  if (matches(text, OFFLINE_SIGNALS)) {
    return {
      kind: "offline",
      title: "Can't reach the server",
      body:
        "Your data is safe — the page just could not reach the API. This is " +
        "usually a brief network blip or a restart in progress.",
      retryable: true,
      href: "/dashboard",
      hrefLabel: "Go to dashboard",
    };
  }

  if (matches(text, MISSING_SIGNALS)) {
    return {
      kind: "missing",
      title: "We couldn't find that",
      body: "The page or record you asked for does not exist, or has been removed.",
      retryable: false,
      href: "/dashboard",
      hrefLabel: "Go to dashboard",
    };
  }

  return {
    kind: "unknown",
    title: "Something went wrong",
    body:
      "This page failed to load. Nothing has been changed or lost — trying again " +
      "usually clears it.",
    retryable: true,
    href: "/dashboard",
    hrefLabel: "Go to dashboard",
  };
}
