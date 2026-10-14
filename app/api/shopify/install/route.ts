/**
 * The App URL's launch from Shopify, forwarded here by the gate (SPEC-344, backend SPEC-352).
 *
 * Shopify's signed query goes to the backend, which answers with Shopify's approval screen for a
 * new shop or `open` for a shop that is already connected (the merchant opened the app from their
 * Shopify admin). It only ever redirects; nothing renders, so OAuth is the first thing a new
 * merchant sees, as Shopify's review requires.
 */
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { ApiError } from "@/lib/api-error";
import { installProblemHref, queryRecord } from "@/lib/shopify-install";
import { startInstall, type InstallStart } from "@/services/shopify-install";

export async function GET(request: NextRequest): Promise<never> {
  let result: InstallStart | null = null;
  let expired = false;
  try {
    result = await startInstall(queryRecord(request.nextUrl.searchParams));
  } catch (error) {
    expired = error instanceof ApiError && /expired/i.test(error.message);
  }
  if (result?.action === "authorize" && result.url) redirect(result.url);
  if (result?.action === "open") redirect("/");
  redirect(installProblemHref(expired ? "expired" : "failed"));
}
