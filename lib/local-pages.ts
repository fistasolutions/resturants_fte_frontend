/**
 * Local pages (frontend SPEC-386 / backend SPEC-403) — pure helpers for the Search Visibility tab
 * and the brand's public location pages: status words, the length counters, the schema.org
 * `Restaurant` JSON-LD and the sitemap. No JSX, no fetching.
 */
import type { LocalPageBranch, PublicLocationPage } from "@/types/local-pages";

/** Google's practical limits, the same the backend cuts to. */
export const LOCAL_PAGE_LIMITS = {
  headline: 120,
  intro: 2000,
  seoTitle: 60,
  seoDescription: 155,
} as const;

export type LocalPageField = keyof typeof LOCAL_PAGE_LIMITS;

export type LocalPageState = "none" | "draft" | "published";

export function pageState(row: LocalPageBranch): LocalPageState {
  if (!row.page) return "none";
  return row.page.status === "published" ? "published" : "draft";
}

export const PAGE_STATE_LABELS: Record<LocalPageState, string> = {
  none: "No page",
  draft: "Draft",
  published: "Published",
};

/** "42 / 60", and whether it is over. */
export function lengthHint(value: string, field: LocalPageField): { text: string; over: boolean } {
  const limit = LOCAL_PAGE_LIMITS[field];
  const used = value.trim().length;
  return { text: `${used} / ${limit}`, over: used > limit };
}

/** What a dialog may save: every field present, none empty, none over its limit. */
export function editErrors(values: Record<LocalPageField, string>): string[] {
  const names: Record<LocalPageField, string> = {
    headline: "Headline",
    intro: "Intro",
    seoTitle: "Search title",
    seoDescription: "Search description",
  };
  const errors: string[] = [];
  for (const field of Object.keys(LOCAL_PAGE_LIMITS) as LocalPageField[]) {
    const value = values[field].trim();
    if (!value) errors.push(`${names[field]} cannot be empty.`);
    else if (value.length > LOCAL_PAGE_LIMITS[field])
      errors.push(`${names[field]} is at most ${LOCAL_PAGE_LIMITS[field]} characters.`);
  }
  return errors;
}

/** Branches without a page that a write-missing run would write. */
export function missingCount(rows: LocalPageBranch[]): number {
  return rows.filter((row) => row.page === null).length;
}

const SCHEMA_DAYS: Record<string, string> = {
  Monday: "https://schema.org/Monday",
  Tuesday: "https://schema.org/Tuesday",
  Wednesday: "https://schema.org/Wednesday",
  Thursday: "https://schema.org/Thursday",
  Friday: "https://schema.org/Friday",
  Saturday: "https://schema.org/Saturday",
  Sunday: "https://schema.org/Sunday",
};

/** A span past midnight ("17:00"–"01:00") closes at "23:59" for schema.org, which has no
 * next-day closing time; the next day's own spans carry the rest. */
function closes(open: string, close: string): string {
  return close <= open ? "23:59" : close;
}

/** schema.org `Restaurant` for one location page. */
export function restaurantJsonLd(data: PublicLocationPage, url: string, orderUrl: string): Record<string, unknown> {
  const { branch } = data;
  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: `${data.brand.name} ${branch.name}`,
    url,
    menu: orderUrl,
    acceptsReservations: false,
    address: {
      "@type": "PostalAddress",
      ...(branch.addressLine ? { streetAddress: branch.addressLine } : {}),
      ...(branch.city ? { addressLocality: branch.city } : {}),
      ...(branch.state ? { addressRegion: branch.state } : {}),
      ...(branch.postalCode ? { postalCode: branch.postalCode } : {}),
    },
  };
  if (branch.phone) ld.telephone = branch.phone;
  if (branch.lat !== null && branch.lng !== null)
    ld.geo = { "@type": "GeoCoordinates", latitude: branch.lat, longitude: branch.lng };
  const hours = branch.hours.flatMap((day) =>
    day.spans.map(([open, close]) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: SCHEMA_DAYS[day.day],
      opens: open,
      closes: closes(open, close),
    })),
  );
  if (hours.length) ld.openingHoursSpecification = hours;
  return ld;
}

/** JSON for a `<script type="application/ld+json">`: `<` escaped so the copy can never close the
 * script element. */
export function jsonLdScript(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function xmlEscape(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** The brand's location pages as a sitemap. */
export function sitemapXml(origin: string, slug: string, pages: { slug: string; updatedAt: string | null }[]): string {
  const base = `${origin}/r/${encodeURIComponent(slug)}`;
  const urls = [
    `<url><loc>${xmlEscape(base)}</loc></url>`,
    ...pages.map(
      (page) =>
        `<url><loc>${xmlEscape(`${base}/${encodeURIComponent(page.slug)}`)}</loc>` +
        (page.updatedAt ? `<lastmod>${xmlEscape(page.updatedAt.slice(0, 10))}</lastmod>` : "") +
        "</url>",
    ),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}</urlset>\n`;
}

/** A map search for the address (no key, no tracking). */
export function directionsUrl(address: string, lat: number | null, lng: number | null): string {
  const q = lat !== null && lng !== null ? `${lat},${lng}` : address;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

/** A menu price on the public page, in the brand's currency. */
export function priceText(value: number, currency: string | null): string {
  const code = (currency ?? "USD").toUpperCase();
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: code }).format(value);
  } catch {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
  }
}

/** "11:00–22:00, 17:00–23:30" or "Closed". */
export function spansText(spans: [string, string][]): string {
  return spans.length ? spans.map(([open, close]) => `${open}–${close}`).join(", ") : "Closed";
}
