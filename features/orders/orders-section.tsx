"use client";

import { OrdersShell } from "@/features/orders/orders-shell";
import { useApiQuery } from "@/hooks/use-api-query";
import { reportQueries } from "@/lib/queries/reports";

/**
 * The Orders section shell fed from the client cache (SPEC-230). The orders
 * `layout.tsx` prefetches the report scopes (the Location filter's options) once for
 * the whole section; until they land the filter simply has no options, so entering
 * the section never waits on them.
 */
export function OrdersSection({ children }: { children: React.ReactNode }) {
  const scopes = useApiQuery(reportQueries.scopes());
  return <OrdersShell locations={scopes.data?.locations ?? []}>{children}</OrdersShell>;
}
