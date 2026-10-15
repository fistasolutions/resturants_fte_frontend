import type { Metadata } from "next";

import { StorefrontView } from "@/features/storefront/storefront-view";

export const metadata: Metadata = { title: "Order online" };

/** The brand's online ordering (SPEC-379 over backend SPEC-394). */
export default async function OrderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <StorefrontView slug={slug} />;
}
