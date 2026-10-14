/**
 * Auth service — live (SPEC-017; every sign-in path since SPEC-312). Runs in the
 * auth screens. Anything that mints tokens goes to `/api/session`, which sets
 * the httpOnly cookies — tokens never touch client JavaScript. Everything else
 * (codes, provider start URLs, invitation previews) goes through `/api/proxy`.
 */
import type { SessionKind } from "@/lib/auth-flows";
import type { UserProfile } from "@/types/store";

export interface LoginInput {
  email: string;
  password: string;
}

export interface SignedIn {
  user: UserProfile;
  hasOrganization: boolean;
  redirect: string | null;
}

export interface InvitationPreview {
  organizationName: string;
  organizationSlug: string;
  email: string;
  roleName: string;
  hasAccount: boolean;
}

/** A failed auth step, carrying the backend's code so a screen can route on it. */
export class AuthFlowError extends Error {
  constructor(
    message: string,
    readonly code: string | undefined,
    readonly status: number,
  ) {
    super(message);
    this.name = "AuthFlowError";
  }
}

const FALLBACK = "Something went wrong. Try again.";

async function readError(response: Response): Promise<AuthFlowError> {
  const data = await response.json().catch(() => ({}));
  const error = data?.error ?? {};
  const detail = Array.isArray(data?.detail) ? data.detail[0]?.msg : undefined;
  return new AuthFlowError(error.message ?? detail ?? FALLBACK, error.code, response.status);
}

async function session(kind: SessionKind, body: Record<string, unknown>): Promise<Response> {
  const response = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, ...body }),
  });
  if (!response.ok) throw await readError(response);
  return response;
}

async function signIn(kind: SessionKind, body: Record<string, unknown>): Promise<SignedIn> {
  const data = await (await session(kind, body)).json();
  return {
    user: { name: data.user.name, email: data.user.email },
    hasOrganization: Boolean(data.hasOrganization),
    redirect: typeof data.redirect === "string" ? data.redirect : null,
  };
}

async function publicCall<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/proxy${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!response.ok) throw await readError(response);
  return (await response.json()) as T;
}

export function login(input: LoginInput): Promise<SignedIn> {
  return signIn("password", { email: input.email.trim().toLowerCase(), password: input.password });
}

export function verifyEmail(email: string, code: string): Promise<SignedIn> {
  return signIn("verify", { email, code });
}

export function resetPassword(email: string, code: string, password: string): Promise<SignedIn> {
  return signIn("reset", { email, code, password });
}

export function finishGoogle(code: string, state: string): Promise<SignedIn> {
  return signIn("google", { code, state });
}

export function finishShopify(query: Record<string, string>): Promise<SignedIn> {
  return signIn("shopify", { query });
}

export function acceptInvitation(token: string): Promise<SignedIn> {
  return signIn("invite", { token });
}

/** A new account. Without an invitation a code is emailed (`null`); with one the
 * link proves the address and the caller is signed in straight away. */
export async function register(input: {
  name: string;
  email: string;
  password: string;
  invitationToken?: string;
}): Promise<SignedIn | null> {
  const response = await session("register", input);
  const data = await response.json();
  if (!data.user) return null;
  return {
    user: { name: data.user.name, email: data.user.email },
    hasOrganization: Boolean(data.hasOrganization),
    redirect: typeof data.redirect === "string" ? data.redirect : null,
  };
}

export async function resendCode(
  email: string,
  purpose: "verify_email" | "reset_password",
): Promise<void> {
  await publicCall("/auth/codes/resend", {
    method: "POST",
    body: JSON.stringify({ email, purpose }),
  });
}

export async function forgotPassword(email: string): Promise<void> {
  await publicCall("/auth/password/forgot", { method: "POST", body: JSON.stringify({ email }) });
}

export async function googleStartUrl(next?: string | null): Promise<string> {
  const query = next ? `?redirect=${encodeURIComponent(next)}` : "";
  return (await publicCall<{ url: string }>(`/auth/google/start${query}`)).url;
}

export async function shopifyStartUrl(shop: string, next?: string | null): Promise<string> {
  const body = JSON.stringify({ shop, redirect: next ?? null });
  return (await publicCall<{ url: string }>("/auth/shopify/start", { method: "POST", body })).url;
}

export async function invitationPreview(token: string): Promise<InvitationPreview> {
  const data = await publicCall<{
    organization_name: string;
    organization_slug: string;
    email: string;
    role_name: string;
    has_account: boolean;
  }>(`/auth/invitations/${encodeURIComponent(token)}`);
  return {
    organizationName: data.organization_name,
    organizationSlug: data.organization_slug,
    email: data.email,
    roleName: data.role_name,
    hasAccount: data.has_account,
  };
}

/** Clears the httpOnly session cookies. */
export async function logout(): Promise<void> {
  await fetch("/api/session", { method: "DELETE" });
}
