import { AiShell } from "@/features/ai/ai-shell";

export default function AiLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AiShell>{children}</AiShell>;
}
