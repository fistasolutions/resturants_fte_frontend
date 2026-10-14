/**
 * Server-side API proxy (SPEC-017): the browser's only path to the backend.
 * Injects the httpOnly access token as a bearer header and streams responses
 * through untouched (chat SSE included). Never exposes API_URL to the client.
 *
 * Silent refresh (SPEC-149): if the backend returns 401 and a refresh cookie is
 * present, mint a fresh access token, retry the request once, and set the
 * rotated cookies on the response — so long-lived single-page sessions (e.g.
 * chat) survive the 30-min access-token boundary without a logout.
 */
import { NextResponse, type NextRequest } from "next/server";

import { refreshTokens } from "@/lib/refresh";
import {
  ACCESS_MAX_AGE_SECONDS,
  cookieBase,
  REFRESH_COOKIE,
  REFRESH_MAX_AGE_SECONDS,
  SESSION_COOKIE,
} from "@/lib/session";

const API_URL = process.env.API_URL ?? "http://localhost:8000";

function backendUnreachable() {
  return NextResponse.json(
    { error: { code: "backend_unreachable", message: "The API is not reachable." } },
    { status: 502 },
  );
}

/** The browser went away mid-request — a navigation, a cleared poll interval, a closed
 * tab. NOT a backend failure, and reporting it as one is actively misleading: it made a
 * routine navigation log "The API is not reachable." */
function isClientAbort(cause: unknown, request: NextRequest): boolean {
  if (request.signal.aborted) return true;
  return cause instanceof Error && cause.name === "AbortError";
}

/** 499, nginx's "client closed request". Nobody is left to read this response — it
 * exists so the route returns rather than throwing, which is what produced the
 * `ECONNRESET` noise in the server log. */
function clientGone(): NextResponse {
  return new NextResponse(null, { status: 499 });
}

async function forward(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const target = `${API_URL}/api/v1/${path.join("/")}${request.nextUrl.search}`;
  const accessToken = request.cookies.get(SESSION_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  const accept = request.headers.get("accept") ?? "application/json";
  const contentType = request.headers.get("content-type");
  // A <video>/<audio> element asks for byte ranges, not a whole file (SPEC-174).
  // Dropping this header turns every media request into a full download —
  // no scrubbing, and Safari refuses to play the source at all.
  const range = request.headers.get("range");
  const method = request.method;
  // Buffer the request body once so a 401 retry can replay it. Response bodies
  // are still streamed straight through (chat SSE unaffected).
  const body =
    method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer();

  const call = (token: string | undefined) => {
    const headers = new Headers();
    headers.set("Accept", accept);
    if (contentType) headers.set("Content-Type", contentType);
    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (range) headers.set("Range", range);
    // Forward the client's abort signal: when the browser navigates away mid-request
    // the upstream call is cancelled too, instead of being left to complete against a
    // reader that has gone.
    return fetch(target, {
      method,
      headers,
      body,
      cache: "no-store",
      signal: request.signal,
    });
  };

  let upstream: Response;
  try {
    upstream = await call(accessToken);
  } catch (cause) {
    if (isClientAbort(cause, request)) return clientGone();
    return backendUnreachable();
  }

  let refreshed: Awaited<ReturnType<typeof refreshTokens>> = null;
  if (upstream.status === 401 && refreshToken) {
    refreshed = await refreshTokens(refreshToken);
    if (refreshed) {
      try {
        upstream = await call(refreshed.accessToken);
      } catch (cause) {
        if (isClientAbort(cause, request)) return clientGone();
        return backendUnreachable();
      }
    }
  }

  const responseHeaders = new Headers();
  // `accept-ranges`/`content-range` belong to the media path; no JSON endpoint
  // sets them, so copying them through is additive.
  // `content-disposition` keeps a download's file name (SPEC-332: the organization export).
  for (const name of [
    "content-type",
    "cache-control",
    "accept-ranges",
    "content-range",
    "content-disposition",
  ]) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }
  const response = new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
  if (refreshed) {
    response.cookies.set(SESSION_COOKIE, refreshed.accessToken, {
      ...cookieBase,
      maxAge: ACCESS_MAX_AGE_SECONDS,
    });
    response.cookies.set(REFRESH_COOKIE, refreshed.refreshToken, {
      ...cookieBase,
      maxAge: REFRESH_MAX_AGE_SECONDS,
    });
  }
  return response;
}

// Next.js only routes verbs that are exported — a missing export means the
// proxy itself 405s and the request never reaches the backend.
export {
  forward as GET,
  forward as POST,
  forward as PUT,
  forward as PATCH,
  forward as DELETE,
};
