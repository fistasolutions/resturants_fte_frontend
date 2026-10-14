import type { Metadata } from "next";

import { OrdersPageContent } from "@/features/orders/orders-page-content";

export const metadata: Metadata = {
  title: "Discounted — Orders",
};

export const dynamic = "force-dynamic";

interface OrdersDiscountedPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default function OrdersDiscountedPage({ searchParams }: OrdersDiscountedPageProps) {
  return <OrdersPageContent tab="discounted" searchParams={searchParams} />;
}
