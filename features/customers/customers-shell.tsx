"use client";

import { usePathname } from "next/navigation";

import { FolderPanel } from "@/components/shared/folder-tabs";
import { PageHeader } from "@/components/shared/page-header";
import { CustomerTabs } from "@/features/customers/customer-tabs";
import { activeCustomerTab } from "@/lib/customer-tabs";

/** Each tab keeps the title it always had — the shell just paints it once, instantly. */
const HEADERS: Record<string, { title: string; description: string }> = {
  "money-finder": {
    title: "Customers",
    description: "Who stopped buying, what they're worth, and how to win them back.",
  },
  segments: {
    title: "Segments",
    description: "Who pays full price, who never has, and what each group costs in discount.",
  },
  "repeat-clock": {
    title: "Repeat Clock",
    description: "When customers actually come back — so a winback lands before they rebuy, not after.",
  },
  health: {
    title: "Customer Health",
    description: "Your top customers with every platform's view on one line — who to save, who to stop chasing.",
  },
};

/**
 * Persistent Customers shell (SPEC-232). Header first, then the tab bar, then the
 * active tab's content — the same order as every other shell. Before this the tab
 * bar sat in the layout but the header lived inside each tab's data view, so the
 * header painted *below* the tabs and only once the query resolved. The winback
 * review flow owns its own header and passes through bare.
 */
export function CustomersShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const tab = activeCustomerTab(pathname);
  if (tab === null) return <>{children}</>;

  const header = HEADERS[tab] ?? HEADERS["money-finder"];
  return (
    <main className="min-w-0 flex-1 space-y-6 p-4 md:p-6">
      <PageHeader title={header.title} description={header.description} />
      <div>
        <CustomerTabs />
        <FolderPanel>
          {children}
        </FolderPanel>
      </div>
    </main>
  );
}
