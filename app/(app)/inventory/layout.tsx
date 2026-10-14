import { InventoryShell } from "@/features/inventory/inventory-shell";

/**
 * Persistent shell for the Inventory Analyst tabs (SPEC-085). A layout is not
 * unmounted when navigating between its child routes, so the header + tab bar
 * (rendered inside `InventoryShell`) stay painted across tab switches — only the
 * page content below swaps.
 */
export default function InventoryLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <InventoryShell>{children}</InventoryShell>;
}
