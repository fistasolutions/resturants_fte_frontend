"use client";

import { usePathname, useSearchParams } from "next/navigation";

import { FolderPanel } from "@/components/shared/folder-tabs";
import { PageHeader } from "@/components/shared/page-header";
import { DateRangePicker } from "@/features/dashboard/date-range-picker";
import { ProductTabs } from "@/features/products/product-tabs";
import { resolveDateRange } from "@/lib/date-range";
import { RANGELESS_PRODUCT_TABS, activeProductTab } from "@/lib/product-tabs";
import { dateToISO } from "@/utils/date";

const DESCRIPTION =
  "Winners, losers, and money leaks — figures computed by the backend from Shopify data, interpretation by the AI analyst.";

/**
 * Persistent Product Analyst shell (SPEC-090). Rendered from the products
 * `layout.tsx`, so it stays mounted across tab switches: the header (title +
 * date-range picker) and the tab bar never re-render as part of a content swap —
 * only `{children}` (the active tab's content) changes, showing its own
 * content-only skeleton while its data loads.
 *
 * On any non-tab route under `/products` it renders `{children}` bare — those
 * pages own their own header and `<main>`.
 */
export function ProductShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = activeProductTab(pathname);

  if (!active) return <>{children}</>;

  // Default 30d matches the fetch in `ProductPageContent`, so the picker label
  // and the loaded data never disagree.
  const range = resolveDateRange(
    {
      range: searchParams.get("range") ?? searchParams.get("period") ?? "30d",
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
    },
    dateToISO(new Date()),
  );

  return (
    <main className="min-w-0 flex-1 space-y-4 p-4 md:p-6">
      <PageHeader
        title="Product Analyst"
        description={DESCRIPTION}
        actions={
          RANGELESS_PRODUCT_TABS.has(active) ? undefined : (
            <DateRangePicker
              from={range.from}
              to={range.to}
              preset={range.preset}
              label={range.label}
              basePath={pathname}
            />
          )
        }
      />
      <div>
        <ProductTabs />
        <FolderPanel>
          {children}
        </FolderPanel>
      </div>
    </main>
  );
}
