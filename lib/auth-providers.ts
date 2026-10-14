/**
 * Which "Continue with …" buttons the sign-in screens offer (SPEC-340, patched 2026-10-06).
 *
 * Google is offered unless `NEXT_PUBLIC_GOOGLE_SIGN_IN=false`; Shopify is hidden unless
 * `NEXT_PUBLIC_SHOPIFY_SIGN_IN=true`. Both buttons, their callbacks and the backend routes
 * always exist — a variable and a redeploy switch each one.
 */

export type SignInProviders = { google: boolean; shopify: boolean; any: boolean };

export function signInProviders(
  google: string | undefined,
  shopify: string | undefined,
): SignInProviders {
  const on = { google: google !== "false", shopify: shopify === "true" };
  return { ...on, any: on.google || on.shopify };
}

export const SIGN_IN_PROVIDERS = signInProviders(
  process.env.NEXT_PUBLIC_GOOGLE_SIGN_IN,
  process.env.NEXT_PUBLIC_SHOPIFY_SIGN_IN,
);
