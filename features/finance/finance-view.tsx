"use client";

import { useSearchParams } from "next/navigation";

import { FinanceNotice } from "@/features/finance/finance-notice";
import { AgingTab } from "@/features/finance/tabs/aging-tab";
import { BillsTab } from "@/features/finance/tabs/bills-tab";
import { CashTab } from "@/features/finance/tabs/cash-tab";
import { FinanceChatTab } from "@/features/finance/tabs/chat-tab";
import { OverviewTab } from "@/features/finance/tabs/overview-tab";
import { ProfileTab } from "@/features/finance/tabs/profile-tab";
import { RunTab } from "@/features/finance/tabs/run-tab";
import { ValueTab } from "@/features/finance/tabs/value-tab";
import { VendorsTab } from "@/features/finance/tabs/vendors-tab";
import { normalizeFinanceTab } from "@/lib/finance";

/**
 * Finance Oversight's content (SPEC-301): the tab the URL names. The breadcrumb, header
 * and tab bar live in the persistent shell (SPEC-232); each tab reads its own query from
 * the client cache (SPEC-230) and shows its own skeleton while that read is pending.
 * Tabs switch with `history.pushState`, so this re-renders in place — no server request.
 */
export function FinanceView() {
  const params = useSearchParams();
  const tab = normalizeFinanceTab(params.get("tab"));
  return (
    <div className="space-y-3">
      <FinanceNotice />
      {tab === "overview" && <OverviewTab />}
      {tab === "value" && <ValueTab />}
      {tab === "bills" && <BillsTab />}
      {tab === "run" && <RunTab />}
      {tab === "aging" && <AgingTab />}
      {tab === "vendors" && <VendorsTab />}
      {tab === "cash" && <CashTab />}
      {tab === "chat" && <FinanceChatTab />}
      {tab === "profile" && <ProfileTab />}
    </div>
  );
}
