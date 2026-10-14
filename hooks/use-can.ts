"use client";

import { useCallback } from "react";

import { useApiQuery } from "@/hooks/use-api-query";
import { teamQueries } from "@/lib/queries/team";
import { roleGate, type RoleGateResult, type RoleNeed } from "@/lib/role-gate";

/**
 * The member's role, asked from any screen (frontend SPEC-358, root ABSOLUTE RULE 13).
 * `const can = useCan(); can("social.publish").allowed`. One cached `/auth/me` read serves the
 * whole app; while it loads every action is allowed, as before — the server still decides.
 */
export function useCan(): (need: RoleNeed) => RoleGateResult {
  const access = useApiQuery(teamQueries.access());
  const data = access.data;
  return useCallback((need: RoleNeed) => roleGate(data, need), [data]);
}
