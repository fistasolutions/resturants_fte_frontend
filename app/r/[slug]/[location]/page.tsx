import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Bike, Clock, MapPin, Phone, ShoppingBag, Store } from "lucide-react";

import {
  directionsUrl,
  jsonLdScript,
  priceText,
  restaurantJsonLd,
  spansText,
} from "@/lib/local-pages";
import { attributionQuery } from "@/lib/attribution";
import { publicGet, siteOrigin } from "@/lib/public-api";
import type { PublicLocationPage } from "@/types/local-pages";

interface Props {
  params: Promise<{ slug: string; location: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function load(slug: string, location: string): Promise<PublicLocationPage | null> {
  return publicGet<PublicLocationPage>(
    `/storefront/${encodeURIComponent(slug)}/locations/${encodeURIComponent(location)}`,
  );
}

function pageUrl(slug: string, location: string): string {
  return `${siteOrigin()}/r/${encodeURIComponent(slug)}/${encodeURIComponent(location)}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, location } = await params;
  const data = await load(slug, location);
  if (!data) return { title: "Not found" };
  const url = pageUrl(slug, location);
  return {
    title: { absolute: data.page.seoTitle },
    description: data.page.seoDescription,
    alternates: { canonical: url },
    openGraph: { title: data.page.seoTitle, description: data.page.seoDescription, url, type: "website" },
  };
}

/** One branch's local page (frontend SPEC-386 over backend SPEC-403). The copy is the brand's; the
 * address, hours, phone and prices are the branch's own, read when the page is served. */
export default async function LocationPage({ params, searchParams }: Props) {
  const { slug, location } = await params;
  // SPEC-387: an ad landing here keeps its tokens on the way to the order.
  const carry = attributionQuery(await searchParams);
  const data = await load(slug, location);
  if (!data) notFound();
  const { branch, page, brand } = data;
  const orderPath = `/order/${encodeURIComponent(brand.slug)}`;
  const orderHref = `${orderPath}${carry}`;
  const ld = restaurantJsonLd(data, pageUrl(slug, location), `${siteOrigin()}${orderPath}`);
  const paragraphs = page.intro.split(/\n\s*\n/).filter(Boolean);

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(ld) }} />
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
        <Link
          href={`/r/${encodeURIComponent(brand.slug)}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden /> All {brand.name} locations
        </Link>
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {brand.name} · {branch.name}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{page.headline}</h1>
          <div className="space-y-3 text-base leading-relaxed text-muted-foreground">
            {paragraphs.map((text, i) => (
              <p key={i}>{text}</p>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {branch.ordersOnline ? (
              <Link
                href={orderHref}
                className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <ShoppingBag className="size-4" aria-hidden /> Order online
              </Link>
            ) : null}
            {branch.phone ? (
              <a
                href={`tel:${branch.phone.replace(/[^\d+]/g, "")}`}
                className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-border px-5 text-sm font-semibold hover:bg-muted/50"
              >
                <Phone className="size-4" aria-hidden /> {branch.phone}
              </a>
            ) : null}
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Find us</h2>
            {branch.address ? (
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                <a
                  href={directionsUrl(branch.address, branch.lat, branch.lng)}
                  target="_blank"
                  rel="noreferrer"
                  className="underline-offset-4 hover:underline"
                >
                  {branch.address}
                </a>
              </p>
            ) : null}
            <ul className="flex flex-wrap gap-2 text-sm">
              <li className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1">
                <Clock className="size-3.5" aria-hidden /> {branch.openNow ? "Open now" : "Closed now"}
              </li>
              {branch.delivery ? (
                <li className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1">
                  <Bike className="size-3.5" aria-hidden /> Delivery
                </li>
              ) : null}
              {branch.carryout ? (
                <li className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1">
                  <Store className="size-3.5" aria-hidden /> Carryout
                </li>
              ) : null}
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Opening hours</h2>
            {branch.hours.length ? (
              <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
                {branch.hours.map((day) => (
                  <div key={day.day} className="contents">
                    <dt className="text-muted-foreground">{day.day}</dt>
                    <dd className="tabular-nums">{spansText(day.spans)}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Call us for today&apos;s hours.</p>
            )}
          </div>
        </section>

        {data.highlights.length ? (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight">Favourites here</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {data.highlights.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.category}</p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums">
                    {item.fromPrice ? "from " : ""}
                    {priceText(item.price, brand.currency)}
                  </p>
                </li>
              ))}
            </ul>
            {branch.ordersOnline ? (
              <Link href={orderHref} className="inline-flex text-sm font-semibold text-primary underline-offset-4 hover:underline">
                See the full menu and order
              </Link>
            ) : null}
          </section>
        ) : null}
      </div>
    </main>
  );
}
