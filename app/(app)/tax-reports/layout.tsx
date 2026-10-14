import { TaxReportsShell } from "@/features/tax-reports/tax-reports-shell";

/** Persistent header for Sales & Tax (SPEC-232) — see the shell. */
export default function TaxReportsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <TaxReportsShell>{children}</TaxReportsShell>;
}
