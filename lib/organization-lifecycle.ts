/**
 * Leaving the platform (SPEC-332 over backend SPEC-340) — pure. Export everything as a ZIP,
 * delete the organization with a 30-day grace, restore it by link.
 */

/** The ZIP download, through the proxy (the browser streams it straight to disk). */
export const EXPORT_PATH = "/api/proxy/organizations/current/export";

/** SPEC-334: with `files`, the ZIP also carries every image, video and uploaded file. */
export function exportHref(files: boolean): string {
  return files ? `${EXPORT_PATH}?files=true` : EXPORT_PATH;
}

/** The backend's rule for the delete confirmation: case and spacing do not count. */
export function confirmationMatches(typed: string, name: string): boolean {
  const normalise = (value: string) => value.trim().split(/\s+/).join(" ").toLowerCase();
  return typed.trim() !== "" && normalise(typed) === normalise(name);
}

/** "1 November 2026" — the day the organization is erased. */
export function purgeDateLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "in 30 days";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export interface DeletionScheduled {
  purgeAfter: string;
  restoreUrl: string;
  emailed: boolean;
}

export interface DeletionScheduledApi {
  purge_after: string;
  restore_url: string;
  emailed: boolean;
}

export function deletionFrom(api: DeletionScheduledApi): DeletionScheduled {
  return { purgeAfter: api.purge_after, restoreUrl: api.restore_url, emailed: api.emailed };
}

/** What a failed restore says, by the backend's error code. */
export function restoreFailureMessage(code: string | null): string {
  if (code === "restore_expired") return "This link has expired or was already used.";
  return "The organization could not be restored. Try again in a moment.";
}

/** A token worth sending: the backend's shape is `<id>.<timestamp>.<signature>`. */
export function plausibleRestoreToken(token: string | null | undefined): token is string {
  return typeof token === "string" && /^\d+\.\d+\.[A-Za-z0-9_-]{20,}$/.test(token);
}
