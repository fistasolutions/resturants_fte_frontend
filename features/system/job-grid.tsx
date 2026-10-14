import { JobCard } from "@/features/system/job-card";
import { groupJobs } from "@/lib/system-trace";
import type { SystemJob } from "@/types/system";

/**
 * Every job, grouped by purpose (SPEC-228).
 *
 * Twenty-three flat cards is a list, not a dashboard. The grouping is by what the job
 * is *for*, and both the groups and the cards inside them are ordered worst-first —
 * a page whose problems are below the fold is a page nobody reads.
 */
export function JobGrid({ jobs }: { jobs: SystemJob[] }) {
  const groups = groupJobs(jobs);

  return (
    <div className="space-y-6">
      {groups.map(({ group, jobs: items }) => (
        <section key={group} className="space-y-2.5">
          <div className="flex items-baseline gap-3">
            <h2 className="text-[11px] font-bold tracking-[0.12em] text-muted-foreground uppercase">
              {group}
            </h2>
            <span className="text-xs text-muted-foreground">
              {items.length} {items.length === 1 ? "job" : "jobs"}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {items.map((job) => (
              <JobCard key={job.key} job={job} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
