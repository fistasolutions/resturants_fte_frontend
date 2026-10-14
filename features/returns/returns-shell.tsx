"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { FolderPanel } from "@/components/shared/folder-tabs";
import { PageHeader } from "@/components/shared/page-header";
import { DateRangePicker } from "@/features/dashboard/date-range-picker";
import { ReturnsTabs } from "@/features/returns/returns-tabs";
import { normalizeReturnsTab } from "@/lib/returns-tabs";
import { resolveDateRange } from "@/lib/date-range";
import { dateToISO } from "@/utils/date";


/**
 * Persistent Returns shell (SPEC-095). Rendered from the returns `layout.tsx`,
 * so the header + tab bar stay mounted across tab switches — only `{children}`
 * (the active tab's content) re-renders and shows its own content-only skeleton.
 * The style-detail route (`/returns/style/[id]`) owns its own header, so the
 * shell passes it through bare.
 */
export function ReturnsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (pathname !== "/returns") return <>{children}</>;

  const params = Object.fromEntries(searchParams.entries());
  const range = resolveDateRange(params, dateToISO(new Date()));
  const active = normalizeReturnsTab(searchParams.get("tab"));

  return (
    <main className="space-y-6 p-4 md:p-6">
      <PageHeader
        title="Returns Intelligence"
        description="Which products are hurting margin, why, and how much — return rate, profit lost, sizing defects, and category breakdown from Loop Returns."
        actions={
          <DateRangePicker
            from={range.from}
            to={range.to}
            preset={range.preset}
            label={range.label}
            basePath="/returns"
          />
        }
      />
      <div>
        <ReturnsTabs active={active} query={params} />
        <FolderPanel>
          {/* SPEC-154 — the other returns *slices* live under Orders/Products/Dashboard;
              surface them from the canonical hub so they're discoverable, not hidden. */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="font-medium">Related returns views:</span>
            <Link href="/orders/returns" className="text-foreground underline underline-offset-4">
              Returned orders
            </Link>
            <Link href="/products/returns" className="text-foreground underline underline-offset-4">
              Return leak by product
            </Link>
            <Link href="/orders/returns-spike" className="text-foreground underline underline-offset-4">
              Return-rate spikes
            </Link>
          </div>
          {children}
        </FolderPanel>
      </div>
    </main>
  );
}
