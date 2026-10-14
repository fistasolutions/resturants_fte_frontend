/**
 * Connect with Gorgias — the rules of the OAuth round trip (SPEC-372 over backend SPEC-380).
 *
 * Pure, so Vitest covers every rule that can be wrong: the subdomain the sign-in starts on, what
 * the callback says when it comes back, what an install link from Gorgias's App Store does, and
 * what the granted access means in words. The callback route
 * (`app/api/integrations/gorgias/callback/route.ts`) and the connect surfaces only draw what
 * these return.
 */
import type { HubOAuth } from "@/types/integrations";

/** Gorgias's own page in the hub, Settings tab — where every connect result lands. */
export const GORGIAS_INTEGRATION_PAGE = "/integrations/gorgias?tab=settings";

/** The query keys the callback answers with. */
export const GORGIAS_RESULT_PARAM = "gorgias";
export const GORGIAS_ERROR_PARAM = "gorgias_error";

/** Said when nothing more specific is known. Never Gorgias's own words. */
export const GORGIAS_GENERIC_ERROR = "Gorgias could not complete that connection. Try connecting again.";

/** A denied consent is said plainly, with the way back. */
export const GORGIAS_DENIED_MESSAGE =
  "You didn't allow ftes for Commerce to access Gorgias, so Gorgias isn't connected. To connect, click Connect with Gorgias again and press Allow.";

/** The backend's sentences for a missing or wrong subdomain (SPEC-380), said here first. */
export const GORGIAS_NO_SUBDOMAIN = "Enter your Gorgias subdomain — the part before .gorgias.com";
export const GORGIAS_BAD_SUBDOMAIN = "That isn't a Gorgias subdomain — use the part before .gorgias.com, like acme";

/** The longest sentence a result line shows — the text arrives in a URL anyone can craft. */
const MAX_MESSAGE = 300;

const SUBDOMAIN = /^[a-z0-9][a-z0-9-]{0,62}$/;

export type SubdomainCheck = { ok: true; subdomain: string } | { ok: false; message: string };

/**
 * `Acme`, `acme.gorgias.com` or `https://acme.gorgias.com/app` → `acme`, by the backend's own
 * rule, so a typo is caught before the round trip starts.
 */
export function gorgiasSubdomain(raw: string | null | undefined): SubdomainCheck {
  let value = (raw ?? "").trim().toLowerCase();
  if (!value) return { ok: false, message: GORGIAS_NO_SUBDOMAIN };
  value = value.replace(/^[a-z]+:\/\//, "").split("/", 1)[0];
  if (value.endsWith(".gorgias.com")) value = value.slice(0, -".gorgias.com".length);
  return SUBDOMAIN.test(value) ? { ok: true, subdomain: value } : { ok: false, message: GORGIAS_BAD_SUBDOMAIN };
}

/** The return page with the result added. */
export function gorgiasReturnUrl(result: Record<string, string>): string {
  const [path, existing = ""] = GORGIAS_INTEGRATION_PAGE.split("?", 2);
  const query = new URLSearchParams(existing);
  for (const [key, value] of Object.entries(result)) query.set(key, value);
  return `${path}?${query.toString()}`;
}

export type GorgiasCallbackStep =
  | { kind: "cancelled"; message: string }
  | { kind: "failed"; message: string }
  | { kind: "exchange"; code: string; state: string };

/**
 * What the callback does with Gorgias's answer: a denied consent says what happened and how to
 * connect; any other refusal is one plain sentence; a code and a state go to the backend.
 */
export function gorgiasCallbackStep(query: {
  error: string | null;
  code: string | null;
  state: string | null;
}): GorgiasCallbackStep {
  if (query.error === "access_denied") return { kind: "cancelled", message: GORGIAS_DENIED_MESSAGE };
  if (query.error) return { kind: "failed", message: GORGIAS_GENERIC_ERROR };
  if (!query.code || !query.state) return { kind: "failed", message: GORGIAS_GENERIC_ERROR };
  return { kind: "exchange", code: query.code, state: query.state };
}

/** The backend's sentence for a failed exchange, cut short; the generic one when it is blank. */
export function gorgiasErrorMessage(message: string | null | undefined): string {
  const text = (message ?? "").trim();
  if (!text) return GORGIAS_GENERIC_ERROR;
  return text.length > MAX_MESSAGE ? `${text.slice(0, MAX_MESSAGE - 1)}…` : text;
}

export interface GorgiasNotice {
  tone: "success" | "error";
  text: string;
}

/** The line Gorgias's page shows after the round trip, or null. */
export function gorgiasNotice(params: URLSearchParams): GorgiasNotice | null {
  const error = params.get(GORGIAS_ERROR_PARAM);
  if (error !== null) return { tone: "error", text: gorgiasErrorMessage(error) };
  if (params.get(GORGIAS_RESULT_PARAM) === "connected") {
    return {
      tone: "success",
      text: "Connected with Gorgias. Tickets, agents and satisfaction scores start syncing within 15 minutes.",
    };
  }
  return null;
}

/** Whether the button may be offered: the platform has the Gorgias app set up here. */
export function canConnectWithGorgias(oauth: HubOAuth | null | undefined): boolean {
  return oauth?.available === true && oauth.connected !== true;
}

/** `?connect=gorgias&account=<subdomain>`: the App URL Gorgias's listing opens. */
export const GORGIAS_CONNECT_PARAM = "connect";
export const GORGIAS_CONNECT_VALUE = "gorgias";
export const GORGIAS_ACCOUNT_PARAM = "account";

export type GorgiasAutoStart = "start" | "need_subdomain" | "connected" | "not_allowed" | "unavailable" | "wait";

/**
 * What Gorgias's page does with an install link. `null` when the address carries none; `wait`
 * while the connection or the member's access is still loading. `subdomain` is the `account`
 * Gorgias passed, else the one saved on the card.
 */
export function gorgiasAutoStart(
  params: URLSearchParams,
  oauth: HubOAuth | null | undefined,
  access: { known: boolean; allowed: boolean },
  savedSubdomain: string | null | undefined,
): GorgiasAutoStart | null {
  if (params.get(GORGIAS_CONNECT_PARAM) !== GORGIAS_CONNECT_VALUE) return null;
  if (oauth === undefined || !access.known) return "wait";
  if (oauth === null || (!oauth.available && !oauth.connected)) return "unavailable";
  if (oauth.connected && !oauth.needsReconnecting) return "connected";
  if (!access.allowed) return "not_allowed";
  return installSubdomain(params, savedSubdomain) ? "start" : "need_subdomain";
}

/** The subdomain an install link starts on: Gorgias's `account`, else the saved one. */
export function installSubdomain(params: URLSearchParams, savedSubdomain: string | null | undefined): string | null {
  for (const candidate of [params.get(GORGIAS_ACCOUNT_PARAM), savedSubdomain]) {
    const check = gorgiasSubdomain(candidate);
    if (check.ok) return check.subdomain;
  }
  return null;
}

/** The address without the install link, so a refresh or Back never starts it twice. */
export function withoutGorgiasInstall(pathname: string, params: URLSearchParams): string {
  const next = new URLSearchParams(params);
  next.delete(GORGIAS_CONNECT_PARAM);
  next.delete(GORGIAS_ACCOUNT_PARAM);
  const query = next.toString();
  return query ? `${pathname}?${query}` : pathname;
}

/** What each granted Gorgias scope lets the platform do, in a fixed reading order. */
const SCOPE_WORDS: { scope: string; words: string }[] = [
  { scope: "tickets:read", words: "Read tickets and their messages" },
  { scope: "users:read", words: "Read agents and teams" },
  { scope: "satisfaction_survey:read", words: "Read satisfaction scores" },
  { scope: "tickets:write", words: "Reply, add notes and update tickets — only on your approval or chosen autonomy" },
  { scope: "macros:read", words: "Read macros" },
  { scope: "macros:write", words: "Save approved replies as macros" },
  { scope: "rules:read", words: "Read rules, so replies never fight an auto-reply" },
];

/** Gorgias's OpenID basics — needed to sign in, nothing to show. */
const SILENT = new Set(["openid", "email", "profile", "offline"]);

/** The granted scopes in words; a scope this build does not know is shown as it is. */
export function gorgiasScopeLabels(scopes: readonly string[]): string[] {
  const granted = new Set(scopes.map((s) => s.trim()).filter(Boolean));
  const lines = SCOPE_WORDS.filter((row) => granted.has(row.scope)).map((row) => row.words);
  const known = new Set(SCOPE_WORDS.map((row) => row.scope));
  for (const scope of [...granted].sort()) if (!known.has(scope) && !SILENT.has(scope)) lines.push(scope);
  return lines;
}
