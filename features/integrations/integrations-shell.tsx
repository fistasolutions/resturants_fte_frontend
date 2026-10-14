"use client";

import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { ShallowLink } from "@/components/shared/shallow-link";
import { Button } from "@/components/ui/button";
import { HubProvider } from "@/features/integrations/hub/hub-context";
import { hubHref } from "@/lib/integration-hub";

/**
 * Persistent Integrations shell (SPEC-232, SPEC-328). The hub's header paints from the
 * layout; an app's own page and the sign-in callbacks draw their own and pass through bare.
 * Both share one `HubProvider`, so the connect dialog and Sync now work on either.
 */
export function IntegrationsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname !== "/integrations") return <HubProvider>{children}</HubProvider>;
  return (
    <HubProvider>
      <main className="min-w-0 flex-1 space-y-6 p-4 md:p-6">
        <PageHeader
          title="Integrations"
          description="Connect the apps your store runs on. We only read from them, and every figure in the app shows which one it came from."
          actions={
            <Button asChild>
              <ShallowLink href={hubHref({ tab: "browse" })}>
                <Plus className="size-4" aria-hidden />
                Connect an app
              </ShallowLink>
            </Button>
          }
        />
        {children}
      </main>
    </HubProvider>
  );
}
