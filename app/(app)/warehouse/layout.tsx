import { WarehouseShell } from "@/features/warehouse/warehouse-shell";

/** Persistent header for Warehouse (SPEC-232) — see the shell. */
export default function WarehouseLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <WarehouseShell>{children}</WarehouseShell>;
}
