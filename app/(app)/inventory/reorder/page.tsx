import type { Metadata } from "next";

import { InventoryPageContent } from "@/features/inventory/inventory-page-content";

export const metadata: Metadata = { title: "Reorder — Inventory Analyst" };
export const dynamic = "force-dynamic";

interface InventoryReorderPageProps {
  searchParams: Promise<{
    range?: string;
    from?: string;
    to?: string;
    period?: string;
  }>;
}

export default function InventoryReorderPage({ searchParams }: InventoryReorderPageProps) {
  return <InventoryPageContent tab="reorder" searchParams={searchParams} />;
}
