/** Search Visibility's local pages for a restaurant brand (frontend SPEC-386 / backend SPEC-403). */

export type LocalPageStatus = "draft" | "published";

export interface LocalPage {
  slug: string;
  headline: string;
  intro: string;
  seoTitle: string;
  seoDescription: string;
  status: LocalPageStatus;
  writtenByModel: boolean;
  publishedAt: string | null;
  updatedAt: string | null;
}

export interface LocalPageBranch {
  branchId: number;
  code: string;
  name: string;
  city: string | null;
  branchStatus: string;
  page: LocalPage | null;
  publicPath: string | null;
}

export interface LocalPagesData {
  brandSlug: string;
  sitePath: string;
  branches: LocalPageBranch[];
  counts: { branches: number; written: number; published: number };
  /** Only on a "write the missing pages" answer. */
  writtenNow?: number;
}

export interface LocalPageEdit {
  headline?: string;
  intro?: string;
  seoTitle?: string;
  seoDescription?: string;
}

/** The public site's reads (no sign-in). */
export interface PublicLocationCard {
  slug: string;
  name: string;
  city: string | null;
  address: string;
  headline: string;
  updatedAt: string | null;
}

export interface PublicLocations {
  name: string;
  slug: string;
  locations: PublicLocationCard[];
}

export interface PublicHoursDay {
  day: string;
  spans: [string, string][];
}

export interface PublicLocationPage {
  brand: { name: string; slug: string; currency: string | null };
  page: {
    slug: string;
    headline: string;
    intro: string;
    seoTitle: string;
    seoDescription: string;
    updatedAt: string | null;
  };
  branch: {
    id: number;
    name: string;
    addressLine: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    address: string;
    phone: string | null;
    lat: number | null;
    lng: number | null;
    hours: PublicHoursDay[];
    openNow: boolean;
    delivery: boolean;
    carryout: boolean;
    ordersOnline: boolean;
  };
  highlights: { id: number; name: string; category: string; price: number; fromPrice: boolean }[];
}
