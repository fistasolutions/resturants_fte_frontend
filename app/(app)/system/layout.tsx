import { SystemShell } from "@/features/system/system-shell";

export default function SystemLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <SystemShell>{children}</SystemShell>;
}
