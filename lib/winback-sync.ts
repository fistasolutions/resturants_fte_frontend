import type { WinbackKlaviyoAccess } from "@/types/brief";

/**
 * Whether the win-back's "Sync to Klaviyo" may run (frontend SPEC-356 / backend SPEC-365). The
 * backend shares one answer about the store's Klaviyo key between the win-back and the Email
 * Marketing Manager; a key that cannot write profiles and lists is refused before anything is
 * marked synced. An older backend sends no `klaviyo`: the button stays as it was.
 */
export interface WinbackSyncGate {
  allowed: boolean;
  reason: string | null;
}

/** The backend's error code for a key that cannot sync the win-back. */
export const WINBACK_NOT_ALLOWED = "klaviyo_winback_not_allowed";

export function winbackSyncGate(klaviyo: WinbackKlaviyoAccess | null | undefined): WinbackSyncGate {
  if (!klaviyo || klaviyo.can_sync) return { allowed: true, reason: null };
  return { allowed: false, reason: klaviyo.reason };
}

/** True when a failed sync was the key's refusal — not something a retry can fix. */
export function refusedBySync(code: string | null | undefined): boolean {
  return code === WINBACK_NOT_ALLOWED;
}

/** Where the Money Finder's Drifting VIPs card sends the owner, and what it says (SPEC-356
 * patch 2026-10-13). */
export interface WinbackCardCta {
  label: string;
  /** Shown under the button when Klaviyo must be connected first; null otherwise. */
  hint: { text: string; href: string } | null;
}

export const KLAVIYO_SETTINGS_HREF = "/integrations/klaviyo?tab=settings";

/**
 * `connected` is the Integrations card's Klaviyo `connected`: false says "Review list" and how
 * to connect; true or unknown (undefined — still loading, or a role that cannot see
 * integrations) keeps the card as it was.
 */
export function winbackCardCta(connected: boolean | undefined): WinbackCardCta {
  if (connected === false) {
    return {
      label: "Review list",
      hint: { text: "Connect Klaviyo to sync", href: KLAVIYO_SETTINGS_HREF },
    };
  }
  return { label: "Review & sync to Klaviyo", hint: null };
}
