/**
 * Install from Shopify (SPEC-344, backend SPEC-352) — the pure half.
 *
 * A merchant who clicks Install in Shopify lands on our App URL with Shopify's signed launch
 * query. The gate forwards it to `INSTALL_START_PATH`; Shopify's approval comes back to the
 * install callback, which keeps the one-time claim in an httpOnly cookie until the merchant has
 * an account and a company to attach the store to.
 */

/** Where the gate forwards a launch (a Route Handler — the gate never runs under `/api/`). */
export const INSTALL_START_PATH = "/api/shopify/install";
/** The open page that explains a failed install. */
export const INSTALL_PROBLEM_PATH = "/shopify-install";
/** httpOnly: `{claim, shop}` from an approved install, waiting for its owner. */
export const INSTALL_COOKIE = "ftes_shopify_install";
/** As long as the backend keeps the install (SPEC-352 `CLAIM_TTL`). */
export const INSTALL_COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

const SHOP = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/;
const CLAIM = /^[A-Za-z0-9_-]{20,128}$/;

/**
 * Shopify's launch: its signed `shop` + `hmac` + `timestamp`. A return from Shopify's approval
 * screen carries those too, plus `code` and `state` — that is an OAuth callback, not a launch.
 */
export function isShopifyLaunch(params: URLSearchParams): boolean {
  return (
    Boolean(params.get("shop")) &&
    Boolean(params.get("hmac")) &&
    Boolean(params.get("timestamp")) &&
    !params.has("code") &&
    !params.has("state")
  );
}

/** The query as the backend reads it: every parameter once, exactly as Shopify signed it. */
export function queryRecord(params: URLSearchParams): Record<string, string> {
  const record: Record<string, string> = {};
  for (const [key, value] of params) {
    if (!(key in record)) record[key] = value;
  }
  return record;
}

export interface InstallClaim {
  claim: string;
  shop: string;
}

export function serializeInstallCookie(value: InstallClaim): string {
  return JSON.stringify({ claim: value.claim, shop: value.shop });
}

/** The cookie's claim, or null for anything missing, malformed or tampered with. */
export function readInstallCookie(value: string | undefined | null): InstallClaim | null {
  if (!value) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const { claim, shop } = parsed as Record<string, unknown>;
  if (typeof claim !== "string" || !CLAIM.test(claim)) return null;
  if (typeof shop !== "string" || !SHOP.test(shop)) return null;
  return { claim, shop };
}

export type InstallProblem = "cancelled" | "expired" | "failed";

const PROBLEMS: Record<InstallProblem, { title: string; body: string }> = {
  cancelled: {
    title: "Installation cancelled",
    body: "Nothing was installed. When you're ready, install the app again from Shopify.",
  },
  expired: {
    title: "That link has expired",
    body: "Shopify's link is only valid for a short time. Open the app from Shopify again.",
  },
  failed: {
    title: "We couldn't finish installing",
    body: "Shopify didn't confirm the installation. Install the app again from Shopify.",
  },
};

export function installProblem(reason: string | null | undefined): InstallProblem {
  return reason === "cancelled" || reason === "expired" ? reason : "failed";
}

export function installProblemText(reason: string | null | undefined): {
  title: string;
  body: string;
} {
  return PROBLEMS[installProblem(reason)];
}

/** The page that explains a failed install. */
export function installProblemHref(reason: InstallProblem): string {
  return `${INSTALL_PROBLEM_PATH}?reason=${reason}`;
}
