/**
 * Connect with Klaviyo — the rules of the OAuth round trip (SPEC-371 over backend SPEC-379).
 *
 * Pure, so Vitest covers every rule that can be wrong: where the callback may send the owner
 * back to, what it says when it gets there, and what each granted scope means in words. The
 * callback route (`app/api/integrations/klaviyo/callback/route.ts`) and the two connect
 * surfaces (the Integrations Klaviyo page and Email Marketing → Settings → Connection) only
 * draw what these return.
 */
import type { HubOAuth } from "@/types/integrations";

/** The cookie that tells the Klaviyo callback which page the connect started on. */
export const KLAVIYO_RETURN_COOKIE = "klaviyo_return";

/** The Integrations hub — the fallback, and where the Integrations page's button returns to. */
export const KLAVIYO_INTEGRATIONS_RETURN = "/integrations";
/** Email Marketing → Settings, where the Connection card shows the result. */
export const KLAVIYO_EMAIL_RETURN = "/email-marketing?tab=settings";
/** Klaviyo's own page in the hub, Settings tab — where a result on the hub is forwarded. */
export const KLAVIYO_INTEGRATION_PAGE = "/integrations/klaviyo?tab=settings";

export type KlaviyoReturnPath = typeof KLAVIYO_INTEGRATIONS_RETURN | typeof KLAVIYO_EMAIL_RETURN;

const RETURN_PATHS: ReadonlySet<string> = new Set([KLAVIYO_INTEGRATIONS_RETURN, KLAVIYO_EMAIL_RETURN]);

/** The query keys the callback answers with. */
export const KLAVIYO_RESULT_PARAM = "klaviyo";
export const KLAVIYO_ERROR_PARAM = "klaviyo_error";

/** Said when nothing more specific is known. Never Klaviyo's own words. */
export const KLAVIYO_GENERIC_ERROR = "Klaviyo could not complete that connection. Try connecting again.";

/** The longest sentence a result line shows — the text arrives in a URL anyone can craft. */
const MAX_MESSAGE = 300;

function decode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Where the callback may send the owner: the Integrations hub or Email Marketing's Settings,
 * and nothing else. The cookie is readable by page script, so it is never trusted as a URL:
 * anything unknown falls back to the hub.
 */
export function klaviyoReturnPath(value: string | null | undefined): KlaviyoReturnPath {
  if (!value) return KLAVIYO_INTEGRATIONS_RETURN;
  const path = decode(value);
  return RETURN_PATHS.has(path) ? (path as KlaviyoReturnPath) : KLAVIYO_INTEGRATIONS_RETURN;
}

/** The `document.cookie` string that remembers (or, with null, forgets) the start page. */
export function klaviyoReturnCookie(path: KlaviyoReturnPath | null): string {
  return path
    ? `${KLAVIYO_RETURN_COOKIE}=${encodeURIComponent(path)}; Path=/; Max-Age=900; SameSite=Lax`
    : `${KLAVIYO_RETURN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

/** The return page with the result added to whatever query it already carries. */
export function klaviyoReturnUrl(root: string, result: Record<string, string>): string {
  const [path, existing = ""] = root.split("?", 2);
  const query = new URLSearchParams(existing);
  for (const [key, value] of Object.entries(result)) query.set(key, value);
  const text = query.toString();
  return text ? `${path}?${text}` : path;
}

/** A denied consent is said plainly, with the way back (Klaviyo's review checklist). */
export const KLAVIYO_DENIED_MESSAGE =
  "You didn't allow ftes for Commerce to access Klaviyo, so Klaviyo isn't connected. To connect, click Connect with Klaviyo again and press Allow.";

export type KlaviyoCallbackStep =
  | { kind: "cancelled"; message: string }
  | { kind: "failed"; message: string }
  | { kind: "exchange"; code: string; state: string };

/**
 * What the callback does with Klaviyo's answer. A denied consent (`access_denied`) says what
 * happened and how to connect; any other refusal is one plain sentence; a code and a state go
 * to the backend to be exchanged.
 */
export function klaviyoCallbackStep(query: {
  error: string | null;
  code: string | null;
  state: string | null;
}): KlaviyoCallbackStep {
  if (query.error === "access_denied") return { kind: "cancelled", message: KLAVIYO_DENIED_MESSAGE };
  if (query.error) return { kind: "failed", message: KLAVIYO_GENERIC_ERROR };
  if (!query.code || !query.state) return { kind: "failed", message: KLAVIYO_GENERIC_ERROR };
  return { kind: "exchange", code: query.code, state: query.state };
}

/** The backend's sentence for a failed exchange, cut short; the generic one when it is blank. */
export function klaviyoErrorMessage(message: string | null | undefined): string {
  const text = (message ?? "").trim();
  if (!text) return KLAVIYO_GENERIC_ERROR;
  return text.length > MAX_MESSAGE ? `${text.slice(0, MAX_MESSAGE - 1)}…` : text;
}

export interface KlaviyoNotice {
  tone: "success" | "error";
  text: string;
}

/** The line a connect surface shows after the round trip through Klaviyo, or null. */
export function klaviyoNotice(params: URLSearchParams): KlaviyoNotice | null {
  const error = params.get(KLAVIYO_ERROR_PARAM);
  if (error !== null) return { tone: "error", text: klaviyoErrorMessage(error) };
  if (params.get(KLAVIYO_RESULT_PARAM) === "connected") {
    return { tone: "success", text: "Connected with Klaviyo. Campaigns, flows, lists and profiles are being read now." };
  }
  return null;
}

/**
 * A Klaviyo result that landed on the hub belongs to Klaviyo's own page, where its card says
 * how it went: the hub forwards it there with the result intact. Null when there is none.
 */
export function klaviyoHubForward(params: URLSearchParams): string | null {
  const result: Record<string, string> = {};
  const error = params.get(KLAVIYO_ERROR_PARAM);
  const connected = params.get(KLAVIYO_RESULT_PARAM);
  if (error !== null) result[KLAVIYO_ERROR_PARAM] = error;
  else if (connected === "connected") result[KLAVIYO_RESULT_PARAM] = connected;
  else return null;
  return klaviyoReturnUrl(KLAVIYO_INTEGRATION_PAGE, result);
}

/** A card's OAuth facts (Klaviyo, Gorgias) from the hub payload; undefined from an older backend. */
export function toHubOAuth(api: unknown): HubOAuth | undefined {
  if (!api || typeof api !== "object") return undefined;
  const raw = api as Record<string, unknown>;
  return {
    available: raw.available === true,
    connected: raw.connected === true,
    scopes: Array.isArray(raw.scopes) ? raw.scopes.filter((s): s is string => typeof s === "string") : [],
    ...(raw.needs_reconnecting === true ? { needsReconnecting: true } : {}),
  };
}

/** `?connect=klaviyo`: the install link Klaviyo's listing opens (SPEC-371 amendment). */
export const KLAVIYO_CONNECT_PARAM = "connect";
export const KLAVIYO_CONNECT_VALUE = "klaviyo";

export type KlaviyoAutoStart = "start" | "connected" | "not_allowed" | "unavailable" | "wait";

/**
 * What the Klaviyo page does with an install link. `null` when the address carries none;
 * `wait` while the connection or the member's access is still loading.
 */
export function klaviyoAutoStart(
  params: URLSearchParams,
  oauth: HubOAuth | null | undefined,
  access: { known: boolean; allowed: boolean },
): KlaviyoAutoStart | null {
  if (params.get(KLAVIYO_CONNECT_PARAM) !== KLAVIYO_CONNECT_VALUE) return null;
  if (oauth === undefined || !access.known) return "wait";
  if (oauth === null || (!oauth.available && !oauth.connected)) return "unavailable";
  if (oauth.connected) return "connected";
  return access.allowed ? "start" : "not_allowed";
}

/** The address without the install link, so a refresh or Back never starts it twice. */
export function withoutConnectParam(pathname: string, params: URLSearchParams): string {
  const next = new URLSearchParams(params);
  next.delete(KLAVIYO_CONNECT_PARAM);
  const query = next.toString();
  return query ? `${pathname}?${query}` : pathname;
}

/** Whether the button may be offered: the platform has the Klaviyo app set up here. */
export function canConnectWithKlaviyo(oauth: HubOAuth | null | undefined): boolean {
  return oauth?.available === true && oauth.connected !== true;
}

/** What each Klaviyo resource lets the employee do, read-only and with write access. */
const SCOPE_WORDS: { resource: string; read: string; write: string | null }[] = [
  { resource: "accounts", read: "See the account's name and settings", write: null },
  { resource: "campaigns", read: "Read campaigns and their results", write: "Create, schedule and cancel campaigns" },
  { resource: "flows", read: "Read flows and their results", write: "Build flows and turn them on or off" },
  { resource: "lists", read: "Read lists", write: "Create lists and keep their members in step" },
  { resource: "segments", read: "Read segments", write: "Create and update segments" },
  { resource: "profiles", read: "Read profiles and their consent", write: "Update profiles, such as a customer's pick" },
  { resource: "metrics", read: "Read metrics and reports", write: null },
  { resource: "templates", read: "Read email templates", write: "Create email templates" },
  { resource: "subscriptions", read: "Read subscriptions", write: "Subscribe your own seed addresses for test sends" },
];

/**
 * The granted scopes in words, in a fixed reading order, one line per resource: write access
 * says what it adds (it includes reading); a scope this build does not know is shown as it is.
 */
export function klaviyoScopeLabels(scopes: readonly string[]): string[] {
  const granted = new Set(scopes.map((s) => s.trim()).filter(Boolean));
  const known = new Set<string>();
  const lines: string[] = [];
  for (const row of SCOPE_WORDS) {
    const read = `${row.resource}:read`;
    const write = `${row.resource}:write`;
    known.add(read);
    known.add(write);
    const canRead = granted.has(read);
    const canWrite = granted.has(write);
    if (canWrite && row.write) lines.push(canRead ? `${row.read}; ${lowerFirst(row.write)}` : row.write);
    else if (canRead || canWrite) lines.push(row.read);
  }
  for (const scope of [...granted].sort()) if (!known.has(scope)) lines.push(scope);
  return lines;
}

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}
