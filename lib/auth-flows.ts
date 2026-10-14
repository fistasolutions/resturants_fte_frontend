/**
 * The sign-in flows (SPEC-312) — pure. The session route handler maps a browser
 * request to the backend call that mints tokens; the screens decide where to go
 * next. Nothing here touches a token's secrecy: the org claim is only *read*
 * (the backend verifies every token it is handed).
 */
import { onboardingPath } from "@/lib/pricing";

export type SessionKind =
  | "password"
  | "verify"
  | "reset"
  | "register"
  | "google"
  | "shopify"
  | "invite"
  | "organization";

export interface SessionRequest {
  path: string;
  body: Record<string, unknown> | null;
  /** Send the signed-in user's access token (accepting an invitation). */
  withBearer: boolean;
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function email(value: unknown): string {
  return text(value).trim().toLowerCase();
}

/** The backend call for one `POST /api/session` body. A body with no `kind`
 * is a password sign-in — the shape the login form has always sent. */
export function sessionRequest(input: Record<string, unknown>): SessionRequest | null {
  const kind = (text(input.kind) || "password") as SessionKind;
  switch (kind) {
    case "password":
      return {
        path: "/auth/login",
        body: { email: email(input.email), password: text(input.password) },
        withBearer: false,
      };
    case "verify":
      return {
        path: "/auth/verify-email",
        body: { email: email(input.email), code: text(input.code) },
        withBearer: false,
      };
    case "reset":
      return {
        path: "/auth/password/reset",
        body: {
          email: email(input.email),
          code: text(input.code),
          password: text(input.password),
        },
        withBearer: false,
      };
    case "register": {
      const body: Record<string, unknown> = {
        name: text(input.name).trim(),
        email: email(input.email),
        password: text(input.password),
      };
      if (text(input.invitationToken)) body.invitation_token = text(input.invitationToken);
      return { path: "/auth/register", body, withBearer: false };
    }
    case "google":
      return {
        path: "/auth/google/callback",
        body: { code: text(input.code), state: text(input.state) },
        withBearer: false,
      };
    case "shopify": {
      const query = input.query;
      if (!query || typeof query !== "object") return null;
      const clean: Record<string, string> = {};
      for (const [key, value] of Object.entries(query as Record<string, unknown>)) {
        if (typeof value === "string") clean[key] = value;
      }
      return { path: "/auth/shopify/callback", body: { query: clean }, withBearer: false };
    }
    case "invite": {
      const token = text(input.token);
      if (!/^[A-Za-z0-9_-]{16,128}$/.test(token)) return null;
      return { path: `/auth/invitations/${token}/accept`, body: null, withBearer: true };
    }
    case "organization": {
      const name = text(input.name).trim();
      if (!name || name.length > 160) return null;
      return { path: "/onboarding/organization", body: { name }, withBearer: true };
    }
    default:
      return null;
  }
}

/** The organization the access token works in, read from its `org` claim —
 * `null` when it has none (signed in, not yet in an organization). */
export function organizationClaim(accessToken: string): number | null {
  const parts = accessToken.split(".");
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded)) as { org?: unknown };
    return typeof payload.org === "number" && payload.org > 0 ? payload.org : null;
  } catch {
    return null;
  }
}

/** An in-app path to return to — never another origin, never an auth screen. */
export function safeNext(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return null;
  }
  if (AUTH_PATHS.some((p) => next === p || next.startsWith(`${p}?`) || next.startsWith(`${p}/`))) {
    return null;
  }
  return next;
}

/** A signed-in user with no organization may only be here (SPEC-313). */
export const ONBOARDING_PATH = "/onboarding";

export function needsOnboarding(accessToken: string | undefined, pathname: string): boolean {
  if (!accessToken) return false;
  if (pathname === ONBOARDING_PATH || pathname.startsWith(`${ONBOARDING_PATH}/`)) return false;
  return organizationClaim(accessToken) === null;
}

export const AUTH_PATHS = [
  "/login",
  "/signup",
  "/verify",
  "/forgot",
  "/reset",
  "/invite",
  "/auth",
] as const;

/** Where the browser goes once signed in. */
export function destinationAfterSignIn(
  hasOrganization: boolean,
  next?: string | null,
  plan?: string | null,
): string {
  // SPEC-320: a plan chosen on /pricing rides along into onboarding.
  if (!hasOrganization) return onboardingPath(plan);
  return safeNext(next) ?? "/";
}

export type ErrorStep = "verify" | "use-provider" | null;

/** A backend error that means "go somewhere else", not "show the message". */
export function stepForError(code: string | undefined): ErrorStep {
  if (code === "email_not_verified") return "verify";
  if (code === "password_not_set") return "use-provider";
  return null;
}

export const CODE_LENGTH = 6;

/** What the code box keeps of what was typed or pasted: digits, at most six. */
export function codeDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, CODE_LENGTH);
}

/** A shop as typed → `name.myshopify.com`, or `null` when it cannot be one. */
export function normaliseShop(value: string): string | null {
  let shop = value.trim().toLowerCase();
  shop = shop.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (!shop.endsWith(".myshopify.com")) shop = `${shop}.myshopify.com`;
  return /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(shop) ? shop : null;
}

export const RESEND_COOLDOWN_SECONDS = 60;

/** Seconds until another code may be asked for (never negative). */
export function resendWait(lastSentAt: number | null, now: number): number {
  if (lastSentAt === null) return 0;
  const left = RESEND_COOLDOWN_SECONDS - Math.floor((now - lastSentAt) / 1000);
  return Math.max(0, left);
}

/** The cookie that used to remember the last organization's login screen. Nothing sets it since
 * SPEC-339; the proxy only expires one a browser still carries. */
export const ORG_COOKIE = "fte_org";

/** The organization named by this visit's `/login?org=<slug>`, handed from the proxy to the auth
 * layout for that render only (SPEC-339). */
export const LOGIN_ORG_HEADER = "x-fte-login-org";

export function validSlug(value: string | null | undefined): string | null {
  const slug = (value ?? "").trim().toLowerCase();
  return /^[a-z0-9][a-z0-9-]{0,79}$/.test(slug) ? slug : null;
}
