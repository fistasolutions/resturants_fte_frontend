import { NextResponse, type NextRequest } from "next/server";

import { LOGIN_ORG_HEADER, needsOnboarding, ONBOARDING_PATH, ORG_COOKIE, validSlug } from "@/lib/auth-flows";
import { PLAN_COOKIE, PLAN_COOKIE_MAX_AGE, validPlanKey } from "@/lib/pricing";
import { refreshTokens } from "@/lib/refresh";
import { INSTALL_PROBLEM_PATH, INSTALL_START_PATH, isShopifyLaunch } from "@/lib/shopify-install";
import {
  ACCESS_MAX_AGE_SECONDS,
  cookieBase,
  REFRESH_COOKIE,
  REFRESH_MAX_AGE_SECONDS,
  SESSION_COOKIE,
} from "@/lib/session";
import { SUPPORT_COOKIE, SUPPORT_ENDED_PATH } from "@/lib/support-session";

// Screens for someone NOT signed in — a signed-in visit goes to the app (SPEC-312).
const AUTH_ROUTES = ["/login", "/signup", "/verify", "/forgot", "/reset"];
// Screens reachable signed in or not: an invitation (accept it while signed in) and the
// Google/Shopify return pages (a provider may send back a browser that holds a session).
// SPEC-332: `/restore` — the link in a deletion email, opened by an owner who cannot sign in
// (the organization is locked) or by one who still holds a session.
// SPEC-344: the page that explains a failed install from Shopify.
// SPEC-363: where a support session's tab lands when it ends.
const OPEN_ROUTES = [
  "/invite",
  "/auth",
  "/pricing",
  "/restore",
  INSTALL_PROBLEM_PATH,
  SUPPORT_ENDED_PATH,
  // SPEC-379: a restaurant brand's online ordering and its guests' order tracker.
  "/order",
  "/track",
  // SPEC-384: a driver's app — its link's token is the key.
  "/driver",
  // SPEC-386: a restaurant brand's local pages and their sitemap.
  "/r",
];

// SPEC-215: the share card must be reachable WITHOUT a session. Slack, WhatsApp
// and LinkedIn fetch `og:image` as anonymous crawlers — behind the gate they get
// a 307 to /login and render the flat row the image exists to replace. It carries
// no store data, only the wordmark and the product line.
const PUBLIC_ASSETS = ["/opengraph-image", "/twitter-image", "/icon", "/apple-icon"];

export async function proxy(request: NextRequest) {
  const response = await gate(request);
  // SPEC-320: a plan chosen on /pricing is remembered for the Google/Shopify round trip, which
  // returns without the URL. Not a secret — readable by the plan step, which clears it.
  const plan = validPlanKey(request.nextUrl.searchParams.get("plan"));
  if (plan) {
    response.cookies.set(PLAN_COOKIE, plan, {
      path: "/",
      sameSite: "lax",
      secure: cookieBase.secure,
      maxAge: PLAN_COOKIE_MAX_AGE,
    });
  }
  return response;
}

async function gate(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  // API routes are exempt: /api/session must be reachable to log in, and
  // /api/proxy requests carry their own auth + refresh (see its route handler).
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }
  // SPEC-344: a merchant who clicked Install in Shopify lands on the App URL with Shopify's
  // signed launch query. OAuth comes first (Shopify's review), so before any sign-in screen the
  // whole query goes to the install route, which sends them to Shopify's approval screen.
  if (isShopifyLaunch(request.nextUrl.searchParams)) {
    return NextResponse.redirect(
      new URL(`${INSTALL_START_PATH}${request.nextUrl.search}`, request.url),
    );
  }
  if (PUBLIC_ASSETS.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }
  if (OPEN_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return NextResponse.next();
  }
  const isAuthRoute = AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  // `/login?org=<slug>`: this organization's login screen, for this visit only (SPEC-339) — never
  // remembered, so the next person on this browser sees the platform's own screen. A copy of the
  // header sent by the client is dropped first.
  request.headers.delete(LOGIN_ORG_HEADER);
  const orgSlug = isAuthRoute ? validSlug(request.nextUrl.searchParams.get("org")) : null;
  if (orgSlug) request.headers.set(LOGIN_ORG_HEADER, orgSlug);

  let hasSession = request.cookies.has(SESSION_COOKIE);

  // Silent refresh (SPEC-149): the 30-min access cookie has expired but the
  // 7-day refresh cookie is still here — mint a fresh pair instead of bouncing
  // the user to /login mid-work.
  let refreshed: Awaited<ReturnType<typeof refreshTokens>> = null;
  if (!hasSession) {
    const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
    if (refreshToken) {
      refreshed = await refreshTokens(refreshToken);
      if (refreshed) {
        // Make the new access token visible to this request's Server Components
        // (they read it via `cookies()` from the forwarded request headers).
        request.cookies.set(SESSION_COOKIE, refreshed.accessToken);
        hasSession = true;
      }
    }
  }

  // SPEC-363: a support session's tab whose time ran out goes to its own ended page — never
  // to a login screen that would invite the operator to sign in as someone.
  if (!hasSession && request.cookies.has(SUPPORT_COOKIE)) {
    const response = NextResponse.redirect(new URL(SUPPORT_ENDED_PATH, request.url));
    response.cookies.set(SUPPORT_COOKIE, "", { ...cookieBase, httpOnly: false, maxAge: 0 });
    return response;
  }

  if (!hasSession && !isAuthRoute) {
    // Come back to the page that was asked for once signed in (`safeNext` checks it).
    const login = new URL("/login", request.url);
    if (pathname !== "/") login.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    const response = NextResponse.redirect(login);
    // Clear the stale refresh cookie so we don't loop trying to refresh it.
    if (request.cookies.has(REFRESH_COOKIE)) {
      response.cookies.set(REFRESH_COOKIE, "", { ...cookieBase, maxAge: 0 });
    }
    return response;
  }
  // SPEC-227: the app layout bounces here when the backend REJECTS the token in a
  // cookie that is still present (secret rotated, token revoked, clock skew).
  // Without this the rule below sees `hasSession` and sends the user straight back
  // into the app, which 401s and bounces again — an infinite redirect. A Server
  // Component cannot clear a cookie during render, so the layout signals here and
  // the gate does it: drop both cookies and let the login page render.
  if (isAuthRoute && request.nextUrl.searchParams.get("session") === "expired") {
    const response = NextResponse.next({ request: { headers: request.headers } });
    response.cookies.set(SESSION_COOKIE, "", { ...cookieBase, maxAge: 0 });
    response.cookies.set(REFRESH_COOKIE, "", { ...cookieBase, maxAge: 0 });
    return response;
  }

  if (hasSession && isAuthRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // SPEC-313: signed in but in no organization yet — the app has nothing to show until
  // the company exists, so every page leads to onboarding.
  const accessToken = refreshed?.accessToken ?? request.cookies.get(SESSION_COOKIE)?.value;
  if (needsOnboarding(accessToken, pathname)) {
    const toOnboarding = NextResponse.redirect(new URL(ONBOARDING_PATH, request.url));
    if (refreshed) {
      toOnboarding.cookies.set(SESSION_COOKIE, refreshed.accessToken, {
        ...cookieBase,
        maxAge: ACCESS_MAX_AGE_SECONDS,
      });
      toOnboarding.cookies.set(REFRESH_COOKIE, refreshed.refreshToken, {
        ...cookieBase,
        maxAge: REFRESH_MAX_AGE_SECONDS,
      });
    }
    return toOnboarding;
  }

  const response = NextResponse.next({
    request: { headers: request.headers },
  });
  // SPEC-339: expire the cookie that used to remember the last organization's login screen.
  if (request.cookies.has(ORG_COOKIE)) {
    response.cookies.set(ORG_COOKIE, "", { ...cookieBase, maxAge: 0 });
  }
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

export const config = {
  // Gate everything except Next internals and static assets (images + media).
  matcher: [
    // `api/` is excluded (SPEC-317): the gate returns early there anyway, and Next buffers a
    // gated request's body only up to 10 MB — a 25 MB login video would arrive cut.
    "/((?!api/|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|webm)$).*)",
  ],
};
