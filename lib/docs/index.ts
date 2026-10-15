/**
 * Registry + pure helpers for the in-app docs (SPEC-229). Framework-free so it is
 * Vitest-covered and shared by the shell, the tab bars, the article and the pager.
 *
 * Adding a feature (root Rule 11): write `lib/docs/content/<slug>.ts`, add it to
 * `FEATURE_DOCS` below in reading order, and the coverage test passes again.
 */

import { adsDoc } from "@/lib/docs/content/ads";
import { aiDoc } from "@/lib/docs/content/ai";
import { briefDoc } from "@/lib/docs/content/brief";
import { chatDoc } from "@/lib/docs/content/chat";
import { customerSupportDoc } from "@/lib/docs/content/customer-support";
import { customersDoc } from "@/lib/docs/content/customers";
import { dataManagerDoc } from "@/lib/docs/content/data-manager";
import { dashboardDoc } from "@/lib/docs/content/dashboard";
import { discountsDoc } from "@/lib/docs/content/discounts";
import { emailMarketingDoc } from "@/lib/docs/content/email-marketing";
import { employeesDoc } from "@/lib/docs/content/employees";
import { foresightDoc } from "@/lib/docs/content/foresight";
import { guestsDoc } from "@/lib/docs/content/guests";
import { integrationsDoc } from "@/lib/docs/content/integrations";
import { cashDoc } from "@/lib/docs/content/cash";
import { kitchenDoc } from "@/lib/docs/content/kitchen";
import { inventoryDoc } from "@/lib/docs/content/inventory";
import { menuDoc } from "@/lib/docs/content/menu";
import { networkDoc } from "@/lib/docs/content/network";
import { operationsDoc } from "@/lib/docs/content/operations";
import { ordersDoc } from "@/lib/docs/content/orders";
import { posDoc } from "@/lib/docs/content/pos";
import { productsDoc } from "@/lib/docs/content/products";
import { reportFteDoc } from "@/lib/docs/content/report-fte";
import { reportsDoc } from "@/lib/docs/content/reports";
import { resultsDoc } from "@/lib/docs/content/results";
import { returnsDoc } from "@/lib/docs/content/returns";
import { royaltiesDoc } from "@/lib/docs/content/royalties";
import { settingsDoc } from "@/lib/docs/content/settings";
import { socialDoc } from "@/lib/docs/content/social";
import { spotlightDoc } from "@/lib/docs/content/spotlight";
import { systemDoc } from "@/lib/docs/content/system";
import { ciDoc } from "@/lib/docs/content/ci";
import { taxReportsDoc } from "@/lib/docs/content/tax-reports";
import { teamPerformanceDoc } from "@/lib/docs/content/team-performance";
import { trafficDoc } from "@/lib/docs/content/traffic";
import { warehouseDoc } from "@/lib/docs/content/warehouse";
import type { DocArea, DocAreaKey, FeatureDoc } from "@/types/docs";

export const DOCS_ROOT = "/docs";

/** The seven area tabs, in bar order. `start` is the overview itself. */
export const DOC_AREAS: DocArea[] = [
  { key: "start", label: "Start here", summary: "What the platform is, how it works, and how to read these docs." },
  { key: "command", label: "Command Center", summary: "Where every day starts — the brief, the numbers, the analyst you can ask, and the written report." },
  { key: "merchandising", label: "Merchandising", summary: "What to sell, stock, buy and clear — ranked by money." },
  { key: "operations", label: "Operations", summary: "Orders, the warehouse, returns, discounts and tax — the transaction record turned into worklists." },
  { key: "customers", label: "Customers & Support", summary: "Who to talk to and why — customers, the support team, and the people walking into the stores." },
  { key: "growth", label: "Growth", summary: "The digital employees that earn attention — search content, organic social, and gated paid media." },
  { key: "platform", label: "Outcomes & Platform", summary: "Did it work, how did the AI and the jobs perform, and where everything is configured." },
];

/** Every feature doc, in reading order (also the prev/next order). */
export const FEATURE_DOCS: FeatureDoc[] = [
  briefDoc,
  dashboardDoc,
  chatDoc,
  networkDoc,
  reportsDoc,
  reportFteDoc,
  productsDoc,
  menuDoc,
  dataManagerDoc,
  inventoryDoc,
  foresightDoc,
  ordersDoc,
  posDoc,
  kitchenDoc,
  cashDoc,
  operationsDoc,
  warehouseDoc,
  returnsDoc,
  discountsDoc,
  taxReportsDoc,
  royaltiesDoc,
  customersDoc,
  guestsDoc,
  teamPerformanceDoc,
  customerSupportDoc,
  trafficDoc,
  employeesDoc,
  spotlightDoc,
  socialDoc,
  adsDoc,
  emailMarketingDoc,
  resultsDoc,
  aiDoc,
  systemDoc,
  ciDoc,
  integrationsDoc,
  settingsDoc,
];

const DOC_BY_SLUG = new Map(FEATURE_DOCS.map((doc) => [doc.slug, doc]));
const AREA_BY_KEY = new Map(DOC_AREAS.map((area) => [area.key, area]));

export function getDoc(slug: string): FeatureDoc | null {
  return DOC_BY_SLUG.get(slug) ?? null;
}

export function getDocArea(key: DocAreaKey): DocArea {
  // Every FeatureDoc.area is a DocAreaKey, and every key is in DOC_AREAS — the
  // registry test pins this, so the non-null assertion cannot fire in practice.
  return AREA_BY_KEY.get(key)!;
}

/** The docs in one area, in `FEATURE_DOCS` order. */
export function docsForArea(key: DocAreaKey): FeatureDoc[] {
  return FEATURE_DOCS.filter((doc) => doc.area === key);
}

export function docHref(slug: string): string {
  return `${DOCS_ROOT}/${slug}`;
}

/** The area a docs pathname belongs to: `/docs` → start, `/docs/<slug>` → its
 * doc's area, anything unknown → null. Trailing slashes are tolerated. */
export function activeDocSlug(pathname: string): string | null {
  const trimmed = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  if (trimmed === DOCS_ROOT) return null;
  if (!trimmed.startsWith(`${DOCS_ROOT}/`)) return null;
  const slug = trimmed.slice(DOCS_ROOT.length + 1);
  return DOC_BY_SLUG.has(slug) ? slug : null;
}

export function activeDocArea(pathname: string): DocAreaKey | null {
  const trimmed = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  if (trimmed === DOCS_ROOT) return "start";
  const slug = activeDocSlug(trimmed);
  return slug ? (DOC_BY_SLUG.get(slug)?.area ?? null) : null;
}

/** Previous and next docs in reading order; null at either end. */
export function docNeighbors(slug: string): { previous: FeatureDoc | null; next: FeatureDoc | null } {
  const index = FEATURE_DOCS.findIndex((doc) => doc.slug === slug);
  if (index === -1) return { previous: null, next: null };
  return {
    previous: index > 0 ? FEATURE_DOCS[index - 1] : null,
    next: index < FEATURE_DOCS.length - 1 ? FEATURE_DOCS[index + 1] : null,
  };
}

/** Resolve `related` slugs to docs, dropping any that do not exist (the test
 * fails on a dangling slug, so this is belt-and-braces for the renderer). */
export function relatedDocs(doc: FeatureDoc): FeatureDoc[] {
  return doc.related.map((slug) => DOC_BY_SLUG.get(slug)).filter((d): d is FeatureDoc => Boolean(d));
}

/** Stable anchor ids for the article's "On this page" rail. */
export const DOC_ANCHORS = [
  { id: "what-it-is", label: "What it is" },
  { id: "why-it-matters", label: "Why it matters" },
  { id: "how-it-works", label: "How it works" },
  { id: "screens", label: "Screens & tabs" },
  { id: "how-to-use", label: "How to use it" },
  { id: "benefits", label: "Benefits" },
  { id: "good-to-know", label: "Good to know" },
  { id: "related", label: "Related" },
] as const;

/** Section anchor within "Screens & tabs" — slugified from the title. */
export function sectionAnchor(title: string): string {
  return `screen-${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}`;
}

/** Human date for the `updated` stamp — "11 Sep 2026". */
export function formatUpdated(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  if (!year || !month || !day || month < 1 || month > 12) return iso;
  return `${day} ${months[month - 1]} ${year}`;
}
