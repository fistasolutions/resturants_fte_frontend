import type { Metadata } from "next";

import { InventoryPageContent } from "@/features/inventory/inventory-page-content";

export const metadata: Metadata = { title: "Warehouse → Store — Inventory Analyst" };
export const dynamic = "force-dynamic";

interface InventoryTransfersPageProps {
  searchParams: Promise<{
    range?: string;
    from?: string;
    to?: string;
    period?: string;
  }>;
}

export default function InventoryTransfersPage({ searchParams }: InventoryTransfersPageProps) {
  return <InventoryPageContent tab="transfers" searchParams={searchParams} />;
}
