import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, ShoppingBag } from "lucide-react";

import { CateringForm } from "@/features/storefront/catering-form";
import { publicGet, siteOrigin } from "@/lib/public-api";
import type { PublicLocations } from "@/types/local-pages";

interface Props {
  params: Promise<{ slug: string }>;
}

function load(slug: string): Promise<PublicLocations | null> {
  return publicGet<PublicLocations>(`/storefront/${encodeURIComponent(slug)}/locations`);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) return { title: "Not found" };
  return {
    title: { absolute: `${data.name} locations` },
    description: `Find your nearest ${data.name} and order online.`,
    alternates: { canonical: `${siteOrigin()}/r/${encodeURIComponent(slug)}` },
  };
}

/** The brand's locations (frontend SPEC-386 over backend SPEC-403): every published local page. */
export default async function LocationsPage({ params }: Props) {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) notFound();
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{data.name} locations</h1>
            <p className="mt-1 text-muted-foreground">Find your nearest restaurant, then order for delivery or carryout.</p>
          </div>
          <Link
            href={`/order/${encodeURIComponent(data.slug)}`}
            className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <ShoppingBag className="size-4" aria-hidden /> Order online
          </Link>
        </header>
        {data.locations.length === 0 ? (
          <p className="rounded-2xl border border-border bg-card p-6 text-muted-foreground">
            Our location pages are on their way. You can still order online.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {data.locations.map((loc) => (
              <li key={loc.slug}>
                <Link
                  href={`/r/${encodeURIComponent(data.slug)}/${encodeURIComponent(loc.slug)}`}
                  className="block h-full rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <p className="font-semibold">{loc.name}</p>
                  {loc.address ? (
                    <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden /> {loc.address}
                    </p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <section id="catering" className="space-y-3 pt-4">
          <h2 className="text-xl font-semibold tracking-tight">Catering</h2>
          <p className="text-muted-foreground">Feeding a team, a party or a school? Tell us about it and we will send a quote.</p>
          <CateringForm slug={data.slug} />
        </section>
      </div>
    </main>
  );
}
