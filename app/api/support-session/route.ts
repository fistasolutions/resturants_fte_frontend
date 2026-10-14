/**
 * View as company (SPEC-363 / backend SPEC-371): the entry and the exit of a support session.
 *
 * GET ?code=… — the admin console opens this in a new tab. The single-use code is exchanged
 * server-side, so it never reaches client JavaScript; the access token lands in the same httpOnly
 * cookie a sign-in uses, for exactly the session's remaining time, and the refresh cookie is
 * cleared (a support session never refreshes). A marker cookie with no secret in it tells the
 * banner to draw.
 *
 * DELETE — the banner's Exit: ends the session on the backend and clears all three cookies.
 */
import { NextResponse, type NextRequest } from "next/server";

import { cookieBase, REFRESH_COOKIE, SESSION_COOKIE } from "@/lib/session";
import {
  markerValue,
  secondsLeft,
  SUPPORT_COOKIE,
  SUPPORT_ENDED_PATH,
} from "@/lib/support-session";

const API_URL = process.env.API_URL ?? "http://localhost:8000";

function ended(request: NextRequest, reason: string): NextResponse {
  const url = new URL(SUPPORT_ENDED_PATH, request.url);
  url.searchParams.set("reason", reason);
  const response = NextResponse.redirect(url);
  clearAll(response);
  return response;
}

function clearAll(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE, "", { ...cookieBase, maxAge: 0 });
  response.cookies.set(REFRESH_COOKIE, "", { ...cookieBase, maxAge: 0 });
  response.cookies.set(SUPPORT_COOKIE, "", { ...cookieBase, httpOnly: false, maxAge: 0 });
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code") ?? "";
  if (code.length < 20 || code.length > 200) return ended(request, "link");

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const userAgent = request.headers.get("user-agent");
  if (userAgent) headers["User-Agent"] = userAgent;
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) headers["X-Forwarded-For"] = forwarded;

  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL}/api/v1/auth/support-session`, {
      method: "POST",
      headers,
      body: JSON.stringify({ code }),
      cache: "no-store",
    });
  } catch {
    return ended(request, "unreachable");
  }
  if (!upstream.ok) return ended(request, "link");
  const data = (await upstream.json().catch(() => null)) as {
    access_token?: unknown;
    expires_at?: unknown;
  } | null;
  if (typeof data?.access_token !== "string" || typeof data.expires_at !== "string") {
    return ended(request, "link");
  }
  const maxAge = secondsLeft(data.expires_at);
  if (maxAge <= 0) return ended(request, "expired");

  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set(SESSION_COOKIE, data.access_token, { ...cookieBase, maxAge });
  response.cookies.set(REFRESH_COOKIE, "", { ...cookieBase, maxAge: 0 });
  response.cookies.set(SUPPORT_COOKIE, markerValue(data.expires_at), {
    ...cookieBase,
    httpOnly: false,
    maxAge,
  });
  return response;
}

export async function DELETE(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    try {
      await fetch(`${API_URL}/api/v1/auth/support-session`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
    } catch {
      // The session still ends on its own at its end time; the cookies go regardless.
    }
  }
  const response = NextResponse.json({ ok: true });
  clearAll(response);
  return response;
}
