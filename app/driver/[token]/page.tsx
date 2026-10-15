import type { Metadata } from "next";

import { DriverView } from "@/features/driver-app/driver-view";

export const metadata: Metadata = { title: "Deliveries", robots: { index: false, follow: false } };

/** The driver app (SPEC-384 over backend SPEC-400). */
export default async function DriverPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <DriverView token={token} />;
}
