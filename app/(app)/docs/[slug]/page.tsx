import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DocArticle } from "@/features/docs/doc-article";
import { FEATURE_DOCS, getDoc } from "@/lib/docs";

interface DocPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return FEATURE_DOCS.map((doc) => ({ slug: doc.slug }));
}

export async function generateMetadata({ params }: DocPageProps): Promise<Metadata> {
  const { slug } = await params;
  const doc = getDoc(slug);
  return { title: doc ? `${doc.title} · Docs` : "Docs" };
}

/** `/docs/[slug]` — one feature doc. An unknown slug renders the in-shell
 * not-found page (SPEC-227). Static content; no data fetch. */
export default async function DocPage({ params }: DocPageProps) {
  const { slug } = await params;
  const doc = getDoc(slug);
  if (!doc) notFound();
  return <DocArticle doc={doc} />;
}
