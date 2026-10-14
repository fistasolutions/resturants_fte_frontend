"use client";

import { LifeBuoy } from "lucide-react";

import { EmployeeChatPanel } from "@/features/employees/employee-chat-panel";
import { CUSTOMER_SUPPORT_EMPLOYEE } from "@/lib/employee-chat";

/**
 * Customer Support Agent › Chat (SPEC-346 / backend SPEC-353): its own threads on the shared
 * engine (SPEC-293, `conversations.employee = "customer_support"`), read tools only. Each turn
 * is the platform's answer card (SPEC-352); the link cards an answer carries (the Inbox on a
 * queue, a ticket, Insights, a playbook) close it as buttons, each a screen that exists.
 */
export function SupportChatTab() {
  return <EmployeeChatPanel meta={CUSTOMER_SUPPORT_EMPLOYEE} icon={LifeBuoy} />;
}
