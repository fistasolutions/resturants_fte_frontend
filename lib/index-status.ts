/**
 * Google's index status per published post — the pure half (SPEC-261; backend
 * SPEC-261). The backend classifies Google's URL Inspection verdict into an
 * `IndexState`; this module turns that into a badge, a next step in the owner's
 * words, and the Search Console deep link where "Request indexing" lives (Google
 * exposes no API for it). Vitest-covered — no component runner (root Rule 4).
 */
import type { IndexState, IndexSummary, PostIndexStatus } from "@/types/spotlight";

export type IndexTone = "success" | "warning" | "muted" | "destructive";

export interface IndexBadge {
  label: string;
  tone: IndexTone;
}

/** The badge for a row. `null` (never inspected) reads as such, never as a verdict. */
export function indexBadge(index: PostIndexStatus | null): IndexBadge {
  return badgeForState(index?.state ?? null);
}

export function badgeForState(state: IndexState | null): IndexBadge {
  if (!state) return { label: "Not inspected yet", tone: "muted" };
  switch (state) {
    case "indexed":
      return { label: "Indexed", tone: "success" };
    case "discovered":
      return { label: "Discovered, not indexed", tone: "warning" };
    case "crawled":
      return { label: "Crawled, not indexed", tone: "warning" };
    case "unknown":
      return { label: "Unknown to Google", tone: "muted" };
    case "excluded":
      return { label: "Excluded", tone: "destructive" };
    case "error":
      return { label: "Fetch error", tone: "destructive" };
  }
}

/** The one-line next step for a state — what the owner can actually do. */
export function indexHint(state: IndexState | null): string {
  switch (state) {
    case "indexed":
      return "Can appear in Google results. Impressions arrive as it starts to rank — typically weeks for a new post.";
    case "discovered":
      return "Google knows the URL but hasn't crawled it. A link from a page Google already crawls — the Journal menu, the homepage — is what moves it; Request indexing in Search Console speeds it up.";
    case "crawled":
      return "Google crawled it and hasn't indexed it yet. Usually a new or thin page; internal links and time change this, and Request indexing asks for another look.";
    case "unknown":
      return "Google has never seen this URL. It is in the sitemap; a link from a crawled page is what gets it found, and Request indexing in Search Console submits it directly.";
    case "excluded":
      return "Google is keeping this page out on purpose — a noindex tag, a redirect, or a duplicate with another canonical. Check the page in Search Console.";
    case "error":
      return "Google couldn't fetch the page. Check that the article is live and reachable, then Request indexing.";
    default:
      return "Index status arrives with the next Search Console sync.";
  }
}

/** Order states from most to least urgent — the callout leads with the worst present. */
const SEVERITY: IndexState[] = ["error", "excluded", "unknown", "discovered", "crawled", "indexed"];

export function worstState(states: Array<IndexState | null>): IndexState | null {
  const present = states.filter((s): s is IndexState => s !== null);
  for (const state of SEVERITY) {
    if (present.includes(state)) return state;
  }
  return null;
}

/** Search Console's URL Inspection page for one URL of the property — where
 * "Request indexing" is. Both parameters are percent-encoded as Google expects. */
export function inspectInSearchConsoleUrl(property: string | null, url: string): string {
  const params = new URLSearchParams();
  if (property) params.set("resource_id", property);
  params.set("id", url);
  return `https://search.google.com/search-console/inspect?${params.toString()}`;
}

/** "2 of 4 posts indexed by Google · 2 not indexed" — the tile's supporting line. */
export function indexSummaryLine(summary: IndexSummary): string {
  const total = summary.indexed + summary.notIndexed + summary.uninspected;
  if (total === 0) return "No published posts yet";
  const parts = [`${summary.indexed} of ${total} ${total === 1 ? "post" : "posts"} indexed by Google`];
  if (summary.notIndexed > 0) parts.push(`${summary.notIndexed} not indexed`);
  if (summary.uninspected > 0) parts.push(`${summary.uninspected} not inspected yet`);
  return parts.join(" · ");
}
