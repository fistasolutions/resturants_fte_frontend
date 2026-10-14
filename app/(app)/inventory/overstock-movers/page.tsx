import type { Metadata } from "next";

import { InventoryPageContent } from "@/features/inventory/inventory-page-content";

export const metadata: Metadata = { title: "Overstock & Movers — Inventory Analyst" };
export const dynamic = "force-dynamic";

interface InventoryOverstockMoversPageProps {
  searchParams: Promise<{
    range?: string;
    from?: string;
    to?: string;
    period?: string;
  }>;
}

export default function InventoryOverstockMoversPage({
  searchParams,
}: InventoryOverstockMoversPageProps) {
  return <InventoryPageContent tab="overstock-movers" searchParams={searchParams} />;
}
