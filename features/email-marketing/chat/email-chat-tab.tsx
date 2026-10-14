"use client";

import { MailCheck } from "lucide-react";

import { EmployeeChatPanel } from "@/features/employees/employee-chat-panel";
import { EMAIL_MARKETING_EMPLOYEE } from "@/lib/employee-chat";

/**
 * The employee's own chat (SPEC-345 / backend SPEC-354) on the shared engine (SPEC-293,
 * `conversations.employee = "email_marketing"`), read tools only — it answers from the plan,
 * the campaigns with their holdout results, the flows and deliverability, and never sends.
 * Each turn is the platform's answer card (SPEC-352), which closes with the page that acts on
 * the answer (backend `ACTIONS_BY_TOOL`): the plan, the approvals, the flows or the builder.
 */
export function EmailChatTab() {
  return <EmployeeChatPanel meta={EMAIL_MARKETING_EMPLOYEE} icon={MailCheck} />;
}
