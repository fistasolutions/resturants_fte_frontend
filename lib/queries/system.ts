/** System trace queries — scheduler job health and run history (SPEC-228, backend
 * SPEC-238) — defined once for both transports (SPEC-230). Byte-identical paths to
 * `services/system.ts`. */
import { defineQuery } from "@/lib/query-def";
import { adaptOverview, adaptRun, adaptRunPage } from "@/lib/system-trace";
import type { RunDetail, RunPage, SystemOverview } from "@/types/system";

export interface RunQuery {
  jobId?: string;
  status?: string;
  window?: string;
  page?: number;
  pageSize?: number;
}

export const systemPaths = {
  jobs: (): string => "/system/jobs",
  runs: (query: RunQuery): string => {
    const params = new URLSearchParams();
    if (query.jobId) params.set("job_id", query.jobId);
    if (query.status) params.set("status", query.status);
    // All time is the default on purpose: "has this ever run" is the first question
    // this page is asked, and a 24-hour default answers it wrongly for every daily job.
    params.set("window", query.window || "all");
    params.set("page", String(query.page ?? 1));
    params.set("page_size", String(query.pageSize ?? 25));
    return `/system/runs?${params.toString()}`;
  },
  run: (runId: number): string => `/system/runs/${runId}`,
} as const;

export const systemQueries = {
  /** One composite read serves the whole overview — no reason to fan out (Rule 5). */
  jobs: () =>
    defineQuery<SystemOverview>(["system", "jobs"], async (api) =>
      adaptOverview(await api<Parameters<typeof adaptOverview>[0]>(systemPaths.jobs())),
    ),
  runs: (query: RunQuery = {}) =>
    defineQuery<RunPage>(
      [
        "system",
        "runs",
        {
          jobId: query.jobId ?? null,
          status: query.status ?? null,
          window: query.window || "all",
          page: query.page ?? 1,
          pageSize: query.pageSize ?? 25,
        },
      ],
      async (api) => adaptRunPage(await api<Parameters<typeof adaptRunPage>[0]>(systemPaths.runs(query))),
    ),
  run: (runId: number) =>
    defineQuery<RunDetail>(["system", "run", runId], async (api) => {
      const raw = await api<Record<string, unknown>>(systemPaths.run(runId));
      return {
        ...adaptRun(raw as never),
        title: raw.title as string,
        purpose: (raw.purpose as string | null) ?? null,
        cadenceLabel: (raw.cadence_label as string | null) ?? null,
        group: (raw.group as string | null) ?? null,
      };
    }),
} as const;
