/**
 * Session route (SPEC-017; every sign-in path since SPEC-312): the ONLY place
 * tokens are handled. POST {kind, …} → the backend call that mints tokens
 * (`lib/auth-flows.ts` `sessionRequest`) → httpOnly cookies + `{user,
 * hasOrganization, redirect}` — never a token. A body with no `kind` is a
 * password sign-in. DELETE → clear cookies.
 */
import { NextResponse, type NextRequest } from "next/server";

import { organizationClaim, sessionRequest } from "@/lib/auth-flows";
import {
  ACCESS_MAX_AGE_SECONDS,
  cookieBase as COOKIE_BASE,
  REFRESH_COOKIE,
  REFRESH_MAX_AGE_SECONDS,
  SESSION_COOKIE,
} from "@/lib/session";

const API_URL = process.env.API_URL ?? "http://localhost:8000";

function problem(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(request: NextRequest) {
  let input: Record<string, unknown>;
  try {
    input = await request.json();
  } catch {
    return problem("invalid_request", "Malformed request body.", 400);
  }
  const call = sessionRequest(input);
  if (call === null) {
    return problem("invalid_request", "That sign-in request is not recognised.", 400);
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const userAgent = request.headers.get("user-agent");
  if (userAgent) headers["User-Agent"] = userAgent;
  if (call.withBearer) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) return problem("invalid_token", "Sign in first.", 401);
    headers.Authorization = `Bearer ${token}`;
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL}/api/v1${call.path}`, {
      method: "POST",
      headers,
      body: call.body === null ? undefined : JSON.stringify(call.body),
      cache: "no-store",
    });
  } catch {
    return problem("backend_unreachable", "The API is not reachable.", 502);
  }

  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    return NextResponse.json(data, { status: upstream.status });
  }
  if (typeof data.access_token !== "string") {
    // A step that mints nothing yet (a registration: "we've sent you a code").
    return NextResponse.json({ status: data.status ?? "accepted" }, { status: upstream.status });
  }

  const organizationId = organizationClaim(data.access_token);
  const response = NextResponse.json({
    user: { name: data.user.name, email: data.user.email },
    hasOrganization: organizationId !== null,
    redirect: typeof data.redirect === "string" ? data.redirect : null,
  });
  response.cookies.set(SESSION_COOKIE, data.access_token, {
    ...COOKIE_BASE,
    maxAge: ACCESS_MAX_AGE_SECONDS,
  });
  response.cookies.set(REFRESH_COOKIE, data.refresh_token, {
    ...COOKIE_BASE,
    maxAge: REFRESH_MAX_AGE_SECONDS,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { ...COOKIE_BASE, maxAge: 0 });
  response.cookies.set(REFRESH_COOKIE, "", { ...COOKIE_BASE, maxAge: 0 });
  return response;
}
