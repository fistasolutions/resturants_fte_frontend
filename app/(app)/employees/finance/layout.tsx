import { FinanceShell } from "@/features/finance/finance-shell";

export default function FinanceLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <FinanceShell>{children}</FinanceShell>;
}
