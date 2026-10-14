import { destinationAfterSignIn } from "@/lib/auth-flows";
import type { SignedIn } from "@/services/auth";

/** Hard REPLACE navigation once signed in: drops the auth screen from history (Back
 * cannot resurrect it over a live session) and runs the proxy gate with the fresh
 * cookies (SPEC-017 Patches). A user with no organization yet goes to onboarding. */
export function goAfterSignIn(result: SignedIn, next?: string | null): void {
  // SPEC-320: the plan chosen on /pricing is in this page's URL (sign-up, verify).
  const plan = new URLSearchParams(window.location.search).get("plan");
  window.location.replace(
    destinationAfterSignIn(result.hasOrganization, result.redirect ?? next, plan),
  );
}
