"use client";

import { Telescope } from "lucide-react";

import { EmployeeChatPanel } from "@/features/employees/employee-chat-panel";
import { SPOTLIGHT_EMPLOYEE } from "@/lib/employee-chat";

/** Spotlight › Chat (SPEC-293) — the shared employee chat panel (SPEC-301), as Spotlight. */
export function SpotlightChatTab() {
  return <EmployeeChatPanel meta={SPOTLIGHT_EMPLOYEE} icon={Telescope} />;
}
