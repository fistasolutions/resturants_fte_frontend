import type { MetadataRoute } from "next";

/**
 * Internal BI tool — deliberately invisible to search/AI crawlers
 * (SPEC-006 Patches). Everything is auth-gated; nothing should index.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}
