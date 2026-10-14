"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { RefreshCw } from "lucide-react";

import { FolderPanel } from "@/components/shared/folder-tabs";
import { PageHeader } from "@/components/shared/page-header";
import { RoleButton } from "@/components/shared/role-gate";
import { ShallowLink } from "@/components/shared/shallow-link";
import { Button } from "@/components/ui/button";
import { EmployeeBreadcrumb } from "@/features/employees/employee-breadcrumb";
import { FinanceTabs } from "@/features/finance/finance-tabs";
import { useFinanceActions } from "@/features/finance/use-finance-actions";
import { FINANCE_ROOT, financeHref, normalizeFinanceTab } from "@/lib/finance";
import { cn } from "@/lib/utils";

const DESCRIPTION =
  "Everything your QuickBooks companies owe, in one place — read from QuickBooks, never written back.";

/**
 * Persistent shell for Finance Oversight (SPEC-296, the SPEC-232 shape; eight tabs since
 * SPEC-301): breadcrumb, header and tab bar stay mounted across tab switches. A bill's and
 * a vendor's own pages carry their own breadcrumb, so they pass through bare — the rule
 * every shell in the app follows.
 */
export function FinanceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const actions = useFinanceActions();
  if (pathname !== FINANCE_ROOT) return <>{children}</>;

  return (
    <main className="min-w-0 flex-1 space-y-4 p-4 md:p-6">
      <div className="space-y-2">
        <EmployeeBreadcrumb current="Accounts Payable" />
        <PageHeader
          title="Accounts Payable"
          description={DESCRIPTION}
          actions={
            <>
              <RoleButton need="finance.manage" variant="outline" size="sm" onClick={actions.sync} disabled={actions.syncing}>
                <RefreshCw className={cn("size-3.5", actions.syncing && "animate-spin")} aria-hidden />
                {actions.syncing ? "Reading QuickBooks…" : "Sync now"}
              </RoleButton>
              <Button asChild size="sm">
                <ShallowLink href={financeHref("chat")}>Ask Accounts Payable</ShallowLink>
              </Button>
            </>
          }
        />
        {actions.error && (
          <p role="alert" className="text-xs text-destructive">
            {actions.error}
          </p>
        )}
      </div>
      <div>
        <FinanceTabs active={normalizeFinanceTab(searchParams.get("tab"))} />
        <FolderPanel>
          {children}
        </FolderPanel>
      </div>
    </main>
  );
}
