"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ArrowUpRight } from "lucide-react";

import { FolderPanel } from "@/components/shared/folder-tabs";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/features/dashboard/date-range-picker";
import { DiscountTabs } from "@/features/discounts/discount-tabs";
import { activeDiscountTab, withDiscountDefaultRange, type DiscountTab } from "@/lib/discount-tabs";
import { resolveDateRange } from "@/lib/date-range";

const TAB_DESCRIPTION: Record<DiscountTab, string> = {
  overview:
    "Every discount given across locations — automatic vs manual, who entered it, and what's flagged by policy. Read-only from Shopify.",
  attention:
    "What needs a look, why, and where — each flagged discount with a one-click email to the location's manager to confirm the reason.",
  staff:
    "Who's discounting — every employee ranked by the manual discounts they entered, across all stores, with outliers flagged.",
  reasons:
    "Why discounts were given — the manual-discount total broken down by reason, and how much carries no reason at all.",
  cannibalisation:
    "How much of each code's discount went to customers who had already bought — acquisition against margin given to people who were coming anyway.",
  decisions:
    "What the whole store did per day while each code ran vs the days just before — orders, revenue, margin — with a verdict; codes that run every day are marked always on.",
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Persistent Discount Monitoring shell (SPEC-098). Header + date picker + tab
 * bar stay mounted across tab switches — only the body swaps. On a drill route
 * (`/discounts/locations|employees|transactions/[id]`) `activeDiscountTab` is
 * null and it renders `{children}` bare — those pages own their breadcrumb.
 */
export function DiscountsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = activeDiscountTab(pathname);

  if (!active) return <>{children}</>;

  const range = resolveDateRange(
    withDiscountDefaultRange(Object.fromEntries(searchParams.entries())),
    todayISO(),
  );

  return (
    <main className="min-w-0 flex-1 space-y-6 p-4 md:p-6">
      <PageHeader
        title="Discount Monitoring"
        description={TAB_DESCRIPTION[active]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/orders/discounted">
                Discounted Orders
                <ArrowUpRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <DateRangePicker
              from={range.from}
              to={range.to}
              preset={range.preset}
              label={range.label}
              basePath={pathname}
            />
          </div>
        }
      />
      <div>
        <DiscountTabs />
        <FolderPanel>
          {children}
        </FolderPanel>
      </div>
    </main>
  );
}
