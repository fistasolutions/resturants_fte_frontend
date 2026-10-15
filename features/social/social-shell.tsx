"use client";

import { usePathname, useSearchParams } from "next/navigation";

import { FolderPanel } from "@/components/shared/folder-tabs";
import { PageHeader } from "@/components/shared/page-header";
import { useWorkspace } from "@/features/workspace/workspace-provider";
import { EmployeeBreadcrumb } from "@/features/employees/employee-breadcrumb";
import { SocialTabs } from "@/features/social/social-tabs";
import { normalizeSocialTab } from "@/lib/social";

/**
 * Persistent Social Growth shell (SPEC-110), rendered from the social
 * `layout.tsx` so the header + tab bar stay mounted across tab switches — only
 * `{children}` (the active tab, behind a keyed `<Suspense>`) re-renders and
 * shows its own content-only skeleton. Mirrors the Spotlight / Returns shell.
 */
export function SocialShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // SPEC-389: a restaurant brand's content comes from its menu.
  const restaurant = useWorkspace().features.includes("restaurant");
  if (pathname !== "/social") return <>{children}</>;

  const active = normalizeSocialTab(searchParams.get("tab"));

  return (
    <main className="space-y-6 p-4 md:p-6">
      <div className="space-y-2">
        <EmployeeBreadcrumb current="Social Media Manager" />
        <PageHeader
          title="Social Media Manager"
          description={`Your AI organic social manager: it turns ${restaurant ? "your menu" : "the product catalog"} into native social content — picking what to feature, generating creative and captions per channel, routing every post through you, and measuring the reach it earns.`}
        />
      </div>
      <div>
        <SocialTabs active={active} />
        <FolderPanel>
          {children}
        </FolderPanel>
      </div>
    </main>
  );
}
