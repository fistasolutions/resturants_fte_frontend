/**
 * Where Shopify returns a merchant who approved the install (SPEC-344) — the redirect URI on the
 * public app, byte for byte.
 *
 * The code is exchanged server-side; the backend keeps the store's token as a pending install
 * and hands back a one-time claim. Signed in, the claim is used at once. Otherwise — or when it
 * cannot be used yet (no company, or a store already) — it waits in an httpOnly cookie and the
 * merchant continues to sign-up; onboarding offers to finish connecting. No token, claim or code
 * ever reaches page script.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { SESSION_COOKIE, cookieBase } from "@/lib/session";
import {
  INSTALL_COOKIE,
  INSTALL_COOKIE_MAX_AGE,
  installProblemHref,
  queryRecord,
  serializeInstallCookie,
} from "@/lib/shopify-install";
import { claimInstall, completeInstall, type InstallComplete } from "@/services/shopify-install";

export async function GET(request: NextRequest): Promise<never> {
  const params = request.nextUrl.searchParams;
  // The merchant pressed Cancel on Shopify's screen.
  if (params.get("error") || !params.get("code")) redirect(installProblemHref("cancelled"));

  let pending: InstallComplete | null = null;
  try {
    pending = await completeInstall(queryRecord(params));
  } catch {
    pending = null;
  }
  if (!pending) redirect(installProblemHref("failed"));

  const jar = await cookies();
  const session = jar.get(SESSION_COOKIE)?.value;
  let claimed = false;
  if (session) {
    try {
      await claimInstall(pending.claim, session);
      claimed = true;
    } catch {
      claimed = false; // kept for onboarding below
    }
  }
  if (claimed) {
    jar.delete(INSTALL_COOKIE);
    redirect("/");
  }
  jar.set(
    INSTALL_COOKIE,
    serializeInstallCookie({ claim: pending.claim, shop: pending.shop_domain }),
    {
      ...cookieBase,
      maxAge: INSTALL_COOKIE_MAX_AGE,
    },
  );
  redirect(session ? "/onboarding" : "/signup");
}
