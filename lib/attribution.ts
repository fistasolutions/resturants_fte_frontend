/**
 * Ad attribution on the brand's own site (frontend SPEC-387 / backend SPEC-404): the `utm_*` tokens
 * an ad's link carries, kept through the visit and sent with the order. Pure.
 */

export interface Attribution {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
}

const KEYS = ["utm_source", "utm_medium", "utm_campaign"] as const;
const LIMITS: Record<(typeof KEYS)[number], number> = { utm_source: 80, utm_medium: 80, utm_campaign: 120 };

function clean(value: string | null, limit: number): string | null {
  const text = (value ?? "").trim().toLowerCase().slice(0, limit);
  return text || null;
}

/** The tokens in a query string, or null when it carries none. */
export function readAttribution(search: string): Attribution | null {
  const params = new URLSearchParams(search);
  const found = {
    utmSource: clean(params.get("utm_source"), LIMITS.utm_source),
    utmMedium: clean(params.get("utm_medium"), LIMITS.utm_medium),
    utmCampaign: clean(params.get("utm_campaign"), LIMITS.utm_campaign),
  };
  return found.utmSource || found.utmMedium || found.utmCampaign ? found : null;
}

/** The query string to carry the tokens onward (a local page's Order button), "" when none. */
export function attributionQuery(params: Record<string, string | string[] | undefined>): string {
  const out = new URLSearchParams();
  for (const key of KEYS) {
    const raw = params[key];
    const value = clean(Array.isArray(raw) ? (raw[0] ?? null) : (raw ?? null), LIMITS[key]);
    if (value) out.set(key, value);
  }
  const text = out.toString();
  return text ? `?${text}` : "";
}

/** The request body's `attribution`, or null. */
export function attributionBody(value: Attribution | null | undefined): Record<string, string | null> | null {
  if (!value) return null;
  return { utm_source: value.utmSource, utm_medium: value.utmMedium, utm_campaign: value.utmCampaign };
}

export function serializeAttribution(value: Attribution): string {
  return JSON.stringify(value);
}

export function parseStoredAttribution(raw: string | null): Attribution | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<Attribution>;
    const pick = (v: unknown) => (typeof v === "string" && v ? v : null);
    const out = { utmSource: pick(value.utmSource), utmMedium: pick(value.utmMedium), utmCampaign: pick(value.utmCampaign) };
    return out.utmSource || out.utmMedium || out.utmCampaign ? out : null;
  } catch {
    return null;
  }
}
