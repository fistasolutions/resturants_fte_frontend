import { sitemapXml } from "@/lib/local-pages";
import { PUBLIC_REVALIDATE_SECONDS, publicGet, siteOrigin } from "@/lib/public-api";
import type { PublicLocations } from "@/types/local-pages";

/** The brand's location pages for search engines (frontend SPEC-386). */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await publicGet<PublicLocations>(`/storefront/${encodeURIComponent(slug)}/locations`);
  if (!data) return new Response("Not found", { status: 404 });
  return new Response(sitemapXml(siteOrigin(), data.slug, data.locations), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": `public, max-age=${PUBLIC_REVALIDATE_SECONDS}`,
    },
  });
}
