/**
 * The Audit tab's words and choices (SPEC-333 / backend SPEC-342) — pure.
 */
import type { AdAccountChoice, AdPlatformsStatus, AuditFinding, AuditSeverity } from "@/types/ad-platforms";

export const AUDIT_WINDOWS = [7, 30, 90] as const;
export type AuditWindow = (typeof AUDIT_WINDOWS)[number];

/** An untrusted `?days=` → one of the windows the backend reads; anything else is 30. */
export function normalizeWindow(value: string | null | undefined): AuditWindow {
  const n = Number(value);
  return (AUDIT_WINDOWS as readonly number[]).includes(n) ? (n as AuditWindow) : 30;
}

export const SEVERITY: Record<AuditSeverity, { label: string; tone: "destructive" | "warning" | "neutral" }> = {
  high: { label: "High", tone: "destructive" },
  medium: { label: "Medium", tone: "warning" },
  low: { label: "Low", tone: "neutral" },
};

export const RULE_LABEL: Record<AuditFinding["rule"], string> = {
  spend_no_purchases: "No purchases",
  roas_below_breakeven: "Below break-even",
  cpa_over_target: "Cost per purchase high",
  creative_fatigue: "Creative fatigue",
  below_par_creative: "Low click-through",
  hook_rate_low: "Weak video hook",
  learning_limited: "Learning limited",
  no_purchase_tracking: "Tracking missing",
};

export type ConnectionStage = "unconfigured" | "disconnected" | "choose" | "connected";

/** Which of the tab's four states to draw. */
export function connectionStage(status: AdPlatformsStatus): ConnectionStage {
  const meta = status.platforms.find((p) => p.platform === "meta");
  if (!meta) return status.configured ? "disconnected" : "unconfigured";
  return meta.accounts.some((a) => a.selected) ? "connected" : "choose";
}

/** Whether the owner's ticks differ from what is saved — the Save button's state. */
export function selectionChanged(accounts: AdAccountChoice[], ticked: Set<string>): boolean {
  return accounts.some((a) => a.selected !== ticked.has(a.id));
}

/** "4.2%" from 0.042; "—" when there is no base. */
export function percent(value: number | null, digits = 1): string {
  return value == null ? "—" : `${(value * 100).toFixed(digits)}%`;
}

/** "2.67×" for a ROAS or MER; "—" when there is none. */
export function multiple(value: number | null): string {
  return value == null ? "—" : `${value.toFixed(2)}×`;
}

/** Remember that an Ads sign-in is under way, so the shared Meta callback returns here
 * even when Meta sends the owner back with an error and no state. The value says which
 * screen started it — the Audit tab or Meta Ads' page in Integrations. */
export const ADS_CONNECT_FLAG = "ads-meta-connect";

export type AdsConnectFrom = "audit" | "integrations";

/** Where each screen reads the result: the Audit tab as `meta=`, Meta's one card in
 * Integrations as `ads=` — that page also shows the posting sign-in's `meta=` result. */
const ADS_RETURN: Record<AdsConnectFrom, string> = {
  audit: "/ads?tab=audit&meta=",
  integrations: "/integrations/meta?tab=settings&ads=",
};

/** Where Meta's callback sends an Ads sign-in back to, with its result; null when the
 * flag is not an Ads one. The first release stored "1", which meant the Audit tab. */
export function adsReturnHref(flag: string | null, result: "connected" | "cancelled" | "error"): string | null {
  const from: AdsConnectFrom | null =
    flag === "integrations" ? "integrations" : flag === "audit" || flag === "1" ? "audit" : null;
  return from ? `${ADS_RETURN[from]}${result}` : null;
}
