import type { Metadata } from "next";

import { InventoryPageContent } from "@/features/inventory/inventory-page-content";

export const metadata: Metadata = {
  title: "Inventory Analyst",
};

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface InventoryPageProps {
  searchParams: Promise<{
    range?: string;
    from?: string;
    to?: string;
    period?: string;
  }>;
}

export default function InventoryAnalystPage({ searchParams }: InventoryPageProps) {
  return <InventoryPageContent tab="overview" searchParams={searchParams} />;
}
