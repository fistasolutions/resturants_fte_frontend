import { CustomerSupportShell } from "@/features/customer-support/customer-support-shell";

/** Persistent layout for the Customer Support Agent (SPEC-346, the SPEC-232 shape): the
 * breadcrumb, header and tab bar stay painted across tab switches. */
export default function CustomerSupportLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <CustomerSupportShell>{children}</CustomerSupportShell>;
}
