/**
 * Settings → Account (SPEC-324 over backend SPEC-331): your sessions and your organization's
 * general settings, as the tabs show them. Pure.
 */

export interface ApiSession {
  id: string;
  device: string;
  browser: string | null;
  os: string | null;
  kind: string;
  created_at: string;
  last_used_at: string | null;
  current: boolean;
}

export type DeviceKind = "desktop" | "mobile" | "tablet";

export interface SessionView {
  id: string;
  device: string;
  kind: DeviceKind;
  signedInAt: string;
  lastActiveAt: string;
  current: boolean;
}

export interface ApiOrganizationSettings {
  calendar_system: string | null;
  name: string;
  slug: string;
}

export interface OrganizationSettings {
  name: string;
  slug: string;
  calendar: "gregorian" | "hebrew";
}

function kind(value: string): DeviceKind {
  return value === "mobile" || value === "tablet" ? value : "desktop";
}

/** This device first, then the most recently active. */
export function toSessions(api: ApiSession[]): SessionView[] {
  return api
    .map((s) => ({
      id: s.id,
      device: s.device,
      kind: kind(s.kind),
      signedInAt: s.created_at,
      lastActiveAt: s.last_used_at ?? s.created_at,
      current: s.current,
    }))
    .sort((a, b) => {
      if (a.current !== b.current) return a.current ? -1 : 1;
      return b.lastActiveAt.localeCompare(a.lastActiveAt);
    });
}

export function toOrganizationSettings(api: ApiOrganizationSettings): OrganizationSettings {
  return {
    name: api.name,
    slug: api.slug,
    calendar: api.calendar_system === "hebrew" ? "hebrew" : "gregorian",
  };
}

export const NAME_MAX = 120;
export const PASSWORD_MIN = 8;

/** A name the backend accepts: trimmed, 1–120 characters. `null` when it is fine. */
export function nameProblem(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Enter a name.";
  if (trimmed.length > NAME_MAX) return `Keep it under ${NAME_MAX} characters.`;
  return null;
}

/** A new password the backend accepts, and that it matches its confirmation. */
export function passwordProblem(next: string, confirm: string): string | null {
  if (next.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`;
  if (next.length > 128) return "Keep it under 128 characters.";
  if (next !== confirm) return "The two passwords don't match.";
  return null;
}
