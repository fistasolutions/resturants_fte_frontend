/** System traces — scheduler job health and run history (SPEC-228, backend SPEC-238)
 * — server transport. Since SPEC-230 the paths, keys and loaders live in
 * `lib/queries/system.ts`; this module is their `serverApi` face. */
import { serverApi } from "@/lib/api";
import { systemQueries, type RunQuery } from "@/lib/queries/system";
import type { RunDetail, RunPage, SystemOverview } from "@/types/system";

export type { RunQuery } from "@/lib/queries/system";

export async function getSystemJobs(): Promise<SystemOverview> {
  return systemQueries.jobs().load(serverApi);
}

export async function getSystemRuns(query: RunQuery = {}): Promise<RunPage> {
  return systemQueries.runs(query).load(serverApi);
}

export async function getSystemRun(runId: number): Promise<RunDetail> {
  return systemQueries.run(runId).load(serverApi);
}
