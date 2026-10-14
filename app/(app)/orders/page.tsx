import type { Metadata } from "next";

import { OrdersPageContent } from "@/features/orders/orders-page-content";

export const metadata: Metadata = {
  title: "Orders",
};

export const dynamic = "force-dynamic";

interface OrdersPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default function OrdersPage({ searchParams }: OrdersPageProps) {
  return <OrdersPageContent tab="all" searchParams={searchParams} />;
}
