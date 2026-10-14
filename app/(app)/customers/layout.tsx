import { CustomersShell } from "@/features/customers/customers-shell";

/**
 * Persistent shell for the Customers tabs (SPEC-189, header moved in by SPEC-232).
 * A layout is not unmounted when navigating between its child routes, so the header
 * and tab bar stay painted across switches — only the page content below swaps.
 */
export default function CustomersLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <CustomersShell>{children}</CustomersShell>;
}
