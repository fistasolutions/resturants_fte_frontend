import type { Metadata } from "next";

import { OrdersPageContent } from "@/features/orders/orders-page-content";

export const metadata: Metadata = {
  title: "Cancelled — Orders",
};

export const dynamic = "force-dynamic";

interface OrdersCancelledPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default function OrdersCancelledPage({ searchParams }: OrdersCancelledPageProps) {
  return <OrdersPageContent tab="cancelled" searchParams={searchParams} />;
}
