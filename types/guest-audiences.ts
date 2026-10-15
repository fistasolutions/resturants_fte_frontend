/** A restaurant brand's guest audiences (frontend SPEC-388 / backend SPEC-405). */

export interface GuestAudience {
  key: string;
  name: string;
  description: string;
  size: number;
  withEmail: number;
  /** An email and marketing opt-in on the brand's own site. */
  reachable: number;
  syncedAt: string | null;
  syncedCount: number | null;
}

export interface GuestAudienceSync {
  key: string;
  externalId: string;
  /** Guests whose Klaviyo profile was given their audiences (properties only). */
  written: number;
  added: number;
  removed: number;
  size: number;
  /** Opted in on the brand's site but not subscribed in Klaviyo. */
  notSubscribed: number;
}
