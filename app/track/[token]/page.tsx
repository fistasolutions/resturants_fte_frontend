import type { Metadata } from "next";

import { TrackView } from "@/features/storefront/track-view";

export const metadata: Metadata = { title: "Your order" };

/** The guest's live order tracker (SPEC-379 over backend SPEC-394). */
export default async function TrackPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ paid?: string }>;
}) {
  const [{ token }, { paid }] = await Promise.all([params, searchParams]);
  return <TrackView token={token} paid={paid === "1"} />;
}
