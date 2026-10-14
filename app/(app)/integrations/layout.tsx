import { IntegrationsShell } from "@/features/integrations/integrations-shell";

/** Persistent header for Integrations (SPEC-232) — see the shell. */
export default function IntegrationsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <IntegrationsShell>{children}</IntegrationsShell>;
}
