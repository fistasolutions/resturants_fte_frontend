/**
 * Clarity display logic (SPEC-214) — pure, so Vitest can reach it.
 *
 * The components stay presentational; every judgement lives here. That is how this repo
 * satisfies "no component test runner exists yet" (root Rule 4).
 *
 * The rule these functions exist to enforce: **unmeasured is not zero.** A blog nobody
 * has measured and a blog nobody read look identical if you render both as `0`, and they
 * call for opposite reactions — connect the tag, versus rewrite the article.
 */

/** How far into an article readers actually get. */
export interface ReadThrough {
  measured: boolean;
  /** e.g. "Readers stop around word 463 of 2,572 (18%)". */
  summary: string;
  /** 0–1, or null when unmeasured. */
  depth: number | null;
}

export function readThrough(post: {
  measured: boolean;
  wordCount: number;
  avgScrollDepth: number | null;
  stopsAroundWord: number | null;
}): ReadThrough {
  if (!post.measured || post.avgScrollDepth === null) {
    return {
      measured: false,
      depth: null,
      summary: "Not measured yet — connect Clarity to see how far readers get.",
    };
  }
  const pct = Math.round(post.avgScrollDepth * 100);
  if (!post.wordCount || post.stopsAroundWord === null) {
    return { measured: true, depth: post.avgScrollDepth, summary: `${pct}% average scroll depth.` };
  }
  return {
    measured: true,
    depth: post.avgScrollDepth,
    summary:
      `Readers stop around word ${post.stopsAroundWord.toLocaleString()} ` +
      `of ${post.wordCount.toLocaleString()} (${pct}%).`,
  };
}

export type FrictionBand = "severe" | "notable" | "minor";

/**
 * Severity from friction events per 100 sessions — a rate, not a raw count.
 *
 * A raw count would rank the busiest page first every time, which is exactly the
 * ordering Clarity already gives you and the reason it is not actionable. Revenue does
 * the prioritising (backend SPEC-219); this only colours how bad the page itself is.
 */
export function frictionBand(events: number, sessions: number): FrictionBand {
  if (sessions <= 0) return "minor";
  const per100 = (events / sessions) * 100;
  if (per100 >= 10) return "severe";
  if (per100 >= 3) return "notable";
  return "minor";
}

export const FRICTION_LABEL: Record<FrictionBand, string> = {
  severe: "Severe",
  notable: "Notable",
  minor: "Minor",
};

/**
 * What a traffic source's numbers actually mean together.
 *
 * The distinction that justifies the join: heavy engagement plus few orders is a broken
 * page; light engagement plus few orders is the wrong audience. A spend dashboard sees
 * only "few orders" and would pause both — including the one whose traffic was fine.
 */
export function sourceVerdict(source: {
  sessions: number;
  avgScrollDepth: number;
  attributedOrders: number;
  rageClicks: number;
}): string {
  if (source.sessions <= 0) return "No sessions recorded.";
  if (source.attributedOrders > 0 && source.rageClicks === 0) {
    return "Converting, with no friction recorded.";
  }
  const engaged = source.avgScrollDepth >= 0.5;
  if (engaged && source.attributedOrders === 0) {
    return "People engage but do not buy — look at the landing page, not the targeting.";
  }
  if (!engaged && source.attributedOrders === 0) {
    return "People leave immediately — this is an audience problem, not a page problem.";
  }
  if (engaged && source.rageClicks > 0) {
    return "Good traffic hitting friction — fixing the page is worth more than more budget.";
  }
  return "Converting.";
}

/** Honest empty-state copy for a surface that has no Clarity data yet. */
export function emptyStateMessage(connected: boolean, configured: boolean): string {
  if (!configured) {
    return "Connect Microsoft Clarity in Integrations to see this.";
  }
  if (!connected) {
    return "Clarity is connected. The first daily pull has not landed yet — check back tomorrow.";
  }
  return "Clarity has not reported anything for this window yet.";
}

/* ── SPEC-284 patch: channels, not spellings ─────────────────────────────── */

/** "Includes facebook, ig, l.instagram.com" when a channel merged several of Clarity's
 * names; null when it is just the one name the owner already sees. */
export function mergedFrom(source: { label: string; rawSources: string[] }): string | null {
  const label = source.label.toLowerCase();
  const differs = source.rawSources.some((raw) => raw.replace(/^www\./, "") !== label);
  return differs ? `Includes ${source.rawSources.join(", ")}` : null;
}

/** The sources an ad page judges: the store's own website and direct visits are not
 * campaigns, so they are left out. */
export function campaignSources<T extends { internal?: boolean }>(sources: T[]): T[] {
  return sources.filter((s) => !s.internal);
}

/* ── SPEC-284: a verdict per traffic source, as a chip with its reason ──────── */

export type SourceTone = "ok" | "warn" | "bad" | "muted";

export interface SourceVerdictLine {
  label: string;
  tone: SourceTone;
  /** One sentence the owner can act on. */
  why: string;
}

/** Sources with fewer sessions than this get no verdict — a judgment on 12
 * sessions would be noise dressed as insight. */
export const SOURCE_MIN_SESSIONS = 50;

/**
 * The same rule as `sourceVerdict`, as a chip: engaged (scroll ≥ 50%) + no orders =
 * the page is broken; not engaged + no orders = the audience is wrong; orders with
 * no friction = converting. Under the floor, "too few to judge".
 */
export function sourceVerdictLine(source: {
  sessions: number;
  avgScrollDepth: number;
  quickBacks: number;
  attributedOrders: number;
  rageClicks: number;
  internal?: boolean;
}): SourceVerdictLine {
  if (source.internal) {
    return { label: "Your own site", tone: "muted", why: "Visitors moving around your own site or arriving direct — not a campaign to judge." };
  }
  if (source.sessions < SOURCE_MIN_SESSIONS) {
    return { label: "Too few to judge", tone: "muted", why: `Under ${SOURCE_MIN_SESSIONS} sessions in the window.` };
  }
  const engaged = source.avgScrollDepth >= 0.5;
  const quickBackRate = source.sessions > 0 ? source.quickBacks / source.sessions : 0;
  if (source.attributedOrders > 0 && source.rageClicks === 0) {
    return { label: "Converting", tone: "ok", why: "Orders came from this source and no rage clicks were recorded." };
  }
  if (source.attributedOrders > 0 && source.rageClicks > 0) {
    return { label: "Converting, with friction", tone: "warn", why: "It converts, but visitors hit rage clicks — fixing the page is worth more than more budget." };
  }
  if (engaged) {
    return { label: "Good audience, broken page", tone: "warn", why: "They read and scroll, then leave without buying — look at the landing page, not the targeting." };
  }
  if (quickBackRate >= 0.5) {
    return { label: "Wrong audience", tone: "bad", why: "Most leave within seconds and never scroll — targeting, not the page." };
  }
  return { label: "No orders yet", tone: "muted", why: "Light engagement and no orders — watch it before spending more." };
}

