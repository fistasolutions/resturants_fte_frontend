import type { Metadata } from "next";

import { OrdersPageContent } from "@/features/orders/orders-page-content";
import { ReturnsHubLink } from "@/components/shared/returns-hub-link";

export const metadata: Metadata = {
  title: "Returned Orders",
};

export const dynamic = "force-dynamic";

interface OrdersReturnsPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default function OrdersReturnsPage({ searchParams }: OrdersReturnsPageProps) {
  // SPEC-154 — this is the returned-orders slice; point users at the canonical hub.
  return (
    <>
      <ReturnsHubLink />
      <OrdersPageContent tab="returns" searchParams={searchParams} />
    </>
  );
}
