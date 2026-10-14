import { TrafficShell } from "@/features/traffic/traffic-shell";

export default function TrafficLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <TrafficShell>{children}</TrafficShell>;
}
