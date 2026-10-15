/** Guest audiences' pure half (frontend SPEC-388): grouping and the sync's words. */
import type { GuestAudience, GuestAudienceSync } from "@/types/guest-audiences";

export const BRANCH_AUDIENCE_PREFIX = "guest-branch-";

export function splitAudiences(rows: GuestAudience[]): { lifecycle: GuestAudience[]; branches: GuestAudience[] } {
  return {
    lifecycle: rows.filter((r) => !r.key.startsWith(BRANCH_AUDIENCE_PREFIX)),
    branches: rows.filter((r) => r.key.startsWith(BRANCH_AUDIENCE_PREFIX)),
  };
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** "Sent: 12 guests updated in Klaviyo · list now 9 (3 added, 1 removed) · 3 opted in on your site but not subscribed in Klaviyo." */
export function syncNotice(name: string, result: GuestAudienceSync): string {
  const parts = [
    `${name}: ${plural(result.written, "guest", "guests")} updated in Klaviyo`,
    `list now ${result.size} (${result.added} added, ${result.removed} removed)`,
  ];
  if (result.notSubscribed > 0)
    parts.push(
      `${plural(result.notSubscribed, "guest", "guests")} opted in on your site but not subscribed in Klaviyo — they join the list once they subscribe`,
    );
  return `${parts.join(" · ")}.`;
}
