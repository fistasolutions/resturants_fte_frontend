/**
 * Why an integration connect was refused (SPEC-336, backend SPEC-344).
 *
 * The backend binds every Meta, Google and QuickBooks connect to the user, organization and
 * store that started it, and refuses anything else with a code. A callback that fails puts
 * that code — never text — on the page it returns to (`&reason=`), and the page's banner shows
 * the sentence for it. Only a code this module knows is ever rendered, so a URL can never make
 * the page say something we did not write.
 */

export const CONNECT_REASONS = {
  connect_link_invalid: {
    title: "That connection link isn't valid",
    detail: "Nothing was connected. Start the connection again from here.",
  },
  connect_link_expired: {
    title: "That connection link expired",
    detail: "Links last 10 minutes and nothing was connected. Start the connection again from here.",
  },
  connect_started_elsewhere: {
    title: "That connection was started somewhere else",
    detail:
      "It was started from a different account or workspace, so nothing was connected here. Start it again from this page.",
  },
} as const;

export type ConnectReasonCode = keyof typeof CONNECT_REASONS;

export interface ConnectReason {
  title: string;
  detail: string;
}

export function isConnectReason(value: unknown): value is ConnectReasonCode {
  return typeof value === "string" && Object.hasOwn(CONNECT_REASONS, value);
}

/** The known refusal code an action error carries, or null (any other failure). */
export function connectReasonCode(error: unknown): ConnectReasonCode | null {
  if (typeof error !== "object" || error === null || !("code" in error)) return null;
  const code = (error as { code: unknown }).code;
  return isConnectReason(code) ? code : null;
}

/** The sentence for a `reason` read from the URL — null for anything we did not write. */
export function connectReason(code: string | null | undefined): ConnectReason | null {
  return isConnectReason(code) ? CONNECT_REASONS[code] : null;
}

/** `href` with `reason=<code>` added; unchanged when there is no known code. */
export function withReason(href: string, code: ConnectReasonCode | null): string {
  if (!code) return href;
  return `${href}${href.includes("?") ? "&" : "?"}reason=${code}`;
}
