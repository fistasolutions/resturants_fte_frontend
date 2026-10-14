import { ProductShell } from "@/features/products/product-shell";

/**
 * Persistent shell for the Product Analyst tabs (SPEC-090). A layout is not
 * unmounted when navigating between its child routes, so the header + tab bar
 * (rendered inside `ProductShell`) stay painted across tab switches — only the
 * page content below swaps.
 */
export default function ProductLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <ProductShell>{children}</ProductShell>;
}
