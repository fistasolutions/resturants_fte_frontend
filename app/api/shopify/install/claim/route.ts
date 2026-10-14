/**
 * Finish connecting a store approved in Shopify (SPEC-344): the claim from the httpOnly cookie,
 * with the signed-in session, to the backend. The cookie is dropped once the claim is used or
 * refused for good; a temporary failure keeps it so the owner can try again.
 */
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ApiError } from "@/lib/api-error";
import { SESSION_COOKIE } from "@/lib/session";
import { INSTALL_COOKIE, readInstallCookie } from "@/lib/shopify-install";
import { claimInstall } from "@/services/shopify-install";

export async function POST(): Promise<NextResponse> {
  const jar = await cookies();
  const session = jar.get(SESSION_COOKIE)?.value;
  if (!session) {
    return NextResponse.json(
      { ok: false, message: "Sign in to finish connecting." },
      { status: 401 },
    );
  }
  const pending = readInstallCookie(jar.get(INSTALL_COOKIE)?.value);
  if (!pending) {
    return NextResponse.json(
      { ok: false, message: "That Shopify install has expired. Install the app again." },
      { status: 410 },
    );
  }
  try {
    await claimInstall(pending.claim, session);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 502;
    // Refused for good (expired, used, owned elsewhere): the cookie can never work again.
    if (status === 409 || status === 410) jar.delete(INSTALL_COOKIE);
    const message =
      error instanceof ApiError ? error.message : "Could not reach the server. Try again.";
    return NextResponse.json({ ok: false, message }, { status });
  }
  jar.delete(INSTALL_COOKIE);
  return NextResponse.json({ ok: true });
}
