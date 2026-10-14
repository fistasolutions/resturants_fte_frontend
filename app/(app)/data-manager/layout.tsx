import { DataManagerShell } from "@/features/data-manager/data-manager-shell";

/** Data Manager's persistent layout (SPEC-374): the shell paints once and stays across tab switches. */
export default function DataManagerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <DataManagerShell>{children}</DataManagerShell>;
}
