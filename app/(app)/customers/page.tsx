import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { CustomersView } from "@/features/customers/customers-view";
import { parseCustomersFilters } from "@/lib/customers-filters";
import { CUSTOMERS_PAGE_SIZE } from "@/lib/page-sizes";
import { customerQueries } from "@/lib/queries/customers";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Customers" };
export const dynamic = "force-dynamic";

interface CustomersPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const filters = parseCustomersFilters(await searchParams);
  const queryClient = getQueryClient();
  prefetch(
    queryClient,
    customerQueries.moneyFinder({ page: filters.page, limit: CUSTOMERS_PAGE_SIZE, q: filters.q }),
  );
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CustomersView filters={filters} />
    </HydrationBoundary>
  );
}
