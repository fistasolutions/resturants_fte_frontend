"use client";

import { Landmark } from "lucide-react";

import { EmployeeChatPanel } from "@/features/employees/employee-chat-panel";
import { FINANCE_EMPLOYEE } from "@/lib/employee-chat";

/** Finance Oversight › Chat (SPEC-301) — its own threads on the shared employee engine
 * (backend SPEC-287/295): read tools over the synced books, nothing it can change. */
export function FinanceChatTab() {
  return <EmployeeChatPanel meta={FINANCE_EMPLOYEE} icon={Landmark} />;
}
