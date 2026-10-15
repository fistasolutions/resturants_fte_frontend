import type { MetadataRoute } from "next";

/**
 * Internal BI tool — deliberately invisible to search/AI crawlers
 * (SPEC-006 Patches). Everything is auth-gated; nothing should index — except a restaurant
 * brand's public location pages under `/r/` (SPEC-386), which exist to be found.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/r/",
      disallow: "/",
    },
  };
}
