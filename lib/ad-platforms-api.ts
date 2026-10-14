/**
 * Performance Ads ← real ad accounts: the backend's shapes → the view models (SPEC-333 /
 * backend SPEC-342). Pure, so the mapping of somebody's ad money is provable in Vitest.
 * A missing ratio stays null — it never becomes 0, which would read as a real figure.
 */
import type {
  AdAudit,
  AdFigures,
  AdPerformance,
  AdPlatformsStatus,
  AuditFinding,
} from "@/types/ad-platforms";

interface ApiFigures {
  spend: number | null;
  impressions: number;
  clicks: number;
  purchases: number;
  revenue: number | null;
  roas: number | null;
  cpa: number | null;
  ctr: number | null;
  cpc: number | null;
  cpm: number | null;
  frequency: number | null;
  hook_rate: number | null;
}

export interface ApiPlatformsStatus {
  configured: boolean;
  platforms: {
    platform: "meta";
    status: "connected" | "needs_reconnect";
    connected_by: string;
    last_synced_at: string | null;
    last_error: string | null;
    accounts: { id: string; name: string; currency: string; timezone: string; active: boolean; selected: boolean }[];
  }[];
}

export interface ApiPerformance {
  days: number;
  since: string;
  until: string;
  currency: string;
  accounts: { id: string; name: string }[];
  totals: ApiFigures;
  mer: { value: number | null; sales?: number | null; reason: string | null };
  campaigns: (ApiFigures & { id: string; name: string; status: string; objective: string })[];
  ads: (ApiFigures & {
    id: string;
    name: string;
    campaign: string;
    status: string;
    title: string | null;
    body: string | null;
    thumbnail: string | null;
    is_video: boolean;
  })[];
}

export interface ApiAudit {
  days: number;
  spend: number | null;
  at_risk: number | null;
  findings: {
    rule: AuditFinding["rule"];
    severity: AuditFinding["severity"];
    level: AuditFinding["level"];
    name: string;
    campaign_name: string | null;
    title: string;
    evidence: string;
    wasted: number | null;
    action: string;
  }[];
}

export function toFigures(raw: ApiFigures): AdFigures {
  return {
    spend: raw.spend ?? 0,
    impressions: raw.impressions,
    clicks: raw.clicks,
    purchases: raw.purchases,
    revenue: raw.revenue ?? 0,
    roas: raw.roas,
    cpa: raw.cpa,
    ctr: raw.ctr,
    cpc: raw.cpc,
    cpm: raw.cpm,
    frequency: raw.frequency,
    hookRate: raw.hook_rate,
  };
}

export function toPlatformsStatus(raw: ApiPlatformsStatus): AdPlatformsStatus {
  return {
    configured: raw.configured,
    platforms: raw.platforms.map((p) => ({
      platform: p.platform,
      status: p.status,
      connectedBy: p.connected_by,
      lastSyncedAt: p.last_synced_at,
      lastError: p.last_error,
      accounts: p.accounts.map((a) => ({ ...a })),
    })),
  };
}

export function toPerformance(raw: ApiPerformance): AdPerformance {
  return {
    days: raw.days,
    since: raw.since,
    until: raw.until,
    currency: raw.currency,
    accounts: raw.accounts,
    totals: toFigures(raw.totals),
    mer: { value: raw.mer.value, sales: raw.mer.sales ?? null, reason: raw.mer.reason },
    campaigns: raw.campaigns.map((c) => ({
      ...toFigures(c),
      id: c.id,
      name: c.name,
      status: c.status,
      objective: c.objective,
    })),
    ads: raw.ads.map((a) => ({
      ...toFigures(a),
      id: a.id,
      name: a.name,
      campaign: a.campaign,
      status: a.status,
      title: a.title,
      body: a.body,
      thumbnail: a.thumbnail,
      isVideo: a.is_video,
    })),
  };
}

export function toAudit(raw: ApiAudit): AdAudit {
  return {
    days: raw.days,
    spend: raw.spend ?? 0,
    atRisk: raw.at_risk ?? 0,
    findings: raw.findings.map((f) => ({
      rule: f.rule,
      severity: f.severity,
      level: f.level,
      name: f.name,
      campaignName: f.campaign_name,
      title: f.title,
      evidence: f.evidence,
      wasted: f.wasted ?? 0,
      action: f.action,
    })),
  };
}
