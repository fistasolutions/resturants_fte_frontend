/** Where a send flow's recipient is configured, and how to deep-link there
 * (SPEC-234). Every recipient lives on the Manager Notifications tab of
 * Settings: one row per location, then the store-level warehouse / support /
 * returns contacts. The compose panels build a link that lands on that tab,
 * highlights the exact field, and carries the page to come back to. */

export type RecipientSetting =
  | { kind: "location"; locationId: number | null }
  | { kind: "warehouse" }
  | { kind: "support" }
  | { kind: "returns" };

export type StoreContactKind = Exclude<RecipientSetting["kind"], "location">;

export const MANAGER_NOTIFICATIONS_PATH = "/settings/manager-notifications";

const STORE_CONTACTS: ReadonlySet<string> = new Set(["warehouse", "support", "returns"]);
const LOCATION_FOCUS = /^location-(\d{1,15})$/;
const CONTROL_CHARS = /[\x00-\x1f\x7f]/;

/** The `focus` token for a setting — the id of the element to highlight.
 * `null` when the location is unknown (nothing specific to point at). */
export function recipientFocus(setting: RecipientSetting): string | null {
  if (setting.kind !== "location") return setting.kind;
  return setting.locationId === null ? null : `location-${setting.locationId}`;
}

/** Only a same-origin relative path may be a return target: it must start with
 * a single `/` (so `//host` and `https://host` are rejected) and carry no
 * control characters. Anything else is dropped, never "fixed". */
export function parseReturnPath(raw: string | null | undefined): string | null {
  if (!raw || raw.length > 2048) return null;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return null;
  if (CONTROL_CHARS.test(raw)) return null;
  return raw;
}

/** Inverse of `recipientFocus`: the `focus` query value back to a setting. */
export function parseFocus(raw: string | null | undefined): RecipientSetting | null {
  if (!raw) return null;
  if (STORE_CONTACTS.has(raw)) return { kind: raw as StoreContactKind };
  const match = LOCATION_FOCUS.exec(raw);
  if (!match) return null;
  return { kind: "location", locationId: Number(match[1]) };
}

/** The Settings URL for a missing recipient. `returnTo` is the page the owner
 * is leaving (path + query) so a save can bring them straight back. */
export function recipientSettingsHref(
  setting: RecipientSetting,
  returnTo: string | null | undefined,
): string {
  const params = new URLSearchParams();
  const focus = recipientFocus(setting);
  if (focus) params.set("focus", focus);
  const safeReturn = parseReturnPath(returnTo);
  if (safeReturn) params.set("return", safeReturn);
  const query = params.toString();
  return query ? `${MANAGER_NOTIFICATIONS_PATH}?${query}` : MANAGER_NOTIFICATIONS_PATH;
}

/** A page that only knows the order (discount review) learns the location from
 * the draft it loads (`location_id`, backend SPEC-242). Non-location settings
 * and settings that already carry an id are returned unchanged. */
export function withLocationId(
  setting: RecipientSetting,
  locationId: number | null | undefined,
): RecipientSetting {
  if (setting.kind !== "location" || setting.locationId !== null) return setting;
  return typeof locationId === "number" ? { kind: "location", locationId } : setting;
}

/** Route params arrive as strings; an overdue "unattributed" bucket has no id. */
export function locationSetting(raw: string | number | null | undefined): RecipientSetting {
  if (typeof raw === "number") {
    return { kind: "location", locationId: Number.isFinite(raw) ? raw : null };
  }
  const id = raw && /^\d{1,15}$/.test(raw) ? Number(raw) : null;
  return { kind: "location", locationId: id };
}

/** Plain-language name of the missing contact, for the warning copy. */
export function recipientLabel(setting: RecipientSetting): string {
  switch (setting.kind) {
    case "location":
      return "a manager email for this location";
    case "warehouse":
      return "the warehouse manager's email";
    case "support":
      return "the support lead's email";
    case "returns":
      return "the returns lead's email";
  }
}

/** Label for the "go back" link Settings shows while a return page is set. */
export function returnLabel(returnTo: string): string {
  const path = returnTo.split("?")[0];
  const isMessage = /\/send(-all)?(\/|$)/.test(path) || /\/agents\/\d+\/review$/.test(path);
  return isMessage ? "Back to your message" : "Go back";
}
