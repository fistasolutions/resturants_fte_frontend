import type { Metadata } from "next";

import { TrackView } from "@/features/storefront/track-view";

export const metadata: Metadata = { title: "Your order" };

/** The guest's live order tracker (SPEC-379 over backend SPEC-394). */
export default async function TrackPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <TrackView token={token} />;
}
