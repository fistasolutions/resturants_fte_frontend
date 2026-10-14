import type { Metadata } from "next";

import { DiscountsShell } from "@/features/discounts/discounts-shell";

export const metadata: Metadata = {
  title: "Discount Monitoring",
};

/**
 * Persistent shell for the Discount Monitoring tabs (SPEC-098). A layout is not
 * unmounted when navigating between its child routes, so the header + date
 * picker + tab bar (in `DiscountsShell`) stay painted across tab switches — only
 * the tab body swaps. Drill routes render bare (the shell self-gates).
 */
export default function DiscountsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <DiscountsShell>{children}</DiscountsShell>;
}
