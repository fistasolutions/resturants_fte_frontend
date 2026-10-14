import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { OrdersListPanel } from "@/features/orders/orders-list-panel";
import { ordersApiQuery, parseOrderFilters } from "@/lib/order-filters";
import type { OrdersTab } from "@/lib/order-tabs";
import { orderQueries } from "@/lib/queries/orders";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

const PAGE_SIZE = 25;

const TAB_META: Record<OrdersTab, { basePath: string; emptyMessage: string }> = {
  all: { basePath: "/orders", emptyMessage: "No orders match the active filters." },
  returns: {
    basePath: "/orders/returns",
    emptyMessage: "No returned orders match the active filters.",
  },
  cancelled: {
    basePath: "/orders/cancelled",
    emptyMessage: "No cancelled orders match the active filters.",
  },
  discounted: {
    basePath: "/orders/discounted",
    emptyMessage: "No discounted orders match the active filters.",
  },
};

interface OrdersPageContentProps {
  tab: OrdersTab;
  searchParams: Promise<Record<string, string | undefined>>;
}

/** Content-only body for every Orders tab (SPEC-079; SPEC-087). The header, tab
 * bar, and filters row live in the persistent orders shell (`OrdersShell`);
 * this starts the fetch for the tab's first page and streams it into the client
 * cache (SPEC-230) — it never waits for it. Server-side pagination (SPEC-035
 * pattern): each page is one API call, keyed by filters + page. */
export async function OrdersPageContent({ tab, searchParams }: OrdersPageContentProps) {
  const { basePath, emptyMessage } = TAB_META[tab];
  const filters = { ...parseOrderFilters(await searchParams), view: tab === "all" ? null : tab };

  const queryClient = getQueryClient();
  prefetch(queryClient, orderQueries.list(filters, PAGE_SIZE));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <OrdersListPanel
        key={ordersApiQuery(filters)}
        filters={filters}
        pageSize={PAGE_SIZE}
        emptyMessage={emptyMessage}
        basePath={basePath}
      />
    </HydrationBoundary>
  );
}
