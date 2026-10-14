import type { EmailAccess, EmailAccessAction } from "@/types/email-marketing";

/**
 * What the Klaviyo key may do (frontend SPEC-353 / backend SPEC-362). The backend probes the
 * key's write scopes without writing and refuses any write the key cannot make; the screen
 * mirrors that so a button the key cannot use is disabled with the reason beside it, never a
 * click that ends in an error. An older backend sends no `access`: everything stays allowed,
 * as before.
 */
export interface AccessGate {
  allowed: boolean;
  reason: string | null;
}

const ALLOWED: AccessGate = { allowed: true, reason: null };

const CAN: Record<EmailAccessAction, keyof Pick<EmailAccess, "canSend" | "canBuildFlows" | "canSyncAudiences">> = {
  send: "canSend",
  flows: "canBuildFlows",
  audiences: "canSyncAudiences",
};

export function accessGate(access: EmailAccess | null | undefined, action: EmailAccessAction): AccessGate {
  if (!access || access[CAN[action]]) return ALLOWED;
  return { allowed: false, reason: access.reasons[action] ?? access.reason };
}

/** The one-line banner for a key that may not do everything; null for a full key. */
export function accessBanner(access: EmailAccess | null | undefined): { title: string; body: string } | null {
  if (!access || access.mode === "full") return null;
  if (access.mode === "read_only") {
    return {
      title: "Read-only Klaviyo key",
      body: "Your Email Marketing Manager reads and advises. To let it prepare and send, give it a key with full access on Integrations.",
    };
  }
  return {
    title: "Some Klaviyo permissions are missing",
    body: `The key cannot use ${access.missing.join(", ")}. Everything else works; add those permissions to the key on Integrations.`,
  };
}
