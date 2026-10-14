/**
 * The pricing page and the plan's journey through sign-up (SPEC-320) — pure. The plans
 * themselves come from the backend (`GET /plans`); this is only the route logic and the copy
 * that describes what every plan includes (each line true of the product today).
 */

/** Remembers the chosen plan across a Google/Shopify round trip, which drops the URL. */
export const PLAN_COOKIE = "fte_plan";
export const PLAN_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

/** A plan key as the backend writes them (`up_to_3m`, `3m_to_30m`, `over_30m`), or null. */
export function validPlanKey(value: string | null | undefined): string | null {
  const key = (value ?? "").trim().toLowerCase();
  return /^[a-z0-9_]{1,32}$/.test(key) ? key : null;
}

/** Where "Choose this plan" goes: sign-up for a visitor, onboarding for someone signed in. */
export function choosePlanHref(key: string, signedIn: boolean): string {
  const plan = encodeURIComponent(key);
  return signedIn ? `/onboarding?plan=${plan}` : `/signup?plan=${plan}`;
}

export function onboardingPath(plan: string | null | undefined): string {
  const key = validPlanKey(plan);
  return key ? `/onboarding?plan=${encodeURIComponent(key)}` : "/onboarding";
}

/** The plan to preselect: the URL's over the remembered one, and only a plan that exists. */
export function pickPlan(
  fromUrl: string | null | undefined,
  fromCookie: string | null | undefined,
  keys: readonly string[],
): string | null {
  for (const candidate of [fromUrl, fromCookie]) {
    const key = validPlanKey(candidate);
    if (key && keys.includes(key)) return key;
  }
  return null;
}

export interface Included {
  title: string;
  body: string;
}

/** What every plan includes — no plan gates a feature. */
export const INCLUDED: readonly Included[] = [
  {
    title: "Every app, one login",
    body: "Shopify, Klaviyo, Gorgias, Loop Returns, iPacky, V-Count, QuickBooks, Search Console, Meta and Clarity — side by side, synced every 15 minutes.",
  },
  {
    title: "Glisp, your AI analyst",
    body: "Type or talk. Every answer shows the number, the reason and where it came from.",
  },
  {
    title: "The AI employees",
    body: "Search Visibility, Social Media Manager, Report Builder and Accounts Payable, with Paid Ads Manager in early access. Nothing is sent without your approval.",
  },
  {
    title: "Your whole team",
    body: "Invite people, give each a role, or build your own roles from the permission list.",
  },
  {
    title: "Your brand",
    body: "Your logo in the app and your own picture, video or carousel on your team's login screen.",
  },
  {
    title: "AI included",
    body: "Each plan includes AI every month. Add your own AI provider keys any time and they are used instead.",
  },
];

export const HOW_IT_STARTS: readonly Included[] = [
  { title: "Choose your plan", body: "By your store's annual revenue." },
  { title: "Create your account", body: "Email, Google or Shopify — then name your company." },
  { title: "Connect Shopify", body: "Your last 30 days sync in minutes, and every page opens as its data lands." },
];

/** The steps as the payment mode in force makes them true (SPEC-321). */
export function howItStarts(stripe: boolean): readonly Included[] {
  if (!stripe) return HOW_IT_STARTS;
  return [
    HOW_IT_STARTS[0],
    { title: "Create your account and pay", body: "Email, Google or Shopify, then secure checkout by Stripe." },
    HOW_IT_STARTS[2],
  ];
}

/** The chips under the headline — "no card" only while payment is a preview. */
export function pricingChips(stripe: boolean): readonly string[] {
  return [
    "Billed monthly",
    stripe ? "Secure checkout by Stripe" : "No card needed to start",
    "Every feature in every plan",
  ];
}

/** What every plan gets — one line each, true of the product today (SPEC-326; shared by the
 * pricing card and the onboarding Plan step since SPEC-351). */
export const YOU_GET: readonly string[] = [
  "Every app in one place, synced every 15 minutes",
  "Glisp, your AI analyst — every number shows its source",
  "The AI employees: Search Visibility, Social Media Manager, Report Builder, Accounts Payable",
  "Your whole team, with roles",
  "Your brand on the app and the login screen",
];

/** The AI a plan includes, said without a dollar figure (SPEC-351): the allowance is what the
 * employees run on, not a second price list. */
export const AI_INCLUDED = "Glisp and every AI employee, with a monthly AI allowance included";
