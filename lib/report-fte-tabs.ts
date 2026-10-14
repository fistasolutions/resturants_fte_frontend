/**
 * Pure tab model + routing helpers for the Report FTE page (SPEC-256). Framework-free
 * so it is unit-testable and shared by the persistent shell and the tab bar. Mirrors
 * `lib/product-tabs.ts`.
 */

export type ReportFteTabKey =
  | "desk"
  | "composer"
  | "templates"
  | "history"
  | "delivered"
  | "profile";

export interface ReportFteTabDef {
  key: ReportFteTabKey;
  label: string;
  basePath: string;
}

export const REPORT_FTE_BASE = "/report-fte";

export const REPORT_FTE_TABS: ReportFteTabDef[] = [
  { key: "desk", label: "Desk", basePath: REPORT_FTE_BASE },
  { key: "composer", label: "Composer", basePath: `${REPORT_FTE_BASE}/composer` },
  { key: "templates", label: "Templates", basePath: `${REPORT_FTE_BASE}/templates` },
  { key: "history", label: "History", basePath: `${REPORT_FTE_BASE}/history` },
  { key: "delivered", label: "Delivered & scheduled", basePath: `${REPORT_FTE_BASE}/delivered` },
  { key: "profile", label: "Profile", basePath: `${REPORT_FTE_BASE}/profile` },
];

const TAB_BY_PATH = new Map(REPORT_FTE_TABS.map((tab) => [tab.basePath, tab]));

function normalizePath(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

/**
 * The tab whose route is this pathname. Exact match for every tab, plus one
 * framed sub-route: the template editor (`/report-fte/templates/<id>`) keeps the
 * Templates tab active because it is that tab's detail, not a page of its own.
 * Anything else under `/report-fte` is `null` and rendered bare by the shell.
 */
export function activeReportFteTab(pathname: string): ReportFteTabKey | null {
  const path = normalizePath(pathname);
  const exact = TAB_BY_PATH.get(path)?.key;
  if (exact) return exact;
  if (path.startsWith(`${REPORT_FTE_BASE}/templates/`)) return "templates";
  return null;
}

/** The bare, reading-width page of one generated report (SPEC-286). */
export function reportPageHref(runId: number): string {
  return `${REPORT_FTE_BASE}/reports/${runId}`;
}

/** True when the shell should frame the route with the header and tab bar. */
export function isReportFteFramedRoute(pathname: string): boolean {
  return activeReportFteTab(pathname) !== null;
}

/** The composer route carrying an ask from the Desk; a blank ask opens the composer as is. */
export function composerHref(ask: string): string {
  const trimmed = ask.trim();
  if (!trimmed) return `${REPORT_FTE_BASE}/composer`;
  return `${REPORT_FTE_BASE}/composer?ask=${encodeURIComponent(trimmed)}`;
}

/** The composer route for a run that already exists (SPEC-285). */
export function composerRunHref(runId: number): string {
  return `${REPORT_FTE_BASE}/composer?run=${runId}`;
}

export function templateEditorHref(templateId: string): string {
  return `${REPORT_FTE_BASE}/templates/${encodeURIComponent(templateId)}`;
}
