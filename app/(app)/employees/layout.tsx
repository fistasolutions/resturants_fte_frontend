import { EmployeesShell } from "@/features/employees/employees-shell";

export default function EmployeesLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <EmployeesShell>{children}</EmployeesShell>;
}
